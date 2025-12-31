/**
 * 📋 Tasks Slice - Gestion des tâches et projets
 */

import { StateCreator } from 'zustand'
import {
  Task, Project, SubTask, CustomCategory, TaskStatus, TaskPriority,
  HistoryAction, DEFAULT_CATEGORIES, PROJECT_COLORS, PROJECT_ICONS, generateId
} from './types'
import { TaskRelation } from '../../types/taskRelation'
import {
  observeTaskCreated,
  observeTaskCompleted,
} from '../../insights'

export interface TasksSlice {
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
  setPriorityTask: (taskId: string) => void
  getPriorityTask: () => Task | undefined

  // Custom Categories
  customCategories: CustomCategory[]
  addCategory: (label: string, emoji: string) => string
  updateCategory: (id: string, label: string, emoji: string) => void
  deleteCategory: (id: string) => void
  getAllCategories: () => CustomCategory[]

  // Projects
  projects: Project[]
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => string
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void

  // Task Quota System
  taskQuota: number
  setTaskQuota: (quota: number) => void
  unlockNextTasks: (count: number) => void
  getVisibleTasks: () => Task[]
  getHiddenTasks: () => Task[]

  // Task Relations
  taskRelations: TaskRelation[]
  addTaskRelation: (relation: Omit<TaskRelation, 'id' | 'createdAt'>) => void
  removeTaskRelation: (id: string) => void
  getTaskRelations: (taskId: string) => TaskRelation[]

  // History (undo/redo)
  history: HistoryAction[]
  historyIndex: number
  addToHistory: (action: HistoryAction) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
}

export const createTasksSlice: StateCreator<
  TasksSlice & { addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void },
  [['zustand/persist', unknown]],
  [],
  TasksSlice
