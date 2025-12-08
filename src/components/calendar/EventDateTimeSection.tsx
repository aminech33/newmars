import { Calendar, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'

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
  const [isMultiDay, setIsMultiDay] = useState(!!endDate && endDate !== startDate)

  useEffect(() => {
    setIsMultiDay(!!endDate && endDate !== startDate)
  }, [endDate, startDate])

  const handleToggleMultiDay = (checked: boolean) => {
    setIsMultiDay(checked)
    if (!checked) {
      // Si on désactive multi-jours, on vide la date de fin
      onEndDateChange('')
    } else {
      // Si on active multi-jours, on met la date de fin au lendemain par défaut
      const nextDay = new Date(startDate)
      nextDay.setDate(nextDay.getDate() + 1)
      onEndDateChange(nextDay.toISOString().split('T')[0])
    }
  }

  return (
    <div className="space-y-4">
      {/* Multi-day toggle */}
      <label className="flex items-center gap-2 cursor-pointer group">
        <input
          type="checkbox"
          checked={isMultiDay}
          onChange={(e) => handleToggleMultiDay(e.target.checked)}
          className="form-checkbox h-4 w-4 text-indigo-500 bg-zinc-800 border-zinc-700 rounded focus:ring-2 focus:ring-indigo-500/50"
        />
        <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">
          📅 Événement sur plusieurs jours
        </span>
      </label>

      {/* Dates */}
      <div className={`grid ${isMultiDay ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
        <div>
          <label className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
            <Calendar className="w-3.5 h-3.5" />
            {isMultiDay ? 'Date de début' : 'Date'}
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900/50 rounded-xl text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </div>
        {isMultiDay && (
          <div>
            <label className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
              <Calendar className="w-3.5 h-3.5" />
              Date de fin
            </label>
            <input
              type="date"
              value={endDate || startDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              min={startDate}
              className="w-full px-3 py-2 bg-zinc-900/50 rounded-xl text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>
        )}
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
            className="w-full px-3 py-2 bg-zinc-900/50 rounded-xl text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors"
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
            className="w-full px-3 py-2 bg-zinc-900/50 rounded-xl text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </div>
      </div>

      {isMultiDay && (
        <div className="text-xs text-zinc-600 bg-zinc-800/30 rounded-lg p-2">
          💡 Astuce : L'événement apparaîtra sur tous les jours entre le début et la fin
        </div>
      )}
    </div>
  )
}

