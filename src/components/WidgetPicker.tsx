import { X, CheckSquare, BarChart3, Calendar, BookOpen, Flame, MessageSquare, Timer, ExternalLink, Sparkles, Zap, Heart, Book } from 'lucide-react'
import { useStore } from '../store/useStore'
import { WidgetType } from '../types/widgets'

interface WidgetPickerProps {
  isOpen: boolean
  onClose: () => void
}

const widgetDefinitions = [
  { type: 'tasks' as WidgetType, label: 'Tâches', icon: CheckSquare, description: 'Liste de vos tâches' },
  { type: 'stats' as WidgetType, label: 'Statistiques', icon: BarChart3, description: 'Vos stats de productivité' },
  { type: 'calendar' as WidgetType, label: 'Calendrier', icon: Calendar, description: 'Échéances à venir' },
  { type: 'health' as WidgetType, label: 'Santé', icon: Heart, description: 'Poids, nutrition & calories' },
  { type: 'journal' as WidgetType, label: 'Journal', icon: Book, description: 'Réflexion quotidienne' },
  { type: 'notes' as WidgetType, label: 'Notes', icon: BookOpen, description: 'Notes rapides' },
  { type: 'habits' as WidgetType, label: 'Habitudes', icon: Flame, description: 'Suivi d\'habitudes' },
  { type: 'quote' as WidgetType, label: 'Citation', icon: MessageSquare, description: 'Citation inspirante' },
  { type: 'pomodoro' as WidgetType, label: 'Pomodoro', icon: Timer, description: 'Timer de focus' },
  { type: 'links' as WidgetType, label: 'Liens', icon: ExternalLink, description: 'Liens rapides' },
  { type: 'ai' as WidgetType, label: 'Assistant IA', icon: Sparkles, description: 'Accès rapide à l\'IA' },
  { type: 'quick-actions' as WidgetType, label: 'Actions Rapides', icon: Zap, description: 'Raccourcis essentiels' },
]

export function WidgetPicker({ isOpen, onClose }: WidgetPickerProps) {
  const { addWidget, widgets } = useStore()

  const handleAddWidget = (type: WidgetType) => {
    // Find next available position
    const maxY = Math.max(0, ...widgets.map(w => w.position.y + w.dimensions.height))
    
    addWidget({
      type,
      size: 'medium',
      dimensions: { width: 1, height: 1 },
      position: { x: 0, y: maxY }
    })
    
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-mars-surface rounded-3xl shadow-[0_16px_64px_rgba(0,0,0,0.5)] overflow-hidden animate-scale-in backdrop-blur-xl"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900">
          <div>
            <h2 className="text-lg font-medium text-zinc-200">Ajouter un widget</h2>
            <p className="text-xs text-zinc-600 mt-1">Choisissez un widget à ajouter à votre hub</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-600 hover:text-zinc-400 transition-all duration-300 rounded-xl hover:bg-zinc-800/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Widget Grid */}
        <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-auto">
          {widgetDefinitions.map((widget) => {
            const Icon = widget.icon
            return (
              <button
                key={widget.type}
                onClick={() => handleAddWidget(widget.type)}
                className="p-4 text-left bg-zinc-900/50 rounded-2xl hover:bg-zinc-900 shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)] transition-all duration-300 group"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Icon className="w-6 h-6 text-zinc-600 group-hover:text-zinc-500 mb-3" />
                <h3 className="text-sm font-medium text-zinc-300 mb-1">{widget.label}</h3>
                <p className="text-xs text-zinc-600">{widget.description}</p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
