import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Widget, WidgetLayout, Habit, QuickNote, QuickLink } from '../types/widgets'
import { Event } from '../types/calendar'
import { WeightEntry, MealEntry, HealthGoal, UserProfile, ExerciseEntry, HydrationEntry } from '../types/health'
import { JournalEntry } from '../types/journal'
import { TaskRelation } from '../types/taskRelation'
import { Course, Message, Flashcard, Note as LearningNote } from '../types/learning'
import { Book, DEMO_BOOKS, Quote, ReadingNote, ReadingSession, ReadingGoal } from '../types/library'

export type TaskCategory = 'dev' | 'design' | 'personal' | 'work' | 'urgent'
export type TaskStatus = 'backlog' | 'todo' | 'in-progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface SubTask {
  id: string
  title: string
  completed: boolean
}

export interface Task {
  id: string
  title: string
  completed: boolean
  category: TaskCategory
  createdAt: number
  dueDate?: string
  status: TaskStatus
  priority: TaskPriority
  estimatedTime?: number // en minutes
  actualTime?: number
  tags?: string[]
  subtasks?: SubTask[]
  description?: string
  focusScore?: number
  linkedEventId?: string // Link to calendar event
  projectId?: string // ID du projet associé
  isVisible?: boolean // Pour le système de quota (true = visible, false = cachée)
}

// Interface pour les projets personnalisés
export interface Project {
  id: string
  name: string
  color: string
  icon: string
  createdAt: number
  linkedCourseId?: string // Lien vers un cours d'apprentissage
}

// Couleurs disponibles pour les projets
export const PROJECT_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#ef4444', // Red
  '#84cc16', // Lime
]

// Icônes disponibles pour les projets
export const PROJECT_ICONS = ['🚀', '💡', '🏠', '💼', '📱', '🎨', '📚', '🎯', '⚡', '🔥', '💎', '🌟']

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
  duration: number // durée prévue en minutes
  actualDuration?: number // durée réelle si interrompu
  completedAt: number // timestamp
  startedAt?: number // timestamp de début
  date: string // YYYY-MM-DD
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

type View = 'hub' | 'tasks' | 'dashboard' | 'ai' | 'calendar' | 'health' | 'journal' | 'learning' | 'library' | 'pomodoro' | 'habits'

export type AccentTheme = 'indigo' | 'cyan' | 'emerald' | 'rose' | 'violet' | 'amber'

interface AppState {
  // Navigation
  currentView: View
  setView: (view: View) => void
  
  // User
  userName: string
  setUserName: (name: string) => void
  
  // Theme
  accentTheme: AccentTheme
  setAccentTheme: (theme: AccentTheme) => void
  
  // Tasks
  tasks: Task[]
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  moveTask: (taskId: string, newStatus: TaskStatus) => void
  addSubtask: (taskId: string, subtaskTitle: string) => void
  toggleSubtask: (taskId: string, subtaskId: string) => void
  deleteSubtask: (taskId: string, subtaskId: string) => void
  
  // Notes
  notes: Note[]
  addNote: (title: string, content: string) => void
  updateNote: (id: string, title: string, content: string) => void
  deleteNote: (id: string) => void
  
  // Stats & Pomodoro
  focusMinutes: number
  addFocusMinutes: (minutes: number) => void
  dailyGoal: number
  setDailyGoal: (goal: number) => void
  pomodoroSessions: PomodoroSession[]
  dailyStats: DailyStats[]
  addPomodoroSession: (session: Omit<PomodoroSession, 'id' | 'completedAt' | 'date'>) => void
  getTodayStats: () => DailyStats
  getWeekStats: () => DailyStats[]
  getCurrentStreak: () => number
  
  // History (for undo/redo)
  history: HistoryAction[]
  historyIndex: number
  addToHistory: (action: HistoryAction) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  
  // Toasts
  toasts: Toast[]
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void
  
  // Search Widget
  isCommandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  
  // Focus Mode & Pomodoro
  isFocusMode: boolean
  focusTaskId: string | null
  pomodoroTimeLeft: number
  isPomodoroRunning: boolean
  setFocusMode: (enabled: boolean, taskId?: string) => void
  setPomodoroTime: (seconds: number) => void
  togglePomodoroRunning: () => void
  resetPomodoro: () => void
  
  // Widgets
  widgets: Widget[]
  currentLayout: WidgetLayout | null
  layouts: WidgetLayout[]
  isEditMode: boolean
  setEditMode: (enabled: boolean) => void
  addWidget: (widget: Omit<Widget, 'id'>) => void
  updateWidget: (id: string, updates: Partial<Widget>) => void
  removeWidget: (id: string) => void
  setWidgets: (widgets: Widget[]) => void
  resetWidgets: () => void
  saveLayout: (name: string) => void
  loadLayout: (id: string) => void
  deleteLayout: (id: string) => void
  
  // Habits
  habits: Habit[]
  addHabit: (name: string) => void
  toggleHabitToday: (id: string) => void
  deleteHabit: (id: string) => void
  
  // Quick Notes
  quickNotes: QuickNote[]
  addQuickNote: (content: string) => void
  deleteQuickNote: (id: string) => void
  
  // Quick Links
  quickLinks: QuickLink[]
  addQuickLink: (label: string, url: string) => void
  deleteQuickLink: (id: string) => void
  
  // Events/Calendar
  events: Event[]
  addEvent: (event: Omit<Event, 'id' | 'createdAt'>) => void
  updateEvent: (id: string, updates: Partial<Event>) => void
  deleteEvent: (id: string) => void
  toggleEventComplete: (id: string) => void
  
