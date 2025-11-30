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
  const { widgets, updateWidget, isEditMode } = useStore()
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null)

  const renderWidget = (widget: Widget) => {
    const props = { id: widget.id, size: widget.size }
    
    switch (widget.type) {
      case 'tasks':
        return <TasksWidget {...props} />
      case 'stats':
        return <StatsWidget {...props} />
      case 'habits':
        return <HabitsWidget {...props} />
      case 'notes':
        return <NotesWidget {...props} />
      case 'quote':
        return <QuoteWidget {...props} />
      case 'calendar':
        return <CalendarWidget {...props} />
      case 'pomodoro':
        return <PomodoroWidget {...props} />
      case 'links':
        return <LinksWidget {...props} />
      case 'ai':
        return <AIWidget {...props} />
      case 'quick-actions':
        return <QuickActionsWidget {...props} />
      case 'health':
        return <HealthWidget {...props} />
      case 'journal':
        return <JournalWidget {...props} />
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
    const { width, height } = widget.dimensions
    return {
      gridColumn: `span ${width}`,
      gridRow: `span ${height}`,
      minHeight: height === 1 ? '160px' : '340px',
    }
  }

  // Sort widgets by position for consistent layout
  const sortedWidgets = [...widgets].sort((a, b) => {
    if (a.position.y !== b.position.y) return a.position.y - b.position.y
    return a.position.x - b.position.x
  })

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 auto-rows-min">
      {sortedWidgets.map((widget, index) => (
        <div
          key={widget.id}
          style={{
            ...getGridStyle(widget),
            animation: 'staggerFadeIn 0.4s ease-out forwards',
            animationDelay: `${index * 50}ms`,
            opacity: 0,
          }}
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
        </div>
      )}
    </div>
  )
}
