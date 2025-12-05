import { Bell, Plus, X } from 'lucide-react'
import { Reminder } from '../../types/calendar'

interface EventRemindersSectionProps {
  reminders: Reminder[]
  onRemindersChange: (reminders: Reminder[]) => void
}

const REMINDER_PRESETS = [
  { label: '5 minutes avant', value: 5 },
  { label: '15 minutes avant', value: 15 },
  { label: '30 minutes avant', value: 30 },
  { label: '1 heure avant', value: 60 },
  { label: '1 jour avant', value: 1440 },
]

export function EventRemindersSection({ reminders, onRemindersChange }: EventRemindersSectionProps) {
  const handleAddReminder = (minutes: number) => {
    const newReminder: Reminder = {
      time: minutes,
      sent: false
    }
    onRemindersChange([...reminders, newReminder])
  }
  
  const handleRemoveReminder = (index: number) => {
    const updated = reminders.filter((_, i) => i !== index)
    onRemindersChange(updated)
  }
  
  const getReminderLabel = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min avant`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h avant`
    return `${Math.floor(minutes / 1440)}j avant`
  }
  
  return (
    <div className="space-y-3">
      {/* Existing reminders */}
      {reminders.length > 0 && (
        <div className="space-y-2">
          {reminders.map((reminder, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-zinc-900/50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-sm text-zinc-300">
                  {getReminderLabel(reminder.time)}
                </span>
                {reminder.sent && (
                  <span className="text-xs text-emerald-400">✓ Envoyé</span>
                )}
              </div>
              <button
                onClick={() => handleRemoveReminder(index)}
                className="text-zinc-600 hover:text-rose-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Add reminder presets */}
      <div className="space-y-2">
        <label className="block text-xs text-zinc-500">Ajouter un rappel</label>
        <div className="flex flex-wrap gap-2">
          {REMINDER_PRESETS.map(preset => (
            <button
              key={preset.value}
              onClick={() => handleAddReminder(preset.value)}
              disabled={reminders.some(r => r.time === preset.value)}
              className="px-2 py-1 text-xs rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:border-indigo-500/50 hover:text-indigo-400"
            >
              <Plus className="w-3 h-3 inline mr-1" />
              {preset.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Notification permission warning */}
      {'Notification' in window && Notification.permission === 'default' && (
        <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <p className="text-xs text-amber-300">
            💡 Activez les notifications du navigateur pour recevoir les rappels
          </p>
        </div>
      )}
      
      {'Notification' in window && Notification.permission === 'denied' && (
        <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg">
          <p className="text-xs text-rose-300">
            ⚠️ Les notifications sont bloquées. Activez-les dans les paramètres du navigateur.
          </p>
        </div>
      )}
    </div>
  )
}

