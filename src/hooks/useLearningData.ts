import { useState, useMemo, useCallback } from 'react'
import { useStore } from '../store/useStore'
import {
  Course,
  Message,
  Flashcard,
  Note,
  LearningStats,
  LearningUIState,
  CreateCourseData,
  UpdateCourseData,
  CourseStatus
} from '../types/learning'

// ============================================
// GÉNÉRATION D'ID
// ============================================

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useLearningData() {
  const {
    learningCourses,
    addLearningCourse,
    updateLearningCourse,
    deleteLearningCourse,
    addLearningMessage,
    deleteLearningMessage,
    addLearningFlashcard,
    deleteLearningFlashcard,
    addLearningNote,
    deleteLearningNote
  } = useStore()

  // UI State
  const [uiState, setUIState] = useState<LearningUIState>({
    activeCourseId: null,
    searchQuery: '',
    filterStatus: 'all',
    sortBy: 'recent',
    sidebarCollapsed: false,
    isTyping: false
  })

  // ============================================
  // COMPUTED VALUES (Memoized)
  // ============================================

  // Cours actif
  const activeCourse = useMemo(() => {
    if (!uiState.activeCourseId) return null
    return learningCourses.find(c => c.id === uiState.activeCourseId) || null
  }, [learningCourses, uiState.activeCourseId])

  // Cours filtrés et triés
  const filteredCourses = useMemo(() => {
    let courses = [...learningCourses]

    // Filtre par statut
    if (uiState.filterStatus !== 'all') {
      courses = courses.filter(c => c.status === uiState.filterStatus)
    }

    // Filtre par recherche
    if (uiState.searchQuery.trim()) {
      const query = uiState.searchQuery.toLowerCase()
      courses = courses.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
      )
    }

    // Tri
    switch (uiState.sortBy) {
      case 'name':
        courses.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'progress':
        courses.sort((a, b) => b.progress - a.progress)
        break
      case 'streak':
        courses.sort((a, b) => b.streak - a.streak)
        break
      case 'recent':
      default:
        courses.sort((a, b) => {
          // Épinglés en premier
          if (a.pinnedAt && !b.pinnedAt) return -1
          if (!a.pinnedAt && b.pinnedAt) return 1
          // Puis par dernière activité
          return b.lastActiveAt - a.lastActiveAt
        })
    }

    return courses
  }, [learningCourses, uiState.filterStatus, uiState.searchQuery, uiState.sortBy])

  // Stats globales
  const stats = useMemo((): LearningStats => {
    const activeCourses = learningCourses.filter(c => c.status === 'active')
    const totalTimeSpent = learningCourses.reduce((sum, c) => sum + c.totalTimeSpent, 0)
    const totalMessages = learningCourses.reduce((sum, c) => sum + c.messagesCount, 0)
    const totalFlashcards = learningCourses.reduce((sum, c) => sum + c.flashcards.length, 0)

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
      totalFlashcards,
      currentStreak,
      longestStreak: Math.max(currentStreak, ...learningCourses.map(c => c.streak)),
      weeklyActivity,
      topCourses
    }
  }, [learningCourses])

  // ============================================
  // ACTIONS - COURS
  // ============================================

  const createCourse = useCallback((data: CreateCourseData): Course => {
    const now = Date.now()
    const newCourse: Course = {
      id: generateId(),
      name: data.name.trim(),
      description: data.description?.trim(),
      icon: data.icon,
      color: data.color,
      level: data.level,
      status: 'active',
      linkedProjectId: data.linkedProjectId, // Lien projet obligatoire
      messages: [],
      systemPrompt: data.systemPrompt,
      flashcards: [],
      notes: [],
      totalTimeSpent: 0,
      lastActiveAt: now,
      streak: 0,
      sessionsCount: 0,
      messagesCount: 0,
      topics: data.topics?.map(name => ({
        id: generateId(),
        name,
        status: 'pending' as const
      })),
      progress: 0,
      createdAt: now,
      updatedAt: now
    }

    addLearningCourse(newCourse)
    
    setUIState(prev => ({ ...prev, activeCourseId: newCourse.id }))

    return newCourse
  }, [addLearningCourse])

  const updateCourse = useCallback((courseId: string, data: UpdateCourseData) => {
    updateLearningCourse(courseId, {
      ...data,
      updatedAt: Date.now()
    })
  }, [updateLearningCourse])

  const deleteCourse = useCallback((courseId: string) => {
    deleteLearningCourse(courseId)
    if (uiState.activeCourseId === courseId) {
      setUIState(prev => ({ ...prev, activeCourseId: null }))
    }
  }, [deleteLearningCourse, uiState.activeCourseId])

  const togglePinCourse = useCallback((courseId: string) => {
    const course = learningCourses.find(c => c.id === courseId)
    if (course) {
      updateLearningCourse(courseId, {
        pinnedAt: course.pinnedAt ? undefined : Date.now()
      })
    }
  }, [learningCourses, updateLearningCourse])

  const archiveCourse = useCallback((courseId: string) => {
    updateLearningCourse(courseId, { status: 'archived' })
    if (uiState.activeCourseId === courseId) {
      setUIState(prev => ({ ...prev, activeCourseId: null }))
    }
  }, [updateLearningCourse, uiState.activeCourseId])

  // ============================================
  // ACTIONS - MESSAGES
  // ============================================

  const sendMessage = useCallback(async (courseId: string, content: string): Promise<Message> => {
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now()
    }

    addLearningMessage(courseId, userMessage)

    // Mettre à jour le cours
    updateLearningCourse(courseId, {
      lastActiveAt: Date.now(),
      messagesCount: (learningCourses.find(c => c.id === courseId)?.messagesCount || 0) + 1
    })

    return userMessage
  }, [addLearningMessage, updateLearningCourse, learningCourses])

  const addAIResponse = useCallback((courseId: string, content: string): Message => {
    const aiMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content,
      timestamp: Date.now()
    }

    addLearningMessage(courseId, aiMessage)

    // Mettre à jour le cours
    updateLearningCourse(courseId, {
      lastActiveAt: Date.now(),
      messagesCount: (learningCourses.find(c => c.id === courseId)?.messagesCount || 0) + 1
    })

    return aiMessage
  }, [addLearningMessage, updateLearningCourse, learningCourses])

  const deleteMessage = useCallback((courseId: string, messageId: string) => {
    deleteLearningMessage(courseId, messageId)
  }, [deleteLearningMessage])

  const toggleMessageLike = useCallback((courseId: string, messageId: string) => {
    const course = learningCourses.find(c => c.id === courseId)
    if (!course) return

    const message = course.messages.find(m => m.id === messageId)
    if (!message) return

    const updatedMessages = course.messages.map(m =>
      m.id === messageId ? { ...m, liked: !m.liked } : m
    )

    updateLearningCourse(courseId, { messages: updatedMessages } as any)
  }, [learningCourses, updateLearningCourse])

  // ============================================
  // ACTIONS - FLASHCARDS
  // ============================================

  const createFlashcard = useCallback((
    courseId: string,
    front: string,
    back: string,
    messageId?: string
  ): Flashcard => {
    const flashcard: Flashcard = {
      id: generateId(),
      courseId,
      front: front.trim(),
      back: back.trim(),
      difficulty: 3,
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
      nextReview: new Date().toISOString().split('T')[0],
      reviewCount: 0,
      correctCount: 0,
      createdAt: Date.now(),
      createdFromMessageId: messageId
    }

    addLearningFlashcard(courseId, flashcard)
    return flashcard
  }, [addLearningFlashcard])

  const deleteFlashcard = useCallback((courseId: string, flashcardId: string) => {
    deleteLearningFlashcard(courseId, flashcardId)
  }, [deleteLearningFlashcard])

  // ============================================
  // ACTIONS - NOTES
  // ============================================

  const createNote = useCallback((
    courseId: string,
    title: string,
    content: string,
    messageId?: string
  ): Note => {
    const note: Note = {
      id: generateId(),
      courseId,
      title: title.trim(),
      content: content.trim(),
      tags: [],
      createdFromMessageId: messageId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: false
    }

    addLearningNote(courseId, note)
    return note
  }, [addLearningNote])

  const deleteNote = useCallback((courseId: string, noteId: string) => {
    deleteLearningNote(courseId, noteId)
  }, [deleteLearningNote])

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
  // RETURN
  // ============================================

  return {
    // State
    uiState,
    courses: learningCourses,
    filteredCourses,
    activeCourse,
    stats,

    // Actions - Cours
    createCourse,
    updateCourse,
    deleteCourse,
    togglePinCourse,
    archiveCourse,

    // Actions - Messages
    sendMessage,
    addAIResponse,
    deleteMessage,
    toggleMessageLike,

    // Actions - Flashcards
    createFlashcard,
    deleteFlashcard,

    // Actions - Notes
    createNote,
    deleteNote,

    // Actions - UI
    setActiveCourse,
    setSearchQuery,
    setFilterStatus,
    setSortBy,
    toggleSidebar,
    setIsTyping
  }
}

