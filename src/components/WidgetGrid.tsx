import { useState, Suspense, useCallback, memo } from 'react'
import { useStore } from '../store/useStore'
import { Widget } from '../types/widgets'
import { getWidgetDefinition, isValidWidgetType } from '../config/widgetRegistry'
import { WidgetErrorBoundary } from './widgets/WidgetErrorBoundary'
import { WidgetSkeleton } from './widgets/WidgetSkeleton'
import { ConfirmDialog } from './ui/ConfirmDialog'
import { UndoToast } from './ui/UndoToast'

// Memoized widget wrapper for performance
const MemoizedWidget = memo(function MemoizedWidget({ 
  widget, 
  onRemove 
}: { 
  widget: Widget
  onRemove: () => void
}) {
  const definition = getWidgetDefinition(widget.type)
  
  if (!definition) {
    return (
      <div className="h-full w-full rounded-3xl p-5 bg-zinc-900/30 border border-zinc-800/50 flex items-center justify-center">
        <p className="text-xs text-zinc-600">Widget inconnu: {widget.type}</p>
      </div>
    )
  }

  const WidgetComponent = definition.component

  return (
    <WidgetErrorBoundary 
      widgetId={widget.id} 
      widgetTitle={definition.label}
      onRemove={onRemove}
    >
      <Suspense fallback={<WidgetSkeleton />}>
        <WidgetComponent widget={widget} />
      </Suspense>
    </WidgetErrorBoundary>
  )
})