  // Health
  userProfile: UserProfile
  setUserProfile: (profile: Partial<UserProfile>) => void
  weightEntries: WeightEntry[]
  addWeightEntry: (entry: Omit<WeightEntry, 'id' | 'createdAt'>) => void
  updateWeightEntry: (id: string, updates: Partial<WeightEntry>) => void
  deleteWeightEntry: (id: string) => void
  mealEntries: MealEntry[]
  addMealEntry: (entry: Omit<MealEntry, 'id' | 'createdAt'>) => void
  updateMealEntry: (id: string, updates: Partial<MealEntry>) => void
  deleteMealEntry: (id: string) => void
  exerciseEntries: ExerciseEntry[]
  addExerciseEntry: (entry: Omit<ExerciseEntry, 'id' | 'createdAt'>) => void
  updateExerciseEntry: (id: string, updates: Partial<ExerciseEntry>) => void
  deleteExerciseEntry: (id: string) => void
  hydrationEntries: HydrationEntry[]
  addHydrationEntry: (entry: Omit<HydrationEntry, 'id' | 'createdAt'>) => void
  deleteHydrationEntry: (id: string) => void
  healthGoals: HealthGoal[]
  addHealthGoal: (goal: Omit<HealthGoal, 'id'>) => void
  updateHealthGoal: (id: string, updates: Partial<HealthGoal>) => void
  deleteHealthGoal: (id: string) => void
  
  // Journal
  journalEntries: JournalEntry[]
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void
  deleteJournalEntry: (id: string) => void
  toggleJournalFavorite: (id: string) => void
  
  // Projects
  projects: Project[]
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  
  // Task Quota System
  taskQuota: number // Nombre max de tâches visibles
  setTaskQuota: (quota: number) => void
  unlockNextTasks: (count: number) => void // Débloque N tâches selon priorité
  getVisibleTasks: () => Task[]
  getHiddenTasks: () => Task[]
  
  // Task Relations
  taskRelations: TaskRelation[]
  addTaskRelation: (relation: Omit<TaskRelation, 'id' | 'createdAt'>) => void
  removeTaskRelation: (id: string) => void
  getTaskRelations: (taskId: string) => TaskRelation[]
  
  // Learning / Apprentissage IA
  learningCourses: Course[]
  addLearningCourse: (course: Course) => void
  updateLearningCourse: (id: string, updates: Partial<Course>) => void
  deleteLearningCourse: (id: string) => void
  addLearningMessage: (courseId: string, message: Message) => void
  deleteLearningMessage: (courseId: string, messageId: string) => void
  addLearningFlashcard: (courseId: string, flashcard: Flashcard) => void
  deleteLearningFlashcard: (courseId: string, flashcardId: string) => void
  addLearningNote: (courseId: string, note: LearningNote) => void
  deleteLearningNote: (courseId: string, noteId: string) => void
  
  // Library / Bibliothèque
  books: Book[]
  readingSessions: ReadingSession[]
  readingGoal: ReadingGoal | null
  isReadingSession: boolean
  currentReadingBookId: string | null
  readingSessionStart: number | null
  
  addBook: (book: Omit<Book, 'id' | 'addedAt' | 'updatedAt' | 'quotes' | 'notes' | 'totalReadingTime' | 'sessionsCount'>) => void
  updateBook: (id: string, updates: Partial<Book>) => void
  deleteBook: (id: string) => void
  
  // Citations & Notes (livres)
  addQuote: (bookId: string, quote: Omit<Quote, 'id' | 'addedAt'>) => void
  updateQuote: (bookId: string, quoteId: string, updates: Partial<Quote>) => void
  deleteQuote: (bookId: string, quoteId: string) => void
  addBookNote: (bookId: string, note: Omit<ReadingNote, 'id' | 'addedAt'>) => void
  deleteBookNote: (bookId: string, noteId: string) => void
  
  // Sessions de lecture
  startReadingSession: (bookId: string) => void
  endReadingSession: (pagesRead?: number) => void
  cancelReadingSession: () => void
  
  // Objectif annuel
  setReadingGoal: (goal: ReadingGoal) => void
  
  // Stats calculées
  getReadingStats: () => {
    totalBooks: number
    completedBooks: number
    completedThisYear: number
    totalPagesRead: number
    totalReadingTime: number
    averageRating: number
    goalProgress: number
  }
}

const generateId = () => Math.random().toString(36).substring(2, 9)

