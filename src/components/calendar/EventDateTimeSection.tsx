import { Calendar, Clock } from 'lucide-react'

interface EventDateTimeSectionProps {
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onStartTimeChange: (time: string) => void
  onEndTimeChange: (time: string) => void
}

export function EventDateTimeSection({
  startDate,
  endDate,
  startTime,
  endTime,
  onStartDateChange,
  onEndDateChange,
  onStartTimeChange,
  onEndTimeChange
}: EventDateTimeSectionProps) {
  return (
    <div className="space-y-4">
      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
            <Calendar className="w-3.5 h-3.5" />
            Date de début
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900/50 rounded-xl text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
            <Calendar className="w-3.5 h-3.5" />
            Date de fin
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            min={startDate}
            className="w-full px-3 py-2 bg-zinc-900/50 rounded-xl text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </div>
      </div>

      {/* Times */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
            <Clock className="w-3.5 h-3.5" />
            Heure de début
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => onStartTimeChange(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900/50 rounded-xl text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
            <Clock className="w-3.5 h-3.5" />
            Heure de fin
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => onEndTimeChange(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900/50 rounded-xl text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </div>
      </div>
    </div>
  )
}

