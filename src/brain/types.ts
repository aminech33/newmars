/**
 * 🧠 BRAIN - Types centralisés
 * 
 * Le cerveau de l'application qui observe, analyse et guide
 * avec bienveillance, sans jamais juger ni punir.
 */

// ═══════════════════════════════════════════════════════════════
// ÉVÉNEMENTS OBSERVÉS
// ═══════════════════════════════════════════════════════════════

export type BrainEventType =
  // Tâches
  | 'task:created'
  | 'task:completed'
  | 'task:deleted'
  | 'task:updated'
  | 'task:moved'
  // Pomodoro
  | 'pomodoro:started'
  | 'pomodoro:completed'
  | 'pomodoro:interrupted'
  // Santé
  | 'weight:added'
  | 'meal:added'
  | 'water:added'
  // Journal & Mood
  | 'journal:written'
  | 'mood:set'
  // Habitudes
  | 'habit:checked'
  | 'habit:unchecked'
  | 'habit:created'
  // Lecture
  | 'book:started'
  | 'book:finished'
  | 'reading:session'
  // Apprentissage
  | 'course:started'
  | 'course:message'
  | 'flashcard:reviewed'
  // Navigation
  | 'view:changed'
  | 'app:opened'
  | 'app:closed'

export interface BrainEvent {
  type: BrainEventType
  timestamp: number
  data: Record<string, any>
  context?: {
    hour: number
    dayOfWeek: number
    mood?: number
  }
}

// ═══════════════════════════════════════════════════════════════
// PATTERNS DÉTECTÉS
// ═══════════════════════════════════════════════════════════════

export interface UserPatterns {
  // 🕐 Temporels
  peakHours: number[]                    // Top 3 heures productives
  lowHours: number[]                     // Heures de fatigue
  bestDays: number[]                     // 0=dim, 1=lun... 6=sam
  averageSessionStart: number            // Heure moyenne début journée
  averageSessionEnd: number              // Heure moyenne fin journée
  
  // ✅ Productivité
  avgTasksPerDay: number
  avgFocusDuration: number               // Durée Pomodoro réelle moyenne
  preferredCategories: string[]          // Top 3 catégories
  avoidedCategories: string[]            // Catégories procrastinées
  taskCompletionRate: number             // 0-1
  avgTaskDelay: number                   // Jours moyen avant complétion
  
  // 🍽️ Santé
  mealTimes: {
    breakfast: string | null             // "08:30" ou null
    lunch: string | null
    dinner: string | null
  }
  avgCaloriesPerDay: number
  weightTrend: 'losing' | 'gaining' | 'stable'
  
  // 🧘 Mental
  avgMood: number                        // 1-10
  moodByHour: Record<number, number>     // Mood moyen par heure
  moodByDay: Record<number, number>      // Mood moyen par jour
  journalFrequency: number               // Jours/semaine
  
  // 🔄 Habitudes
  habitCompletionRate: number            // 0-1
  mostConsistentHabits: string[]
  strugglingHabits: string[]
  
  // 📚 Apprentissage
  avgStudyDuration: number               // Minutes par session
  preferredLearningTime: number          // Heure préférée
  
  // 🔗 Corrélations découvertes
  correlations: {
    moodProductivity: number             // -1 à 1
    sleepProductivity: number            // -1 à 1 (si données dispo)
    exerciseEnergy: number               // -1 à 1
  }
}

// ═══════════════════════════════════════════════════════════════
// PRÉDICTIONS
// ═══════════════════════════════════════════════════════════════

export interface Prediction {
  id: string
  type: 'productivity' | 'health' | 'mood' | 'habit' | 'procrastination'
  confidence: number                     // 0-1
  prediction: string                     // Description
  basedOn: string                        // Explication transparente
}

export interface CurrentPredictions {
  // Productivité
  isGoodTimeForWork: boolean
  expectedTasksToday: number
  procrastinationRisk: number            // 0-1
  suggestedBreakIn: number | null        // Minutes, null si pas besoin
  
  // Santé
  expectedMoodTonight: number            // 1-10
  shouldEatSoon: boolean
  hydrationReminder: boolean
  
