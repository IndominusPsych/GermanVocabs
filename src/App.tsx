import { useEffect, useState } from 'react'
import VocabularyCard from './components/VocabularyCard'
import { getLetterCount, getLevelCount, useVocabStore } from './store/vocabStore'
import { initAnalytics, trackPageView } from './utils/analytics'

type Theme = 'system' | 'light' | 'dark'

const THEME_KEY = 'vocab-theme'
const COMPACT = '(max-width: 860px)'

const readTheme = (): Theme => {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // storage blocked — fall back to the system appearance
  }
  return 'system'
}

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

  const [sidebarOpen, setSidebarOpen] = useState(
    () => !window.matchMedia(COMPACT).matches
  )
  const [theme, setTheme] = useState<Theme>(readTheme)

  const entry = words[currentIndex]
  const canGoBack = currentIndex > 0
  const canGoNext = currentIndex < words.length - 1
  const levelTotal = getLevelCount(level)
  const levelSeen = practicedIds.filter((id) => id.startsWith(level + '_')).length

  useEffect(() => {
    if (entry) {
      markPracticed(entry.id)
    }
  }, [entry, markPracticed])

  useEffect(() => {
    initAnalytics()
    trackPageView()
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // ignore
    }
  }, [theme])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (target.closest('input, textarea, select')) return
      if (event.key === 'ArrowRight') next()
      if (event.key === 'ArrowLeft') previous()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, previous])

  const chooseLetter = (item: string) => {
    setLetter(item)
    if (window.matchMedia(COMPACT).matches) setSidebarOpen(false)
  }

  const cycleTheme = () =>
    setTheme((now) => (now === 'system' ? 'light' : now === 'light' ? 'dark' : 'system'))

  const themeLabel = { system: 'Appearance: System', light: 'Appearance: Light', dark: 'Appearance: Dark' }[theme]

  return (
    <div className="win">
      <header className="titlebar">
        <button
          className="tb-btn"
          type="button"
          aria-label="Toggle sidebar"
          title="Toggle Sidebar"
          onClick={() => setSidebarOpen((open) => !open)}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
            <rect x="1.5" y="2.5" width="13" height="11" rx="2.2" />
            <path d="M6 2.5v11" />
          </svg>
        </button>

        <div className="tb-title">
          <div className="t">Wortschatz</div>
          <div className="s">
            {level} · {letter === 'ALL' ? 'All letters' : `Letter ${letter}`}
            {words.length > 0 && ` · ${currentIndex + 1} of ${words.length}`}
          </div>
        </div>

        <div className="tb-right">
          <button
            className="tb-btn"
            type="button"
            aria-label="Previous word"
            title="Previous (←)"
            onClick={previous}
            disabled={!canGoBack}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3.5L5.5 8l4.5 4.5" />
            </svg>
          </button>
          <button
            className="tb-btn"
            type="button"
            aria-label="Next word"
            title="Next (→)"
            onClick={next}
            disabled={!canGoNext}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3.5L10.5 8 6 12.5" />
            </svg>
          </button>
          <span className="tb-sep" />
          <button className="tb-btn" type="button" aria-label={themeLabel} title={themeLabel} onClick={cycleTheme}>
            {theme === 'dark' ? (
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
                <path d="M13.5 9.6A5.6 5.6 0 0 1 6.4 2.5a5.6 5.6 0 1 0 7.1 7.1Z" />
              </svg>
            ) : theme === 'light' ? (
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                <circle cx="8" cy="8" r="3.4" />
                <path d="M8 .9v1.8M8 13.3v1.8M15.1 8h-1.8M2.7 8H.9M13 3l-1.3 1.3M4.3 11.7L3 13M13 13l-1.3-1.3M4.3 4.3L3 3" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
                <circle cx="8" cy="8" r="6" />
                <path d="M8 2a6 6 0 0 1 0 12Z" fill="currentColor" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <div className="winbody">
        <nav className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`} aria-label="Levels and letters">
          <div className="sb-top">
            <div className="seg" role="tablist" aria-label="Level">
              {levels.map((item) => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={level === item}
                  className={`seg-btn ${level === item ? 'on' : ''}`}
                  onClick={() => setLevel(item)}
                >
                  {item}
                  <small>{getLevelCount(item)}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="sb-list">
            <div className="sb-head">Letters</div>
            {letters.map((item) => {
              const count = getLetterCount(level, item)
              return (
                <button
                  key={item}
                  type="button"
                  className={`sb-row ${letter === item ? 'on' : ''}`}
                  onClick={() => chooseLetter(item)}
                  disabled={count === 0}
                >
                  <span className="sb-ico">
                    {item === 'ALL' ? (
                      <svg viewBox="0 0 12 12" fill="currentColor">
                        <rect x="1" y="1" width="4" height="4" rx="1" />
                        <rect x="7" y="1" width="4" height="4" rx="1" />
                        <rect x="1" y="7" width="4" height="4" rx="1" />
                        <rect x="7" y="7" width="4" height="4" rx="1" />
                      </svg>
                    ) : (
                      item
                    )}
                  </span>
                  <span className="sb-t">{item === 'ALL' ? 'All Words' : `Letter ${item}`}</span>
                  <span className="sb-n">{count}</span>
                </button>
              )
            })}
          </div>

          <div className="sb-foot">
            <div className="k">
              <span>Seen in {level}</span>
              <b>
                {levelSeen} / {levelTotal}
              </b>
            </div>
            <div className="mini-track">
              <div className="mini-fill" style={{ width: `${(levelSeen / levelTotal) * 100}%` }} />
            </div>
            <button className="btn" type="button" onClick={resetPracticed}>
              Reset Progress
            </button>
          </div>
        </nav>
        <div className={`scrim ${sidebarOpen ? 'on' : ''}`} onClick={() => setSidebarOpen(false)} />

        <main className="content">
          <div className="stage">
            {entry ? (
              <>
                <div className="stage-top">
                  <span className="kicker">
                    {entry.level} · {letter === 'ALL' ? 'All Words' : `Letter ${letter}`}
                  </span>
                  <span className="count">
                    {currentIndex + 1} / {words.length}
                  </span>
                </div>
                <div className="progress">
                  <div style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }} />
                </div>

                <VocabularyCard key={entry.id} entry={entry} />

                <div className="nav">
                  <button className="btn lg" type="button" onClick={previous} disabled={!canGoBack}>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 3.5L5.5 8l4.5 4.5" />
                    </svg>
                    Previous
                  </button>
                  <span className="hint">
                    <span className="kbd">←</span>
                    <span className="kbd">→</span>
                    to move
                  </span>
                  <button className="btn lg primary" type="button" onClick={next} disabled={!canGoNext}>
                    Next
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 3.5L10.5 8 6 12.5" />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <div className="empty">
                <h2>No words for this filter</h2>
                <p>Choose another letter or level.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
