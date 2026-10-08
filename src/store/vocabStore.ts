import { create } from 'zustand'
import a1 from '../../data/processed/A1.json'
import a2 from '../../data/processed/A2.json'
import b1 from '../../data/processed/B1.json'
import type { VocabLevel, VocabularyEntry } from '../types/vocabulary'

const allWords: Record<VocabLevel, VocabularyEntry[]> = {
  A1: a1 as VocabularyEntry[],
  A2: a2 as VocabularyEntry[],
  B1: b1 as VocabularyEntry[]
}

const sortWords = (words: VocabularyEntry[]) =>
  [...words].sort((a, b) =>
    a.word.localeCompare(b.word, 'de', { sensitivity: 'base' })
  )

const filterWords = (level: VocabLevel, letter: string) => {
  const levelWords = sortWords(allWords[level])

  if (letter === 'ALL') {
    return levelWords
  }

  return levelWords.filter((word) => word.letter === letter)
}

interface Store {
  level: VocabLevel
  letter: string
  currentIndex: number
  words: VocabularyEntry[]
  levels: VocabLevel[]
  letters: string[]
  practicedIds: string[]
  setLevel: (level: VocabLevel) => void
  setLetter: (letter: string) => void
  markPracticed: (id: string) => void
  resetPracticed: () => void
  next: () => void
  previous: () => void
}

export const useVocabStore = create<Store>((set) => ({
  level: 'A1',
  letter: 'ALL',
  currentIndex: 0,
  words: filterWords('A1', 'ALL'),
  levels: ['A1', 'A2', 'B1'],
  practicedIds: [],
  letters: [
    'ALL',
    ...Array.from(new Set(Object.values(allWords).flat().map((entry) => entry.letter))).sort(
      (a, b) => a.localeCompare(b, 'de')
    )
  ],

  setLevel: (level) =>
    set((state) => ({
      level,
      currentIndex: 0,
      words: filterWords(level, state.letter)
    })),

  setLetter: (letter) =>
    set((state) => ({
      letter,
      currentIndex: 0,
      words: filterWords(state.level, letter)
    })),

  markPracticed: (id) =>
    set((state) => {
      if (state.practicedIds.includes(id)) {
        return state
      }

      return {
        practicedIds: [...state.practicedIds, id]
      }
    }),

  resetPracticed: () =>
    set({
      practicedIds: []
    }),

  next: () =>
    set((state) => ({
      currentIndex: Math.min(state.currentIndex + 1, state.words.length - 1)
    })),

  previous: () =>
    set((state) => ({
      currentIndex: Math.max(state.currentIndex - 1, 0)
    }))
}))

export const getLevelCount = (level: VocabLevel) => allWords[level].length

export const getLetterCount = (level: VocabLevel, letter: string) =>
  letter === 'ALL'
    ? allWords[level].length
    : allWords[level].filter((entry) => entry.letter === letter).length
