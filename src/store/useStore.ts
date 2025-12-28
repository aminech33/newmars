/**
 * 🏪 NewMars Store - Zustand avec Slices
 * 
 * Architecture modulaire :
 * - tasksSlice: Tâches, projets, catégories, quota
 * - healthSlice: Santé, nutrition, poids, hydratation
 * - journalSlice: Journal, habitudes
 * - learningSlice: Cours IA, flashcards
 * - librarySlice: Livres, sessions lecture
 * - uiSlice: Navigation, thème, widgets, pomodoro
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Import des slices
import { createTasksSlice, TasksSlice } from './slices/tasksSlice'
import { createHealthSlice, HealthSlice } from './slices/healthSlice'
import { createJournalSlice, JournalSlice } from './slices/journalSlice'
import { createLearningSlice, LearningSlice } from './slices/learningSlice'
import { createLibrarySlice, LibrarySlice } from './slices/librarySlice'
import { createUISlice, UISlice } from './slices/uiSlice'

// Import types pour re-export
import { DEMO_BOOKS } from '../types/library'
import { Task, TaskStatus, TaskPriority } from './slices/types'

// Type du store complet
export type AppState = TasksSlice & HealthSlice & JournalSlice & LearningSlice & LibrarySlice & UISlice

// Version du store
const STORE_VERSION = 2

// Helper pour générer des IDs
const generateId = () => Math.random().toString(36).substring(2, 9)

export const useStore = create<AppState>()(
  persist(
    (...args) => ({
      // Combiner tous les slices
      ...createTasksSlice(...args),
      ...createHealthSlice(...args),
      ...createJournalSlice(...args),
      ...createLearningSlice(...args),
      ...createLibrarySlice(...args),
      ...createUISlice(...args),
    }),
    {
      name: 'newmars-storage',
      version: STORE_VERSION,
      migrate: (persistedState: any, version: number) => {
        if (version < STORE_VERSION) {
          return {
            ...persistedState,
            widgets: []
          }
        }
        return persistedState
      },
      partialize: (state) => ({
        // User & Theme
        userName: state.userName,
        accentTheme: state.accentTheme,
        
        // Tasks & Projects
        tasks: state.tasks,
        projects: state.projects,
        customCategories: state.customCategories,
        taskRelations: state.taskRelations,
        taskQuota: state.taskQuota,
        
        // Notes & Widgets
        notes: state.notes,
        widgets: state.widgets,
        layouts: state.layouts,
        quickNotes: state.quickNotes,
        quickLinks: state.quickLinks,
        
        // Stats
        focusMinutes: state.focusMinutes,
        dailyGoal: state.dailyGoal,
        pomodoroSessions: state.pomodoroSessions,
        dailyStats: state.dailyStats,
        
        // Health
        userProfile: state.userProfile,
        weightEntries: state.weightEntries,
        mealEntries: state.mealEntries,
        exerciseEntries: state.exerciseEntries,
        hydrationEntries: state.hydrationEntries,
        healthGoals: state.healthGoals,
        
        // Journal & Habits
        journalEntries: state.journalEntries,
        habits: state.habits,
        
        // Learning
        learningCourses: state.learningCourses,
        
        // Library
        books: state.books,
        readingSessions: state.readingSessions,
        readingGoal: state.readingGoal,
      })
    }
  )
)

// ═══════════════════════════════════════════════════════════════
// SUBSCRIPTIONS - Mise à jour automatique de canUndo/canRedo
// ═══════════════════════════════════════════════════════════════

let isUpdatingHistory = false
useStore.subscribe((state) => {
  if (isUpdatingHistory) return
  isUpdatingHistory = true
  useStore.setState({
    canUndo: state.historyIndex >= 0,
    canRedo: state.historyIndex < state.history.length - 1
  })
  isUpdatingHistory = false
})

// ═══════════════════════════════════════════════════════════════
// MIGRATIONS - Compatibilité avec anciennes données
// ═══════════════════════════════════════════════════════════════

let migrationDone = false

const migrateTasksData = () => {
  if (migrationDone) return

  try {
    const state = useStore.getState()

    if (!state.tasks || !Array.isArray(state.tasks)) {
      migrationDone = true
      return
    }

    const tasksNeedMigration = state.tasks.some(task =>
      !task.status || !task.priority
    )

    if (tasksNeedMigration) {
      const migratedTasks = state.tasks.map(task => ({
        ...task,
        status: task.status || (task.completed ? 'done' : 'todo') as TaskStatus,
        priority: task.priority || 'medium' as TaskPriority,
        estimatedTime: task.estimatedTime || 30,
        subtasks: task.subtasks || [],
        tags: task.tags || [],
        focusScore: task.focusScore || 0
      }))

      useStore.setState({ tasks: migratedTasks })
    }
    migrationDone = true
  } catch {
    migrationDone = true
    useStore.setState({
      tasks: [
        { id: '1', title: 'Finaliser le composant Dashboard', completed: false, category: 'dev', createdAt: Date.now() - 86400000, status: 'in-progress', priority: 'high', estimatedTime: 60 },
        { id: '2', title: 'Revoir les maquettes UI', completed: false, category: 'design', createdAt: Date.now() - 172800000, status: 'todo', priority: 'medium', estimatedTime: 45 },
      ]
    })
  }
}

const migrateBooksData = () => {
  try {
    const state = useStore.getState()

    if (!state.books || state.books.length === 0) {
      const demoBooks = DEMO_BOOKS.map((book, i) => ({
        ...book,
        id: generateId(),
        addedAt: Date.now() - (i * 86400000),
        updatedAt: Date.now() - (i * 86400000),
      }))

      useStore.setState({ books: demoBooks })
    } else {
      const needsMigration = state.books.some(b =>
        b.quotes === undefined || b.notes === undefined || b.totalReadingTime === undefined
      )

      if (needsMigration) {
        const migratedBooks = state.books.map(book => ({
          ...book,
          quotes: book.quotes || [],
          notes: book.notes || [],
          totalReadingTime: book.totalReadingTime || 0,
          sessionsCount: book.sessionsCount || 0
        }))
        useStore.setState({ books: migratedBooks })
      }

      // Migration des genres
      try {
        const { migrateAllBooksGenres } = require('../utils/genreMigration')
        const migratedGenreBooks = migrateAllBooksGenres(state.books)
        if (JSON.stringify(migratedGenreBooks) !== JSON.stringify(state.books)) {
          console.log('📚 Migration des genres effectuée')
          useStore.setState({ books: migratedGenreBooks })
        }
      } catch {
        // Genre migration not critical
      }
    }

    if (!state.readingSessions) {
      useStore.setState({ readingSessions: [] })
    }

    if (!state.readingGoal) {
      useStore.setState({ readingGoal: { year: new Date().getFullYear(), targetBooks: 12 } })
    }
  } catch {
    // Silently handle migration errors
  }
}

// Run migrations on load
if (typeof window !== 'undefined') {
  setTimeout(() => {
    migrateTasksData()
    migrateBooksData()
  }, 100)
}

// ═══════════════════════════════════════════════════════════════
// SÉLECTEURS OPTIMISÉS
// ═══════════════════════════════════════════════════════════════

export const selectVisibleTasksCount = (state: AppState) =>
  state.tasks.filter((t: Task) => !t.completed && (t.isVisible === undefined || t.isVisible === true)).length

export const selectHiddenTasksCount = (state: AppState) =>
  state.tasks.filter((t: Task) => !t.completed && t.isVisible === false).length

export const selectTaskQuota = (state: AppState) => state.taskQuota

export const selectIsQuotaFull = (state: AppState) => {
  const visibleCount = state.tasks.filter((t: Task) => !t.completed && (t.isVisible === undefined || t.isVisible === true)).length
  return visibleCount >= state.taskQuota
}

// ═══════════════════════════════════════════════════════════════
// RE-EXPORTS pour compatibilité
// ═══════════════════════════════════════════════════════════════

// Types
export type { TaskCategory, TaskStatus, TaskPriority, TemporalColumn, View, AccentTheme } from './slices/types'
export type { Task, Project, SubTask, CustomCategory, Note, Toast, HistoryAction, PomodoroSession, DailyStats } from './slices/types'

// Constants
export { DEFAULT_CATEGORIES, PROJECT_COLORS, PROJECT_ICONS } from './slices/tasksSlice'
