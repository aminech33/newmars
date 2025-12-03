import { memo, useMemo } from 'react'
import { Flame, Check, CheckCircle2 } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'

interface HabitsWidgetProps {
  widget: Widget
}

export const HabitsWidget = memo(function HabitsWidget({ widget }: HabitsWidgetProps) {
  const { id } = widget
  const { habits, toggleHabitToday, setView } = useStore()

  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  const todayCompleted = useMemo(() => 
    habits.filter(h => h.completedDates.includes(today)).length
  , [habits, today])

  const currentStreak = useMemo(() => {
    if (habits.length === 0) return 0
    let maxStreak = 0
    habits.forEach(habit => {
      let streak = 0
      const sortedDates = [...habit.completedDates].sort().reverse()
      let currentDate = new Date()
      
      for (let i = 0; i < 30; i++) {
        const dateStr = currentDate.toISOString().split('T')[0]
        if (sortedDates.includes(dateStr)) {
          streak++
        } else if (i > 0) {
          break
        }
        currentDate.setDate(currentDate.getDate() - 1)
      }
      maxStreak = Math.max(maxStreak, streak)
    })
    return maxStreak
  }, [habits])

  return (
    <WidgetContainer id={id} title="" currentSize="notification" onClick={() => setView('hub')}>
      <div className="h-full flex flex-col p-6 gap-4">
        {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <Flame className="w-12 h-12 text-amber-400" strokeWidth={1.5} />
              </div>
          {currentStreak > 0 && (
            <div className="px-3 py-1 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full shadow-lg shadow-amber-500/30">
              <span className="text-sm font-bold text-white">{currentStreak}j</span>
            </div>
          )}
        </div>

        {/* Big Count */}
        <div className="text-center">
          <div className="text-6xl font-bold text-white tabular-nums leading-none">
            {todayCompleted}<span className="text-3xl text-zinc-500">/{habits.length}</span>
          </div>
          <div className="text-sm text-zinc-500 uppercase tracking-wide mt-2">
            aujourd'hui
          </div>
        </div>

        {/* Habits List */}
        <div className="flex-1 space-y-2 overflow-hidden">
          {habits.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-zinc-500 text-sm py-4">
              <Flame className="w-8 h-8 text-zinc-600 mb-2" />
              <span>Aucune habitude</span>
            </div>
          ) : (
            habits.slice(0, 3).map((habit) => {
              const isCompleted = habit.completedDates.includes(today)
              
              return (
                <button
                  key={habit.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleHabitToday(habit.id)
                  }}
                  className="flex items-center gap-3 w-full text-left p-2 rounded-lg
                             hover:bg-white/5 transition-colors group"
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                                   transition-all flex-shrink-0
                                   ${isCompleted 
                                     ? 'bg-amber-400 border-amber-400' 
                                     : 'border-zinc-600 group-hover:border-amber-400'
                                   }`}>
                    {isCompleted && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                  <span className={`text-sm flex-1 transition-colors
                                    ${isCompleted 
                                      ? 'text-zinc-500 line-through' 
                                      : 'text-zinc-300 group-hover:text-white'
                                    }`}>
                    {habit.name}
                  </span>
                  {habit.streak > 0 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 rounded-full">
                      <Flame className="w-3 h-3 text-orange-400" />
                      <span className="text-xs text-orange-400 font-medium">{habit.streak}</span>
                    </div>
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Footer Progress */}
        {habits.length > 0 && (
          <div className="pt-2 border-t border-white/10">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                style={{ width: `${(todayCompleted / habits.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </WidgetContainer>
  )
})
