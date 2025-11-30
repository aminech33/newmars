import { ReactNode } from 'react'
import { X, GripVertical, Maximize2, Minimize2 } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Widget } from '../../types/widgets'

interface WidgetContainerProps {
  // Support both old and new API
  id?: string
  title?: string
  widget?: Widget
  children: ReactNode
  actions?: ReactNode
  currentSize?: 'small' | 'medium' | 'large'
  onClick?: () => void
}

const widgetTitles: Record<string, string> = {
  'tasks': 'Tâches',
  'stats': 'Statistiques',
  'calendar': 'Calendrier',
  'health': 'Santé',
  'journal': 'Journal',
  'notes': 'Notes',
  'habits': 'Habitudes',
  'quote': 'Citation',
  'pomodoro': 'Pomodoro',
  'links': 'Liens',
  'ai': 'Assistant IA',
  'quick-actions': 'Actions',
  'projects': 'Projets',
}

export function WidgetContainer({ id, title, widget, children, actions, currentSize, onClick }: WidgetContainerProps) {
  const { isEditMode, removeWidget, updateWidget, accentTheme } = useStore()

  // Support both old API (id, title) and new API (widget)
  const widgetId = widget?.id || id || ''
  const widgetTitle = title || (widget?.type ? widgetTitles[widget.type] : '') || 'Widget'
  const size = currentSize || widget?.size || 'small'

  const toggleSize = () => {
    const sizeMap = {
      small: { size: 'medium' as const, dimensions: { width: 1 as const, height: 1 as const } },
      medium: { size: 'large' as const, dimensions: { width: 2 as const, height: 2 as const } },
      large: { size: 'small' as const, dimensions: { width: 1 as const, height: 1 as const } },
    }
    const newConfig = sizeMap[size]
    updateWidget(widgetId, { size: newConfig.size, dimensions: newConfig.dimensions })
  }

  const gradientColors = {
    indigo: { from: '#5b7fff', to: '#4d6ee6' },
    cyan: { from: '#64d2ff', to: '#50b8e6' },
    emerald: { from: '#30d158', to: '#28b84a' },
    rose: { from: '#ff375f', to: '#e62e51' },
    violet: { from: '#bf5af2', to: '#a64dd9' },
    amber: { from: '#ff9f0a', to: '#e68d09' },
  }

  const gradient = gradientColors[accentTheme] || gradientColors.indigo

  const handleClick = () => {
    if (!isEditMode && onClick) {
      onClick()
    }
  }

  return (
    <div 
      onClick={handleClick}
      className={`
        h-full w-full backdrop-blur-xl bg-zinc-900/30 rounded-3xl p-5 
        hover:bg-zinc-900/40 hover:-translate-y-1 
        shadow-[0_8px_32px_rgba(0,0,0,0.3)] 
        hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)] 
        transition-all duration-300 group breathe gradient-border
        ${!isEditMode && onClick ? 'cursor-pointer' : ''}
      `}
      style={{
        '--bg-color': 'rgb(28 28 30 / 0.3)',
        '--gradient-from': gradient.from + '40',
        '--gradient-to': gradient.to + '40',
      } as React.CSSProperties}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isEditMode && (
            <div className="cursor-move" title="Glisser pour déplacer">
              <GripVertical className="w-4 h-4 text-zinc-700 hover:text-zinc-500 transition-colors" />
            </div>
          )}
          <h3 className="text-sm font-medium text-zinc-400 tracking-tight">{widgetTitle}</h3>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {isEditMode && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); toggleSize(); }}
                className="opacity-0 group-hover:opacity-100 p-1 text-zinc-700 hover:text-zinc-500 transition-all"
                title="Redimensionner"
              >
                {size === 'large' ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); removeWidget(widgetId); }}
                className="opacity-0 group-hover:opacity-100 p-1 text-zinc-700 hover:text-rose-400 transition-all"
                title="Supprimer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="h-[calc(100%-2.5rem)] overflow-hidden">
        {children}
      </div>
    </div>
  )
}
