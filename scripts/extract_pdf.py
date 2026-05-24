import hashlib
import json
import re
from pathlib import Path

import pdfplumber

ROOT = Path(__file__).resolve().parent.parent

PDFS = {
    "A1": ROOT / "data/raw/Goethe-Zertifikat_A1_Wortliste.pdf",
    "A2": ROOT / "data/raw/Goethe-Zertifikat_A2_Wortliste.pdf",
    "B1": ROOT / "data/raw/Goethe-Zertifikat_B1_Wortliste.pdf",
}

OUTPUT = ROOT / "data/processed"

CONFIG = {
    "A1": {
        "start_page": 9,
        "columns": [{"bbox": (0, 80, 595, 760), "sentence_x": 236}],
    },
    "A2": {
        "start_page": 8,
        "columns": [
            {"bbox": (0, 80, 297, 785), "sentence_x": 106},
            {"bbox": (297, 80, 595, 785), "sentence_x": 375},
        ],
    },
    "B1": {
        "start_page": 16,
        "columns": [
            {"bbox": (0, 75, 297, 785), "sentence_x": 132},
            {"bbox": (297, 75, 595, 785), "sentence_x": 411},
        ],
    },
}

ARTICLES = ("der", "die", "das", "der/die", "der/das", "das/der/die")
ENTRY_WORD_RE = re.compile(r"^[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß'./ -]*$")
PAGE_NOISE_RE = re.compile(
    r"^(WORTLISTE|INVENTARE|INVeNTAre|Seite\s+\d+|[0-9]{6}.*|[0-9]+)$"
)


def clean_text(text):
    return re.sub(r"\s+", " ", text.replace("‘", "'").replace("’", "'")).strip()


def grouped_lines(page):
    words = page.extract_words(x_tolerance=1, y_tolerance=3, use_text_flow=False)
    lines = []

    for word in words:
        top = round(word["top"], 1)
        for line in lines:
            if abs(line["top"] - top) <= 2.5:
                line["words"].append(word)
                break
        else:
            lines.append({"top": top, "words": [word]})

    for line in lines:
        line["words"].sort(key=lambda item: item["x0"])

    return sorted(lines, key=lambda item: item["top"])


def line_parts(line, sentence_x):
    left = []
    sentence = []

    for word in line["words"]:
        if word["x0"] < sentence_x:
            left.append(word["text"])
        else:
            sentence.append(word["text"])

    while left and re.match(r"^\d+\.$", left[-1]):
        sentence.insert(0, left.pop())

    return clean_text(" ".join(left)), clean_text(" ".join(sentence))


def is_noise(text):
    if not text:
        return True

    normalized = clean_text(text)
    return bool(PAGE_NOISE_RE.match(normalized)) or (
        len(normalized) == 1 and normalized.isalpha()
    )


def looks_like_entry_start(left_text, sentence_text):
    if is_noise(left_text):
        return False

    comparable = clean_text(re.sub(r"\s*\([^)]*\)\s*", " ", left_text))
    if not comparable:
        return False

    lowered = comparable.lower()
    first = re.sub(r"[,;:].*$", "", lowered.split()[0])

    if first in ("hat", "ist", "war", "wurde", "gab", "ging", "fiel", "stand"):
        return False

    if first in ARTICLES or lowered.startswith(ARTICLES):
        return True

    if "," in comparable:
        pieces = comparable.split(",", 1)[0].split()
        if not pieces:
            return False

        first_piece = pieces[0]
        return bool(re.search(r"(en|eln|ern|n)$", first_piece.lower()))

    if not sentence_text and len(comparable.split()) > 2:
        return False

    if sentence_text:
        first_piece = re.sub(r"[,;:].*$", "", comparable.split()[0])
        if ENTRY_WORD_RE.match(first_piece):
            return True

    return bool(ENTRY_WORD_RE.match(comparable))


def looks_like_inflection_line(left_text):
    lowered = left_text.lower()

    if lowered.split()[0] in ("hat", "ist", "war", "wurde"):
        return True

    return "," in lowered and not lowered.startswith(ARTICLES)


