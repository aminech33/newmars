/**
 * 🧠 BRAIN - Point d'entrée unique
 * 
 * Le cerveau de l'application qui :
 * - Observe chaque action (silencieusement)
 * - Analyse les patterns de comportement
 * - Prédit les besoins
 * - Guide avec bienveillance
 * 
 * Usage:
 * ```tsx
 * const { 
 *   patterns, 
 *   predictions, 
 *   suggestions, 
 *   wellbeing,
 *   observe 
 * } = useBrain()
 * ```
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  BrainState, 
  BrainEventType, 
  UserPatterns, 
  CurrentPredictions, 
  ContextualSuggestions, 
  WellbeingScore,
  DEFAULT_BRAIN_CONFIG 
} from './types'
import { 
  loadMemory, 
  saveMemory, 
  addEvent, 
  updatePatterns as updateMemoryPatterns,
  addScoreToHistory,
  dismissSuggestion as dismissMemorySuggestion,
  BrainMemory 
} from './Memory'
import { 
  initObserver, 
  observe as observeEvent, 
  getMemory, 
  flushMemory,
  // Re-export des helpers
  observeTaskCreated,
  observeTaskCompleted,
  observeTaskDeleted,
  observeTaskMoved,
  observePomodoroStarted,
  observePomodoroCompleted,
  observePomodoroInterrupted,
  observeWeightAdded,
  observeMealAdded,
  observeWaterAdded,
  observeJournalWritten,
  observeMoodSet,
  observeHabitChecked,
  observeHabitUnchecked,
  observeBookStarted,
  observeBookFinished,
  observeReadingSession,
  observeCourseStarted,
  observeCourseMessage,
  observeFlashcardReviewed,
  observeViewChanged,
  observeAppOpened,
  observeAppClosed,
} from './Observer'
import { analyzePatterns, quickAnalyze } from './Analyzer'
import { predict, generateDetailedPredictions } from './Predictor'
import { generateSuggestions, generateWelcomeMessage, generateEveningMessage } from './Guide'
import { calculateWellbeingScore, getScoreDescription, getScoreColor, getScoreEmoji, getTrendEmoji } from './Wellbeing'

// ═══════════════════════════════════════════════════════════════
// HOOK PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export function useBrain(): BrainState {
  const [memory, setMemory] = useState<BrainMemory>(() => {
    initObserver()
    return getMemory()
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(Date.now())
  
  // Patterns (memoized, recalculé seulement si nécessaire)
  const patterns = useMemo<UserPatterns>(() => {
    const timeSinceLastAnalysis = Date.now() - memory.lastFullAnalysis
    
    // Utiliser le cache si récent
    if (timeSinceLastAnalysis < DEFAULT_BRAIN_CONFIG.patternsCacheDuration) {
      return memory.patterns
    }
    
    // Sinon, recalculer
    return analyzePatterns(memory)
  }, [memory])
  
  // Prédictions (basées sur les patterns)
  const predictions = useMemo<CurrentPredictions>(() => {
    return predict(memory, patterns)
  }, [memory, patterns])
  
  // Suggestions (basées sur patterns + prédictions)
  const suggestions = useMemo<ContextualSuggestions>(() => {
    return generateSuggestions(memory, patterns, predictions)
  }, [memory, patterns, predictions])
  
  // Score de bien-être
  const wellbeing = useMemo<WellbeingScore>(() => {
    return calculateWellbeingScore(memory, patterns)
  }, [memory, patterns])
  
  // Observer un événement
  const observe = useCallback((type: BrainEventType, data: Record<string, any> = {}) => {
    observeEvent(type, data)
    setMemory(getMemory())
    setLastUpdate(Date.now())
  }, [])
  
  // Analyser (force une analyse complète)
  const analyze = useCallback(() => {
    setIsAnalyzing(true)
    
    const newPatterns = analyzePatterns(memory)
    const newMemory = updateMemoryPatterns(memory, newPatterns)
    
    // Sauvegarder le score du jour
    const score = calculateWellbeingScore(newMemory, newPatterns)
    const finalMemory = addScoreToHistory(newMemory, score.overall)
    
    saveMemory(finalMemory)
    setMemory(finalMemory)
    setIsAnalyzing(false)
    setLastUpdate(Date.now())
  }, [memory])
  
  // Dismisser une suggestion
  const dismissSuggestion = useCallback((id: string) => {
    const newMemory = dismissMemorySuggestion(memory, id)
    saveMemory(newMemory)
    setMemory(newMemory)
  }, [memory])
  
  // Rafraîchir
  const refresh = useCallback(() => {
    setMemory(getMemory())
    setLastUpdate(Date.now())
  }, [])
  
  // Analyse périodique
  useEffect(() => {
    const interval = setInterval(() => {
      analyze()
    }, DEFAULT_BRAIN_CONFIG.analyzeInterval)
    
    return () => clearInterval(interval)
  }, [analyze])
  
  // Observer l'ouverture de l'app
  useEffect(() => {
    observeAppOpened()
    
    // Observer la fermeture
    const handleBeforeUnload = () => {
      observeAppClosed()
      flushMemory()
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])
  
  return {
    patterns,
    predictions,
    suggestions,
    wellbeing,
    isAnalyzing,
    lastUpdate,
    observe,
    analyze,
    dismissSuggestion,
    refresh,
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

// Hook principal
export { useBrain as default }

// Types
export * from './types'

// Fonctions d'observation (pour intégration dans useStore)
export {
  observe as brainObserve,
  observeTaskCreated,
  observeTaskCompleted,
  observeTaskDeleted,
  observeTaskMoved,
  observePomodoroStarted,
  observePomodoroCompleted,
  observePomodoroInterrupted,
  observeWeightAdded,
  observeMealAdded,
  observeWaterAdded,
  observeJournalWritten,
  observeMoodSet,
  observeHabitChecked,
  observeHabitUnchecked,
  observeBookStarted,
  observeBookFinished,
  observeReadingSession,
  observeCourseStarted,
  observeCourseMessage,
  observeFlashcardReviewed,
  observeViewChanged,
}

// Helpers d'affichage
export {
  generateWelcomeMessage,
  generateEveningMessage,
  generateDetailedPredictions,
  getScoreDescription,
  getScoreColor,
  getScoreEmoji,
  getTrendEmoji,
}

// Quick analyze (pour usage léger)
export { quickAnalyze }



