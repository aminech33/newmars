/**
 * Hook pour gérer l'archivage automatique des messages dans SQLite
 * 
 * Stratégie:
 * - Garde max 50 messages actifs dans localStorage
 * - Archive automatiquement le reste dans SQLite
 * - Permet de consulter l'historique complet à la demande
 */

import { useEffect, useCallback, useState } from 'react'
import { useStore } from '../store/useStore'
import { Message } from '../types/learning'

const MAX_MESSAGES_ACTIVE = 50  // Seuil avant archivage
const ARCHIVE_CHECK_INTERVAL = 5 * 60 * 1000  // 5 minutes
const API_BASE_URL = 'http://localhost:8000/api/learning'

interface ArchiveStats {
  total: number
  active: number
  archived: number
}

interface UseMessageArchivingReturn {
  archiveOldMessages: () => Promise<number>
  loadArchivedMessages: (offset?: number, limit?: number) => Promise<Message[]>
  getMessageStats: () => Promise<ArchiveStats | null>
  isArchiving: boolean
  needsArchiving: boolean
  stats: ArchiveStats | null
}

export function useMessageArchiving(courseId: string): UseMessageArchivingReturn {
  const { learningCourses, updateLearningCourse } = useStore()
  const course = learningCourses.find(c => c.id === courseId)
  
  const [isArchiving, setIsArchiving] = useState(false)
  const [stats, setStats] = useState<ArchiveStats | null>(null)
  const [needsArchiving, setNeedsArchiving] = useState(false)
  
  // Vérifier si archivage nécessaire
  useEffect(() => {
    if (course && course.messages.length > MAX_MESSAGES_ACTIVE) {
      setNeedsArchiving(true)
    } else {
      setNeedsArchiving(false)
    }
  }, [course?.messages.length])
  
  /**
   * Archive les vieux messages automatiquement
   */
  const archiveOldMessages = useCallback(async (): Promise<number> => {
    if (!course || course.messages.length <= MAX_MESSAGES_ACTIVE) {
      return 0
    }
    
    setIsArchiving(true)
    
    try {
      // 1. Sauvegarder tous les messages dans SQLite (bulk)
      const response = await fetch(`${API_BASE_URL}/save-messages-bulk/${courseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'current-user',
          messages: course.messages
        })
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde bulk')
      }
      
      const saveResult = await response.json()
      console.log(`✅ Sauvegardé ${saveResult.saved_count} messages dans SQLite`)
      
      // 2. Archiver les anciens côté serveur
      const archiveResponse = await fetch(
        `${API_BASE_URL}/archive-messages/${courseId}?keep_recent=${MAX_MESSAGES_ACTIVE}`,
        { method: 'POST' }
      )
      
      if (!archiveResponse.ok) {
        throw new Error('Erreur lors de l\'archivage')
      }
      
      const archiveResult = await archiveResponse.json()
      const archivedCount = archiveResult.archived_count
      
      console.log(`📦 Archivé ${archivedCount} messages`)
      
      // 3. Garder seulement les 50 plus récents dans localStorage
      const recentMessages = course.messages.slice(-MAX_MESSAGES_ACTIVE)
      
      updateLearningCourse(courseId, {
        messages: recentMessages
      })
      
      // 4. Rafraîchir les stats
      await getMessageStats()
      
      setNeedsArchiving(false)
      return archivedCount
      
    } catch (error) {
      console.error('❌ Erreur archivage:', error)
      return 0
    } finally {
      setIsArchiving(false)
    }
  }, [course, courseId, updateLearningCourse])
  
  /**
   * Charge les messages archivés depuis SQLite (pour consultation)
   */
  const loadArchivedMessages = useCallback(async (
    offset: number = 0, 
    limit: number = 100
  ): Promise<Message[]> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/archived-messages/${courseId}?limit=${limit}&offset=${offset}`
      )
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des messages archivés')
      }
      
      const result = await response.json()
      return result.messages
      
    } catch (error) {
      console.error('❌ Erreur chargement messages archivés:', error)
      return []
    }
  }, [courseId])
  
  /**
   * Récupère les statistiques de messages
   */
  const getMessageStats = useCallback(async (): Promise<ArchiveStats | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/message-stats/${courseId}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des stats')
      }
      
      const result = await response.json()
      const statsData: ArchiveStats = {
        total: result.total,
        active: result.active,
        archived: result.archived
      }
      
      setStats(statsData)
      return statsData
      
    } catch (error) {
      console.error('❌ Erreur stats:', error)
      return null
    }
  }, [courseId])
  
  /**
   * Archivage automatique périodique
   */
  useEffect(() => {
    if (!course) return
    
    const checkAndArchive = async () => {
      if (course.messages.length > MAX_MESSAGES_ACTIVE + 10) {
        console.log('🔄 Archivage automatique déclenché...')
        await archiveOldMessages()
      }
    }
    
    // Check initial
    checkAndArchive()
    
    // Check périodique (toutes les 5 minutes)
    const interval = setInterval(checkAndArchive, ARCHIVE_CHECK_INTERVAL)
    
    return () => clearInterval(interval)
  }, [course, archiveOldMessages])
  
  /**
   * Charger les stats au montage
   */
  useEffect(() => {
    getMessageStats()
  }, [getMessageStats])
  
  return {
    archiveOldMessages,
    loadArchivedMessages,
    getMessageStats,
    isArchiving,
    needsArchiving,
    stats
  }
}


/**
 * Hook pour charger les messages depuis SQLite au démarrage
 * Utile pour restaurer les messages récents après un rafraîchissement
 */
export function useLoadRecentMessages(courseId: string, autoLoad: boolean = true) {
  const { updateLearningCourse } = useStore()
  const [isLoading, setIsLoading] = useState(false)
  
  const loadRecent = useCallback(async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/recent-messages/${courseId}?limit=${MAX_MESSAGES_ACTIVE}`
      )
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des messages récents')
      }
      
      const result = await response.json()
      
      if (result.messages && result.messages.length > 0) {
        updateLearningCourse(courseId, {
          messages: result.messages
        })
        console.log(`✅ Chargé ${result.messages.length} messages récents depuis SQLite`)
      }
      
    } catch (error) {
      console.error('❌ Erreur chargement messages récents:', error)
    } finally {
      setIsLoading(false)
    }
  }, [courseId, updateLearningCourse])
  
  useEffect(() => {
    if (autoLoad) {
      loadRecent()
    }
  }, [autoLoad, loadRecent])
  
  return { loadRecent, isLoading }
}

