import { useEffect } from 'react'
import VocabularyCard from './components/VocabularyCard'
import { getLevelCount, useVocabStore } from './store/vocabStore'
import type { VocabLevel } from './types/vocabulary'
import { initAnalytics, trackPageView } from "./utils/analytics";

export default function App() {
  const {
    level,
    levels,
    letter,
    letters,
    words,
    currentIndex,
    practicedIds,
    setLevel,
    setLetter,
    markPracticed,
    resetPracticed,
    next,
    previous
  } = useVocabStore()

  const entry = words[currentIndex]
  const canGoBack = currentIndex > 0
  const canGoNext = currentIndex < words.length - 1

  useEffect(() => {
    if (entry) {
      markPracticed(entry.id)
    }
  }, [entry, markPracticed])

  useEffect(() => {

  initAnalytics();

  trackPageView();

  }, []);

  return (
    <main className="min-h-screen bg-stone-50 text-zinc-950">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-5 flex flex-col gap-4 border-b border-zinc-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold">German Vocabulary Practice</h1>
            <p className="mt-1 text-sm text-zinc-500">
              A1, A2, B1 Word Practice with translation.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {levels.map((item) => (
              <button
                key={item}
                className={`h-10 rounded-md px-4 text-sm font-semibold transition ${
                  level === item
                    ? 'bg-zinc-950 text-white'
                    : 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'
                }`}
                onClick={() => setLevel(item as VocabLevel)}
              >
                {item} ({getLevelCount(item)})
              </button>
            ))}
          </div>
        </header>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {letters.map((item) => (
            <button
              key={item}
              className={`flex h-9 min-w-9 items-center justify-center rounded-md px-3 text-sm font-semibold leading-none transition ${
                letter === item
                  ? 'bg-teal-700 text-white'
                  : 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'
              }`}
              onClick={() => setLetter(item)}
            >
              {item === 'ALL' ? 'All' : item}
            </button>
          ))}
        </div>

        <div className="grid flex-1 items-center gap-5 py-4 lg:grid-cols-[1fr_180px]">
          {entry ? (
            <>
              <div className="flex flex-col items-center justify-center gap-5">
                <div className="w-full max-w-3xl text-center text-sm font-semibold text-zinc-500">
                  {currentIndex + 1} / {words.length}
                </div>
                <VocabularyCard entry={entry} />

                <div className="flex w-full max-w-3xl items-center justify-center gap-3">
                  <button
                    className="h-11 min-w-28 rounded-md border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={previous}
                    disabled={!canGoBack}
                  >
                    Previous
                  </button>

                  <button
                    className="h-11 min-w-28 rounded-md bg-teal-700 px-5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={next}
                    disabled={!canGoNext}
                  >
                    Next
                  </button>
                </div>
              </div>

              <aside className="mx-auto w-full max-w-3xl rounded-lg border border-zinc-200 bg-white p-4 text-center shadow-sm lg:sticky lg:top-6 lg:w-44 lg:self-center">
                <p className="text-xs font-semibold uppercase tracking-normal text-zinc-500">
                  Practiced
                </p>
                <p className="mt-2 text-4xl font-bold text-zinc-950">
                  {practicedIds.length}
                </p>
                <p className="mt-1 text-sm text-zinc-500">words seen</p>
                <button
                  className="mt-4 h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                  onClick={resetPracticed}
                >
                  Reset
                </button>
              </aside>
            </>
          ) : (
            <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
              <h2 className="text-xl font-bold">No words for this filter</h2>
              <p className="mt-2 text-zinc-500">Choose another letter or level.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
