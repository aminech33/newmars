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

  // Prochains 3 événements
  const nextEvents = useMemo(() => {
    const allItems = [
      ...tasksWithDates.map(t => ({ 
        id: t.id, 
        title: t.title, 
        date: t.dueDate || '',
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
      .filter(item => item.date && item.date >= todayStr)
      .sort((a, b) => {
        const dateCompare = (a.date || '').localeCompare(b.date || '')
        if (dateCompare !== 0) return dateCompare
        if ('time' in a && a.time && !('time' in b && b.time)) return -1
        if (!('time' in a && a.time) && 'time' in b && b.time) return 1
        return 0
      })
      .slice(0, 3)
  }, [tasksWithDates, upcomingEvents, todayStr])

  // Mini calendrier - 7 jours
  const weekDays = useMemo(() => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      const hasTasksOnDate = tasksWithDates.some(t => t.dueDate === dateStr)
      const hasEventsOnDate = upcomingEvents.some(e => e.startDate === dateStr)
      days.push({
        day: date.getDate(),
        name: date.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 1).toUpperCase(),
        isToday: i === 0,
        hasEvents: hasTasksOnDate || hasEventsOnDate
      })
    }
    return days
  }, [today, tasksWithDates, upcomingEvents])

  return (
    <WidgetContainer id={id} title="" currentSize="notification" onClick={() => setView('calendar')}>
      <div className="h-full flex flex-col p-5 gap-2.5">
        {/* Header compact avec date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-cyan-400 hover-glow" strokeWidth={1.5} />
            <div className="text-3xl font-bold text-white tabular-nums leading-none font-mono-display number-glow">
              {today.getDate()}
            </div>
            <div className="text-[10px] text-cyan-400/80 uppercase tracking-wider font-semibold">
              {today.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}
            </div>
          </div>
          <div className="text-[10px] text-zinc-600 uppercase">
            {today.toLocaleDateString('fr-FR', { weekday: 'long' })}
          </div>
        </div>

        {/* Mini calendrier 7 jours */}
        <div className="flex gap-1 justify-between">
          {weekDays.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div className="text-[9px] text-zinc-600 font-medium mb-1">{day.name}</div>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold transition-colors hover:scale-110
                              ${day.isToday 
                                ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/40' 
                                : day.hasEvents
                                ? 'bg-white/10 text-zinc-300 hover:bg-white/15'
                                : 'text-zinc-600 hover:text-zinc-400'
                              }`}>
                {day.day}
              </div>
              {day.hasEvents && !day.isToday && (
                <div className="w-1 h-1 rounded-full bg-blue-400 mt-1" />
              )}
            </div>
          ))}
        </div>

        {/* Événements à venir */}
        <div className="flex-1 space-y-1.5 overflow-hidden">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            À venir
          </div>
          {nextEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center h-full">
              <Clock className="w-8 h-8 text-zinc-600 mb-2" />
              <span className="text-xs text-zinc-500">Aucun événement</span>
            </div>
          ) : (
            nextEvents.map((item) => {
              const isToday = item.date === todayStr
              const itemDate = new Date(item.date)
              
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-2 p-2 rounded-lg gradient-border-cyan hover:scale-[1.02] transition-colors"
                >
                  <Clock className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-zinc-300 truncate font-medium">
                      {item.title}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
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

        {/* Footer - Event count */}
        {todayEvents.length > 0 && (
          <div className="text-center pt-2 border-t border-white/10">
            <span className="text-[10px] text-blue-400 font-semibold">
              {todayEvents.length} événement{todayEvents.length > 1 ? 's' : ''} aujourd'hui
            </span>
          </div>
        )}
      </div>
    </WidgetContainer>
  )
})
