import { Flame, Trash2, CheckCircle2, Circle } from 'lucide-react'
import { Habit } from '../../types/widgets'

interface HabitCardProps {
  habit: Habit
  today: string
  onToggle: (id: string) => void
  onDelete: () => void
  isSelected: boolean
  onSelect: () => void
}

export function HabitCard({ habit, today, onToggle, onDelete, isSelected, onSelect }: HabitCardProps) {
  const isCompletedToday = habit.completedDates.includes(today)
  
  // Calculate current streak correctly
  const currentStreak = () => {
    let streak = 0
    let checkDate = new Date()
    const sortedDates = [...habit.completedDates].sort().reverse()
    
    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split('T')[0]
      if (sortedDates.includes(dateStr)) {
        streak++
      } else if (i > 0) {
        break
      }
      checkDate.setDate(checkDate.getDate() - 1)
    }
    return streak
  }

  const streak = currentStreak()

  // Last 7 days for mini visualization
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date.toISOString().split('T')[0]
  })

  return (
    <div
      onClick={() => onToggle(habit.id)}
      className={`group relative p-6 rounded-2xl border transition-all cursor-pointer ${
        isCompletedToday
          ? 'bg-amber-500/10 border-amber-500/30 shadow-lg shadow-amber-500/10'
          : 'bg-white/5 border-white/10 hover:border-white/20'
      }`}
    >
      <div className="flex items-center justify-between">
        {/* Left: Checkbox & Info */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(habit.id); }}
            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
              isCompletedToday
                ? 'bg-amber-500 border-amber-500'
                : 'border-amber-400 hover:border-amber-300'
            }`}
          >
            {isCompletedToday ? (
              <CheckCircle2 className="w-6 h-6 text-white" />
            ) : (
              <Circle className="w-6 h-6 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>

          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${
              isCompletedToday ? 'text-amber-300' : 'text-white'
            }`}>
              {habit.name}
            </h3>
            <div className="flex items-center gap-4 mt-1">
              {streak > 0 && (
                <div className="flex items-center gap-1 text-sm text-zinc-500">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>{streak} jour{streak > 1 ? 's' : ''}</span>
                </div>
              )}
              <div className="text-xs text-zinc-600">
                {habit.completedDates.length} fois complété
              </div>
            </div>
          </div>
        </div>

        {/* Right: Last 7 Days Visualization */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {last7Days.map((date, i) => {
              const isCompleted = habit.completedDates.includes(date)
              const isToday = date === today
              return (
                <div
                  key={date}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
                    isCompleted
                      ? 'bg-amber-500 text-white'
                      : isToday
                      ? 'bg-white/10 text-zinc-500 border border-white/20'
                      : 'bg-white/5 text-zinc-700'
                  }`}
                  title={new Date(date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                >
                  {new Date(date).getDate()}
                </div>
              )
            })}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-2 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

