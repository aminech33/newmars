/**
 * 🧠 BRAIN - Point d'entrée unique (SIMPLIFIÉ)
 * 
 * Le cerveau de l'application qui :
 * - Observe chaque action (silencieusement)
 * - Calcule le Wellbeing Score pour le Dashboard
 * 
 * Usage:
 * ```tsx
 * const { patterns, wellbeing, observe } = useBrain()
 * ```
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  BrainState, 
  BrainEventType, 
  UserPatterns, 
  WellbeingScore,
  DEFAULT_BRAIN_CONFIG 
} from './types'
import { 
  loadMemory, 
  saveMemory, 
  updatePatterns as updateMemoryPatterns,
  addScoreToHistory,
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
    wellbeing,
    isAnalyzing,
    lastUpdate,
    observe,
    analyze,
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
  getScoreDescription,
  getScoreColor,
  getScoreEmoji,
  getTrendEmoji,
}

// Quick analyze (pour usage léger)
export { quickAnalyze }
