export interface VocabularyEntry {
  id: string
  level: 'A1' | 'A2' | 'B1'
  letter: string
  word: string
  type?: 'noun' | 'verb' | 'phrase' | 'word'
  article?: string
  plural?: string
  sentence_de?: string
}

export type VocabLevel = VocabularyEntry['level']
