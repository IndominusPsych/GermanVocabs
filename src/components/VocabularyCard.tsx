import { useEffect, useState } from 'react'
import { speakGerman } from '../hooks/useAudio'
import { useTranslation } from '../hooks/useTranslation'
import type { VocabularyEntry } from '../types/vocabulary'

interface Props {
  entry: VocabularyEntry
}

export default function VocabularyCard({ entry }: Props) {
  const [showMeaning, setShowMeaning] = useState(false)
  const wordLabel = [entry.article, entry.word].filter(Boolean).join(' ')
  const sentenceText = entry.sentence_de
  const wordTranslation = useTranslation(showMeaning ? wordLabel : undefined)
  const sentenceTranslation = useTranslation(
    showMeaning && sentenceText ? sentenceText : undefined
  )

  useEffect(() => {
    setShowMeaning(false)
  }, [entry.id])

  const audioText = sentenceText ? `${wordLabel}. ${sentenceText}` : wordLabel

  return (
    <section className="w-full max-w-3xl rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm sm:p-8">
      <div className="mb-6 flex flex-col items-center gap-4">
        <div className="max-w-2xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-normal text-teal-700">
            {entry.level} · {entry.letter}
          </p>
          <h1 className="break-words text-4xl font-bold text-zinc-950 sm:text-5xl">
            {wordLabel}
          </h1>
          {(entry.plural || entry.type) && (
            <p className="mt-3 text-sm text-zinc-500">
              {[entry.type, entry.plural && `plural ${entry.plural}`]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            className="flex h-11 w-11 items-center justify-center rounded-md bg-zinc-950 text-white transition hover:bg-zinc-800"
            onClick={() => speakGerman(audioText)}
            aria-label="Listen"
            title="Listen"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M11 5 6 9H3v6h3l5 4V5Z" />
              <path d="M15.5 8.5a5 5 0 0 1 0 7" />
              <path d="M18.5 5.5a9 9 0 0 1 0 13" />
            </svg>
          </button>

          <button
            className="h-11 rounded-md border border-teal-700 px-5 text-sm font-semibold text-teal-800 transition hover:bg-teal-50"
            onClick={() => setShowMeaning((value) => !value)}
          >
            {showMeaning ? 'Hide Meaning' : 'Show Meaning'}
          </button>
        </div>
      </div>

      {sentenceText && (
        <div className="mx-auto mb-6 max-w-2xl rounded-md bg-zinc-50 p-4 text-lg leading-8 text-zinc-800">
          {sentenceText}
        </div>
      )}

      {showMeaning && (
        <div className="mx-auto mt-6 max-w-2xl space-y-4 border-t border-zinc-200 pt-5">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-normal text-zinc-500">
              Word
            </h2>
            <p className="mt-1 text-xl text-zinc-950">
              {wordTranslation.status === 'loading' && 'Translating...'}
              {wordTranslation.status === 'error' && 'Translation unavailable'}
              {wordTranslation.status === 'ready' && wordTranslation.translation}
            </p>
          </div>

          {sentenceText && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-normal text-zinc-500">
                Sentence
              </h2>
              <p className="mt-1 text-lg leading-8 text-zinc-800">
                {sentenceTranslation.status === 'loading' && 'Translating...'}
                {sentenceTranslation.status === 'error' &&
                  'Translation unavailable'}
                {sentenceTranslation.status === 'ready' &&
                  sentenceTranslation.translation}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
