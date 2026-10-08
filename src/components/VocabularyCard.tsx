import { useState } from 'react'
import { speakGerman } from '../hooks/useAudio'
import { useTranslation } from '../hooks/useTranslation'
import type { VocabularyEntry } from '../types/vocabulary'

interface Props {
  entry: VocabularyEntry
}

const GENDERS = ['der', 'die', 'das']

const genderClass = (article?: string) =>
  article && GENDERS.includes(article) ? article : ''

const translationText = (result: ReturnType<typeof useTranslation>) => {
  if (result.status === 'ready') return result.translation
  if (result.status === 'error') return 'Translation unavailable'
  return 'Translating…'
}

// Remounted per entry (keyed by id in App), so the meaning starts hidden for each word.
export default function VocabularyCard({ entry }: Props) {
  const [showMeaning, setShowMeaning] = useState(false)
  const wordLabel = [entry.article, entry.word].filter(Boolean).join(' ')
  const sentenceText = entry.sentence_de
  const wordTranslation = useTranslation(showMeaning ? wordLabel : undefined)
  const sentenceTranslation = useTranslation(
    showMeaning && sentenceText ? sentenceText : undefined
  )
  const gender = genderClass(entry.article)

  const audioText = sentenceText ? `${wordLabel}. ${sentenceText}` : wordLabel

  return (
    <section className="vcard">
      <div className="vc-main">
        <h1 className="vc-word">
          {entry.article && (
            <>
              <span className={`vc-art ${gender}`}>{entry.article}</span>{' '}
            </>
          )}
          {entry.word}
        </h1>

        {(entry.type || entry.plural) && (
          <div className="vc-meta">
            {entry.type && <span className={`chip ${gender}`}>{entry.type}</span>}
            {entry.plural && <span className="chip">plural {entry.plural}</span>}
          </div>
        )}

        <div className="vc-acts">
          <button
            className="btn listen"
            type="button"
            onClick={() => speakGerman(audioText)}
            aria-label="Listen"
            title="Listen"
          >
            <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M11 5 6 9H3v6h3l5 4V5Z" />
              <path d="M15.5 8.5a5 5 0 0 1 0 7" />
              <path d="M18.5 5.5a9 9 0 0 1 0 13" />
            </svg>
          </button>

          <button
            className={`btn lg ${showMeaning ? '' : 'primary'}`}
            type="button"
            onClick={() => setShowMeaning((value) => !value)}
          >
            {showMeaning ? 'Hide Meaning' : 'Show Meaning'}
          </button>
        </div>
      </div>

      {sentenceText && <p className="vc-sentence">{sentenceText}</p>}

      {showMeaning && (
        <div className="vc-mean">
          <div className="vc-row">
            <span className="k">Word</span>
            <span className={`v ${wordTranslation.status === 'ready' ? '' : 'muted'}`}>
              {translationText(wordTranslation)}
            </span>
          </div>
          {sentenceText && (
            <div className="vc-row">
              <span className="k">Sentence</span>
              <span className={`v ${sentenceTranslation.status === 'ready' ? '' : 'muted'}`}>
                {translationText(sentenceTranslation)}
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
