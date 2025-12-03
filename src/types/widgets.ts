export type WidgetType = 
  | 'tasks' 
  | 'stats' 
  | 'calendar' 
  | 'notes' 
  | 'habits' 
  | 'pomodoro'
  | 'links'
  | 'weather'
  | 'ai'
  | 'quick-actions'
  | 'health'
  | 'journal'
  | 'learning'

// Taille unique pour tous les widgets dans le centre de notifications
export type WidgetSize = 'notification'

export interface WidgetDimensions {
  width: 1  // Toujours 1 colonne
  height: 1 // Toujours 1 ligne
}

export interface WidgetPosition {
  x: number
  y: number
}

export interface Widget {
  id: string
  type: WidgetType
  size: WidgetSize
  dimensions: WidgetDimensions
  position: WidgetPosition
  config?: Record<string, any>
  isLocked?: boolean
}

export interface WidgetLayout {
  id: string
  name: string
  widgets: Widget[]
  gridCols: number
  isActive: boolean
}

export interface WidgetDefinition {
  type: WidgetType
  label: string
  icon: string
  description: string
  defaultSize: WidgetSize
  defaultDimensions: WidgetDimensions
  // Plus besoin de availableSizes, taille unique
}

export interface Habit {
  id: string
  name: string
  streak: number
  completedDates: string[]
}

export interface QuickNote {
  id: string
  content: string
  createdAt: number
}

export interface QuickLink {
  id: string
  label: string
  url: string
  icon?: string
}
