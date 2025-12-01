// Types pour le système de journal

export type MoodLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export type MoodEmoji = '😢' | '😐' | '🙂' | '😊' | '🤩'

export interface JournalEntry {
  id: string
  date: string // YYYY-MM-DD
  mood?: MoodLevel
  moodEmoji?: MoodEmoji
  mainGoal?: string
  gratitude?: string[]
  reflection: string
  learned?: string
  victory?: string
  photos?: string[] // URLs or base64
  tags?: string[]
  isFavorite?: boolean
  createdAt: number
  updatedAt: number
}

export interface JournalPrompt {
  id: string
  question: string
  category: 'gratitude' | 'goal' | 'reflection' | 'learning' | 'victory'
  icon: string
}

export interface JournalStats {
  totalEntries: number
  currentStreak: number
  longestStreak: number
  averageMood: number
  entriesThisMonth: number
  entriesThisYear: number
  favoriteCount: number
}
