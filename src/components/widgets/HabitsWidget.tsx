import { memo, useMemo } from 'react'
import { Flame, Check } from 'lucide-react'
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

  // Mini graphique 7 derniers jours
  const last7Days = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const completed = habits.filter(h => h.completedDates.includes(dateStr)).length
      days.push({
        day: date.getDate(),
        completed,
        total: habits.length
      })
    }
    return days
  }, [habits])

  return (
    <WidgetContainer id={id} title="" currentSize="notification" onClick={() => setView('myday')}>
      <div className="h-full flex flex-col p-5 gap-2.5">
        {/* Header compact */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-amber-400 hover-glow" strokeWidth={1.5} />
            <div className="text-3xl font-bold text-white tabular-nums leading-none font-mono-display number-glow">
              {todayCompleted}<span className="text-xl text-zinc-500/60">/{habits.length}</span>
            </div>
          </div>
          {currentStreak > 0 && (
            <div className="px-2 py-0.5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full shadow-lg shadow-amber-500/30">
              <span className="text-[10px] font-bold text-white">{currentStreak}j</span>
            </div>
          )}
        </div>

        {/* Mini graphique 7 jours */}
        {habits.length > 0 && (
          <div className="h-10 flex items-end gap-0.5">
            {last7Days.map((day, i) => {
              const height = day.total > 0 ? (day.completed / day.total) * 100 : 0
              const isToday = i === 6
              
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className={`w-full rounded-t transition-transform hover:scale-105 will-change-transform ${
                      isToday 
                        ? 'chart-bar-amber' 
                        : 'bg-amber-500/50'
                    }`}
                    style={{ height: `${Math.max(20, height)}%` }}
                  />
                  <div className="text-[8px] text-zinc-600">{day.day}</div>
                </div>
              )
            })}
          </div>
        )}

        {/* Habits List - Toutes les habitudes */}
        <div className="flex-1 space-y-1 overflow-hidden">
          {habits.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center h-full">
              <Flame className="w-10 h-10 text-zinc-600 mb-2" />
              <span className="text-xs text-zinc-500">Aucune habitude</span>
            </div>
          ) : (
            habits.map((habit) => {
              const isCompleted = habit.completedDates.includes(today)
              
              return (
                <button
                  key={habit.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleHabitToday(habit.id)
                  }}
                  className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg
                             hover:bg-white/5 transition-colors group"
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                                   transition-colors flex-shrink-0
                                   ${isCompleted 
                                     ? 'bg-amber-400 border-amber-400' 
                                     : 'border-zinc-600 group-hover:border-amber-400'
                                   }`}>
                    {isCompleted && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                  </div>
                  <span className={`text-xs flex-1 transition-colors truncate
                                    ${isCompleted 
                                      ? 'text-zinc-500 line-through' 
                                      : 'text-zinc-300 group-hover:text-white'
                                    }`}>
                    {habit.name}
                  </span>
                  {habit.streak > 0 && !isCompleted && (
                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-500/20 rounded-full">
                      <Flame className="w-2.5 h-2.5 text-orange-400" />
                      <span className="text-[9px] text-orange-400 font-medium">{habit.streak}</span>
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
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-zinc-600">Progression</span>
              <span className="text-[10px] text-zinc-400 font-semibold">{Math.round((todayCompleted / habits.length) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-colors duration-500"
                style={{ width: `${(todayCompleted / habits.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </WidgetContainer>
  )
})
