import { useState, useMemo, useCallback } from 'react'
import { useStore } from '../store/useStore'
import {
  LearningStats,
  LearningUIState,
  CourseStatus
} from '../types/learning'
import { useCourseManagement } from './useCourseManagement'
import { useCourseMessages } from './useCourseMessages'
import { useCourseNotes } from './useCourseNotes'
import { useSessionTracking } from './useSessionTracking'

/**
 * Hook principal consolidé - orchestrateur des 3 hooks spécialisés
 */
export function useLearningData() {
  const { learningCourses } = useStore()
  
  // Délégation aux hooks spécialisés
  const courseManagement = useCourseManagement()
  const courseMessages = useCourseMessages()
  const courseNotes = useCourseNotes()

  // UI State
  const [uiState, setUIState] = useState<LearningUIState>({
    activeCourseId: null,
    searchQuery: '',
    filterStatus: 'all',
    sortBy: 'recent',
    sidebarCollapsed: false,
    isTyping: false
  })

  // Session tracking (habitude auto-toggle)
  useSessionTracking(uiState.activeCourseId)

  // ============================================
  // COMPUTED - FILTRAGE & TRI
  // ============================================

  const filteredCourses = useMemo(() => {
    let filtered = learningCourses

    // Filtre par recherche
    if (uiState.searchQuery) {
      const query = uiState.searchQuery.toLowerCase()
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
      )
    }

    // Filtre par statut
    if (uiState.filterStatus !== 'all') {
      filtered = filtered.filter(c => c.status === uiState.filterStatus)
    }

    // Tri
    const sorted = [...filtered].sort((a, b) => {
      switch (uiState.sortBy) {
        case 'recent':
          return b.lastActiveAt - a.lastActiveAt
        case 'name':
          return a.name.localeCompare(b.name)
        case 'progress':
          return (b.progress || 0) - (a.progress || 0)
        default:
          return 0
      }
    })

    return sorted
  }, [learningCourses, uiState.searchQuery, uiState.filterStatus, uiState.sortBy])

  const activeCourse = useMemo(() => 
    learningCourses.find(c => c.id === uiState.activeCourseId) || null,
    [learningCourses, uiState.activeCourseId]
  )

  // ============================================
  // COMPUTED - STATS
  // ============================================

  const stats = useMemo((): LearningStats => {
    const activeCourses = learningCourses.filter(c => c.status === 'active')
    const totalTimeSpent = learningCourses.reduce((sum, c) => sum + c.totalTimeSpent, 0)
    const totalMessages = learningCourses.reduce((sum, c) => sum + c.messagesCount, 0)

    // Calculer le streak global (jours consécutifs avec activité)
    const today = new Date().setHours(0, 0, 0, 0)
    let currentStreak = 0
    let checkDate = today

    while (true) {
      const hasActivity = learningCourses.some(c => {
        const lastActive = new Date(c.lastActiveAt).setHours(0, 0, 0, 0)
        return lastActive === checkDate
      })

      if (hasActivity) {
        currentStreak++
        checkDate -= 24 * 60 * 60 * 1000 // Jour précédent
      } else {
        break
      }
    }

    // Activité des 7 derniers jours
    const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      const dayStart = date.setHours(0, 0, 0, 0)
      const dayEnd = dayStart + 24 * 60 * 60 * 1000

      return learningCourses.reduce((sum, c) => {
        // Simplification : on compte les messages de ce jour
        const dayMessages = c.messages.filter(m =>
          m.timestamp >= dayStart && m.timestamp < dayEnd
        ).length
        return sum + dayMessages * 2 // ~2 min par message
      }, 0)
    })

    // Top cours par temps passé
    const topCourses = [...learningCourses]
      .sort((a, b) => b.totalTimeSpent - a.totalTimeSpent)
      .slice(0, 5)
      .map(c => ({ courseId: c.id, timeSpent: c.totalTimeSpent }))

    return {
      totalCourses: learningCourses.length,
      activeCourses: activeCourses.length,
      totalTimeSpent,
      totalMessages,
      currentStreak,
      longestStreak: Math.max(currentStreak, ...learningCourses.map(c => c.streak)),
      weeklyActivity,
      topCourses
    }
  }, [learningCourses])

  // ============================================
  // ACTIONS - UI
  // ============================================

  const setActiveCourse = useCallback((courseId: string | null) => {
    setUIState(prev => ({ ...prev, activeCourseId: courseId }))
  }, [])

  const setSearchQuery = useCallback((query: string) => {
    setUIState(prev => ({ ...prev, searchQuery: query }))
  }, [])

  const setFilterStatus = useCallback((status: CourseStatus | 'all') => {
    setUIState(prev => ({ ...prev, filterStatus: status }))
  }, [])

  const setSortBy = useCallback((sortBy: LearningUIState['sortBy']) => {
    setUIState(prev => ({ ...prev, sortBy }))
  }, [])

  const toggleSidebar = useCallback(() => {
    setUIState(prev => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }))
  }, [])

  const setIsTyping = useCallback((isTyping: boolean) => {
    setUIState(prev => ({ ...prev, isTyping }))
  }, [])

  // ============================================
  // RETURN - API CONSOLIDÉE
  // ============================================

  return {
    // Data
    filteredCourses,
    activeCourse,
    stats,

    // Course Management
    ...courseManagement,

    // Messages
    ...courseMessages,

    // Notes
    ...courseNotes,

    // UI
    setActiveCourse,
    setSearchQuery,
    setFilterStatus,
    setSortBy,
    toggleSidebar,
    setIsTyping
  }
}
