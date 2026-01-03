/**
 * 🎨 UI Slice - Navigation, toasts, widgets, pomodoro, notes
 */

import { StateCreator } from 'zustand'
import { Widget, WidgetLayout, QuickNote, QuickLink } from '../../types/widgets'
import { View, AccentTheme, Toast, Note, PomodoroSession, DailyStats, generateId } from './types'
import { observePomodoroCompleted } from '../../insights'

export interface UISlice {
  // Navigation
  currentView: View
  navigationHistory: View[]
  setView: (view: View) => void
  goBack: () => void
  canGoBack: boolean

  // Deep linking
  selectedTaskId: string | null
  selectedBookId: string | null
  setSelectedTaskId: (id: string | null) => void
  setSelectedBookId: (id: string | null) => void

  // User
  userName: string
  setUserName: (name: string) => void

  // Theme
  accentTheme: AccentTheme
  setAccentTheme: (theme: AccentTheme) => void

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

  // Toasts
  toasts: Toast[]
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void

  // Search Widget
  isCommandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void

  // Focus Mode & Pomodoro Timer
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

  // Quick Notes
  quickNotes: QuickNote[]
  addQuickNote: (content: string) => void
  deleteQuickNote: (id: string) => void

  // Quick Links
  quickLinks: QuickLink[]
  addQuickLink: (label: string, url: string) => void
  deleteQuickLink: (id: string) => void
}

// Default widgets (empty hub)
const defaultWidgets: Widget[] = []

export const createUISlice: StateCreator<
  UISlice & { tasks: { createdAt: number; completed: boolean }[] },
  [['zustand/persist', unknown]],
  [],
  UISlice
> = (set, get) => ({
  // Navigation
  currentView: 'hub',
  navigationHistory: [] as View[],
  canGoBack: false,

  setView: (view) => {
    const currentView = get().currentView
    if (currentView !== view) {
      set((s) => ({
        currentView: view,
        navigationHistory: [...s.navigationHistory.slice(-9), currentView],
        canGoBack: true
      }))
    }
  },

  goBack: () => {
    const history = get().navigationHistory
    if (history.length > 0) {
      const previousView = history[history.length - 1]
      set((s) => ({
        currentView: previousView,
        navigationHistory: s.navigationHistory.slice(0, -1),
        canGoBack: s.navigationHistory.length > 1
      }))
    }
  },

  // Deep linking
  selectedTaskId: null,
  selectedBookId: null,
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),
  setSelectedBookId: (id) => set({ selectedBookId: id }),

  // User
  userName: 'Alexandre',
  setUserName: (name) => set({ userName: name }),

  // Theme
  accentTheme: 'indigo',
  setAccentTheme: (theme) => {
    set({ accentTheme: theme })
    get().addToast(`Thème ${theme} activé`, 'success')
  },

  // Notes
  notes: [],
  addNote: (title, content) => set((s) => ({
    notes: [...s.notes, { id: generateId(), title, content, createdAt: Date.now(), updatedAt: Date.now() }]
  })),
  updateNote: (id, title, content) => set((s) => ({
    notes: s.notes.map((n) => n.id === id ? { ...n, title, content, updatedAt: Date.now() } : n)
  })),
  deleteNote: (id) => set((s) => ({
    notes: s.notes.filter((n) => n.id !== id)
  })),

  // Stats & Pomodoro
  focusMinutes: 247,
  addFocusMinutes: (minutes) => set((s) => ({
    focusMinutes: s.focusMinutes + minutes
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

    // Brain: Observer Pomodoro completion
    if (session.type === 'focus' && !session.interrupted) {
      observePomodoroCompleted({
        taskId: session.taskId,
        duration: session.duration,
        actualDuration: session.actualDuration || session.duration
      })
    }

    set((s) => {
      const existingStatIndex = s.dailyStats.findIndex(stat => stat.date === today)
      let newDailyStats = [...s.dailyStats]

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
        pomodoroSessions: [...s.pomodoroSessions, newSession],
        dailyStats: newDailyStats,
        focusMinutes: s.focusMinutes + session.duration
      }
    })
    get().addToast(`🍅 Pomodoro terminé ! +${session.duration} min`, 'success')
  },

  getTodayStats: () => {
    const today = new Date().toISOString().split('T')[0]
    const state = get()
    const existing = state.dailyStats.find(s => s.date === today)
    if (existing) return existing

    const todayTasks = state.tasks?.filter(t =>
      t.completed &&
      new Date(t.createdAt).toISOString().split('T')[0] === today
    ).length || 0

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
        const dayTasks = state.tasks?.filter(t => {
          if (!t.completed) return false
          const taskDate = new Date(t.createdAt).toISOString().split('T')[0]
          return taskDate === dateStr
        }).length || 0

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

      if (i === 0) {
        const todayTasks = state.tasks?.filter(t =>
          new Date(t.createdAt).toISOString().split('T')[0] === dateStr
        )
        if ((todayTasks && todayTasks.length > 0) || hasActivity) {
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

  // Toasts
  toasts: [],
  addToast: (message, type = 'info') => {
    const id = generateId()
    set((s) => ({
      toasts: [...s.toasts, { id, message, type }]
    }))
    setTimeout(() => get().removeToast(id), 3000)
  },
  removeToast: (id) => set((s) => ({
    toasts: s.toasts.filter(t => t.id !== id)
  })),

  // Search Widget
  isCommandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),

  // Focus Mode & Pomodoro Timer
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
  togglePomodoroRunning: () => set((s) => ({ isPomodoroRunning: !s.isPomodoroRunning })),
  resetPomodoro: () => set({ pomodoroTimeLeft: 25 * 60, isPomodoroRunning: false }),

  // Widgets
  widgets: defaultWidgets,
  currentLayout: null,
  layouts: [],
  isEditMode: false,
  setEditMode: (enabled) => set({ isEditMode: enabled }),
  addWidget: (widget) => set((s) => ({
    widgets: [...s.widgets, { ...widget, id: generateId() }]
  })),
  updateWidget: (id, updates) => set((s) => ({
    widgets: s.widgets.map(w => w.id === id ? { ...w, ...updates } : w)
  })),
  removeWidget: (id) => set((s) => ({
    widgets: s.widgets.filter(w => w.id !== id)
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
    set((s) => ({ layouts: [...s.layouts, layout] }))
    get().addToast(`Layout "${name}" sauvegardé`, 'success')
  },
  loadLayout: (id) => {
    const layout = get().layouts.find(l => l.id === id)
    if (layout) {
      set({ widgets: layout.widgets, currentLayout: layout })
      get().addToast(`Layout "${layout.name}" chargé`, 'success')
    }
  },
  deleteLayout: (id) => set((s) => ({
    layouts: s.layouts.filter(l => l.id !== id)
  })),

  // Quick Notes
  quickNotes: [],
  addQuickNote: (content) => set((s) => ({
    quickNotes: [...s.quickNotes, { id: generateId(), content, createdAt: Date.now() }]
  })),
  deleteQuickNote: (id) => set((s) => ({
    quickNotes: s.quickNotes.filter(n => n.id !== id)
  })),

  // Quick Links
  quickLinks: [
    { id: '1', label: 'GitHub', url: 'https://github.com' },
    { id: '2', label: 'Figma', url: 'https://figma.com' },
    { id: '3', label: 'Linear', url: 'https://linear.app' },
  ],
  addQuickLink: (label, url) => set((s) => ({
    quickLinks: [...s.quickLinks, { id: generateId(), label, url }]
  })),
  deleteQuickLink: (id) => set((s) => ({
    quickLinks: s.quickLinks.filter(l => l.id !== id)
  })),
})





