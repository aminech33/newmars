/**
 * Types partagés entre les slices du store
 */

import { StateCreator } from 'zustand'

// Type helper pour les slices
export type SliceCreator<T> = StateCreator<
  StoreState,
  [['zustand/persist', unknown]],
  [],
  T
>

// Import des types depuis les fichiers de types existants
export type { Widget, WidgetLayout, Habit, QuickNote, QuickLink } from '../../types/widgets'
export type { WeightEntry, MealEntry, HealthGoal, UserProfile, ExerciseEntry, HydrationEntry } from '../../types/health'
export type { JournalEntry } from '../../types/journal'
export type { TaskRelation } from '../../types/taskRelation'
export type { Course, Message, Note as LearningNote } from '../../types/learning'
export type { Book, Quote, ReadingNote, ReadingSession, ReadingGoal } from '../../types/library'

// Types de base
export type TaskCategory = string
export type TaskStatus = 'todo' | 'in-progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TemporalColumn = 'today' | 'upcoming' | 'distant'
export type View = 'hub' | 'tasks' | 'projects' | 'health' | 'myday' | 'learning' | 'library' | 'settings' | 'docs' | 'documentation' | 'architecture'
export type AccentTheme = 'indigo' | 'cyan' | 'emerald' | 'rose' | 'violet' | 'amber'

// Interfaces
export interface CustomCategory {
  id: string
  label: string
  emoji: string
  createdAt: number
}

export interface SubTask {
  id: string
  title: string
  completed: boolean
}

export interface Task {
  id: string
  title: string
  completed: boolean
  completedAt?: number
  category: TaskCategory
  createdAt: number
  dueDate?: string
  status: TaskStatus
  priority: TaskPriority
  estimatedTime?: number
  actualTime?: number
  tags?: string[]
  subtasks?: SubTask[]
  description?: string
  focusScore?: number
  projectId?: string
  isVisible?: boolean
  isPriority?: boolean
  temporalColumn?: TemporalColumn
  effort?: 'XS' | 'S' | 'M' | 'L'
  phaseIndex?: number
  isValidation?: boolean
  // Ordre manuel dans chaque colonne (pour drag & drop)
  manualOrder?: number
}

export interface AIGeneratedPlan {
  projectName: string
  phases?: Array<{
    name: string
    objective: string
    tasks: Array<{
      title: string
      effort: string
      covers?: string[]
      isValidation?: boolean
    }>
  }>
  tasks: Array<{
    title: string
    effort: string
    covers?: string[]
    isValidation?: boolean
  }>
}

export type ProjectStatus = 'todo' | 'inProgress' | 'completed' | 'archived'

export interface Project {
  id: string
  name: string
  color: string
  icon: string
  createdAt: number
  updatedAt?: number // Date de dernière modification
  status?: ProjectStatus // Nouveau: statut du projet pour les colonnes
  linkedCourseId?: string
  hasPhases?: boolean
  phaseCount?: number
  archived?: boolean
  aiGeneratedPlan?: {
    rawPlan: AIGeneratedPlan
    generatedAt: number
    model: string
    mode: 'free' | 'targeted'
    selectedSkills?: string[]
  }
}

export interface Note {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
}

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

export interface HistoryAction {
  type: 'add' | 'delete' | 'toggle' | 'update'
  task?: Task
  previousState?: any
}

export interface PomodoroSession {
  id: string
  taskId?: string
  taskTitle?: string
  projectId?: string
  projectName?: string
  bookId?: string
  bookTitle?: string
  courseId?: string
  courseName?: string
  duration: number
  actualDuration?: number
  completedAt: number
  startedAt?: number
  date: string
  type: 'focus' | 'break'
  interrupted?: boolean
  interruptions?: number
  tags?: string[]
  notes?: string
}

export interface DailyStats {
  date: string
  tasksCompleted: number
  focusMinutes: number
  pomodoroSessions: number
}

// Catégories par défaut
export const DEFAULT_CATEGORIES: CustomCategory[] = [
  { id: 'dev', label: 'Dev', emoji: '💻', createdAt: 0 },
  { id: 'design', label: 'Design', emoji: '🎨', createdAt: 0 },
  { id: 'work', label: 'Travail', emoji: '💼', createdAt: 0 },
  { id: 'personal', label: 'Personnel', emoji: '🏠', createdAt: 0 },
  { id: 'urgent', label: 'Urgent', emoji: '🚨', createdAt: 0 }
]

// Couleurs et icônes pour projets
export const PROJECT_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ec4899',
  '#8b5cf6', '#06b6d4', '#ef4444', '#84cc16',
]

export const PROJECT_ICONS = ['🚀', '💡', '🏠', '💼', '📱', '🎨', '📚', '🎯', '⚡', '🔥', '💎', '🌟']

// Helper pour générer des IDs
export const generateId = () => Math.random().toString(36).substring(2, 9)

// Type du store complet (sera défini plus tard, ici on utilise any pour éviter les dépendances circulaires)
export type StoreState = any



