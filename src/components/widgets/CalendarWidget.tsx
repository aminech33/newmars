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

  // Small: JUST TODAY - Big date + event count (Apple style)
  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="" currentSize={size} onClick={() => setView('calendar')}>
        <div className="h-full flex flex-col items-center justify-center gap-2 p-4">
          {/* Month name - subtle */}
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
            {today.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}
          </div>
          
          {/* BIG DATE - Apple style */}
          <div className="text-7xl font-bold text-white tabular-nums leading-none">
            {today.getDate()}
          </div>
          
          {/* Weekday */}
          <div className="text-xs text-zinc-400 capitalize font-medium">
            {today.toLocaleDateString('fr-FR', { weekday: 'long' })}
          </div>
          
          {/* Event count badge - only if events exist */}
          {todayEvents.length > 0 && (
            <div className="mt-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/10">
              <span className="text-xs text-white font-medium">
                {todayEvents.length} événement{todayEvents.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </WidgetContainer>
    )
  }

  const nextDays = useMemo(() => {
    const count = size === 'large' ? 7 : 3
    return Array.from({ length: count }, (_, i) => {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      return date
    })
  }, [today, size])

  // Medium: Today + next 2 days with events
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
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        }
      >
        <div className="h-full flex flex-col gap-3">
          {/* Today's events summary */}
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20">
              <CalendarIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white">Aujourd'hui</div>
              <div className="text-xs text-zinc-400">
                {todayEvents.length > 0 
                  ? `${todayEvents.length} événement${todayEvents.length > 1 ? 's' : ''}`
                  : 'Aucun événement'
                }
              </div>
            </div>
            {todayEvents.length > 0 && (
              <div className="flex items-center justify-center w-7 h-7 bg-blue-500/20 rounded-full">
                <span className="text-xs font-bold text-blue-400">{todayEvents.length}</span>
              </div>
            )}
          </div>

          {/* Next 3 days */}
          <div className="flex-1 space-y-2 overflow-hidden">
            {nextDays.map((date) => {
              const dateStr = date.toISOString().split('T')[0]
              const dayTasks = tasksWithDates.filter(t => t.dueDate === dateStr)
              const dayEvents = upcomingEvents.filter(e => e.startDate === dateStr)
              const totalItems = dayTasks.length + dayEvents.length
              const isToday = dateStr === todayStr
              
              return (
                <div 
                  key={dateStr}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  {/* Date badge */}
                  <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg ${
                    isToday 
                      ? 'bg-white/10 border border-white/20' 
                      : 'bg-white/5'
                  }`}>
                    <div className="text-sm font-bold text-white tabular-nums">
                      {date.getDate()}
                    </div>
                    <div className="text-[8px] uppercase text-zinc-500">
                      {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                    </div>
                  </div>
                  
                  {/* Day info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-zinc-300 capitalize">
                      {date.toLocaleDateString('fr-FR', { weekday: 'long' })}
                    </div>
                    {totalItems > 0 ? (
                      <div className="text-[10px] text-zinc-500">
                        {totalItems} événement{totalItems > 1 ? 's' : ''}
                      </div>
                    ) : (
                      <div className="text-[10px] text-zinc-600">Libre</div>
                    )}
                  </div>
                  
                  {/* Event count */}
                  {totalItems > 0 && (
                    <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <span className="text-[10px] font-bold text-blue-400">{totalItems}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </WidgetContainer>
    )
  }

  // Large: Full week view with event details
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
          className="text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      }
    >
      <div className="h-full flex flex-col gap-3">
        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-2xl font-bold text-white tabular-nums">{todayEvents.length}</div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-wide">Aujourd'hui</div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-2xl font-bold text-white tabular-nums">{upcomingEvents.length}</div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-wide">À venir</div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-2xl font-bold text-white tabular-nums">{tasksWithDates.length}</div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-wide">Tâches</div>
          </div>
        </div>

        {/* Week timeline with events */}
        <div className="flex-1 space-y-2 overflow-auto">
          {nextDays.map((date) => {
            const dateStr = date.toISOString().split('T')[0]
            const dayTasks = tasksWithDates.filter(t => t.dueDate === dateStr)
            const dayEvents = upcomingEvents.filter(e => e.startDate === dateStr)
            const isToday = dateStr === todayStr
            
            return (
              <div key={dateStr} className="space-y-1">
                {/* Day header */}
                <div className={`flex items-center gap-3 p-2 rounded-lg ${
                  isToday ? 'bg-white/10 border border-white/20' : 'hover:bg-white/5'
                }`}>
                  <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 ${
                    isToday ? 'bg-white/20' : 'bg-white/5'
                  }`}>
                    <div className="text-sm font-bold text-white tabular-nums">
                      {date.getDate()}
                    </div>
                    <div className="text-[8px] uppercase text-zinc-500">
                      {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white capitalize">
                      {date.toLocaleDateString('fr-FR', { weekday: 'long' })}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {date.toLocaleDateString('fr-FR', { month: 'long' })}
                    </div>
                  </div>

                  {(dayTasks.length + dayEvents.length) > 0 && (
                    <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-400">
                        {dayTasks.length + dayEvents.length}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Events for this day */}
                <div className="ml-12 space-y-1">
                  {dayTasks.slice(0, 2).map((task) => (
                    <div key={task.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/5">
                      <Clock className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                      <span className="text-xs text-zinc-400 truncate">{task.title}</span>
                    </div>
                  ))}
                  {dayEvents.slice(0, 2).map((event) => (
                    <div key={event.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/5">
                      <CalendarIcon className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                      <span className="text-xs text-zinc-400 truncate">{event.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </WidgetContainer>
  )
})
