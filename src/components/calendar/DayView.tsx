import { useMemo } from 'react'
import { Clock, Plus } from 'lucide-react'
import { Event } from '../../store/useStore'
import { formatTime } from '../../utils/dateUtils'

interface DayViewProps {
  date: Date
  events: Event[]
  onEventClick: (eventId: string) => void
  onTimeSlotClick: (hour: number) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const HOUR_HEIGHT = 60 // pixels per hour

export function DayView({ date, events, onEventClick, onTimeSlotClick }: DayViewProps) {
  const dateStr = date.toISOString().split('T')[0]
  
  // Filter events for this day and sort by time
  const dayEvents = useMemo(() => {
    return events
      .filter(e => e.startDate === dateStr)
      .sort((a, b) => {
        const timeA = a.time || '00:00'
        const timeB = b.time || '00:00'
        return timeA.localeCompare(timeB)
      })
  }, [events, dateStr])

  // Group events by hour for positioning
  const eventsByHour = useMemo(() => {
    const grouped: Record<number, Event[]> = {}
    dayEvents.forEach(event => {
      if (event.time) {
        const hour = parseInt(event.time.split(':')[0])
        if (!grouped[hour]) grouped[hour] = []
        grouped[hour].push(event)
      } else {
        // All-day events go in hour 0
        if (!grouped[0]) grouped[0] = []
        grouped[0].push(event)
      }
    })
    return grouped
  }, [dayEvents])

  const eventTypeColors = {
    task: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300',
    meeting: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
    reminder: 'bg-amber-500/20 border-amber-500/50 text-amber-300',
    deadline: 'bg-rose-500/20 border-rose-500/50 text-rose-300',
    other: 'bg-violet-500/20 border-violet-500/50 text-violet-300'
  }

  const isNowHour = (hour: number) => {
    const now = new Date()
    const isToday = now.toISOString().split('T')[0] === dateStr
    return isToday && now.getHours() === hour
  }

  const getCurrentMinuteOffset = () => {
    const now = new Date()
    return now.getMinutes()
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-sm border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white">
              {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            </h3>
            <p className="text-sm text-zinc-500">
              {date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-zinc-500">
              {dayEvents.length} événement{dayEvents.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="flex">
          {/* Time labels */}
          <div className="w-20 flex-shrink-0 border-r border-white/10">
            {HOURS.map(hour => (
              <div
                key={hour}
                className="relative"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                <div className="absolute -top-2 right-4 text-xs font-medium text-zinc-600">
                  {hour.toString().padStart(2, '0')}:00
                </div>
              </div>
            ))}
          </div>

          {/* Events area */}
          <div className="flex-1 relative">
            {/* Hour grid lines */}
            {HOURS.map(hour => (
              <div
                key={hour}
                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                style={{ height: `${HOUR_HEIGHT}px` }}
                onClick={() => onTimeSlotClick(hour)}
              >
                {/* Current time indicator */}
                {isNowHour(hour) && (
                  <div
                    className="absolute left-0 right-0 h-0.5 bg-rose-500 z-20"
                    style={{ top: `${(getCurrentMinuteOffset() / 60) * HOUR_HEIGHT}px` }}
                  >
                    <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-rose-500" />
                  </div>
                )}

                {/* Quick add button on hover */}
                <div className="absolute right-4 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1 bg-white/5 hover:bg-white/10 rounded text-zinc-600 hover:text-zinc-400">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}

            {/* Events */}
            {dayEvents.map(event => {
              const hour = event.time ? parseInt(event.time.split(':')[0]) : 0
              const minute = event.time ? parseInt(event.time.split(':')[1]) : 0
              const top = hour * HOUR_HEIGHT + (minute / 60) * HOUR_HEIGHT
              
              // Estimate height based on duration (default 1 hour if no duration)
              const duration = event.duration || 60
              const height = Math.max(30, (duration / 60) * HOUR_HEIGHT)
              
              const colors = eventTypeColors[event.type] || eventTypeColors.other

              return (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event.id)}
                  className={`absolute left-4 right-4 rounded-lg border p-3 cursor-pointer hover:shadow-lg transition-all z-10 ${colors}`}
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    minHeight: '40px'
                  }}
                >
                  <div className="flex items-start gap-2">
                    {event.time && (
                      <Clock className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {event.title}
                      </div>
                      {event.time && (
                        <div className="text-xs opacity-75 mt-0.5">
                          {event.time}
                          {event.duration && ` • ${event.duration}min`}
                        </div>
                      )}
                      {event.description && height > 60 && (
                        <div className="text-xs opacity-60 mt-1 line-clamp-2">
                          {event.description}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

