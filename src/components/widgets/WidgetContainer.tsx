import { ReactNode, useState, useRef } from 'react'
import { X, GripVertical } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Widget } from '../../types/widgets'

interface WidgetContainerProps {
  // Support both old and new API
  id?: string
  title?: string
  widget?: Widget
  children: ReactNode
  actions?: ReactNode
  currentSize?: 'notification' // Taille unique
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
  'pomodoro': 'Pomodoro',
  'links': 'Liens',
  'ai': 'Assistant IA',
  'quick-actions': 'Actions',
}

export function WidgetContainer({ id, title, widget, children, actions, onClick }: WidgetContainerProps) {
  const { isEditMode, removeWidget, updateWidget, accentTheme } = useStore()
  const [isClicked, setIsClicked] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number } | null>(null)

  // Support both old API (id, title) and new API (widget)
  const widgetId = widget?.id || id || ''
  const widgetTitle = title || (widget?.type ? widgetTitles[widget.type] : '') || ''

  const handleClick = () => {
    if (!isEditMode && onClick) {
      // Trigger pulse animation
      setIsClicked(true)
      setTimeout(() => setIsClicked(false), 600)
      onClick()
    }
  }

  const handleResizeStart = (e: React.MouseEvent) => {
    if (!isEditMode) return
    e.stopPropagation()
    e.preventDefault()
    
    setIsResizing(true)
    const rect = (e.currentTarget as HTMLElement).closest('.widget-container')?.getBoundingClientRect()
    if (rect) {
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startWidth: rect.width,
        startHeight: rect.height
      }
    }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizeRef.current) return
      
      const deltaX = moveEvent.clientX - resizeRef.current.startX
      const deltaY = moveEvent.clientY - resizeRef.current.startY
      
      // Calculate new dimensions based on grid
      const newWidth = resizeRef.current.startWidth + deltaX
      const newHeight = resizeRef.current.startHeight + deltaY
      
      // Map to grid sizes (rough estimation: ~200px per grid unit)
      const gridWidth = Math.max(1, Math.min(3, Math.round(newWidth / 200)))
      const gridHeight = Math.max(1, Math.min(3, Math.round(newHeight / 200)))
      
      // Update dimensions (max 2x2 pour compatibilité avec Widget type)
      const dimensions = {
        width: Math.min(gridWidth, 2) as 1 | 2,
        height: Math.min(gridHeight, 2) as 1 | 2
      }
      
      if (widget?.dimensions?.width !== gridWidth || widget?.dimensions?.height !== gridHeight) {
        updateWidget(widgetId, { dimensions })
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      resizeRef.current = null
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div 
      onClick={handleClick}
      onKeyDown={(e) => {
        if (!isEditMode && onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          handleClick()
        }
      }}
      tabIndex={!isEditMode && onClick ? 0 : -1}
      role={!isEditMode && onClick ? 'button' : undefined}
      aria-label={!isEditMode && onClick ? `Ouvrir ${widgetTitle}` : undefined}
      className={`
        widget-container h-full w-full rounded-3xl p-5 
        glass-widget glass-widget-${accentTheme}
        group relative
        ${!isEditMode && onClick ? 'cursor-pointer' : ''}
        ${isClicked ? 'clicked' : ''}
        ${isResizing ? 'select-none' : ''}
      `}
    >
      {/* Header - Caché si pas de titre */}
      {(widgetTitle || actions || isEditMode) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isEditMode && (
              <div className="cursor-move" title="Glisser pour déplacer">
                <GripVertical className="w-4 h-4 text-zinc-500 hover:text-zinc-300 transition-colors" />
              </div>
            )}
            {widgetTitle && <h3 className="text-sm font-medium text-zinc-300 tracking-tight">{widgetTitle}</h3>}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            {isEditMode && (
              <button
                onClick={(e) => { e.stopPropagation(); removeWidget(widgetId); }}
                className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                title="Supprimer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className={widgetTitle || actions || isEditMode ? "h-[calc(100%-2.5rem)] overflow-auto" : "h-full overflow-auto"}>
        {children}
      </div>

      {/* Resize Handle (bottom-right corner) */}
      {isEditMode && (
        <div
          onMouseDown={handleResizeStart}
          className="absolute bottom-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 cursor-nwse-resize transition-opacity z-10"
          title="Glisser pour redimensionner"
        >
          <div className="absolute bottom-0 right-0 w-full h-full">
            <svg viewBox="0 0 24 24" className="w-full h-full text-zinc-500 hover:text-zinc-300 transition-colors">
              <path
                fill="currentColor"
                d="M22 22H20V20H22V22M22 18H20V16H22V18M18 22H16V20H18V22M18 18H16V16H18V18M14 22H12V20H14V22Z"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}
