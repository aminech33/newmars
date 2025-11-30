import { lazy, ComponentType } from 'react'
import { CheckSquare, BarChart3, Calendar, BookOpen, Flame, Timer, ExternalLink, Sparkles, Zap, Heart, Book, GraduationCap } from 'lucide-react'
import { Widget } from '../types/widgets'

// Lazy load all widgets for better performance
const TasksWidget = lazy(() => import('../components/widgets/TasksWidget').then(m => ({ default: m.TasksWidget })))
const StatsWidget = lazy(() => import('../components/widgets/StatsWidget').then(m => ({ default: m.StatsWidget })))
const HabitsWidget = lazy(() => import('../components/widgets/HabitsWidget').then(m => ({ default: m.HabitsWidget })))
const NotesWidget = lazy(() => import('../components/widgets/NotesWidget').then(m => ({ default: m.NotesWidget })))
const CalendarWidget = lazy(() => import('../components/widgets/CalendarWidget').then(m => ({ default: m.CalendarWidget })))
const PomodoroWidget = lazy(() => import('../components/widgets/PomodoroWidget').then(m => ({ default: m.PomodoroWidget })))
const LinksWidget = lazy(() => import('../components/widgets/LinksWidget').then(m => ({ default: m.LinksWidget })))
const AIWidget = lazy(() => import('../components/widgets/AIWidget').then(m => ({ default: m.AIWidget })))
const QuickActionsWidget = lazy(() => import('../components/widgets/QuickActionsWidget').then(m => ({ default: m.QuickActionsWidget })))
const HealthWidget = lazy(() => import('../components/widgets/HealthWidget').then(m => ({ default: m.HealthWidget })))
const JournalWidget = lazy(() => import('../components/widgets/JournalWidget').then(m => ({ default: m.JournalWidget })))
const LearningWidget = lazy(() => import('../components/widgets/LearningWidget').then(m => ({ default: m.LearningWidget })))

export interface WidgetDefinition {
  type: string
  label: string
  description: string
  icon: ComponentType<{ className?: string }>
  component: ComponentType<{ widget: Widget }>
  category: 'productivity' | 'tracking' | 'tools' | 'wellness'
  defaultSize: 'small' | 'medium' | 'large'
}

export const widgetRegistry: Record<string, WidgetDefinition> = {
  tasks: {
    type: 'tasks',
    label: 'Tâches',
    description: 'Liste de vos tâches en cours',
    icon: CheckSquare,
    component: TasksWidget,
    category: 'productivity',
    defaultSize: 'medium'
  },
  stats: {
    type: 'stats',
    label: 'Statistiques',
    description: 'Vos stats de productivité',
    icon: BarChart3,
    component: StatsWidget,
    category: 'tracking',
    defaultSize: 'medium'
  },
  calendar: {
    type: 'calendar',
    label: 'Calendrier',
    description: 'Échéances à venir',
    icon: Calendar,
    component: CalendarWidget,
    category: 'productivity',
    defaultSize: 'medium'
  },
  health: {
    type: 'health',
    label: 'Santé',
    description: 'Poids, nutrition & calories',
    icon: Heart,
    component: HealthWidget,
    category: 'wellness',
    defaultSize: 'small'
  },
  journal: {
    type: 'journal',
    label: 'Journal',
    description: 'Réflexion quotidienne',
    icon: Book,
    component: JournalWidget,
    category: 'wellness',
    defaultSize: 'medium'
  },
  notes: {
    type: 'notes',
    label: 'Notes',
    description: 'Notes rapides',
    icon: BookOpen,
    component: NotesWidget,
    category: 'tools',
    defaultSize: 'medium'
  },
  habits: {
    type: 'habits',
    label: 'Habitudes',
    description: "Suivi d'habitudes quotidiennes",
    icon: Flame,
    component: HabitsWidget,
    category: 'tracking',
    defaultSize: 'medium'
  },
  pomodoro: {
    type: 'pomodoro',
    label: 'Pomodoro',
    description: 'Timer de focus 25min',
    icon: Timer,
    component: PomodoroWidget,
    category: 'productivity',
    defaultSize: 'small'
  },
  links: {
    type: 'links',
    label: 'Liens',
    description: 'Liens rapides favoris',
    icon: ExternalLink,
    component: LinksWidget,
    category: 'tools',
    defaultSize: 'small'
  },
  ai: {
    type: 'ai',
    label: 'Assistant IA',
    description: "Accès rapide à l'IA",
    icon: Sparkles,
    component: AIWidget,
    category: 'tools',
    defaultSize: 'small'
  },
  'quick-actions': {
    type: 'quick-actions',
    label: 'Actions Rapides',
    description: 'Raccourcis essentiels',
    icon: Zap,
    component: QuickActionsWidget,
    category: 'tools',
    defaultSize: 'small'
  },
  learning: {
    type: 'learning',
    label: 'Apprentissage',
    description: 'Apprends avec un tuteur IA',
    icon: GraduationCap,
    component: LearningWidget,
    category: 'productivity',
    defaultSize: 'medium'
  }
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

