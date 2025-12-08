import { Event } from '../../types/calendar'
import { isSameDay, isEventActiveOnDate } from '../../utils/dateUtils'
import { layoutEvents, getEventStyle } from '../../utils/eventLayoutUtils'

interface WeekViewProps {
  currentDate: Date
  events: Event[]
  onEventClick: (eventId: string) => void
  onDateClick?: (date: Date) => void
}

export function WeekView({ currentDate, events, onEventClick, onDateClick }: WeekViewProps) {
  // Get week days (Monday to Sunday)
  const getWeekDays = () => {
    const days: Date[] = []
    const monday = new Date(currentDate)
    const day = monday.getDay()
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1) // Adjust to Monday
    monday.setDate(diff)
    
    for (let i = 0; i < 7; i++) {
      const newDay = new Date(monday)
      newDay.setDate(monday.getDate() + i)
      days.push(newDay)
    }
    return days
  }

  const weekDays = getWeekDays()
  const hours = Array.from({ length: 13 }, (_, i) => i + 8) // 8h to 20h

  const getEventsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(e => isEventActiveOnDate(e, dateStr) && e.startTime)
  }

  const isToday = (date: Date) => {
    return isSameDay(date, new Date())
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-w-[900px]">
        {/* Header with days */}
        <div className="sticky top-0 z-10 bg-mars-surface border-b border-zinc-900/50 backdrop-blur-xl">
          <div className="grid grid-cols-8 gap-px">
            <div className="p-3 bg-zinc-900/30">
              <span className="text-xs text-zinc-600">Heure</span>
            </div>
            {weekDays.map((day, index) => (
              <div
                key={index}
                className={`p-3 text-center ${
                  isToday(day) ? 'bg-indigo-500/10 border-b-2 border-indigo-500' : 'bg-zinc-900/30'
                }`}
              >
                <div className="text-xs text-zinc-600">
                  {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                </div>
                <div className={`text-lg font-semibold ${isToday(day) ? 'text-indigo-400' : 'text-zinc-300'}`}>
                  {day.getDate()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline grid */}
        <div className="relative">
          {/* Hour labels and grid lines */}
          <div className="grid grid-cols-8 gap-px">
            <div className="bg-zinc-900/20">
              {hours.map(hour => (
                <div key={hour} className="h-20 flex items-start justify-end pr-2 pt-1 border-t border-zinc-900/50">
                  <span className="text-xs text-zinc-600">{hour}:00</span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day, dayIndex) => {
              const dayEvents = getEventsForDay(day)
              const positionedEvents = layoutEvents(dayEvents, 80)
              
              return (
                <div key={dayIndex} className="relative bg-zinc-900/10">
                  {/* Hour grid */}
                  {hours.map(hour => (
                    <div
                      key={hour}
                      className={`h-20 border-t border-zinc-900/50 ${
                        isToday(day) ? 'bg-indigo-500/5' : ''
                      }`}
                    />
                  ))}

                  {/* Events positioned absolutely with smart layout */}
                  <div className="absolute inset-0 p-1">
                    {positionedEvents.map(positioned => {
                      const { event } = positioned
                      const style = getEventStyle(positioned)
                      
                      return (
                        <div
                          key={event.id}
                          onClick={() => onEventClick(event.id)}
                          className="cursor-pointer"
                          style={style}
                        >
                          <div className={`
                            h-full p-2 rounded-lg text-xs overflow-hidden
                            transition-colors duration-200 hover:scale-[1.02] hover:shadow-lg
                            ${event.type === 'meeting' ? 'bg-cyan-500/20 border-l-2 border-cyan-500 text-cyan-300' : ''}
                            ${event.type === 'deadline' ? 'bg-rose-500/20 border-l-2 border-rose-500 text-rose-300' : ''}
                            ${event.type === 'reminder' ? 'bg-amber-500/20 border-l-2 border-amber-500 text-amber-300' : ''}
                            ${event.type === 'birthday' ? 'bg-violet-500/20 border-l-2 border-violet-500 text-violet-300' : ''}
                            ${event.type === 'holiday' ? 'bg-emerald-500/20 border-l-2 border-emerald-500 text-emerald-300' : ''}
                            ${event.type === 'custom' ? 'bg-zinc-700/30 border-l-2 border-zinc-600 text-zinc-300' : ''}
                          `}>
                            <div className="font-medium truncate">{event.title}</div>
                            <div className="text-[10px] opacity-75 mt-0.5">
                              {event.startTime}
                              {event.endTime && ` - ${event.endTime}`}
                            </div>
                            {event.location && (
                              <div className="text-[10px] opacity-60 truncate mt-0.5">
                                📍 {event.location}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Current time indicator */}
          {weekDays.some(day => isToday(day)) && (() => {
            const now = new Date()
            const currentHour = now.getHours()
            const currentMinute = now.getMinutes()
            
            if (currentHour >= 8 && currentHour < 21) {
              const todayIndex = weekDays.findIndex(day => isToday(day))
              const currentMinutes = (currentHour - 8) * 60 + currentMinute
              const currentTop = (currentMinutes / 60) * 80
              
              return (
                <div
                  className="absolute left-0 right-0 z-20 pointer-events-none"
                  style={{ top: `${currentTop + 56}px` }} // +56 for header height
                >
                  <div className="grid grid-cols-8 gap-px">
                    <div />
                    {weekDays.map((_, index) => (
                      <div key={index}>
                        {index === todayIndex && (
                          <>
                            <div className="h-0.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                            <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
            return null
          })()}
        </div>
      </div>
    </div>
  )
}
