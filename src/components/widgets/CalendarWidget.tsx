import { memo, useMemo } from 'react'
import { Clock, Calendar } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'

interface CalendarWidgetProps {
  widget: Widget
}

export const CalendarWidget = memo(function CalendarWidget({ widget }: CalendarWidgetProps) {
  const { id } = widget
  const { tasks, events, setView } = useStore()
  
  const today = useMemo(() => new Date(), [])
  const todayStr = useMemo(() => today.toISOString().split('T')[0], [today])
  
  const tasksWithDates = useMemo(() => tasks.filter(t => t.dueDate && !t.completed), [tasks])
  const upcomingEvents = useMemo(() => events.filter(e => !e.completed), [events])
  
  const todayEvents = useMemo(() => {
    return [...tasksWithDates.filter(t => t.dueDate === todayStr), ...upcomingEvents.filter(e => e.startDate === todayStr)]
  }, [tasksWithDates, upcomingEvents, todayStr])

  // Prochains événements (limité à 3)
  const nextEvents = useMemo(() => {
    const allItems = [
      ...tasksWithDates.map(t => ({ 
        id: t.id, 
        title: t.title, 
        date: t.dueDate,
        type: 'task' as const 
      })),
      ...upcomingEvents.map(e => ({ 
        id: e.id, 
        title: e.title, 
        date: e.startDate,
        time: e.startTime,
        type: 'event' as const 
      }))
    ]
    
    return allItems
      .filter(item => item.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3)
  }, [tasksWithDates, upcomingEvents, todayStr])

  return (
    <WidgetContainer id={id} title="" currentSize="notification" onClick={() => setView('calendar')}>
      <div className="h-full flex flex-col p-6 gap-4">
        {/* Header with icon */}
        <div className="flex items-center justify-center mb-2">
          <div>
            <Calendar className="w-10 h-10 text-blue-400" strokeWidth={1.5} />
          </div>
        </div>

        {/* Month */}
        <div className="text-center">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">
            {today.toLocaleDateString('fr-FR', { month: 'long' }).toUpperCase()}
          </div>
          
          {/* Big Date */}
          <div className="text-6xl font-bold text-white tabular-nums leading-none mb-2">
            {today.getDate()}
          </div>
          
          {/* Weekday */}
          <div className="text-sm text-zinc-400 capitalize font-medium">
            {today.toLocaleDateString('fr-FR', { weekday: 'long' })}
          </div>
        </div>

        {/* Events List */}
        <div className="flex-1 space-y-2 overflow-hidden">
          {nextEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-zinc-500 text-sm py-4">
              <Clock className="w-8 h-8 text-zinc-600 mb-2" />
              <span>Aucun événement</span>
            </div>
          ) : (
            nextEvents.map((item) => {
              const isToday = item.date === todayStr
              const itemDate = new Date(item.date)
              
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/8 transition-colors"
                >
                  <Clock className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-zinc-300 truncate">
                      {item.title}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {isToday ? "Aujourd'hui" : itemDate.toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                      {'time' in item && item.time && ` • ${item.time}`}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Event count badge */}
        {todayEvents.length > 0 && (
          <div className="text-center pt-2 border-t border-white/10">
            <span className="text-xs text-blue-400 font-medium">
              {todayEvents.length} événement{todayEvents.length > 1 ? 's' : ''} aujourd'hui
            </span>
          </div>
        )}
      </div>
    </WidgetContainer>
  )
})