// Widgets par défaut - Taille unique pour tous
const defaultWidgets: Widget[] = [
  {
    id: '1',
    type: 'tasks',
    size: 'notification',
    dimensions: { width: 1, height: 1 },
    position: { x: 0, y: 0 }
  },
  {
    id: '2',
    type: 'calendar',
    size: 'notification',
    dimensions: { width: 1, height: 1 },
    position: { x: 1, y: 0 }
  },
  {
    id: '3',
    type: 'journal',
    size: 'notification',
    dimensions: { width: 1, height: 1 },
    position: { x: 2, y: 0 }
  },
  {
    id: '4',
    type: 'pomodoro',
    size: 'notification',
    dimensions: { width: 1, height: 1 },
    position: { x: 3, y: 0 }
  },
  {
    id: '5',
    type: 'habits',
    size: 'notification',
    dimensions: { width: 1, height: 1 },
    position: { x: 4, y: 0 }
  },
  {
    id: '6',
    type: 'health',
    size: 'notification',
    dimensions: { width: 1, height: 1 },
    position: { x: 5, y: 0 }
  },
  {
    id: '7',
    type: 'learning',
    size: 'notification',
    dimensions: { width: 1, height: 1 },
    position: { x: 6, y: 0 }
  },
  {
    id: '8',
    type: 'library',
    size: 'notification',
    dimensions: { width: 1, height: 1 },
    position: { x: 7, y: 0 }
  }
]

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Navigation
      currentView: 'hub',
      setView: (view) => set({ currentView: view }),
      
      // User
      userName: 'Alexandre',
      setUserName: (name) => set({ userName: name }),
      
      // Theme
      accentTheme: 'indigo',
      setAccentTheme: (theme) => {
        set({ accentTheme: theme })
        get().addToast(`Thème ${theme} activé`, 'success')
      },
      
      // Projects
      projects: [
        { id: 'proj-1', name: 'NewMars', color: '#6366f1', icon: '🚀', createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000 },
        { id: 'proj-2', name: 'Side Project', color: '#10b981', icon: '💡', createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000 },
        { id: 'proj-3', name: 'Freelance', color: '#ec4899', icon: '💼', createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000 },
      ],
      addProject: (project) => {
        const newProject = { ...project, id: generateId(), createdAt: Date.now() }
        set((state) => ({ projects: [...state.projects, newProject] }))
        get().addToast('Projet créé', 'success')
      },
      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) => p.id === id ? { ...p, ...updates } : p)
        }))
      },
      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          // Retirer le projet des tâches associées
          tasks: state.tasks.map((t) => t.projectId === id ? { ...t, projectId: undefined } : t)
        }))
        get().addToast('Projet supprimé', 'info')
      },
      
      // Tasks
      tasks: [
        { id: '1', title: 'Finaliser le composant Dashboard', completed: false, category: 'dev', createdAt: Date.now() - 86400000, status: 'in-progress', priority: 'high', estimatedTime: 60, projectId: 'proj-1', isVisible: true },
        { id: '2', title: 'Revoir les maquettes UI', completed: false, category: 'design', createdAt: Date.now() - 172800000, status: 'todo', priority: 'medium', estimatedTime: 45, projectId: 'proj-1', isVisible: true },
        { id: '3', title: 'Appel avec l\'équipe produit', completed: true, category: 'work', createdAt: Date.now() - 259200000, status: 'done', priority: 'medium', estimatedTime: 30, projectId: 'proj-3' },
        { id: '4', title: 'Implémenter la recherche globale', completed: false, category: 'dev', createdAt: Date.now() - 43200000, status: 'todo', priority: 'high', estimatedTime: 90, projectId: 'proj-1', isVisible: true },
        { id: '5', title: 'Préparer la présentation client', completed: false, category: 'urgent', createdAt: Date.now() - 21600000, status: 'in-progress', priority: 'urgent', estimatedTime: 120, dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], projectId: 'proj-3', isVisible: true },
        { id: '6', title: 'Rechercher des idées', completed: true, category: 'personal', createdAt: Date.now() - 345600000, status: 'done', priority: 'low', estimatedTime: 30, projectId: 'proj-2' },
        { id: '7', title: 'Créer le prototype', completed: false, category: 'dev', createdAt: Date.now() - 172800000, status: 'todo', priority: 'medium', estimatedTime: 120, projectId: 'proj-2', isVisible: true },
      ],
      addTask: (task) => {
        const visibleCount = get().getVisibleTasks().length
        const quota = get().taskQuota
        const isVisible = visibleCount < quota ? true : false
        
        const newTask = { ...task, id: generateId(), createdAt: Date.now(), isVisible }
        set((state) => ({ tasks: [...state.tasks, newTask] }))
        get().addToHistory({ type: 'add', task: newTask })
        
        if (isVisible) {
          get().addToast('Tâche créée', 'success')
        } else {
          get().addToast('Tâche créée (cachée, quota atteint)', 'info')
        }
      },
      toggleTask: (id) => {
        const task = get().tasks.find(t => t.id === id)
        if (task) {
          const wasCompleted = task.completed
          set((state) => ({
            tasks: state.tasks.map((t) => t.id === id ? { ...t, completed: !t.completed } : t)
          }))
          get().addToHistory({ type: 'toggle', task, previousState: task.completed })
          get().addToast(wasCompleted ? 'Tâche réouverte' : 'Tâche terminée ✓', 'success')
          
          // Trigger confetti on completion
          if (!wasCompleted) {
            window.dispatchEvent(new CustomEvent('task-completed'))
            
            // Auto-unlock 1 task when completing a task
            const visibleCount = get().getVisibleTasks().length
            const hiddenCount = get().getHiddenTasks().length
            if (visibleCount < get().taskQuota && hiddenCount > 0) {
              setTimeout(() => get().unlockNextTasks(1), 500)
            }
          }
        }
      },
      deleteTask: (id) => {
        const task = get().tasks.find(t => t.id === id)
        if (task) {
          set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }))
          get().addToHistory({ type: 'delete', task })
          get().addToast('Tâche supprimée', 'info')
        }
      },
      updateTask: (id, updates) => {
        const task = get().tasks.find(t => t.id === id)
        if (task) {
          set((state) => ({
            tasks: state.tasks.map((t) => t.id === id ? { ...t, ...updates } : t)
          }))
          get().addToHistory({ type: 'update', task, previousState: task })
          get().addToast('Tâche mise à jour', 'success')
        }
      },
      moveTask: (taskId, newStatus) => {
        set((state) => ({
          tasks: state.tasks.map((t) => 
            t.id === taskId ? { ...t, status: newStatus, completed: newStatus === 'done' } : t
          )
        }))
        if (newStatus === 'done') {
          window.dispatchEvent(new CustomEvent('task-completed'))
        }
      },
      addSubtask: (taskId, subtaskTitle) => {
        set((state) => ({
          tasks: state.tasks.map((t) => 
            t.id === taskId 
              ? { ...t, subtasks: [...(t.subtasks || []), { id: generateId(), title: subtaskTitle, completed: false }] }
              : t
          )
        }))
      },
      toggleSubtask: (taskId, subtaskId) => {
        set((state) => ({
          tasks: state.tasks.map((t) => 
            t.id === taskId 
              ? { 
                  ...t, 
                  subtasks: t.subtasks?.map(st => 
                    st.id === subtaskId ? { ...st, completed: !st.completed } : st
                  )
                }
              : t
          )
        }))
      },
      deleteSubtask: (taskId, subtaskId) => {
        set((state) => ({
          tasks: state.tasks.map((t) => 
            t.id === taskId 
              ? { ...t, subtasks: t.subtasks?.filter(st => st.id !== subtaskId) }
              : t
          )
        }))
      },
      
      // Task Quota System
      taskQuota: 10, // Max 10 tâches visibles par défaut
      setTaskQuota: (quota) => set({ taskQuota: quota }),
      
      getVisibleTasks: () => {
        return get().tasks.filter(t => !t.completed && (t.isVisible === undefined || t.isVisible === true))
      },
      
      getHiddenTasks: () => {
        return get().tasks.filter(t => !t.completed && t.isVisible === false)
      },
      
      unlockNextTasks: (count) => {
        const state = get()
        const hiddenTasks = state.tasks.filter(t => !t.completed && t.isVisible === false)
        
        if (hiddenTasks.length === 0) return
        
        // Trier par priorité pour débloquer les plus importantes
        const sortedHidden = [...hiddenTasks].sort((a, b) => {
          // 1. Urgentes d'abord
          if (a.priority === 'urgent' && b.priority !== 'urgent') return -1
          if (a.priority !== 'urgent' && b.priority === 'urgent') return 1
          
          // 2. Overdue (en retard)
          const aOverdue = a.dueDate && new Date(a.dueDate) < new Date() ? 1 : 0
          const bOverdue = b.dueDate && new Date(b.dueDate) < new Date() ? 1 : 0
          if (aOverdue !== bOverdue) return bOverdue - aOverdue
          
          // 3. Deadline proche (< 3 jours)
          const now = Date.now()
          const threeDays = 3 * 24 * 60 * 60 * 1000
          const aClose = a.dueDate && (new Date(a.dueDate).getTime() - now) < threeDays ? 1 : 0
          const bClose = b.dueDate && (new Date(b.dueDate).getTime() - now) < threeDays ? 1 : 0
          if (aClose !== bClose) return bClose - aClose
          
          // 4. Avec deadline vs sans deadline
          if (a.dueDate && !b.dueDate) return -1
          if (!a.dueDate && b.dueDate) return 1
          
          // 5. Deadline la plus proche
          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          }
          
          // 6. Par priorité
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        })
        
        // Débloquer les N premières tâches
        const toUnlock = sortedHidden.slice(0, count)
        const unlockedIds = toUnlock.map(t => t.id)
        
        set((state) => ({
          tasks: state.tasks.map(t => 
            unlockedIds.includes(t.id) ? { ...t, isVisible: true } : t
          )
        }))
        
        if (toUnlock.length > 0) {
          get().addToast(`🔓 ${toUnlock.length} tâche${toUnlock.length > 1 ? 's' : ''} débloquée${toUnlock.length > 1 ? 's' : ''}`, 'success')
        }
      },
      
      // Notes
      notes: [],
      addNote: (title, content) => set((state) => ({
        notes: [...state.notes, { id: generateId(), title, content, createdAt: Date.now(), updatedAt: Date.now() }]
      })),
      updateNote: (id, title, content) => set((state) => ({
        notes: state.notes.map((n) => n.id === id ? { ...n, title, content, updatedAt: Date.now() } : n)
      })),
      deleteNote: (id) => set((state) => ({
        notes: state.notes.filter((n) => n.id !== id)
      })),
      
      // Stats & Pomodoro
      focusMinutes: 247,
      addFocusMinutes: (minutes) => set((state) => ({
        focusMinutes: state.focusMinutes + minutes
      })),
      dailyGoal: 5,
      setDailyGoal: (goal) => set({ dailyGoal: goal }),
      pomodoroSessions: [],
      dailyStats: [],
      addPomodoroSession: (session) => {
        const today = new Date().toISOString().split('T')[0]
        const newSession: PomodoroSession = {
          ...session,
          id: generateId(),
          completedAt: Date.now(),
          date: today
        }
        set((state) => {
          // Update daily stats
          const existingStatIndex = state.dailyStats.findIndex(s => s.date === today)
          let newDailyStats = [...state.dailyStats]
          
          if (existingStatIndex >= 0) {
            newDailyStats[existingStatIndex] = {
              ...newDailyStats[existingStatIndex],
              focusMinutes: newDailyStats[existingStatIndex].focusMinutes + session.duration,
              pomodoroSessions: newDailyStats[existingStatIndex].pomodoroSessions + 1
            }
          } else {
            newDailyStats.push({
              date: today,
              tasksCompleted: 0,
              focusMinutes: session.duration,
              pomodoroSessions: 1
            })
          }
          
          return {
            pomodoroSessions: [...state.pomodoroSessions, newSession],
            dailyStats: newDailyStats,
            focusMinutes: state.focusMinutes + session.duration
          }
        })
        get().addToast(`🍅 Pomodoro terminé ! +${session.duration} min`, 'success')
      },
      getTodayStats: () => {
        const today = new Date().toISOString().split('T')[0]
        const state = get()
        const existing = state.dailyStats.find(s => s.date === today)
        if (existing) return existing
        
        // Calculate from tasks completed today
        const todayTasks = state.tasks.filter(t => 
          t.completed && 
          new Date(t.createdAt).toISOString().split('T')[0] === today
        ).length
        
        return {
          date: today,
          tasksCompleted: todayTasks,
          focusMinutes: 0,
          pomodoroSessions: 0
        }
      },
      getWeekStats: () => {
        const stats: DailyStats[] = []
        const state = get()
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const dateStr = date.toISOString().split('T')[0]
          
          const existing = state.dailyStats.find(s => s.date === dateStr)
          if (existing) {
            stats.push(existing)
          } else {
            // Count tasks completed on this day
            const dayTasks = state.tasks.filter(t => {
              if (!t.completed) return false
              const taskDate = new Date(t.createdAt).toISOString().split('T')[0]
              return taskDate === dateStr
            }).length
            
            stats.push({
              date: dateStr,
              tasksCompleted: dayTasks,
              focusMinutes: 0,
              pomodoroSessions: 0
            })
          }
        }
        return stats
      },
      getCurrentStreak: () => {
        const state = get()
        let streak = 0
        const today = new Date()
        
        for (let i = 0; i < 365; i++) {
          const date = new Date(today)
          date.setDate(date.getDate() - i)
          const dateStr = date.toISOString().split('T')[0]
          
          const dayStats = state.dailyStats.find(s => s.date === dateStr)
          const hasActivity = dayStats && (dayStats.tasksCompleted > 0 || dayStats.pomodoroSessions > 0)
          
          // For today, also check if there are incomplete tasks being worked on
          if (i === 0) {
            const todayTasks = state.tasks.filter(t => 
              new Date(t.createdAt).toISOString().split('T')[0] === dateStr
            )
            if (todayTasks.length > 0 || hasActivity) {
              streak++
              continue
            }
          }
          
          if (hasActivity) {
            streak++
          } else if (i > 0) {
            break
          }
        }
        return streak
      },
      
      // History
      history: [],
      historyIndex: -1,
      addToHistory: (action) => set((state) => ({
        history: [...state.history.slice(0, state.historyIndex + 1), action],
        historyIndex: state.historyIndex + 1
      })),
      undo: () => {
        const state = get()
        if (state.historyIndex < 0) return
        
        const action = state.history[state.historyIndex]
        
        if (action.type === 'add' && action.task) {
          set((s) => ({ tasks: s.tasks.filter(t => t.id !== action.task!.id) }))
        } else if (action.type === 'delete' && action.task) {
          set((s) => ({ tasks: [...s.tasks, action.task!] }))
        } else if (action.type === 'toggle' && action.task) {
          set((s) => ({
            tasks: s.tasks.map(t => t.id === action.task!.id ? { ...t, completed: action.previousState } : t)
          }))
        } else if (action.type === 'update' && action.task && action.previousState) {
          set((s) => ({
            tasks: s.tasks.map(t => t.id === action.task!.id ? action.previousState : t)
          }))
        }
        
        set({ historyIndex: state.historyIndex - 1 })
        get().addToast('Action annulée', 'info')
      },
      redo: () => {
        const state = get()
        if (state.historyIndex >= state.history.length - 1) return
        
        const action = state.history[state.historyIndex + 1]
        
        if (action.type === 'add' && action.task) {
          set((s) => ({ tasks: [...s.tasks, action.task!] }))
        } else if (action.type === 'delete' && action.task) {
          set((s) => ({ tasks: s.tasks.filter(t => t.id !== action.task!.id) }))
        } else if (action.type === 'toggle' && action.task) {
          set((s) => ({
            tasks: s.tasks.map(t => t.id === action.task!.id ? { ...t, completed: !action.previousState } : t)
          }))
        }
        
        set({ historyIndex: state.historyIndex + 1 })
        get().addToast('Action rétablie', 'info')
      },
      canUndo: false,
      canRedo: false,
      
      // Toasts
      toasts: [],
      addToast: (message, type = 'info') => {
        const id = generateId()
        set((state) => ({
          toasts: [...state.toasts, { id, message, type }]
        }))
        setTimeout(() => get().removeToast(id), 3000)
      },
      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      })),
      
      // Search Widget
      isCommandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
      
      // Focus Mode & Pomodoro
      isFocusMode: false,
      focusTaskId: null,
      pomodoroTimeLeft: 25 * 60,
      isPomodoroRunning: false,
      setFocusMode: (enabled, taskId) => set({ 
        isFocusMode: enabled, 
        focusTaskId: taskId || null,
        pomodoroTimeLeft: 25 * 60,
        isPomodoroRunning: false
      }),
      setPomodoroTime: (seconds) => set({ pomodoroTimeLeft: seconds }),
      togglePomodoroRunning: () => set((state) => ({ isPomodoroRunning: !state.isPomodoroRunning })),
      resetPomodoro: () => set({ pomodoroTimeLeft: 25 * 60, isPomodoroRunning: false }),
      
      // Widgets
      widgets: defaultWidgets,
      currentLayout: null,
      layouts: [],
      isEditMode: false,
      setEditMode: (enabled) => set({ isEditMode: enabled }),
      addWidget: (widget) => set((state) => ({
        widgets: [...state.widgets, { ...widget, id: generateId() }]
      })),
      updateWidget: (id, updates) => set((state) => ({
        widgets: state.widgets.map(w => w.id === id ? { ...w, ...updates } : w)
      })),
      removeWidget: (id) => set((state) => ({
        widgets: state.widgets.filter(w => w.id !== id)
      })),
    setWidgets: (widgets) => set({ widgets }),
    resetWidgets: () => set({ widgets: defaultWidgets }),
    saveLayout: (name) => {
        const layout: WidgetLayout = {
          id: generateId(),
          name,
          widgets: get().widgets,
          gridCols: 3,
          isActive: false
        }
        set((state) => ({ layouts: [...state.layouts, layout] }))
        get().addToast(`Layout "${name}" sauvegardé`, 'success')
      },
      loadLayout: (id) => {
        const layout = get().layouts.find(l => l.id === id)
        if (layout) {
          set({ widgets: layout.widgets, currentLayout: layout })
          get().addToast(`Layout "${layout.name}" chargé`, 'success')
        }
      },
      deleteLayout: (id) => set((state) => ({
        layouts: state.layouts.filter(l => l.id !== id)
      })),
      
      // Habits
      habits: [
        { id: '1', name: 'Méditation', streak: 7, completedDates: [] },
        { id: '2', name: 'Sport', streak: 3, completedDates: [] },
        { id: '3', name: 'Lecture', streak: 12, completedDates: [] },
      ],
      addHabit: (name) => set((state) => ({
        habits: [...state.habits, { id: generateId(), name, streak: 0, completedDates: [] }]
      })),
      toggleHabitToday: (id) => {
        const today = new Date().toISOString().split('T')[0]
        set((state) => ({
          habits: state.habits.map(h => {
            if (h.id === id) {
              const isCompleted = h.completedDates.includes(today)
              return {
                ...h,
                completedDates: isCompleted
                  ? h.completedDates.filter(d => d !== today)
                  : [...h.completedDates, today],
                streak: isCompleted ? Math.max(0, h.streak - 1) : h.streak + 1
              }
            }
            return h
          })
        }))
      },
      deleteHabit: (id) => set((state) => ({
        habits: state.habits.filter(h => h.id !== id)
      })),
      
      // Quick Notes
      quickNotes: [],
      addQuickNote: (content) => set((state) => ({
        quickNotes: [...state.quickNotes, { id: generateId(), content, createdAt: Date.now() }]
      })),
      deleteQuickNote: (id) => set((state) => ({
        quickNotes: state.quickNotes.filter(n => n.id !== id)
      })),
      
      // Quick Links
      quickLinks: [
        { id: '1', label: 'GitHub', url: 'https://github.com' },
        { id: '2', label: 'Figma', url: 'https://figma.com' },
        { id: '3', label: 'Linear', url: 'https://linear.app' },
      ],
      addQuickLink: (label, url) => set((state) => ({
        quickLinks: [...state.quickLinks, { id: generateId(), label, url }]
      })),
      deleteQuickLink: (id) => set((state) => ({
        quickLinks: state.quickLinks.filter(l => l.id !== id)
      })),
      
      // Events/Calendar
      events: [
        {
          id: '1',
          title: 'Réunion équipe',
          startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          startTime: '14:00',
          endTime: '15:00',
          type: 'meeting' as const,
          category: 'work' as const,
          priority: 'medium' as const,
          isRecurring: false,
          completed: false,
          createdAt: Date.now()
        },
        {
          id: '2',
          title: 'Deadline projet',
          startDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
          type: 'deadline' as const,
          category: 'work' as const,
          priority: 'high' as const,
          isRecurring: false,
          completed: false,
          createdAt: Date.now()
        }
      ],
      addEvent: (event) => {
        const newEvent = { ...event, id: generateId(), createdAt: Date.now() }
        set((state) => ({ events: [...state.events, newEvent] }))
        get().addToast('Événement créé', 'success')
      },
      updateEvent: (id, updates) => {
        set((state) => ({
          events: state.events.map((e) => e.id === id ? { ...e, ...updates } : e)
        }))
        get().addToast('Événement mis à jour', 'success')
      },
      deleteEvent: (id) => {
        set((state) => ({ events: state.events.filter((e) => e.id !== id) }))
        get().addToast('Événement supprimé', 'info')
      },
      toggleEventComplete: (id) => {
        set((state) => ({
          events: state.events.map((e) => e.id === id ? { ...e, completed: !e.completed } : e)
        }))
      },
      
      // Health
      userProfile: {
        height: 175, // cm
        age: 30,
        gender: 'male',
        activityLevel: 'moderate'
      },
      setUserProfile: (profile) => {
        set((state) => ({ userProfile: { ...state.userProfile, ...profile } }))
        get().addToast('Profil mis à jour', 'success')
      },
      
      weightEntries: [],
      addWeightEntry: (entry) => {
        const newEntry = { ...entry, id: generateId(), createdAt: Date.now() }
        set((state) => ({ weightEntries: [...state.weightEntries, newEntry] }))
        get().addToast('Poids enregistré', 'success')
      },
      updateWeightEntry: (id, updates) => {
        set((state) => ({
          weightEntries: state.weightEntries.map((e) => e.id === id ? { ...e, ...updates } : e)
        }))
        get().addToast('Entrée mise à jour', 'success')
      },
      deleteWeightEntry: (id) => {
        set((state) => ({ weightEntries: state.weightEntries.filter((e) => e.id !== id) }))
        get().addToast('Entrée supprimée', 'info')
      },
      
      mealEntries: [],
      addMealEntry: (entry) => {
        const newEntry = { ...entry, id: generateId(), createdAt: Date.now() }
        set((state) => ({ mealEntries: [...state.mealEntries, newEntry] }))
        get().addToast('Repas enregistré', 'success')
      },
      updateMealEntry: (id, updates) => {
        set((state) => ({
          mealEntries: state.mealEntries.map((e) => e.id === id ? { ...e, ...updates } : e)
        }))
        get().addToast('Repas mis à jour', 'success')
      },
      deleteMealEntry: (id) => {
        set((state) => ({ mealEntries: state.mealEntries.filter((e) => e.id !== id) }))
        get().addToast('Repas supprimé', 'info')
      },
      
      exerciseEntries: [],
      addExerciseEntry: (entry) => {
        const newEntry = { ...entry, id: generateId(), createdAt: Date.now() }
        set((state) => ({ exerciseEntries: [...state.exerciseEntries, newEntry] }))
        get().addToast('Exercice enregistré', 'success')
      },
      updateExerciseEntry: (id, updates) => {
        set((state) => ({
          exerciseEntries: state.exerciseEntries.map((e) => e.id === id ? { ...e, ...updates } : e)
        }))
        get().addToast('Exercice mis à jour', 'success')
      },
      deleteExerciseEntry: (id) => {
        set((state) => ({ exerciseEntries: state.exerciseEntries.filter((e) => e.id !== id) }))
        get().addToast('Exercice supprimé', 'info')
      },
      
      hydrationEntries: [],
      addHydrationEntry: (entry) => {
        const newEntry = { ...entry, id: generateId(), createdAt: Date.now() }
        set((state) => ({ hydrationEntries: [...state.hydrationEntries, newEntry] }))
        get().addToast('Hydratation enregistrée', 'success')
      },
      deleteHydrationEntry: (id) => {
        set((state) => ({ hydrationEntries: state.hydrationEntries.filter((e) => e.id !== id) }))
        get().addToast('Entrée supprimée', 'info')
      },
      
      healthGoals: [
        {
          id: '1',
          type: 'weight',
          target: 75,
          current: 80,
          unit: 'kg',
          startDate: new Date().toISOString().split('T')[0],
          active: true
        },
        {
          id: '2',
          type: 'calories',
          target: 2000,
          current: 0,
          unit: 'kcal',
          startDate: new Date().toISOString().split('T')[0],
          active: true
        }
      ],
      addHealthGoal: (goal) => {
        const newGoal = { ...goal, id: generateId() }
        set((state) => ({ healthGoals: [...state.healthGoals, newGoal] }))
        get().addToast('Objectif créé', 'success')
      },
      updateHealthGoal: (id, updates) => {
        set((state) => ({
          healthGoals: state.healthGoals.map((g) => g.id === id ? { ...g, ...updates } : g)
        }))
        get().addToast('Objectif mis à jour', 'success')
      },
      deleteHealthGoal: (id) => {
        set((state) => ({ healthGoals: state.healthGoals.filter((g) => g.id !== id) }))
        get().addToast('Objectif supprimé', 'info')
      },
      
      // Journal
      journalEntries: [],
      addJournalEntry: (entry) => {
        const now = Date.now()
        const newEntry = { ...entry, id: generateId(), createdAt: now, updatedAt: now }
        set((state) => ({ journalEntries: [...state.journalEntries, newEntry] }))
        get().addToast('Entrée journal créée', 'success')
      },
      updateJournalEntry: (id, updates) => {
        set((state) => ({
          journalEntries: state.journalEntries.map((e) => 
            e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e
          )
        }))
        get().addToast('Entrée mise à jour', 'success')
      },
      deleteJournalEntry: (id) => {
        set((state) => ({ journalEntries: state.journalEntries.filter((e) => e.id !== id) }))
        get().addToast('Entrée supprimée', 'info')
      },
      toggleJournalFavorite: (id) => {
        set((state) => ({
          journalEntries: state.journalEntries.map((e) => 
            e.id === id ? { ...e, isFavorite: !e.isFavorite } : e
          )
        }))
      },
      
      // Task Relations
      taskRelations: [],
      addTaskRelation: (relation) => {
        const newRelation = { ...relation, id: generateId(), createdAt: Date.now() }
        set((state) => ({ taskRelations: [...state.taskRelations, newRelation] }))
        get().addToast('Relation créée', 'success')
      },
      removeTaskRelation: (id) => {
        set((state) => ({ taskRelations: state.taskRelations.filter((r) => r.id !== id) }))
        get().addToast('Relation supprimée', 'info')
      },
      getTaskRelations: (taskId) => {
        const state = get()
        return state.taskRelations.filter(r => r.fromTaskId === taskId || r.toTaskId === taskId)
      },
      
      // Learning / Apprentissage IA
      learningCourses: [],
      addLearningCourse: (course) => {
        set((state) => ({ learningCourses: [...state.learningCourses, course] }))
      },
      updateLearningCourse: (id, updates) => {
        set((state) => ({
          learningCourses: state.learningCourses.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          )
        }))
      },
      deleteLearningCourse: (id) => {
        set((state) => ({ learningCourses: state.learningCourses.filter((c) => c.id !== id) }))
      },
      addLearningMessage: (courseId, message) => {
        set((state) => ({
          learningCourses: state.learningCourses.map((c) =>
            c.id === courseId ? { ...c, messages: [...c.messages, message] } : c
          )
        }))
      },
      deleteLearningMessage: (courseId, messageId) => {
        set((state) => ({
          learningCourses: state.learningCourses.map((c) =>
            c.id === courseId 
              ? { ...c, messages: c.messages.filter((m) => m.id !== messageId) } 
              : c
          )
        }))
      },
      addLearningFlashcard: (courseId, flashcard) => {
        set((state) => ({
          learningCourses: state.learningCourses.map((c) =>
            c.id === courseId ? { ...c, flashcards: [...c.flashcards, flashcard] } : c
          )
        }))
      },
      deleteLearningFlashcard: (courseId, flashcardId) => {
        set((state) => ({
          learningCourses: state.learningCourses.map((c) =>
            c.id === courseId 
              ? { ...c, flashcards: c.flashcards.filter((f) => f.id !== flashcardId) } 
              : c
          )
        }))
      },
      addLearningNote: (courseId, note) => {
        set((state) => ({
          learningCourses: state.learningCourses.map((c) =>
            c.id === courseId ? { ...c, notes: [...c.notes, note] } : c
          )
        }))
      },
      deleteLearningNote: (courseId, noteId) => {
        set((state) => ({
          learningCourses: state.learningCourses.map((c) =>
            c.id === courseId 
              ? { ...c, notes: c.notes.filter((n) => n.id !== noteId) } 
              : c
          )
        }))
      },
      
      // Library / Bibliothèque
      books: DEMO_BOOKS.map((book, i) => ({
        ...book,
        id: generateId(),
        addedAt: Date.now() - (i * 86400000),
        updatedAt: Date.now() - (i * 86400000),
      })),
      readingSessions: [],
      readingGoal: { year: new Date().getFullYear(), targetBooks: 12 },
      isReadingSession: false,
      currentReadingBookId: null,
      readingSessionStart: null,
      
      addBook: (book) => {
        const now = Date.now()
        set((state) => ({
          books: [...state.books, { 
            ...book, 
            id: generateId(), 
            addedAt: now, 
            updatedAt: now,
            quotes: [],
            notes: [],
            totalReadingTime: 0,
            sessionsCount: 0
          }]
        }))
      },
      updateBook: (id, updates) => {
        set((state) => ({
          books: state.books.map((b) =>
            b.id === id ? { ...b, ...updates, updatedAt: Date.now() } : b
          )
        }))
      },
      deleteBook: (id) => {
        set((state) => ({ 
          books: state.books.filter((b) => b.id !== id),
          readingSessions: state.readingSessions.filter((s) => s.bookId !== id)
        }))
      },
      
      // Citations
      addQuote: (bookId, quote) => {
        set((state) => ({
          books: state.books.map((b) =>
            b.id === bookId 
              ? { ...b, quotes: [...b.quotes, { ...quote, id: generateId(), addedAt: Date.now() }], updatedAt: Date.now() }
              : b
          )
        }))
      },
      updateQuote: (bookId, quoteId, updates) => {
        set((state) => ({
          books: state.books.map((b) =>
            b.id === bookId 
              ? { ...b, quotes: b.quotes.map(q => q.id === quoteId ? { ...q, ...updates } : q), updatedAt: Date.now() }
              : b
          )
        }))
      },
      deleteQuote: (bookId, quoteId) => {
        set((state) => ({
          books: state.books.map((b) =>
            b.id === bookId 
              ? { ...b, quotes: b.quotes.filter(q => q.id !== quoteId), updatedAt: Date.now() }
              : b
          )
        }))
      },
      
      // Notes des livres
      addBookNote: (bookId: string, note: Omit<ReadingNote, 'id' | 'addedAt'>) => {
        set((state) => ({
          books: state.books.map((b) =>
            b.id === bookId 
              ? { ...b, notes: [...b.notes, { ...note, id: generateId(), addedAt: Date.now() }], updatedAt: Date.now() }
              : b
          )
        }))
      },
      deleteBookNote: (bookId: string, noteId: string) => {
        set((state) => ({
          books: state.books.map((b) =>
            b.id === bookId 
              ? { ...b, notes: b.notes.filter(n => n.id !== noteId), updatedAt: Date.now() }
              : b
          )
        }))
      },
      
      // Sessions de lecture
      startReadingSession: (bookId) => {
        set({
          isReadingSession: true,
          currentReadingBookId: bookId,
          readingSessionStart: Date.now()
        })
      },
      endReadingSession: (pagesRead) => {
        const state = get()
        if (!state.isReadingSession || !state.currentReadingBookId || !state.readingSessionStart) return
        
        const duration = Math.round((Date.now() - state.readingSessionStart) / 60000) // en minutes
        const book = state.books.find(b => b.id === state.currentReadingBookId)
        if (!book || duration < 1) {
          set({ isReadingSession: false, currentReadingBookId: null, readingSessionStart: null })
          return
        }
        
        const session: ReadingSession = {
          id: generateId(),
          bookId: state.currentReadingBookId,
          bookTitle: book.title,
          duration,
          pagesRead,
          date: new Date().toISOString().split('T')[0],
          completedAt: Date.now()
        }
        
        set((s) => ({
          readingSessions: [...s.readingSessions, session],
          books: s.books.map((b) =>
            b.id === state.currentReadingBookId
              ? { 
                  ...b, 
                  totalReadingTime: b.totalReadingTime + duration,
                  sessionsCount: b.sessionsCount + 1,
                  currentPage: pagesRead ? (b.currentPage || 0) + pagesRead : b.currentPage,
                  updatedAt: Date.now()
                }
              : b
          ),
          isReadingSession: false,
          currentReadingBookId: null,
          readingSessionStart: null
        }))
      },
      cancelReadingSession: () => {
        set({ isReadingSession: false, currentReadingBookId: null, readingSessionStart: null })
      },
      
      // Objectif
      setReadingGoal: (goal) => {
        set({ readingGoal: goal })
      },
      
      // Stats
      getReadingStats: () => {
        const state = get()
        const currentYear = new Date().getFullYear()
        const completedBooks = state.books.filter(b => b.status === 'completed')
        const completedThisYear = completedBooks.filter(b => 
          b.finishedAt && new Date(b.finishedAt).getFullYear() === currentYear
        ).length
        
        const totalPagesRead = state.books.reduce((acc, b) => acc + (b.currentPage || 0), 0)
        const totalReadingTime = state.books.reduce((acc, b) => acc + b.totalReadingTime, 0)
        const ratings = completedBooks.filter(b => b.rating).map(b => b.rating!)
        const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
        
        const goalProgress = state.readingGoal 
          ? Math.round((completedThisYear / state.readingGoal.targetBooks) * 100)
          : 0
        
        return {
          totalBooks: state.books.length,
          completedBooks: completedBooks.length,
          completedThisYear,
          totalPagesRead,
          totalReadingTime,
          averageRating: Math.round(averageRating * 10) / 10,
          goalProgress
        }
      },
    }),
    {
      name: 'newmars-storage',
      partialize: (state) => ({
        userName: state.userName,
        accentTheme: state.accentTheme,
        tasks: state.tasks,
        projects: state.projects,
        notes: state.notes,
        focusMinutes: state.focusMinutes,
        dailyGoal: state.dailyGoal,
        widgets: state.widgets,
        layouts: state.layouts,
        habits: state.habits,
        quickNotes: state.quickNotes,
        quickLinks: state.quickLinks,
        events: state.events,
        userProfile: state.userProfile,
        weightEntries: state.weightEntries,
        mealEntries: state.mealEntries,
        exerciseEntries: state.exerciseEntries,
        hydrationEntries: state.hydrationEntries,
        healthGoals: state.healthGoals,
        journalEntries: state.journalEntries,
        taskRelations: state.taskRelations,
        learningCourses: state.learningCourses,
        books: state.books,
        readingSessions: state.readingSessions,
        readingGoal: state.readingGoal,
      })
    }
  )
)

