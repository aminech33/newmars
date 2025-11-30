import { memo } from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'

interface CalendarWidgetProps {
  widget: Widget
}

export const CalendarWidget = memo(function CalendarWidget({ widget }: CalendarWidgetProps) {
  const { id, size = 'small' } = widget
  const { tasks, events, setView } = useStore()
  
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  
  const tasksWithDates = tasks.filter(t => t.dueDate && !t.completed)

  const upcomingEvents = events.filter(e => !e.completed).length

  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="Calendrier" currentSize={size} onClick={() => setView('calendar')}>
        <div className="flex flex-col items-center justify-center h-full">
          <CalendarIcon className="w-8 h-8 text-zinc-600 mb-2" />
          <p className="text-2xl font-bold text-zinc-200">{today.getDate()}</p>
          <p className="text-xs text-zinc-600">{upcomingEvents} événements</p>
        </div>
      </WidgetContainer>
    )
  }

  const getNextDays = (count: number) => {
    return Array.from({ length: count }, (_, i) => {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      return date
    })
  }

  const days = getNextDays(size === 'large' ? 7 : 3)

  return (
    <WidgetContainer id={id} title="Cette semaine" currentSize={size} onClick={() => setView('calendar')}>
      <div className="space-y-3 overflow-auto h-full">
        {days.map((date) => {
          const dateStr = date.toISOString().split('T')[0]
          const dayTasks = tasksWithDates.filter(t => t.dueDate === dateStr)
          const isToday = dateStr === todayStr
          
          return (
            <div key={dateStr} className={`pb-2 border-b border-zinc-900 ${isToday ? 'border-indigo-500/30' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs ${isToday ? 'text-indigo-400' : 'text-zinc-600'}`}>
                  {date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-xs text-zinc-700">{dayTasks.length}</span>
                )}
              </div>
              {dayTasks.length > 0 && (
                <div className="space-y-1">
                  {dayTasks.slice(0, 2).map((task) => (
                    <p key={task.id} className="text-xs text-zinc-500 truncate">• {task.title}</p>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        
        {tasksWithDates.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-4">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-zinc-400 text-sm font-medium mb-1">Aucune échéance</p>
            <p className="text-zinc-700 text-xs">Tout est sous contrôle</p>
          </div>
        )}
      </div>
    </WidgetContainer>
  )
})
