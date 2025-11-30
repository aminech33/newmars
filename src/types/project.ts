// Types pour le système de projets

export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived'

export interface Project {
  id: string
  name: string
  description?: string
  color: string // Hex color
  icon?: string // Emoji or icon name
  status: ProjectStatus
  goal?: string
  deadline?: string // YYYY-MM-DD
  createdAt: number
  updatedAt: number
  isFavorite?: boolean
  
  // Stats (computed)
  tasksCount?: number
  completedTasksCount?: number
  progress?: number // 0-100
  estimatedHours?: number
  actualHours?: number
}

export interface ProjectTemplate {
  id: string
  name: string
  description: string
  icon: string
  color: string
  defaultTasks: Array<{
    title: string
    description?: string
    category?: string
    priority?: string
    estimatedMinutes?: number
  }>
}

export interface ProjectStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalTasks: number
  completedTasks: number
  averageProgress: number
  projectsOnTrack: number
  projectsAtRisk: number
}


export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived'

export interface Project {
  id: string
  name: string
  description?: string
  color: string // Hex color
  icon?: string // Emoji or icon name
  status: ProjectStatus
  goal?: string
  deadline?: string // YYYY-MM-DD
  createdAt: number
  updatedAt: number
  isFavorite?: boolean
  
  // Stats (computed)
  tasksCount?: number
  completedTasksCount?: number
  progress?: number // 0-100
  estimatedHours?: number
  actualHours?: number
}

export interface ProjectTemplate {
  id: string
  name: string
  description: string
  icon: string
  color: string
  defaultTasks: Array<{
    title: string
    description?: string
    category?: string
    priority?: string
    estimatedMinutes?: number
  }>
}

export interface ProjectStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalTasks: number
  completedTasks: number
  averageProgress: number
  projectsOnTrack: number
  projectsAtRisk: number
}


