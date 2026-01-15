// Types pour le système de journal

export type MoodLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export type MoodEmoji = '😢' | '🙃' | '🙂' | '😊' | '😍'

export interface JournalEntry {
  id: string
  date: string // YYYY-MM-DD

  // ✨ INTENTION + ACTION (prioritaire)
  intention?: string // "Qu'est-ce qui compte aujourd'hui ?"
  action?: string // Action concrète associée

  // Champs optionnels (secondaires, fusionnés)
  mood?: MoodLevel
  moodEmoji?: MoodEmoji
  freeNotes?: string // Fusion de gratitude/learned/victory/reflection

  // 🆕 Sections structurées (optionnelles)
  gratitudeText?: string // "Je suis reconnaissant pour..."
  learningText?: string // "Aujourd'hui j'ai appris..."
  victoryText?: string // "Ma victoire du jour..."

  // Métadonnées (silencieuses)
  tags?: string[]
  isFavorite?: boolean
  createdAt: number
  updatedAt: number

  // Legacy fields (deprecated, pour compatibilité)
  mainGoal?: string
  gratitude?: string[]
  reflection?: string
  learned?: string
  victory?: string
  photos?: string[]
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
