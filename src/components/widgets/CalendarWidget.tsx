import { memo, useMemo } from 'react'
import { Calendar as CalendarIcon, Clock, ArrowRight } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'

interface CalendarWidgetProps {
  widget: Widget
}

export const CalendarWidget = memo(function CalendarWidget({ widget }: CalendarWidgetProps) {
  const { id, size = 'small' } = widget
  const { tasks, events, setView } = useStore()
  
  const today = useMemo(() => new Date(), [])
  const todayStr = useMemo(() => today.toISOString().split('T')[0], [today])
  
  const tasksWithDates = useMemo(() => tasks.filter(t => t.dueDate && !t.completed), [tasks])
  const upcomingEvents = useMemo(() => events.filter(e => !e.completed), [events])
  
  const todayEvents = useMemo(() => {
    return [...tasksWithDates.filter(t => t.dueDate === todayStr), ...upcomingEvents.filter(e => e.startDate === todayStr)]
  }, [tasksWithDates, upcomingEvents, todayStr])

  // Small: Date + nombre d'événements
  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="Calendrier" currentSize={size} onClick={() => setView('calendar')}>
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-1">
            {today.toLocaleDateString('fr-FR', { month: 'long' })}
          </div>
          <div className="text-5xl font-bold text-zinc-200 mb-1">{today.getDate()}</div>
          <div className="text-xs text-zinc-500">
            {today.toLocaleDateString('fr-FR', { weekday: 'long' })}
          </div>
          {todayEvents.length > 0 && (
            <div className="mt-2 px-2 py-0.5 bg-blue-500/20 rounded-full">
              <span className="text-xs text-blue-300 font-medium">{todayEvents.length} événement{todayEvents.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </WidgetContainer>
    )
  }

  const nextDays = useMemo(() => {
    const count = size === 'large' ? 7 : 4
    return Array.from({ length: count }, (_, i) => {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      return date
    })
  }, [today, size])

  // Medium: 4 prochains jours
  if (size === 'medium') {
    return (
      <WidgetContainer 
        id={id} 
        title="Calendrier"
        currentSize={size}
        onClick={() => setView('calendar')}
        actions={
          <button
            onClick={(e) => {
              e.stopPropagation()
              setView('calendar')
            }}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        }
      >
        <div className="space-y-2">
          {nextDays.map((date) => {
            const dateStr = date.toISOString().split('T')[0]
            const dayTasks = tasksWithDates.filter(t => t.dueDate === dateStr)
            const dayEvents = upcomingEvents.filter(e => e.startDate === dateStr)
            const totalItems = dayTasks.length + dayEvents.length
            const isToday = dateStr === todayStr
            
            return (
              <div 
                key={dateStr}
                className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${
                  isToday ? 'bg-blue-500/10' : 'hover:bg-white/5'
                }`}
              >
                <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg ${
                  isToday ? 'bg-blue-500' : 'bg-zinc-800'
                }`}>
                  <div className={`text-lg font-bold ${isToday ? 'text-white' : 'text-zinc-300'}`}>
                    {date.getDate()}
                  </div>
                  <div className={`text-[9px] uppercase ${isToday ? 'text-blue-100' : 'text-zinc-600'}`}>
                    {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-300">
                    {date.toLocaleDateString('fr-FR', { weekday: 'long' })}
                  </div>
                  {totalItems > 0 ? (
                    <div className="text-xs text-zinc-500">
                      {totalItems} événement{totalItems > 1 ? 's' : ''}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-700">Libre</div>
                  )}
                </div>
                
                {totalItems > 0 && (
                  <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-400">{totalItems}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </WidgetContainer>
    )
  }

  // Large: 7 jours + détails
  return (
    <WidgetContainer 
      id={id} 
      title="Cette semaine"
      currentSize={size}
      onClick={() => setView('calendar')}
      actions={
        <button
          onClick={(e) => {
            e.stopPropagation()
            setView('calendar')
          }}
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      }
    >
      <div className="flex flex-col h-full">
        {/* Header avec stats */}
        <div className="flex gap-2 mb-3 pb-3 border-b border-white/5">
          <div className="flex-1 bg-blue-500/10 rounded-lg p-2">
            <div className="text-xl font-bold text-blue-400">{todayEvents.length}</div>
            <div className="text-[10px] text-blue-300/70 uppercase tracking-wide">Aujourd'hui</div>
          </div>
          <div className="flex-1 bg-violet-500/10 rounded-lg p-2">
            <div className="text-xl font-bold text-violet-400">{upcomingEvents.length}</div>
            <div className="text-[10px] text-violet-300/70 uppercase tracking-wide">Événements</div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-2 flex-1 overflow-auto">
          {nextDays.map((date) => {
            const dateStr = date.toISOString().split('T')[0]
            const dayTasks = tasksWithDates.filter(t => t.dueDate === dateStr)
            const dayEvents = upcomingEvents.filter(e => e.startDate === dateStr)
            const isToday = dateStr === todayStr
            
            return (
              <div key={dateStr}>
                <div className={`flex items-center gap-3 p-2 rounded-xl mb-1 ${
                  isToday ? 'bg-blue-500/10' : ''
                }`}>
                  <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 ${
                    isToday ? 'bg-blue-500' : 'bg-zinc-800'
                  }`}>
                    <div className={`text-base font-bold ${isToday ? 'text-white' : 'text-zinc-300'}`}>
                      {date.getDate()}
                    </div>
                    <div className={`text-[8px] uppercase ${isToday ? 'text-blue-100' : 'text-zinc-600'}`}>
                      {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="text-sm font-medium text-zinc-300">
                      {date.toLocaleDateString('fr-FR', { weekday: 'long' })}
                    </div>
                  </div>
                </div>
                
                {/* Events pour ce jour */}
                {dayTasks.slice(0, 2).map((task) => (
                  <div key={task.id} className="flex items-center gap-2 ml-14 mb-1">
                    <Clock className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    <span className="text-xs text-zinc-400 truncate">{task.title}</span>
                  </div>
                ))}
                {dayEvents.slice(0, 1).map((event) => (
                  <div key={event.id} className="flex items-center gap-2 ml-14 mb-1">
                    <CalendarIcon className="w-3 h-3 text-blue-400 flex-shrink-0" />
                    <span className="text-xs text-zinc-400 truncate">{event.title}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </WidgetContainer>
  )
})
