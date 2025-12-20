/**
 * 🧠 BRAIN - Memory
 * 
 * Stockage persistant des patterns et événements.
 * Utilise localStorage comme le reste de l'app.
 */

import { BrainMemory, BrainEvent, UserPatterns, DEFAULT_BRAIN_CONFIG } from './types'

const STORAGE_KEY = 'iku-brain-memory'
const CURRENT_VERSION = 1

// Patterns par défaut (utilisateur nouveau)
const DEFAULT_PATTERNS: UserPatterns = {
  peakHours: [10, 14, 16],
  lowHours: [13, 22, 23],
  bestDays: [1, 2, 3],  // Lun, Mar, Mer
  averageSessionStart: 9,
  averageSessionEnd: 18,
  
  avgTasksPerDay: 0,
  avgFocusDuration: 25,
  preferredCategories: [],
  avoidedCategories: [],
  taskCompletionRate: 0,
  avgTaskDelay: 0,
  
  mealTimes: {
    breakfast: null,
    lunch: null,
    dinner: null,
  },
  avgCaloriesPerDay: 0,
  weightTrend: 'stable',
  
  avgMood: 6,
  moodByHour: {},
  moodByDay: {},
  journalFrequency: 0,
  
  habitCompletionRate: 0,
  mostConsistentHabits: [],
  strugglingHabits: [],
  
  avgStudyDuration: 30,
  preferredLearningTime: 10,
  
  correlations: {
    moodProductivity: 0,
    sleepProductivity: 0,
    exerciseEnergy: 0,
  }
}

// Mémoire par défaut
const DEFAULT_MEMORY: BrainMemory = {
  recentEvents: [],
  patterns: DEFAULT_PATTERNS,
  scoreHistory: [],
  dismissedSuggestions: [],
  lastFullAnalysis: 0,
  version: CURRENT_VERSION,
}

/**
 * Charge la mémoire depuis localStorage
 */
export function loadMemory(): BrainMemory {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return { ...DEFAULT_MEMORY }
    
    const parsed = JSON.parse(stored) as BrainMemory
    
    // Migration si version différente
    if (parsed.version !== CURRENT_VERSION) {
      return migrateMemory(parsed)
    }
    
    // Nettoyer les événements trop vieux (> 7 jours)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    parsed.recentEvents = parsed.recentEvents.filter(e => e.timestamp > sevenDaysAgo)
    
    // Limiter le nombre d'événements
    if (parsed.recentEvents.length > DEFAULT_BRAIN_CONFIG.maxRecentEvents) {
      parsed.recentEvents = parsed.recentEvents.slice(-DEFAULT_BRAIN_CONFIG.maxRecentEvents)
    }
    
    return parsed
  } catch (error) {
    console.warn('[Brain] Erreur chargement mémoire:', error)
    return { ...DEFAULT_MEMORY }
  }
}

/**
 * Sauvegarde la mémoire dans localStorage
 */
export function saveMemory(memory: BrainMemory): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory))
  } catch (error) {
    console.warn('[Brain] Erreur sauvegarde mémoire:', error)
  }
}

/**
 * Ajoute un événement à la mémoire
 */
export function addEvent(memory: BrainMemory, event: BrainEvent): BrainMemory {
  const now = new Date()
  
  // Enrichir avec le contexte
  const enrichedEvent: BrainEvent = {
    ...event,
    context: {
      hour: now.getHours(),
      dayOfWeek: now.getDay(),
      ...event.context,
    }
  }
  
  // Ajouter et limiter
  const newEvents = [...memory.recentEvents, enrichedEvent]
  if (newEvents.length > DEFAULT_BRAIN_CONFIG.maxRecentEvents) {
    newEvents.shift()
  }
  
  return {
    ...memory,
    recentEvents: newEvents,
  }
}

/**
 * Met à jour les patterns dans la mémoire
 */
export function updatePatterns(memory: BrainMemory, patterns: Partial<UserPatterns>): BrainMemory {
  return {
    ...memory,
    patterns: {
      ...memory.patterns,
      ...patterns,
    },
    lastFullAnalysis: Date.now(),
  }
}

/**
 * Ajoute un score au historique
 */
export function addScoreToHistory(memory: BrainMemory, score: number): BrainMemory {
  const today = new Date().toISOString().split('T')[0]
  
  // Éviter les doublons pour aujourd'hui
  const filtered = memory.scoreHistory.filter(s => s.date !== today)
  
  // Garder 30 derniers jours
  const newHistory = [...filtered, { date: today, score }].slice(-30)
  
  return {
    ...memory,
    scoreHistory: newHistory,
  }
}

/**
 * Marque une suggestion comme dismissée
 */
export function dismissSuggestion(memory: BrainMemory, suggestionId: string): BrainMemory {
  if (memory.dismissedSuggestions.includes(suggestionId)) {
    return memory
  }
  
  // Garder max 50 suggestions dismissées
  const newDismissed = [...memory.dismissedSuggestions, suggestionId].slice(-50)
  
  return {
    ...memory,
    dismissedSuggestions: newDismissed,
  }
}

/**
 * Obtient les événements d'un type spécifique
 */
export function getEventsByType(memory: BrainMemory, type: string): BrainEvent[] {
  return memory.recentEvents.filter(e => e.type === type)
}

/**
 * Obtient les événements des X dernières heures
 */
export function getRecentEvents(memory: BrainMemory, hours: number): BrainEvent[] {
  const cutoff = Date.now() - hours * 60 * 60 * 1000
  return memory.recentEvents.filter(e => e.timestamp > cutoff)
}

/**
 * Obtient les événements d'aujourd'hui
 */
export function getTodayEvents(memory: BrainMemory): BrainEvent[] {
  const today = new Date().toISOString().split('T')[0]
  return memory.recentEvents.filter(e => {
    const eventDate = new Date(e.timestamp).toISOString().split('T')[0]
    return eventDate === today
  })
}

/**
 * Migration de mémoire (pour futures versions)
 */
function migrateMemory(oldMemory: BrainMemory): BrainMemory {
  // Pour l'instant, on reset simplement
  // Plus tard, on pourra migrer les données
  console.log('[Brain] Migration mémoire v' + oldMemory.version + ' → v' + CURRENT_VERSION)
  
  return {
    ...DEFAULT_MEMORY,
    recentEvents: oldMemory.recentEvents || [],
    patterns: {
      ...DEFAULT_PATTERNS,
      ...oldMemory.patterns,
    },
    version: CURRENT_VERSION,
  }
}

/**
 * Reset complet de la mémoire (debug)
 */
export function resetMemory(): BrainMemory {
  localStorage.removeItem(STORAGE_KEY)
  return { ...DEFAULT_MEMORY }
}


