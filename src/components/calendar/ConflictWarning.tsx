import { AlertTriangle } from 'lucide-react'
import { Event } from '../../types/calendar'
import { detectConflicts } from '../../utils/calendarIntelligence'

interface ConflictWarningProps {
  event: Event
  allEvents: Event[]
}

export function ConflictWarning({ event, allEvents }: ConflictWarningProps) {
  const conflicts = detectConflicts(event, allEvents)
  
  if (conflicts.length === 0) return null
  
  return (
    <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg animate-fade-in">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs font-medium text-amber-400">
            Conflit détecté
          </p>
          <p className="text-xs text-amber-300/80 mt-1">
            Cet événement chevauche {conflicts.length} autre{conflicts.length > 1 ? 's' : ''} événement{conflicts.length > 1 ? 's' : ''} :
          </p>
          <ul className="mt-1 space-y-1">
            {conflicts.map(conflict => (
              <li key={conflict.id} className="text-xs text-amber-300/70">
                • {conflict.title} ({conflict.startTime} - {conflict.endTime})
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}