def split_entry_info(left_text):
    article = None
    rest = clean_text(left_text)
    is_verb = False

    for candidate in sorted(ARTICLES, key=len, reverse=True):
        if rest.lower().startswith(candidate + " "):
            article = candidate
            rest = rest[len(candidate) :].strip()
            break

    rest = re.sub(r"\s*\([^)]*\)\s*", " ", rest)
    rest = clean_text(rest.replace("→", " "))
    word_part = re.split(r"[,;]", rest, 1)[0].strip()
    word = clean_text(word_part)
    plural = None
    first_piece = word.split()[0].lower() if word else ""

    if "," in rest and not article and re.search(r"(en|eln|ern|n)$", first_piece):
        is_verb = True

    if "," in rest and not is_verb:
        plural = clean_text(rest.split(",", 1)[1])

    word = re.sub(r"^[/-]+\s*", "", word)
    word = re.sub(r"\s*/\s*$", "", word)

    return article, word, plural, is_verb


def normalize_sentence(parts):
    sentence = clean_text(" ".join(part for part in parts if part))
    sentence = sentence.replace(" - ", " - ")
    sentence = re.sub(r"(\w)- (\w)", r"\1\2", sentence)
    return sentence


def make_entry(level, left_text, sentence_parts):
    article, word, plural, is_verb = split_entry_info(left_text)

    if not word or not word[0].isalpha() or word.isupper() and len(word) > 2:
        return None

    sentence = normalize_sentence(sentence_parts)
    source = f"{level}:{article or ''}:{word}:{sentence}"
    digest = hashlib.sha1(source.encode("utf-8")).hexdigest()[:10]

    entry = {
        "id": f"{level}_{digest}",
        "level": level,
        "letter": word[0].upper(),
        "word": word,
    }

    if article:
        entry["article"] = article
        entry["type"] = "noun"
    elif is_verb:
        entry["type"] = "verb"
    elif " " in word or "/" in word:
        entry["type"] = "phrase"
    else:
        entry["type"] = "word"

    if plural:
        entry["plural"] = plural

    if sentence:
        entry["sentence_de"] = sentence

    return entry


def parse_column(page, level, column):
    entries = []
    current_left = None
    current_sentences = []
    cropped = page.crop(column["bbox"])

    for line in grouped_lines(cropped):
        left_text, sentence_text = line_parts(line, column["sentence_x"])

        if is_noise(left_text) and not sentence_text:
            continue

        if current_left and current_left.rstrip().endswith("-") and left_text and not sentence_text:
            current_left = current_left.rstrip("- ") + left_text
            continue

        if looks_like_entry_start(left_text, sentence_text):
            if current_left:
                entry = make_entry(level, current_left, current_sentences)
                if entry:
                    entries.append(entry)

            current_left = left_text
            current_sentences = [sentence_text]
            continue

        if current_left:
            if sentence_text:
                current_sentences.append(sentence_text)
            elif not looks_like_inflection_line(left_text):
                current_sentences.append(left_text)

    if current_left:
        entry = make_entry(level, current_left, current_sentences)
        if entry:
            entries.append(entry)

    return entries


def parse_pdf(level, pdf_path):
    entries = []
    config = CONFIG[level]

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages[config["start_page"] - 1 :]:
            for column in config["columns"]:
                entries.extend(parse_column(page, level, column))

    unique = {}
    for entry in entries:
        key = (entry["letter"], entry["word"], entry.get("article", ""))
        existing = unique.get(key)
        if not existing or (
            not existing.get("sentence_de") and entry.get("sentence_de")
        ):
            unique[key] = entry

    return sorted(unique.values(), key=lambda item: (item["letter"], item["word"].lower()))


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)

    for level, pdf_path in PDFS.items():
        if not pdf_path.exists():
            print(f"Missing PDF: {pdf_path}")
            continue

        entries = parse_pdf(level, pdf_path)
        out_file = OUTPUT / f"{level}.json"

        with open(out_file, "w", encoding="utf-8") as file:
            json.dump(entries, file, ensure_ascii=False, indent=2)

        with_sentences = sum(1 for entry in entries if entry.get("sentence_de"))
        print(f"Saved {len(entries)} {level} entries ({with_sentences} with examples)")


if __name__ == "__main__":
    main()
