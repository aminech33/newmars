/**
 * Hook pour gérer le vocabulaire avec Spaced Repetition (SM-2)
 *
 * Permet de réviser le vocabulaire de manière optimale
 */

import { useEffect, useCallback, useState, useRef } from 'react'
import { VocabularyWord } from '../types/languages'
import { API_URLS } from '../services/api'

const API_BASE_URL = API_URLS.LANGUAGES

interface VocabularyStats {
  total: number
  avgMastery: number
  totalReviews: number
  mastered: number
  dueToday: number
}

interface UseVocabularyReviewReturn {
  vocabulary: VocabularyWord[]
  dueWords: VocabularyWord[]
  stats: VocabularyStats | null
  isLoading: boolean

  // Actions
  loadVocabulary: () => Promise<void>
  loadDueWords: () => Promise<void>
  addWord: (word: Omit<VocabularyWord, 'id' | 'easeFactor' | 'interval' | 'repetitions' | 'nextReview' | 'lastReviewed' | 'addedAt'>) => Promise<boolean>
  submitReview: (wordId: string, quality: number) => Promise<boolean>
  refreshStats: () => Promise<void>
}

export function useVocabularyReview(
  courseId: string,
  userId: string = 'current-user'
): UseVocabularyReviewReturn {
  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([])
  const [dueWords, setDueWords] = useState<VocabularyWord[]>([])
  const [stats, setStats] = useState<VocabularyStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // AbortController pour annuler les requêtes en cours lors du démontage
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Charge tout le vocabulaire du cours
   */
  const loadVocabulary = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/vocabulary/${courseId}?user_id=${userId}`,
        { signal }
      )

      if (!response.ok) {
        throw new Error('Erreur lors du chargement du vocabulaire')
      }

      const result = await response.json()
      setVocabulary(result.words || [])

      console.log(`✅ Chargé ${result.words?.length || 0} mots pour ${courseId}`)

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      console.error('❌ Erreur chargement vocabulaire:', error)
    }
  }, [courseId, userId])

  /**
   * Charge les mots à réviser aujourd'hui
   */
  const loadDueWords = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/vocabulary/due-for-review/${courseId}?user_id=${userId}`,
        { signal }
      )

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des mots à réviser')
      }

      const result = await response.json()
      setDueWords(result.words || [])

      console.log(`✅ ${result.words?.length || 0} mots à réviser aujourd'hui`)

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      console.error('❌ Erreur chargement mots à réviser:', error)
    }
  }, [courseId, userId])
  
  /**
   * Ajoute un nouveau mot au vocabulaire
   */
  const addWord = useCallback(async (
    wordData: Omit<VocabularyWord, 'id' | 'easeFactor' | 'interval' | 'repetitions' | 'nextReview' | 'lastReviewed' | 'addedAt'>
  ): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/add-vocabulary/${courseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          word: wordData.word,
          translation: wordData.translation,
          pronunciation: wordData.pronunciation,
          example: wordData.example,
          context: wordData.context
        })
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout du mot')
      }
      
      // Recharger le vocabulaire
      await loadVocabulary()
      await refreshStats()
      
      console.log(`✅ Mot ajouté: ${wordData.word}`)
      return true
      
    } catch (error) {
      console.error('❌ Erreur ajout mot:', error)
      return false
    }
  }, [courseId, userId, loadVocabulary])
  
  /**
   * Soumet une révision de mot
   * 
   * @param wordId - ID du mot
   * @param quality - Qualité de la réponse (0-5)
   *   0: Complete blackout (oublié complètement)
   *   1: Incorrect, remembered with hints
   *   2: Incorrect, seemed easy to recall
   *   3: Correct, difficult recall
   *   4: Correct, hesitation
   *   5: Perfect response
   */
  const submitReview = useCallback(async (
    wordId: string,
    quality: number
  ): Promise<boolean> => {
    if (quality < 0 || quality > 5) {
      console.error('❌ Quality must be between 0 and 5')
      return false
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/vocabulary/submit-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word_id: wordId,
          quality
        })
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors de la soumission de la révision')
      }
      
      // Recharger les mots à réviser et les stats en parallèle
      await Promise.all([
        loadDueWords(),
        loadVocabulary(),
        refreshStats()
      ])

      console.log(`✅ Révision soumise: quality=${quality}`)
      return true

    } catch (error) {
      console.error('❌ Erreur soumission révision:', error)
      return false
    }
  }, [loadDueWords, loadVocabulary, refreshStats])
  
  /**
   * Rafraîchit les statistiques
   */
  const refreshStats = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/vocabulary/stats/${courseId}?user_id=${userId}`,
        { signal }
      )

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des stats')
      }

      const result = await response.json()
      setStats({
        total: result.total,
        avgMastery: result.avgMastery,
        totalReviews: result.totalReviews,
        mastered: result.mastered,
        dueToday: result.dueToday
      })

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      console.error('❌ Erreur chargement stats:', error)
    }
  }, [courseId, userId])

  /**
   * Charger données initiales (en parallèle avec Promise.all)
   */
  useEffect(() => {
    // Annuler les requêtes précédentes
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    const loadInitialData = async () => {
      setIsLoading(true)
      try {
        // Charger les 3 endpoints en parallèle
        await Promise.all([
          loadVocabulary(controller.signal),
          loadDueWords(controller.signal),
          refreshStats(controller.signal)
        ])
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadInitialData()

    // Cleanup: annuler les requêtes si le composant se démonte
    return () => {
      controller.abort()
    }
  }, [courseId, userId, loadVocabulary, loadDueWords, refreshStats])
  
  return {
    vocabulary,
    dueWords,
    stats,
    isLoading,
    loadVocabulary,
    loadDueWords,
    addWord,
    submitReview,
    refreshStats
  }
}


/**
 * Hook simplifié pour juste charger les mots à réviser
 */
export function useDailyVocabularyReview(courseId: string, userId: string = 'current-user') {
  const { dueWords, loadDueWords, submitReview } = useVocabularyReview(courseId, userId)
  
  return {
    dueWords,
    refreshDueWords: loadDueWords,
    submitReview
  }
}


/**
 * Hook pour les stats de vocabulaire (dashboard)
 */
export function useVocabularyStats(courseId: string, userId: string = 'current-user') {
  const { stats, refreshStats } = useVocabularyReview(courseId, userId)
  
  return {
    stats,
    refreshStats
  }
}

