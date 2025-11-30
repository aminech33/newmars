export type WidgetType = 
  | 'tasks' 
  | 'stats' 
  | 'calendar' 
  | 'notes' 
  | 'habits' 
  | 'quote'
  | 'pomodoro'
  | 'links'
  | 'weather'
  | 'ai'
  | 'quick-actions'
  | 'health'
  | 'journal'

export type WidgetSize = 'small' | 'medium' | 'large'

export interface WidgetDimensions {
  width: 1 | 2 | 3
  height: 1 | 2
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
  availableSizes: WidgetSize[]
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


  | 'stats' 
  | 'calendar' 
  | 'notes' 
  | 'habits' 
  | 'quote'
  | 'pomodoro'
  | 'links'
  | 'weather'
  | 'ai'
  | 'quick-actions'
  | 'health'
  | 'journal'

export type WidgetSize = 'small' | 'medium' | 'large'

export interface WidgetDimensions {
  width: 1 | 2 | 3
  height: 1 | 2
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
  availableSizes: WidgetSize[]
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

