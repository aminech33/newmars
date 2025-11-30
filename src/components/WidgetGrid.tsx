import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Widget } from '../types/widgets'
import { TasksWidget } from './widgets/TasksWidget'
import { StatsWidget } from './widgets/StatsWidget'
import { HabitsWidget } from './widgets/HabitsWidget'
import { NotesWidget } from './widgets/NotesWidget'
import { QuoteWidget } from './widgets/QuoteWidget'
import { CalendarWidget } from './widgets/CalendarWidget'
import { PomodoroWidget } from './widgets/PomodoroWidget'
import { LinksWidget } from './widgets/LinksWidget'
import { AIWidget } from './widgets/AIWidget'
import { QuickActionsWidget } from './widgets/QuickActionsWidget'
import { HealthWidget } from './widgets/HealthWidget'
import { JournalWidget } from './widgets/JournalWidget'

export function WidgetGrid() {
  const { widgets, updateWidget, isEditMode, resetWidgets } = useStore()
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null)

  // Debug: afficher les widgets dans la console
  console.log('📦 Widgets actuels:', widgets)

  // Vérifier et réparer les widgets corrompus
  const validWidgets = (widgets || []).filter(w => {
    if (!w || !w.id || !w.type) {
      console.log('❌ Widget invalide:', w)
      return false
    }
    return true
  }).map(w => ({
    ...w,
    size: w.size || 'small',
    dimensions: w.dimensions || { width: 1, height: 1 },
    position: w.position || { x: 0, y: 0 }
  }))

  console.log('✅ Widgets valides:', validWidgets.length)

  const renderWidget = (widget: Widget) => {
    // Passer le widget complet à tous les composants
    const widgetProps = { widget }
    
    switch (widget.type) {
      case 'tasks':
        return <TasksWidget {...widgetProps} />
      case 'stats':
        return <StatsWidget {...widgetProps} />
      case 'habits':
        return <HabitsWidget {...widgetProps} />
      case 'notes':
        return <NotesWidget {...widgetProps} />
      case 'quote':
        return <QuoteWidget {...widgetProps} />
      case 'calendar':
        return <CalendarWidget {...widgetProps} />
      case 'pomodoro':
        return <PomodoroWidget {...widgetProps} />
      case 'links':
        return <LinksWidget {...widgetProps} />
      case 'ai':
        return <AIWidget {...widgetProps} />
      case 'quick-actions':
        return <QuickActionsWidget {...widgetProps} />
      case 'health':
        return <HealthWidget {...widgetProps} />
      case 'journal':
        return <JournalWidget {...widgetProps} />
      default:
        return null
    }
  }

  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    if (!isEditMode) return
    setDraggedWidget(widgetId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (!isEditMode || !draggedWidget) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetWidget: Widget) => {
    if (!isEditMode || !draggedWidget) return
    e.preventDefault()

    const draggedW = widgets.find(w => w.id === draggedWidget)
    if (!draggedW || draggedW.id === targetWidget.id) return

    // Swap positions
    updateWidget(draggedWidget, { position: targetWidget.position })
    updateWidget(targetWidget.id, { position: draggedW.position })

    setDraggedWidget(null)
  }

  const getGridStyle = (widget: Widget) => {
    const dimensions = widget.dimensions || { width: 1, height: 1 }
    const { width, height } = dimensions
    return {
      gridColumn: `span ${width || 1}`,
      gridRow: `span ${height || 1}`,
      minHeight: (height || 1) === 1 ? '160px' : '340px',
    }
  }

  // Sort widgets by position for consistent layout
  const sortedWidgets = [...validWidgets].sort((a, b) => {
    if (a.position.y !== b.position.y) return a.position.y - b.position.y
    return a.position.x - b.position.x
  })

  // Debug
  console.log('🎨 Rendering WidgetGrid with', sortedWidgets.length, 'widgets')

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 auto-rows-min">
      {sortedWidgets.map((widget) => (
        <div
          key={widget.id}
          style={getGridStyle(widget)}
          draggable={isEditMode}
          onDragStart={(e) => handleDragStart(e, widget.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, widget)}
          className={`${isEditMode ? 'cursor-move' : ''} ${
            draggedWidget === widget.id ? 'opacity-50 scale-95' : ''
          } transition-all duration-200`}
        >
          {renderWidget(widget)}
        </div>
      ))}
      
      {sortedWidgets.length === 0 && (
        <div className="col-span-full text-center py-16">
          <p className="text-zinc-600 mb-4">Aucun widget</p>
          <p className="text-zinc-700 text-sm">Cliquez sur "Personnaliser" pour ajouter des widgets</p>
          <button
            onClick={() => resetWidgets()}
            className="mt-4 px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-xl hover:bg-indigo-500/30 transition-all"
          >
            Charger les widgets par défaut
          </button>
        </div>
      )}
    </div>
  )
}