  // Énergie
  energyLevel: 'low' | 'medium' | 'high'
  optimalTaskType: 'creative' | 'routine' | 'break'
}

// ═══════════════════════════════════════════════════════════════
// SUGGESTIONS (GUIDE BIENVEILLANT)
// ═══════════════════════════════════════════════════════════════

export type SuggestionTone = 'encouraging' | 'gentle' | 'celebratory' | 'supportive'

export interface Suggestion {
  id: string
  message: string
  tone: SuggestionTone
  priority: 'low' | 'medium' | 'high'
  category: 'productivity' | 'health' | 'mental' | 'habit' | 'break' | 'celebration'
  actionable?: {
    label: string
    action: string                       // Identifiant action
  }
  expiresAt?: number                     // Timestamp expiration
  dismissed?: boolean
}

// Suggestions contextuelles par moment
export interface ContextualSuggestions {
  now: Suggestion | null                 // Suggestion immédiate
  upcoming: Suggestion[]                 // Prochaines suggestions
  achievements: Suggestion[]             // Célébrations récentes
}

// ═══════════════════════════════════════════════════════════════
// SCORE GLOBAL DE BIEN-ÊTRE
// ═══════════════════════════════════════════════════════════════

export interface WellbeingScore {
  overall: number                        // 0-100
  breakdown: {
    productivity: number                 // 0-25
    health: number                       // 0-25
    mental: number                       // 0-25
    consistency: number                  // 0-25
  }
  trend: 'improving' | 'stable' | 'declining'
  trendPercent: number                   // % changement vs semaine dernière
}

// ═══════════════════════════════════════════════════════════════
// MÉMOIRE PERSISTANTE
// ═══════════════════════════════════════════════════════════════

export interface BrainMemory {
  // Événements récents (7 derniers jours)
  recentEvents: BrainEvent[]
  
  // Patterns calculés
  patterns: UserPatterns
  
  // Historique des scores (30 derniers jours)
  scoreHistory: { date: string; score: number }[]
  
  // Suggestions dismissées (pour ne pas répéter)
  dismissedSuggestions: string[]
  
  // Dernière analyse complète
  lastFullAnalysis: number
  
  // Version pour migrations futures
  version: number
}

// ═══════════════════════════════════════════════════════════════
// ÉTAT DU CERVEAU
// ═══════════════════════════════════════════════════════════════

export interface BrainState {
  // Données calculées
  patterns: UserPatterns
  predictions: CurrentPredictions
  suggestions: ContextualSuggestions
  wellbeing: WellbeingScore
  
  // État interne
  isAnalyzing: boolean
  lastUpdate: number
  
  // Actions
  observe: (type: BrainEventType, data: Record<string, any>) => void
  analyze: () => void
  dismissSuggestion: (id: string) => void
  refresh: () => void
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export interface BrainConfig {
  // Fréquence d'analyse (ms)
  analyzeInterval: number
  
  // Durée de cache des patterns (ms)
  patternsCacheDuration: number
  
  // Nombre max d'événements en mémoire
  maxRecentEvents: number
  
  // Seuils
  thresholds: {
    procrastinationDays: number          // Jours avant alerte douce
    lowMoodThreshold: number             // Mood < X = suggestion support
    breakAfterMinutes: number            // Suggérer pause après X min focus
    celebrateAfterTasks: number          // Célébrer après X tâches
  }
  
  // Personnalité du guide
  personality: {
    encouragementLevel: 'minimal' | 'moderate' | 'enthusiastic'
    reminderFrequency: 'rare' | 'normal' | 'frequent'
  }
}

// Configuration par défaut alignée avec la philosophie
export const DEFAULT_BRAIN_CONFIG: BrainConfig = {
  analyzeInterval: 5 * 60 * 1000,        // 5 minutes
  patternsCacheDuration: 60 * 1000,      // 1 minute
  maxRecentEvents: 500,
  thresholds: {
    procrastinationDays: 5,              // Doux, pas 2-3 jours
    lowMoodThreshold: 4,
    breakAfterMinutes: 90,               // Pas trop intrusif
    celebrateAfterTasks: 3,
  },
  personality: {
    encouragementLevel: 'moderate',
    reminderFrequency: 'rare',           // Non-intrusif
  }
}

