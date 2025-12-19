import { StateCreator } from 'zustand'
import { Task, TaskStatus, SubTask, CustomCategory, DEFAULT_CATEGORIES } from '../useStore'

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
  
  // Task Quota System
  taskQuota: number
  setTaskQuota: (quota: number) => void
  unlockNextTasks: (count: number) => void
  getVisibleTasks: () => Task[]
  getHiddenTasks: () => Task[]
}

const generateId = () => Math.random().toString(36).substring(2, 9)

export const createTasksSlice: StateCreator<TasksSlice> = (set, get) => ({
  tasks: [],
  customCategories: [],
  taskQuota: 7,

  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, {
      ...task,
      id: generateId(),
      createdAt: Date.now()
    }]
  })),

  toggleTask: (id) => set((state) => ({
    tasks: state.tasks.map(task =>
      task.id === id
        ? { ...task, completed: !task.completed, status: !task.completed ? 'done' : 'todo' as TaskStatus }
        : task
    )
  })),

  deleteTask: (id) => set((state) => ({
    tasks: state.tasks.filter(task => task.id !== id)
  })),

  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map(task =>
      task.id === id ? { ...task, ...updates } : task
    )
  })),

  moveTask: (taskId, newStatus) => set((state) => ({
    tasks: state.tasks.map(task =>
      task.id === taskId
        ? { ...task, status: newStatus, completed: newStatus === 'done' }
        : task
    )
  })),

  addSubtask: (taskId, subtaskTitle) => set((state) => ({
    tasks: state.tasks.map(task => {
      if (task.id !== taskId) return task
      const newSubtask: SubTask = {
        id: generateId(),
        title: subtaskTitle,
        completed: false
      }
      return {
        ...task,
        subtasks: [...(task.subtasks || []), newSubtask]
      }
    })
  })),

  toggleSubtask: (taskId, subtaskId) => set((state) => ({
    tasks: state.tasks.map(task => {
      if (task.id !== taskId) return task
      return {
        ...task,
        subtasks: task.subtasks?.map(st =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        )
      }
    })
  })),

  deleteSubtask: (taskId, subtaskId) => set((state) => ({
    tasks: state.tasks.map(task => {
      if (task.id !== taskId) return task
      return {
        ...task,
        subtasks: task.subtasks?.filter(st => st.id !== subtaskId)
      }
    })
  })),

  setPriorityTask: (taskId) => set((state) => ({
    tasks: state.tasks.map(task => ({
      ...task,
      isPriority: task.id === taskId
    }))
  })),

  getPriorityTask: () => get().tasks.find(t => t.isPriority && !t.completed),

  addCategory: (label, emoji) => {
    const id = generateId()
    set((state) => ({
      customCategories: [...state.customCategories, { id, label, emoji, createdAt: Date.now() }]
    }))
    return id
  },

  updateCategory: (id, label, emoji) => set((state) => ({
    customCategories: state.customCategories.map(cat =>
      cat.id === id ? { ...cat, label, emoji } : cat
    )
  })),

  deleteCategory: (id) => set((state) => ({
    customCategories: state.customCategories.filter(cat => cat.id !== id)
  })),

  getAllCategories: () => [...DEFAULT_CATEGORIES, ...get().customCategories],

  setTaskQuota: (quota) => set({ taskQuota: quota }),

  unlockNextTasks: (count) => set((state) => {
    const hiddenTasks = state.tasks
      .filter(t => !t.isVisible && !t.completed)
      .sort((a, b) => {
        if (a.priority === 'urgent' && b.priority !== 'urgent') return -1
        if (b.priority === 'urgent' && a.priority !== 'urgent') return 1
        if (a.dueDate && !b.dueDate) return -1
        if (!a.dueDate && b.dueDate) return 1
        if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        return 0
      })
      .slice(0, count)

    return {
      tasks: state.tasks.map(t =>
        hiddenTasks.find(ht => ht.id === t.id) ? { ...t, isVisible: true } : t
      )
    }
  }),

  getVisibleTasks: () => get().tasks.filter(t => t.isVisible !== false),
  getHiddenTasks: () => get().tasks.filter(t => t.isVisible === false && !t.completed)
})
