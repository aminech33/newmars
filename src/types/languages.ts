/**
 * 🗣️ Types pour l'apprentissage des langues
 */

export type TargetLanguage = 
  | 'spanish' 
  | 'arabic' 
  | 'mandarin' 
  | 'japanese' 
  | 'english'
  | 'german'
  | 'italian'
  | 'portuguese'

export type LanguageLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export type ExerciseType = 
  | 'fill-blank'      // Compléter phrase
  | 'translate'       // Traduire
  | 'multiple-choice' // QCM
  | 'reorder'         // Remettre mots dans l'ordre

export interface LanguageCourse {
  id: string
  targetLanguage: TargetLanguage
  nativeLanguage: 'french'
  level: LanguageLevel
  name: string
  icon: string
  
  // Configuration
  isRTL: boolean           // Arabe, hébreu
  usesPinyin: boolean      // Mandarin
  usesRomaji: boolean      // Japonais
  
  // Progression
  conversationMinutes: number
  exercisesCompleted: number
  wordsLearned: number
  readingMinutes: number
  currentStreak: number
  longestStreak: number
  totalTimeSpent: number
  
  // Contenu
  messages: LanguageMessage[]
  vocabulary: VocabularyWord[]
  completedExercises: string[]  // IDs
  
  // Métadonnées
  createdAt: number
  lastActiveAt: number
}

export interface LanguageMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  translation?: string  // Traduction en français si demandée
  corrections?: Correction[]
  timestamp: number
}

export interface Correction {
  original: string
  corrected: string
  explanation: string
}

export interface VocabularyWord {
  id: string
  word: string
  translation: string
  pronunciation?: string  // Pinyin, romaji, etc.
  example: string
  context: string  // D'où vient ce mot (exercice, conversation, etc.)
  
  // Spaced repetition
  easeFactor: number
  interval: number
  repetitions: number
  nextReview: number
  lastReviewed: number
  
  addedAt: number
}

export interface Exercise {
  id: string
  type: ExerciseType
  level: LanguageLevel
  topic: string
  
  // Contenu
  question: string
  options?: string[]
  correctAnswer: string
  explanation: string
  
  // Média
  audioUrl?: string
  imageUrl?: string
}

export interface ReadingText {
  id: string
  level: LanguageLevel
  title: string
  content: string  // Texte avec mots annotables
  vocabulary: Array<{
    word: string
    translation: string
    position: number  // Index dans le texte
  }>
  estimatedMinutes: number
}

// Language metadata
export const LANGUAGE_INFO: Record<TargetLanguage, {
  name: string
  nativeName: string
  flag: string
  isRTL: boolean
  usesPinyin: boolean
  usesRomaji: boolean
}> = {
  spanish: {
    name: 'Espagnol',
    nativeName: 'Español',
    flag: '🇪🇸',
    isRTL: false,
    usesPinyin: false,
    usesRomaji: false
  },
  arabic: {
    name: 'Arabe',
    nativeName: 'العربية',
    flag: '🇸🇦',
    isRTL: true,
    usesPinyin: false,
    usesRomaji: false
  },
  mandarin: {
    name: 'Mandarin',
    nativeName: '中文',
    flag: '🇨🇳',
    isRTL: false,
    usesPinyin: true,
    usesRomaji: false
  },
  japanese: {
    name: 'Japonais',
    nativeName: '日本語',
    flag: '🇯🇵',
    isRTL: false,
    usesPinyin: false,
    usesRomaji: true
  },
  english: {
    name: 'Anglais',
    nativeName: 'English',
    flag: '🇬🇧',
    isRTL: false,
    usesPinyin: false,
    usesRomaji: false
  },
  german: {
    name: 'Allemand',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    isRTL: false,
    usesPinyin: false,
    usesRomaji: false
  },
  italian: {
    name: 'Italien',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    isRTL: false,
    usesPinyin: false,
    usesRomaji: false
  },
  portuguese: {
    name: 'Portugais',
    nativeName: 'Português',
    flag: '🇵🇹',
    isRTL: false,
    usesPinyin: false,
    usesRomaji: false
  }
}

export const LEVEL_INFO: Record<LanguageLevel, {
  label: string
  description: string
  color: string
}> = {
  A1: {
    label: 'Débutant',
    description: 'Premiers pas',
    color: 'emerald'
  },
  A2: {
    label: 'Élémentaire',
    description: 'Conversations simples',
    color: 'green'
  },
  B1: {
    label: 'Intermédiaire',
    description: 'Autonome',
    color: 'blue'
  },
  B2: {
    label: 'Intermédiaire avancé',
    description: 'Conversations complexes',
    color: 'indigo'
  },
  C1: {
    label: 'Avancé',
    description: 'Maîtrise',
    color: 'purple'
  },
  C2: {
    label: 'Maîtrise',
    description: 'Bilingue',
    color: 'pink'
  }
}