> = (set, get) => ({
  // Default tasks
  tasks: [
    { id: '1', title: 'Finaliser le composant Dashboard', completed: false, category: 'dev', createdAt: Date.now() - 86400000, status: 'in-progress', priority: 'high', estimatedTime: 60, projectId: 'proj-1', isVisible: true },
    { id: '2', title: 'Revoir les maquettes UI', completed: false, category: 'design', createdAt: Date.now() - 172800000, status: 'todo', priority: 'medium', estimatedTime: 45, projectId: 'proj-1', isVisible: true },
    { id: '3', title: 'Appel avec l\'équipe produit', completed: true, category: 'work', createdAt: Date.now() - 259200000, status: 'done', priority: 'medium', estimatedTime: 30, projectId: 'proj-3' },
    { id: '4', title: 'Implémenter la recherche globale', completed: false, category: 'dev', createdAt: Date.now() - 43200000, status: 'todo', priority: 'high', estimatedTime: 90, projectId: 'proj-1', isVisible: true },
    { id: '5', title: 'Préparer la présentation client', completed: false, category: 'urgent', createdAt: Date.now() - 21600000, status: 'in-progress', priority: 'urgent', estimatedTime: 120, dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], projectId: 'proj-3', isVisible: true },
  ],

  addTask: (task) => {
    const state = get()
    const visibleCount = state.getVisibleTasks().length
    const quota = state.taskQuota
    const isVisible = visibleCount < quota

    const newTask = { ...task, id: generateId(), createdAt: Date.now(), isVisible }
    set((s) => ({ tasks: [...s.tasks, newTask] }))
    get().addToHistory({ type: 'add', task: newTask })

    observeTaskCreated({
      id: newTask.id,
      title: newTask.title,
      category: newTask.category,
      priority: newTask.priority
    })

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
      set((s) => ({
        tasks: s.tasks.map((t) => t.id === id 
          ? { ...t, completed: !t.completed, completedAt: !t.completed ? Date.now() : undefined } 
          : t
        )
      }))
      get().addToHistory({ type: 'toggle', task, previousState: task.completed })
      get().addToast(wasCompleted ? 'Tâche réouverte' : 'Tâche terminée ✓', 'success')

      if (!wasCompleted) {
        observeTaskCompleted({
          id: task.id,
          title: task.title,
          duration: task.actualTime
        })
        window.dispatchEvent(new CustomEvent('task-completed'))

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
      set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
      get().addToHistory({ type: 'delete', task })
      get().addToast('Tâche supprimée', 'info')
    }
  },

  updateTask: (id, updates) => {
    const task = get().tasks.find(t => t.id === id)
    if (task) {
      set((s) => ({
        tasks: s.tasks.map((t) => t.id === id ? { ...t, ...updates } : t)
      }))
      get().addToHistory({ type: 'update', task, previousState: task })
      get().addToast('Tâche mise à jour', 'success')
    }
  },

  moveTask: (taskId, newStatus) => {
    const task = get().tasks.find(t => t.id === taskId)
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, status: newStatus, completed: newStatus === 'done' } : t
      )
    }))

    if (task && newStatus === 'done') {
      observeTaskCompleted({
        id: task.id,
        title: task.title,
        duration: task.actualTime
      })
      window.dispatchEvent(new CustomEvent('task-completed'))
    }
  },

  addSubtask: (taskId, subtaskTitle) => {
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: [...(t.subtasks || []), { id: generateId(), title: subtaskTitle, completed: false }] }
          : t
      )
    }))
  },

  toggleSubtask: (taskId, subtaskId) => {
    set((s) => ({
      tasks: s.tasks.map((t) =>
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
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: t.subtasks?.filter(st => st.id !== subtaskId) }
          : t
      )
    }))
  },

  setPriorityTask: (taskId) => {
    set((s) => ({
      tasks: s.tasks.map((t) => ({
        ...t,
        isPriority: t.id === taskId
      }))
    }))
  },

  getPriorityTask: () => {
    return get().tasks.find(t => t.isPriority && !t.completed)
  },

  // Custom Categories
  customCategories: [],

  addCategory: (label, emoji) => {
    const newCategory: CustomCategory = {
      id: generateId(),
      label,
      emoji,
      createdAt: Date.now()
    }
    set((s) => ({
      customCategories: [...s.customCategories, newCategory]
    }))
    get().addToast('Catégorie créée', 'success')
    return newCategory.id
  },

  updateCategory: (id, label, emoji) => {
    set((s) => ({
      customCategories: s.customCategories.map((cat) =>
        cat.id === id ? { ...cat, label, emoji } : cat
      )
    }))
    get().addToast('Catégorie mise à jour', 'success')
  },

  deleteCategory: (id) => {
    const tasksWithCategory = get().tasks.filter(t => t.category === id)
    if (tasksWithCategory.length > 0) {
      get().addToast(`Impossible: ${tasksWithCategory.length} tâche(s) utilise(nt) cette catégorie`, 'error')
      return
    }
    set((s) => ({
      customCategories: s.customCategories.filter((cat) => cat.id !== id)
    }))
    get().addToast('Catégorie supprimée', 'success')
  },

  getAllCategories: () => {
    return [...DEFAULT_CATEGORIES, ...get().customCategories]
  },

  // Projects
  projects: [
    { id: 'proj-1', name: 'NewMars', color: '#6366f1', icon: '🚀', createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000 },
    { id: 'proj-2', name: 'Side Project', color: '#10b981', icon: '💡', createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000 },
    { id: 'proj-3', name: 'Freelance', color: '#ec4899', icon: '💼', createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000 },
  ],

  addProject: (project) => {
    const newProject = { ...project, id: generateId(), createdAt: Date.now() }
    set((s) => ({ projects: [...s.projects, newProject] }))
    get().addToast('Projet créé', 'success')
    return newProject.id
  },

  updateProject: (id, updates) => {
    set((s) => ({
      projects: s.projects.map((p) => 
        p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
      )
    }))
  },

  deleteProject: (id) => {
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      tasks: s.tasks.map((t) => t.projectId === id ? { ...t, projectId: undefined } : t)
    }))
    get().addToast('Projet supprimé', 'info')
  },

  // Task Quota System
  taskQuota: 10,
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

    const sortedHidden = [...hiddenTasks].sort((a, b) => {
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1
      if (a.priority !== 'urgent' && b.priority === 'urgent') return 1

      const aOverdue = a.dueDate && new Date(a.dueDate) < new Date() ? 1 : 0
      const bOverdue = b.dueDate && new Date(b.dueDate) < new Date() ? 1 : 0
      if (aOverdue !== bOverdue) return bOverdue - aOverdue

      const now = Date.now()
      const threeDays = 3 * 24 * 60 * 60 * 1000
      const aClose = a.dueDate && (new Date(a.dueDate).getTime() - now) < threeDays ? 1 : 0
      const bClose = b.dueDate && (new Date(b.dueDate).getTime() - now) < threeDays ? 1 : 0
      if (aClose !== bClose) return bClose - aClose

      if (a.dueDate && !b.dueDate) return -1
      if (!a.dueDate && b.dueDate) return 1

      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }

      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })

    const toUnlock = sortedHidden.slice(0, count)
    const unlockedIds = toUnlock.map(t => t.id)

    set((s) => ({
      tasks: s.tasks.map(t =>
        unlockedIds.includes(t.id) ? { ...t, isVisible: true } : t
      )
    }))

    if (toUnlock.length > 0) {
      get().addToast(`🔓 ${toUnlock.length} tâche${toUnlock.length > 1 ? 's' : ''} débloquée${toUnlock.length > 1 ? 's' : ''}`, 'success')
    }
  },

  // Task Relations
  taskRelations: [],

  addTaskRelation: (relation) => {
    const newRelation = { ...relation, id: generateId(), createdAt: Date.now() }
    set((s) => ({ taskRelations: [...s.taskRelations, newRelation] }))
    get().addToast('Relation créée', 'success')
  },

  removeTaskRelation: (id) => {
    set((s) => ({ taskRelations: s.taskRelations.filter((r) => r.id !== id) }))
    get().addToast('Relation supprimée', 'info')
  },

  getTaskRelations: (taskId) => {
    return get().taskRelations.filter(r => r.fromTaskId === taskId || r.toTaskId === taskId)
  },

  // History
  history: [],
  historyIndex: -1,
  canUndo: false,
  canRedo: false,

  addToHistory: (action) => set((s) => ({
    history: [...s.history.slice(0, s.historyIndex + 1), action],
    historyIndex: s.historyIndex + 1
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
})

// Re-export types and constants
export { DEFAULT_CATEGORIES, PROJECT_COLORS, PROJECT_ICONS }
export type { Task, Project, SubTask, CustomCategory, TaskStatus, TaskPriority, HistoryAction }
