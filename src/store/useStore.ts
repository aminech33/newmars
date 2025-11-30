import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Widget, WidgetLayout, Habit, QuickNote, QuickLink } from '../types/widgets'
import { Event } from '../types/calendar'
import { WeightEntry, MealEntry, HealthGoal, UserProfile } from '../types/health'
import { JournalEntry } from '../types/journal'
import { TaskRelation } from '../types/taskRelation'

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
  project?: string // Nom du projet (ex: "NewMars", "Side Project")
}

// Liste des projets disponibles
export const PROJECTS = [
  { name: 'NewMars', color: '#6366f1', icon: '🚀' },
  { name: 'Side Project', color: '#10b981', icon: '💡' },
  { name: 'Perso', color: '#f59e0b', icon: '🏠' },
  { name: 'Freelance', color: '#ec4899', icon: '💼' },
] as const

export type ProjectName = typeof PROJECTS[number]['name']

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
  duration: number // en minutes (25 par défaut)
  completedAt: number // timestamp
  date: string // YYYY-MM-DD
  type: 'focus' | 'break'
}

export interface DailyStats {
  date: string
  tasksCompleted: number
  focusMinutes: number
  pomodoroSessions: number
}

type View = 'hub' | 'tasks' | 'dashboard' | 'ai' | 'calendar' | 'health' | 'journal'

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
  
  // Command Palette
  isCommandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  
  // Focus Mode
  isFocusMode: boolean
  focusTaskId: string | null
  pomodoroTimeLeft: number
  setFocusMode: (enabled: boolean, taskId?: string) => void
  setPomodoroTime: (seconds: number) => void
  
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
  
  // Task Relations
  taskRelations: TaskRelation[]
  addTaskRelation: (relation: Omit<TaskRelation, 'id' | 'createdAt'>) => void
  removeTaskRelation: (id: string) => void
  getTaskRelations: (taskId: string) => TaskRelation[]
}

const generateId = () => Math.random().toString(36).substring(2, 9)

const defaultWidgets: Widget[] = [
  {
    id: '1',
    type: 'tasks',
    size: 'large',
    dimensions: { width: 2, height: 2 },
    position: { x: 0, y: 0 }
  },
  {
    id: '2',
    type: 'calendar',
    size: 'medium',
    dimensions: { width: 2, height: 1 },
    position: { x: 2, y: 0 }
  },
  {
    id: '3',
    type: 'stats',
    size: 'small',
    dimensions: { width: 1, height: 1 },
    position: { x: 4, y: 0 }
  },
  {
    id: '4',
    type: 'habits',
    size: 'medium',
    dimensions: { width: 1, height: 2 },
    position: { x: 0, y: 2 }
  },
  {
    id: '5',
    type: 'pomodoro',
    size: 'small',
    dimensions: { width: 1, height: 1 },
    position: { x: 1, y: 2 }
  },
  {
    id: '6',
    type: 'quick-actions',
    size: 'small',
    dimensions: { width: 1, height: 1 },
    position: { x: 2, y: 1 }
  },
  {
    id: '7',
    type: 'notes',
    size: 'medium',
    dimensions: { width: 2, height: 1 },
    position: { x: 3, y: 1 }
  },
  {
    id: '8',
    type: 'quote',
    size: 'small',
    dimensions: { width: 1, height: 1 },
    position: { x: 5, y: 0 }
  },
  {
    id: '9',
    type: 'health',
    size: 'small',
    dimensions: { width: 1, height: 1 },
    position: { x: 1, y: 3 }
  },
  {
    id: '10',
    type: 'journal',
    size: 'small',
    dimensions: { width: 1, height: 1 },
    position: { x: 2, y: 2 }
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
      
      // Tasks
      tasks: [
        { id: '1', title: 'Finaliser le composant Dashboard', completed: false, category: 'dev', createdAt: Date.now() - 86400000, status: 'in-progress', priority: 'high', estimatedTime: 60, project: 'NewMars' },
        { id: '2', title: 'Revoir les maquettes UI', completed: false, category: 'design', createdAt: Date.now() - 172800000, status: 'todo', priority: 'medium', estimatedTime: 45, project: 'NewMars' },
        { id: '3', title: 'Appel avec l\'équipe produit', completed: true, category: 'work', createdAt: Date.now() - 259200000, status: 'done', priority: 'medium', estimatedTime: 30, project: 'Freelance' },
        { id: '4', title: 'Implémenter la recherche globale', completed: false, category: 'dev', createdAt: Date.now() - 43200000, status: 'todo', priority: 'high', estimatedTime: 90, project: 'NewMars' },
        { id: '5', title: 'Préparer la présentation client', completed: false, category: 'urgent', createdAt: Date.now() - 21600000, status: 'in-progress', priority: 'urgent', estimatedTime: 120, dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], project: 'Freelance' },
        { id: '6', title: 'Rechercher des idées', completed: true, category: 'personal', createdAt: Date.now() - 345600000, status: 'done', priority: 'low', estimatedTime: 30, project: 'Side Project' },
        { id: '7', title: 'Créer le prototype', completed: false, category: 'dev', createdAt: Date.now() - 172800000, status: 'todo', priority: 'medium', estimatedTime: 120, project: 'Side Project' },
      ],
      addTask: (task) => {
        const newTask = { ...task, id: generateId(), createdAt: Date.now() }
        set((state) => ({ tasks: [...state.tasks, newTask] }))
        get().addToHistory({ type: 'add', task: newTask })
        get().addToast('Tâche créée', 'success')
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
      
      // Command Palette
      isCommandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
      
      // Focus Mode
      isFocusMode: false,
      focusTaskId: null,
      pomodoroTimeLeft: 25 * 60,
      setFocusMode: (enabled, taskId) => set({ 
        isFocusMode: enabled, 
        focusTaskId: taskId || null,
        pomodoroTimeLeft: 25 * 60
      }),
      setPomodoroTime: (seconds) => set({ pomodoroTimeLeft: seconds }),
      
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
    }),
    {
      name: 'newmars-storage',
      partialize: (state) => ({
        userName: state.userName,
        accentTheme: state.accentTheme,
        tasks: state.tasks,
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
        healthGoals: state.healthGoals,
        journalEntries: state.journalEntries,
        taskRelations: state.taskRelations,
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
      console.warn('⚠️ No tasks to migrate')
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
      console.log('✅ Tasks migrated to new format:', migratedTasks.length, 'tasks')
    } else {
      console.log('✅ Tasks already in new format')
    }
    migrationDone = true
  } catch (error) {
    console.error('❌ Migration failed:', error)
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

// Run migration once on load
if (typeof window !== 'undefined') {
  setTimeout(() => {
    migrateTasksData()
  }, 100)
}
