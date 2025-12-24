// Types pour le module Apprentissage IA

// ============================================
// MESSAGES & CHAT
// ============================================

export type MessageRole = 'user' | 'assistant' | 'system'

export interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: number
  
  // Métadonnées
  isStreaming?: boolean        // En cours de génération
  codeBlocks?: string[]        // Blocs de code extraits
  savedAsNote?: boolean        // Sauvegardé en note
  flashcardCreated?: boolean   // Flashcard créée depuis ce message
  liked?: boolean              // Feedback utilisateur
  
  // Pour les erreurs
  isError?: boolean
  errorMessage?: string
}

// ============================================
// COURS
// ============================================

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced'
export type CourseStatus = 'active' | 'paused' | 'completed' | 'archived'

export interface Course {
  id: string
  name: string
  description?: string
  icon: string                 // Emoji
  color: string                // Couleur d'accent (indigo, emerald, etc.)
  level: CourseLevel
  status: CourseStatus
  
  // Lien projet (obligatoire)
  linkedProjectId: string      // ID du projet lié
  
  // Programmation
  isProgramming?: boolean      // Active le split view avec éditeur
  programmingLanguage?: string // python, javascript, typescript, etc.
  
  // Terminal
  isTerminal?: boolean         // Active le split view avec terminal
  
  // Chat
  messages: Message[]
  systemPrompt?: string        // Contexte personnalisé pour l'IA
  
  // Contenu généré
  flashcards: Flashcard[]
  notes: Note[]
  
  // Stats
  totalTimeSpent: number       // Minutes
  lastActiveAt: number         // Timestamp
  streak: number               // Jours consécutifs
  longestStreak: number        // Record de streak
  totalReviews: number         // Nombre total de révisions
  sessionsCount: number
  messagesCount: number
  
  // Mastery tracking (historique des 30 derniers jours)
  masteryHistory?: Array<{
    date: string              // YYYY-MM-DD
    masteryLevel: number      // 0-100
  }>
  currentMastery: number       // 0-100 (maîtrise actuelle)
  
  // Objectifs
  topics?: CourseTopic[]       // Sujets à couvrir
  progress: number             // 0-100
  
  // Méta
  createdAt: number
  updatedAt: number
  pinnedAt?: number            // Si épinglé
}

export interface CourseTopic {
  id: string
  name: string
  status: 'pending' | 'in_progress' | 'completed'
  completedAt?: number
}

// ============================================
// FLASHCARDS
// ============================================

export interface Flashcard {
  id: string
  courseId: string
  front: string                // Question
  back: string                 // Réponse
  hint?: string                // Indice optionnel
  
  // Spaced repetition (SM-2)
  difficulty: 1 | 2 | 3 | 4 | 5
  easeFactor: number           // 2.5 par défaut
  interval: number             // Jours avant prochaine révision
  repetitions: number          // Bonnes réponses consécutives
  nextReview: string           // Date ISO YYYY-MM-DD
  lastReview?: string
  
  // Stats
  reviewCount: number
  correctCount: number
  
  // Méta
  createdAt: number
  createdFromMessageId?: string
}

// ============================================
// NOTES
// ============================================

export interface Note {
  id: string
  courseId: string
  title: string
  content: string
  tags: string[]
  
  // Source
  createdFromMessageId?: string
  
  // Méta
  createdAt: number
  updatedAt: number
  isPinned: boolean
}

// ============================================
// QUIZ
// ============================================

export type QuizQuestionType = 'mcq' | 'truefalse' | 'fillblank' | 'shortanswer'

export interface QuizQuestion {
  id: string
  type: QuizQuestionType
  question: string
  options?: string[]           // Pour MCQ
  correctAnswer: string | boolean
  explanation: string
  difficulty: 1 | 2 | 3
  topic?: string
}

export interface QuizSession {
  id: string
  courseId: string
  questions: QuizQuestion[]
  answers: Record<string, string | boolean>
  currentIndex: number
  score: number
  maxScore: number
  startedAt: number
  completedAt?: number
  timeSpent: number            // Secondes
}

// ============================================
// STATS & OBJECTIFS
// ============================================

export interface LearningStats {
  totalCourses: number
  activeCourses: number
  totalTimeSpent: number       // Minutes
  totalMessages: number
  totalFlashcards: number
  currentStreak: number
  longestStreak: number
  weeklyActivity: number[]     // 7 derniers jours (minutes)
  topCourses: { courseId: string; timeSpent: number }[]
}

export interface LearningGoal {
  id: string
  type: 'time' | 'messages' | 'flashcards' | 'streak'
  target: number
  current: number
  period: 'daily' | 'weekly' | 'monthly'
  active: boolean
}

// ============================================
// UI STATE
// ============================================

export interface LearningUIState {
  activeCourseId: string | null
  searchQuery: string
  filterStatus: CourseStatus | 'all'
  sortBy: 'recent' | 'name' | 'progress' | 'streak'
  sidebarCollapsed: boolean
  isTyping: boolean            // IA en train de répondre
}

// ============================================
// ACTIONS
// ============================================

export interface CreateCourseData {
  name: string
  description?: string
  icon: string
  color: string
  level: CourseLevel
  linkedProjectId: string      // Obligatoire
  systemPrompt?: string
  topics?: string[]
  isProgramming?: boolean
  programmingLanguage?: string
  isTerminal?: boolean
}

export interface UpdateCourseData {
  name?: string
  description?: string
  icon?: string
  color?: string
  level?: CourseLevel
  status?: CourseStatus
  systemPrompt?: string
}

export interface SendMessageData {
  courseId: string
  content: string
}

// ============================================
// CONSTANTES
// ============================================

export const COURSE_ICONS = [
  '💻', '🧮', '🇬🇧', '🇫🇷', '🇪🇸', '🇩🇪', '🇯🇵', '🇨🇳',
  '📖', '📚', '🎨', '🎵', '🔬', '🧪', '🌍', '📊',
  '💼', '📈', '🏛️', '⚖️', '🏥', '🧠', '💡', '🎯',
  '🚀', '⚙️', '🔧', '📱', '🌐', '☁️', '🔒', '📝'
]

export const COURSE_COLORS = [
  'indigo', 'emerald', 'rose', 'amber', 'cyan', 'violet', 'orange', 'teal'
] as const

export type CourseColor = typeof COURSE_COLORS[number]

export const COURSE_LEVELS: { value: CourseLevel; label: string; emoji: string }[] = [
  { value: 'beginner', label: 'Débutant', emoji: '🌱' },
  { value: 'intermediate', label: 'Intermédiaire', emoji: '🌿' },
  { value: 'advanced', label: 'Avancé', emoji: '🌳' }
]

export const QUICK_PROMPTS = [
  { label: 'Explique', prompt: 'Explique-moi ' },
  { label: 'Exemple', prompt: 'Donne-moi un exemple de ' },
  { label: 'Quiz', prompt: 'Fais-moi un quiz sur ' },
  { label: 'Résume', prompt: 'Résume ce qu\'on a vu sur ' },
  { label: 'Compare', prompt: 'Compare ' },
  { label: 'Exercice', prompt: 'Donne-moi un exercice sur ' }
]

