import { Clock, MapPin, Users } from 'lucide-react'
import { Event } from '../../types/calendar'
import { formatTime } from '../../utils/dateUtils'

interface EventCardProps {
  event: Event
  onClick: () => void
}

const typeColors = {
  meeting: 'border-l-cyan-500 bg-cyan-500/5',
  deadline: 'border-l-rose-500 bg-rose-500/5',
  reminder: 'border-l-amber-500 bg-amber-500/5',
  birthday: 'border-l-violet-500 bg-violet-500/5',
  holiday: 'border-l-emerald-500 bg-emerald-500/5',
  custom: 'border-l-zinc-600 bg-zinc-800/30'
}

const typeIcons = {
  meeting: '🗓️',
  deadline: '⏰',
  reminder: '🔔',
  birthday: '🎂',
  holiday: '🎉',
  custom: '📌'
}

export function EventCard({ event, onClick }: EventCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        p-3 rounded-xl cursor-pointer transition-all duration-300
        border-l-4 ${typeColors[event.type]}
        hover:bg-zinc-800/50 hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)]
      `}
      style={{ border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="flex items-start gap-2">
        <span className="text-lg flex-shrink-0">{typeIcons[event.type]}</span>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-medium ${event.completed ? 'line-through text-zinc-600' : 'text-zinc-200'}`}>
            {event.title}
          </h3>
          
          <div className="flex items-center gap-3 mt-1 text-xs text-zinc-600">
            {event.startTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(event.startTime)}
                {event.endTime && ` - ${formatTime(event.endTime)}`}
              </span>
            )}
            
            {event.location && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3" />
                {event.location}
              </span>
            )}
            
            {event.attendees && event.attendees.length > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {event.attendees.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import { Event } from '../../types/calendar'
import { formatTime } from '../../utils/dateUtils'

interface EventCardProps {
  event: Event
  onClick: () => void
}

const typeColors = {
  meeting: 'border-l-cyan-500 bg-cyan-500/5',
  deadline: 'border-l-rose-500 bg-rose-500/5',
  reminder: 'border-l-amber-500 bg-amber-500/5',
  birthday: 'border-l-violet-500 bg-violet-500/5',
  holiday: 'border-l-emerald-500 bg-emerald-500/5',
  custom: 'border-l-zinc-600 bg-zinc-800/30'
}

const typeIcons = {
  meeting: '🗓️',
  deadline: '⏰',
  reminder: '🔔',
  birthday: '🎂',
  holiday: '🎉',
  custom: '📌'
}

export function EventCard({ event, onClick }: EventCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        p-3 rounded-xl cursor-pointer transition-all duration-300
        border-l-4 ${typeColors[event.type]}
        hover:bg-zinc-800/50 hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)]
      `}
      style={{ border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="flex items-start gap-2">
        <span className="text-lg flex-shrink-0">{typeIcons[event.type]}</span>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-medium ${event.completed ? 'line-through text-zinc-600' : 'text-zinc-200'}`}>
            {event.title}
          </h3>
          
          <div className="flex items-center gap-3 mt-1 text-xs text-zinc-600">
            {event.startTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(event.startTime)}
                {event.endTime && ` - ${formatTime(event.endTime)}`}
              </span>
            )}
            
            {event.location && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3" />
                {event.location}
              </span>
            )}
            
            {event.attendees && event.attendees.length > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {event.attendees.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