export function WidgetGrid() {
  const { widgets, updateWidget, removeWidget, addWidget, isEditMode, resetWidgets } = useStore()
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Widget | null>(null)
  const [lastDeleted, setLastDeleted] = useState<Widget | null>(null)
  const [showUndo, setShowUndo] = useState(false)

  // Validate and repair corrupted widgets
  const validWidgets = (widgets || []).filter(w => {
    if (!w || !w.id || !w.type) return false
    if (!isValidWidgetType(w.type)) return false
    return true
  }).map(w => ({
    ...w,
    size: w.size || 'small',
    dimensions: w.dimensions || { width: 1, height: 1 },
    position: w.position || { x: 0, y: 0 }
  }))

  // Handlers
  const handleRemoveWidget = useCallback((widget: Widget) => {
    setConfirmDelete(widget)
  }, [])

  const confirmRemoveWidget = useCallback(() => {
    if (!confirmDelete) return
    
    // Save for undo
    setLastDeleted(confirmDelete)
    removeWidget(confirmDelete.id)
    setConfirmDelete(null)
    setShowUndo(true)
    
    // Auto-hide undo after 5s
    setTimeout(() => setShowUndo(false), 5000)
  }, [confirmDelete, removeWidget])

  const handleUndo = useCallback(() => {
    if (!lastDeleted) return
    
    addWidget({
      type: lastDeleted.type as any,
      size: lastDeleted.size,
      dimensions: lastDeleted.dimensions,
      position: lastDeleted.position
    })
    
    setLastDeleted(null)
    setShowUndo(false)
  }, [lastDeleted, addWidget])

  // Drag & Drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, widgetId: string) => {
    if (!isEditMode) return
    setDraggedWidget(widgetId)
    e.dataTransfer.effectAllowed = 'move'
    
    // For accessibility - announce drag start
    const widget = validWidgets.find(w => w.id === widgetId)
    if (widget) {
      const definition = getWidgetDefinition(widget.type)
      const announcement = `Déplacement de ${definition?.label || 'widget'} commencé`
      announceToScreenReader(announcement)
    }
  }, [isEditMode, validWidgets])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!isEditMode || !draggedWidget) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [isEditMode, draggedWidget])

  const handleDrop = useCallback((e: React.DragEvent, targetWidget: Widget) => {
    if (!isEditMode || !draggedWidget) return
    e.preventDefault()

    const draggedW = widgets.find(w => w.id === draggedWidget)
    if (!draggedW || draggedW.id === targetWidget.id) return

    // Swap positions
    updateWidget(draggedWidget, { position: targetWidget.position })
    updateWidget(targetWidget.id, { position: draggedW.position })

    setDraggedWidget(null)
    
    // Announce for accessibility
    const draggedDef = getWidgetDefinition(draggedW.type)
    const targetDef = getWidgetDefinition(targetWidget.type)
    announceToScreenReader(`${draggedDef?.label} déplacé à la position de ${targetDef?.label}`)
  }, [isEditMode, draggedWidget, widgets, updateWidget])

  const handleDragEnd = useCallback(() => {
    setDraggedWidget(null)
  }, [])

  // Keyboard navigation for drag & drop
  const handleKeyDown = useCallback((e: React.KeyboardEvent, widget: Widget, index: number) => {
    if (!isEditMode) return
    
    const sortedWidgets = [...validWidgets].sort((a, b) => {
      if (a.position.y !== b.position.y) return a.position.y - b.position.y
      return a.position.x - b.position.x
    })

    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      const prevWidget = sortedWidgets[index - 1]
      updateWidget(widget.id, { position: prevWidget.position })
      updateWidget(prevWidget.id, { position: widget.position })
    }
    
    if (e.key === 'ArrowRight' && index < sortedWidgets.length - 1) {
      e.preventDefault()
      const nextWidget = sortedWidgets[index + 1]
      updateWidget(widget.id, { position: nextWidget.position })
      updateWidget(nextWidget.id, { position: widget.position })
    }
    
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      handleRemoveWidget(widget)
    }
  }, [isEditMode, validWidgets, updateWidget, handleRemoveWidget])

  // Taille unique : toutes les cellules sont identiques (1x1)
  const getGridStyle = () => {
    return {
      gridColumn: 'span 1',
      gridRow: 'span 1',
    }
  }

  // Sort widgets by position
  const sortedWidgets = [...validWidgets].sort((a, b) => {
    if (a.position.y !== b.position.y) return a.position.y - b.position.y
    return a.position.x - b.position.x
  })

  // Limiter à 8 widgets maximum (2 lignes x 4 colonnes max)
  const displayedWidgets = sortedWidgets.slice(0, 8)

  return (
    <>
      <div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        style={{ gridAutoRows: '350px', gridTemplateRows: 'repeat(2, 350px)' }}
        role="grid"
        aria-label="Grille de widgets"
      >
        {displayedWidgets.map((widget, index) => (
          <div
            key={widget.id}
            style={getGridStyle()}
            draggable={isEditMode}
            onDragStart={(e) => handleDragStart(e, widget.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, widget)}
            onDragEnd={handleDragEnd}
            onKeyDown={(e) => handleKeyDown(e, widget, index)}
            tabIndex={isEditMode ? 0 : -1}
            role="gridcell"
            aria-label={`${getWidgetDefinition(widget.type)?.label || 'Widget'} - ${isEditMode ? 'Appuyez sur les flèches pour déplacer' : ''}`}
            className={`
              ${isEditMode ? 'cursor-move focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-950 rounded-3xl' : ''} 
              ${draggedWidget === widget.id ? 'opacity-50 scale-95' : ''} 
              transition-colors duration-200
            `}
          >
            <MemoizedWidget 
              widget={widget} 
              onRemove={() => handleRemoveWidget(widget)}
            />
          </div>
        ))}
        
        {sortedWidgets.length === 0 && (
          <div className="col-span-full text-center py-16" role="status">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-zinc-500 mb-2">Aucun widget</p>
            <p className="text-zinc-700 text-sm mb-4">Cliquez sur "Personnaliser" pour ajouter des widgets</p>
            <button
              onClick={() => resetWidgets()}
              className="px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-xl hover:bg-indigo-500/30 transition-colors"
            >
              Charger les widgets par défaut
            </button>
          </div>
        )}
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmRemoveWidget}
        title="Supprimer le widget ?"
        message={`Êtes-vous sûr de vouloir supprimer le widget "${getWidgetDefinition(confirmDelete?.type || '')?.label || 'Widget'}" ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="warning"
      />

      {/* Undo Toast */}
      <UndoToast
        message={`Widget "${getWidgetDefinition(lastDeleted?.type || '')?.label}" supprimé`}
        onUndo={handleUndo}
        isVisible={showUndo}
      />
    </>
  )
}

// Helper for screen reader announcements
function announceToScreenReader(message: string) {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', 'polite')
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  document.body.appendChild(announcement)
  setTimeout(() => announcement.remove(), 1000)
}
