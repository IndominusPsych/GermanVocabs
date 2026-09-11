# German Vocabulary Platform

web app for practicing Goethe A1, A2, and B1 vocabulary. Can also run locally.

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The Vite config uses `base: './'`, so the built `dist` output also works on GitHub Pages project sites.

## Deploy

[Deployed here](https://indominuspsych.github.io/GermanVocabs/)

## Extract Vocabulary From PDFs

The place PDFs live in `data/raw`, and the optimized local JSON files are written to `data/processed`.

```bash
pip install pdfplumber
npm run extract
```

The extractor reads the alphabetic word-list sections, keeps the German word, article/plural when available, example sentence when available, level, and first letter.

## Translation And Audio

Audio uses the browser's built-in German speech synthesis. English meanings are fetched when you click `Show Meaning` using the public MyMemory translation API, then cached in `localStorage`.
