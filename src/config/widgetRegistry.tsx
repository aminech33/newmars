import { lazy, ComponentType } from 'react'
import { CheckSquare, Flame, Timer, Heart, Book, GraduationCap, Library } from 'lucide-react'
import { Widget } from '../types/widgets'

// Lazy load all widgets for better performance
const TasksWidget = lazy(() => import('../components/widgets/TasksWidget').then(m => ({ default: m.TasksWidget })))
const HabitsWidget = lazy(() => import('../components/widgets/HabitsWidget').then(m => ({ default: m.HabitsWidget })))
const PomodoroWidget = lazy(() => import('../components/widgets/PomodoroWidget').then(m => ({ default: m.PomodoroWidget })))
const HealthWidget = lazy(() => import('../components/widgets/HealthWidget').then(m => ({ default: m.HealthWidget })))
const JournalWidget = lazy(() => import('../components/widgets/JournalWidget').then(m => ({ default: m.JournalWidget })))
const LearningWidget = lazy(() => import('../components/widgets/LearningWidget').then(m => ({ default: m.LearningWidget })))
const LibraryWidget = lazy(() => import('../components/widgets/LibraryWidget').then(m => ({ default: m.LibraryWidget })))

export interface WidgetDefinition {
  type: string
  label: string
  description: string
  icon: ComponentType<{ className?: string }>
  component: ComponentType<{ widget: Widget }>
  category: 'productivity' | 'tracking' | 'tools' | 'wellness'
  defaultSize: 'notification' // Taille unique
}

export const widgetRegistry: Record<string, WidgetDefinition> = {
  tasks: {
    type: 'tasks',
    label: 'Tâches',
    description: 'Liste de vos tâches en cours',
    icon: CheckSquare,
    component: TasksWidget,
    category: 'productivity',
    defaultSize: 'notification'
  },
  health: {
    type: 'health',
    label: 'Santé',
    description: 'Poids, nutrition & calories',
    icon: Heart,
    component: HealthWidget,
    category: 'wellness',
    defaultSize: 'notification'
  },
  journal: {
    type: 'journal',
    label: 'Journal',
    description: 'Réflexion quotidienne → Ma Journée',
    icon: Book,
    component: JournalWidget,
    category: 'wellness',
    defaultSize: 'notification'
  },
  habits: {
    type: 'habits',
    label: 'Habitudes',
    description: "Suivi d'habitudes → Ma Journée",
    icon: Flame,
    component: HabitsWidget,
    category: 'tracking',
    defaultSize: 'notification'
  },
  pomodoro: {
    type: 'pomodoro',
    label: 'Pomodoro',
    description: 'Timer & time tracking avancé',
    icon: Timer,
    component: PomodoroWidget,
    category: 'productivity',
    defaultSize: 'notification'
  },
  learning: {
    type: 'learning',
    label: 'Apprentissage',
    description: 'Apprends avec un tuteur IA',
    icon: GraduationCap,
    component: LearningWidget,
    category: 'productivity',
    defaultSize: 'notification'
  },
  library: {
    type: 'library',
    label: 'Bibliothèque',
    description: 'Tes lectures littéraires',
    icon: Library,
    component: LibraryWidget,
    category: 'wellness',
    defaultSize: 'notification'
  },
}

// Helper functions
export const getWidgetDefinition = (type: string): WidgetDefinition | undefined => {
  return widgetRegistry[type]
}

export const getWidgetsByCategory = (category: WidgetDefinition['category']): WidgetDefinition[] => {
  return Object.values(widgetRegistry).filter(w => w.category === category)
}

export const getAllWidgetTypes = (): string[] => {
  return Object.keys(widgetRegistry)
}

export const isValidWidgetType = (type: string): boolean => {
  return type in widgetRegistry
}

// Categories for UI
export const widgetCategories = [
  { id: 'productivity', label: 'Productivité', icon: '🎯' },
  { id: 'tracking', label: 'Suivi', icon: '📊' },
  { id: 'tools', label: 'Outils', icon: '🛠️' },
  { id: 'wellness', label: 'Bien-être', icon: '💚' }
] as const

