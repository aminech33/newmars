/**
 * 🧠 BRAIN - Types centralisés (SIMPLIFIÉ)
 * 
 * Le cerveau observe et calcule le Wellbeing Score.
 * Pas de prédictions ni de suggestions - juste des stats.
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
// PATTERNS DÉTECTÉS (SIMPLIFIÉ)
// ═══════════════════════════════════════════════════════════════

export interface UserPatterns {
  // ✅ Productivité
  avgTasksPerDay: number
  avgFocusDuration: number               // Durée Pomodoro réelle moyenne
  taskCompletionRate: number             // 0-1
  
  // 🍽️ Santé (deprecated - gardé pour compatibilité)
  avgCaloriesPerDay: number
  weightTrend: 'losing' | 'gaining' | 'stable'
  
  // 🧘 Mental
  avgMood: number                        // 1-10
  journalFrequency: number               // Jours/semaine
  
  // 🔄 Habitudes
  habitCompletionRate: number            // 0-1
  
  // 🔗 Corrélations (pour Dashboard)
  correlations: {
    moodProductivity: number             // -1 à 1
  }
}

// ═══════════════════════════════════════════════════════════════
// SCORE GLOBAL DE BIEN-ÊTRE
// ═══════════════════════════════════════════════════════════════

export interface WellbeingScore {
  overall: number                        // 0-100
  breakdown: {
    productivity: number                 // 0-33 (33%)
    health: number                       // Deprecated (toujours 0)
    mental: number                       // 0-33 (33%)
    consistency: number                  // 0-33 (33%)
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
  
  // Dernière analyse complète
  lastFullAnalysis: number
  
  // Version pour migrations futures
  version: number
}

// ═══════════════════════════════════════════════════════════════
// ÉTAT DU CERVEAU (SIMPLIFIÉ)
// ═══════════════════════════════════════════════════════════════

export interface BrainState {
  // Données calculées
  patterns: UserPatterns
  wellbeing: WellbeingScore
  
  // Historique
  scoreHistory: { date: string; score: number }[]
  
  // Stats rapides
  quickStats: {
    todayTaskCount: number
    lastMood: number | null
  }
  
  // Mémoire complète (pour accès avancé)
  memory: BrainMemory
  
  // État interne
  isAnalyzing: boolean
  lastUpdate: number
  
  // Actions
  observe: (type: BrainEventType, data: Record<string, any>) => void
  analyze: () => void
  refresh: () => void
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION (SIMPLIFIÉ)
// ═══════════════════════════════════════════════════════════════

export interface BrainConfig {
  // Fréquence d'analyse (ms)
  analyzeInterval: number
  
  // Durée de cache des patterns (ms)
  patternsCacheDuration: number
  
  // Nombre max d'événements en mémoire
  maxRecentEvents: number
}

// Configuration par défaut
export const DEFAULT_BRAIN_CONFIG: BrainConfig = {
  analyzeInterval: 5 * 60 * 1000,        // 5 minutes
  patternsCacheDuration: 60 * 1000,      // 1 minute
  maxRecentEvents: 500,
}
