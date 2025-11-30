import { Repeat } from 'lucide-react'
import { Recurrence } from '../../types/calendar'
import { FREQUENCY_OPTIONS, DAYS_OF_WEEK } from '../../constants/calendar'

interface EventRecurrenceSectionProps {
  isRecurring: boolean
  recurrence?: Recurrence
  onRecurringChange: (isRecurring: boolean) => void
  onRecurrenceChange: (recurrence: Recurrence | undefined) => void
}

export function EventRecurrenceSection({
  isRecurring,
  recurrence,
  onRecurringChange,
  onRecurrenceChange
}: EventRecurrenceSectionProps) {
  const handleFrequencyChange = (frequency: Recurrence['frequency']) => {
    onRecurrenceChange({
      frequency,
      interval: recurrence?.interval || 1,
      daysOfWeek: recurrence?.daysOfWeek || [],
      endDate: recurrence?.endDate
    })
  }

  const handleIntervalChange = (interval: number) => {
    if (!recurrence) return
    onRecurrenceChange({ ...recurrence, interval })
  }

  const handleDayToggle = (day: number) => {
    if (!recurrence) return
    const days = recurrence.daysOfWeek || []
    const updated = days.includes(day)
      ? days.filter(d => d !== day)
      : [...days, day]
    onRecurrenceChange({ ...recurrence, daysOfWeek: updated })
  }

  const handleEndDateChange = (endDate: string) => {
    if (!recurrence) return
    onRecurrenceChange({ ...recurrence, endDate: endDate || undefined })
  }

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-zinc-500">
          <Repeat className="w-3.5 h-3.5" />
          Récurrence
        </label>
        <button
          onClick={() => {
            onRecurringChange(!isRecurring)
            if (!isRecurring) {
              onRecurrenceChange({ frequency: 'weekly', interval: 1, daysOfWeek: [] })
            } else {
              onRecurrenceChange(undefined)
            }
          }}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            isRecurring ? 'bg-indigo-500' : 'bg-zinc-700'
          }`}
          role="switch"
          aria-checked={isRecurring}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
              isRecurring ? 'translate-x-5' : ''
            }`}
          />
        </button>
      </div>

      {/* Recurrence Options */}
      {isRecurring && recurrence && (
        <div className="space-y-4 p-4 bg-zinc-900/30 rounded-xl border border-zinc-800/50 animate-fade-in">
          {/* Frequency */}
          <div>
            <label className="text-xs text-zinc-500 mb-2 block">Fréquence</label>
            <div className="flex flex-wrap gap-2">
              {FREQUENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleFrequencyChange(opt.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    recurrence.frequency === opt.value
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border border-transparent'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interval */}
          <div>
            <label className="text-xs text-zinc-500 mb-2 block">Intervalle</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">Tous les</span>
              <input
                type="number"
                min="1"
                max="30"
                value={recurrence.interval}
                onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
                className="w-16 px-2 py-1 bg-zinc-900/50 rounded-lg text-sm text-zinc-300 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              />
              <span className="text-sm text-zinc-400">
                {recurrence.frequency === 'daily' && 'jour(s)'}
                {recurrence.frequency === 'weekly' && 'semaine(s)'}
                {recurrence.frequency === 'monthly' && 'mois'}
                {recurrence.frequency === 'yearly' && 'an(s)'}
              </span>
            </div>
          </div>

          {/* Days of Week (for weekly) */}
          {recurrence.frequency === 'weekly' && (
            <div>
              <label className="text-xs text-zinc-500 mb-2 block">Jours</label>
              <div className="flex gap-1">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    onClick={() => handleDayToggle(day.value)}
                    className={`w-9 h-9 rounded-lg text-xs font-medium transition-all ${
                      recurrence.daysOfWeek?.includes(day.value)
                        ? 'bg-indigo-500 text-white'
                        : 'bg-zinc-800/50 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* End Date */}
          <div>
            <label className="text-xs text-zinc-500 mb-2 block">Date de fin (optionnel)</label>
            <input
              type="date"
              value={recurrence.endDate || ''}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900/50 rounded-xl text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