// Update canUndo/canRedo on history changes
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

// Migration: Add missing fields to existing tasks
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
    // Reset to default tasks if migration fails
    useStore.setState({ 
      tasks: [
        { id: '1', title: 'Finaliser le composant Dashboard', completed: false, category: 'dev', createdAt: Date.now() - 86400000, status: 'in-progress', priority: 'high', estimatedTime: 60 },
        { id: '2', title: 'Revoir les maquettes UI', completed: false, category: 'design', createdAt: Date.now() - 172800000, status: 'todo', priority: 'medium', estimatedTime: 45 },
      ]
    })
  }
}

// Migration: Add books if not present and ensure new fields exist
const migrateBooksData = () => {
  try {
    const state = useStore.getState()
    
    // Si books n'existe pas ou est vide, ajouter les livres de démo
    if (!state.books || state.books.length === 0) {
      const demoBooks = DEMO_BOOKS.map((book, i) => ({
        ...book,
        id: generateId(),
        addedAt: Date.now() - (i * 86400000),
        updatedAt: Date.now() - (i * 86400000),
      }))
      
      useStore.setState({ books: demoBooks })
    } else {
      // Migration: ajouter les nouveaux champs si manquants
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
    }
    
    // S'assurer que readingSessions existe
    if (!state.readingSessions) {
      useStore.setState({ readingSessions: [] })
    }
    
    // S'assurer que readingGoal existe
    if (!state.readingGoal) {
      useStore.setState({ readingGoal: { year: new Date().getFullYear(), targetBooks: 12 } })
    }
  } catch {
    // Silently handle migration errors
  }
}

// Run migration once on load
if (typeof window !== 'undefined') {
  setTimeout(() => {
    migrateTasksData()
    migrateBooksData()
  }, 100)
}
