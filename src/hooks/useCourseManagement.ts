import { useCallback } from 'react'
import { useStore } from '../store/useStore'
import { Course, CreateCourseData, UpdateCourseData } from '../types/learning'

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

/**
 * Hook pour la gestion CRUD des cours
 */
export function useCourseManagement() {
  const {
    learningCourses,
    addLearningCourse,
    updateLearningCourse,
    deleteLearningCourse
  } = useStore()

  // ============================================
  // ACTIONS - COURS
  // ============================================

  const createCourse = useCallback((data: CreateCourseData): Course => {
    const now = Date.now()
    const newCourse: Course = {
      id: generateId(),
      name: data.name.trim(),
      description: data.description?.trim() || '',
      icon: data.icon || '📚',
      color: data.color || 'amber',
      level: data.level || 'débutant',
      status: 'active',
      linkedProjectId: data.linkedProjectId,
      codeEnvironment: data.codeEnvironment || 'none',
      programmingLanguage: data.programmingLanguage,
      messages: [],
      systemPrompt: data.systemPrompt,
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
      updatedAt: now,
      currentMastery: 0,
      longestStreak: 0,
      totalReviews: 0,
      masteryHistory: []
    }

    addLearningCourse(newCourse)
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
  }, [deleteLearningCourse])

  const togglePinCourse = useCallback((courseId: string) => {
    const course = learningCourses.find(c => c.id === courseId)
    if (course) {
      updateLearningCourse(courseId, { 
        isPinned: !course.isPinned,
        pinnedAt: !course.isPinned ? Date.now() : undefined
      })
    }
  }, [learningCourses, updateLearningCourse])

  const archiveCourse = useCallback((courseId: string) => {
    updateLearningCourse(courseId, { 
      status: 'completed',
      progress: 100 
    })
  }, [updateLearningCourse])

  return {
    courses: learningCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    togglePinCourse,
    archiveCourse
  }
}

