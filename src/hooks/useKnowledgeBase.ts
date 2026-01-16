/**
 * 🧠 useKnowledgeBase - Hook pour gérer la base de connaissances
 * 
 * Charge et gère les concepts appris dans un cours.
 * Permet à l'IA de s'adapter au niveau réel de l'étudiant.
 */

import { useState, useEffect, useCallback } from 'react'
import { API_URLS } from '../services/api'

export interface Concept {
  id: number
  concept: string
  category: string | null
  definition: string | null
  example: string | null
  keywords: string[]
  timesReferenced: number
  masteryLevel: number
  addedAt: string
  lastReferenced: string | null
}

export interface ConceptStats {
  total: number
  avgMastery: number
  totalReferences: number
  mastered: number
  needsReview: number
}

interface UseKnowledgeBaseReturn {
  concepts: Concept[]
  stats: ConceptStats | null
  isLoading: boolean
  error: string | null
  
  // Actions
  loadConcepts: (courseId: string) => Promise<void>
  addConcept: (concept: Omit<Concept, 'id' | 'timesReferenced' | 'masteryLevel' | 'addedAt' | 'lastReferenced'> & { courseId: string }) => Promise<void>
  searchConcepts: (courseId: string, query: string, limit?: number) => Promise<Concept[]>
  updateMastery: (conceptId: number, masteryLevel: number) => Promise<void>
  refreshStats: (courseId: string) => Promise<void>
}

const API_BASE = API_URLS.BASE

export function useKnowledgeBase(): UseKnowledgeBaseReturn {
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [stats, setStats] = useState<ConceptStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Charge tous les concepts d'un cours
   * À appeler au montage du cours
   */
  const loadConcepts = useCallback(async (courseId: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // 🔥 ÉTAPE 1: Appliquer le decay d'abord (oubli naturel)
      try {
        await fetch(`${API_BASE}/api/knowledge/apply-decay/${courseId}`, {
          method: 'POST'
        })
        console.log('⏰ Mastery decay applied')
      } catch (decayError) {
        console.warn('⚠️ Could not apply decay (non-blocking):', decayError)
      }
      
      // ÉTAPE 2: Charger les concepts avec mastery à jour
      const response = await fetch(`${API_BASE}/api/knowledge/${courseId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to load concepts: ${response.statusText}`)
      }
      
      const data = await response.json()
      setConcepts(data.concepts || [])
      
      console.log(`✅ Loaded ${data.concepts?.length || 0} concepts for course ${courseId}`)
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      console.error('❌ Error loading concepts:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Ajoute un nouveau concept
   * Appelé après chaque réponse de l'IA
   */
  const addConcept = useCallback(async (
    conceptData: Omit<Concept, 'id' | 'timesReferenced' | 'masteryLevel' | 'addedAt' | 'lastReferenced'> & { courseId: string }
  ) => {
    try {
      const response = await fetch(`${API_BASE}/api/knowledge/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conceptData)
      })
      
      if (!response.ok) {
        throw new Error(`Failed to add concept: ${response.statusText}`)
      }
      
      // Rafraîchir la liste locale (optimiste)
      await loadConcepts(conceptData.courseId)
      
    } catch (err) {
      console.error('❌ Error adding concept:', err)
      // Ne pas bloquer l'UI, continuer silencieusement
    }
  }, [loadConcepts])

  /**
   * Recherche des concepts pertinents
   * Appelé avant chaque message à l'IA
   */
  const searchConcepts = useCallback(async (
    courseId: string,
    query: string,
    limit: number = 10
  ): Promise<Concept[]> => {
    try {
      const response = await fetch(`${API_BASE}/api/knowledge/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, query, limit })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to search concepts: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.concepts || []
      
    } catch (err) {
      console.error('❌ Error searching concepts:', err)
      return []
    }
  }, [])

  /**
   * Met à jour le niveau de maîtrise
   * Peut être appelé manuellement ou automatiquement
   */
  const updateMastery = useCallback(async (
    conceptId: number,
    masteryLevel: number
  ) => {
    try {
      const response = await fetch(`${API_BASE}/api/knowledge/update-mastery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conceptId, masteryLevel })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to update mastery: ${response.statusText}`)
      }
      
      // Mettre à jour localement
      setConcepts(prev => prev.map(c =>
        c.id === conceptId
          ? { ...c, masteryLevel }
          : c
      ))
      
    } catch (err) {
      console.error('❌ Error updating mastery:', err)
    }
  }, [])

  /**
   * Rafraîchit les stats de la base de connaissances
   */
  const refreshStats = useCallback(async (courseId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/knowledge/${courseId}/stats`)
      
      if (!response.ok) {
        throw new Error(`Failed to load stats: ${response.statusText}`)
      }
      
      const data = await response.json()
      setStats(data)
      
    } catch (err) {
      console.error('❌ Error loading stats:', err)
    }
  }, [])

  return {
    concepts,
    stats,
    isLoading,
    error,
    loadConcepts,
    addConcept,
    searchConcepts,
    updateMastery,
    refreshStats
  }
}

