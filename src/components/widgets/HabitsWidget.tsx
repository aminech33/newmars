import { memo, useMemo } from 'react'
import { Flame, Check, ArrowRight } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'

interface HabitsWidgetProps {
  widget: Widget
}

export const HabitsWidget = memo(function HabitsWidget({ widget }: HabitsWidgetProps) {
  const { id, size = 'small' } = widget
  const { habits, toggleHabitToday, setView } = useStore()

  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  const todayCompleted = useMemo(() => 
    habits.filter(h => h.completedDates.includes(today)).length
  , [habits, today])

  const currentStreak = useMemo(() => {
    if (habits.length === 0) return 0
    // Calculer la plus longue série actuelle
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

  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toISOString().split('T')[0]
    })
  }, [])

  // Small: Nombre + streak
  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="Habitudes" currentSize={size} onClick={() => setView('hub')}>
        <div className="flex flex-col items-center justify-center h-full">
          <div className="relative mb-2">
            <Flame className={`w-12 h-12 ${currentStreak > 0 ? 'text-orange-400' : 'text-zinc-700'}`} />
            {currentStreak > 0 && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">{currentStreak}</span>
              </div>
            )}
          </div>
          <p className="text-sm text-zinc-500 font-medium">{todayCompleted}/{habits.length} aujourd'hui</p>
        </div>
      </WidgetContainer>
    )
  }

  // Medium: Liste avec checkboxes
  if (size === 'medium') {
    return (
      <WidgetContainer 
        id={id} 
        title="Habitudes"
        currentSize={size}
        onClick={() => setView('hub')}
        actions={
          <button
            onClick={(e) => {
              e.stopPropagation()
              setView('hub')
            }}
            className="text-orange-400 hover:text-orange-300 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        }
      >
        <div className="flex flex-col h-full">
          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-zinc-500">Aujourd'hui</span>
              <span className="text-xs font-bold text-orange-400">{todayCompleted}/{habits.length}</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
                style={{ width: `${habits.length > 0 ? (todayCompleted / habits.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Habit list */}
          <div className="space-y-2 flex-1 overflow-auto">
            {habits.slice(0, 5).map((habit) => {
              const isCompletedToday = habit.completedDates.includes(today)
              return (
                <button
                  key={habit.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleHabitToday(habit.id)
                  }}
                  className="flex items-center gap-3 w-full text-left hover:bg-white/5 p-2 -m-2 rounded-xl transition-colors group"
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                    isCompletedToday 
                      ? 'bg-orange-500' 
                      : 'bg-zinc-800 group-hover:bg-zinc-700'
                  }`}>
                    {isCompletedToday && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-sm flex-1 ${
                    isCompletedToday ? 'text-zinc-400 line-through' : 'text-zinc-300'
                  }`}>
                    {habit.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </WidgetContainer>
    )
  }

  // Large: Grille 7 jours + détails
  return (
    <WidgetContainer 
      id={id} 
      title="Habitudes"
      currentSize={size}
      onClick={() => setView('hub')}
      actions={
        <button
          onClick={(e) => {
            e.stopPropagation()
            setView('hub')
          }}
          className="text-orange-400 hover:text-orange-300 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      }
    >
      <div className="flex flex-col h-full">
        {/* Stats */}
        <div className="flex gap-2 mb-3 pb-3 border-b border-white/5">
          <div className="flex-1 bg-orange-500/10 rounded-lg p-2">
            <div className="text-xl font-bold text-orange-400">{currentStreak}</div>
            <div className="text-[10px] text-orange-300/70 uppercase tracking-wide">Série</div>
          </div>
          <div className="flex-1 bg-amber-500/10 rounded-lg p-2">
            <div className="text-xl font-bold text-amber-400">{todayCompleted}</div>
            <div className="text-[10px] text-amber-300/70 uppercase tracking-wide">Aujourd'hui</div>
          </div>
          <div className="flex-1 bg-emerald-500/10 rounded-lg p-2">
            <div className="text-xl font-bold text-emerald-400">{habits.length}</div>
            <div className="text-[10px] text-emerald-300/70 uppercase tracking-wide">Total</div>
          </div>
        </div>

        {/* Habits avec historique 7 jours */}
        <div className="space-y-3 flex-1 overflow-auto">
          {habits.map((habit) => {
            const isCompletedToday = habit.completedDates.includes(today)
            return (
              <div key={habit.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleHabitToday(habit.id)
                    }}
                    className="flex items-center gap-2 group"
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                      isCompletedToday 
                        ? 'bg-orange-500' 
                        : 'bg-zinc-800 group-hover:bg-zinc-700'
                    }`}>
                      {isCompletedToday && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-sm ${
                      isCompletedToday ? 'text-zinc-400' : 'text-zinc-300'
                    }`}>
                      {habit.name}
                    </span>
                  </button>
                </div>
                
                {/* Mini calendrier 7 jours */}
                <div className="flex gap-1 ml-7">
                  {last7Days.map((date) => {
                    const isCompleted = habit.completedDates.includes(date)
                    const isToday = date === today
                    return (
                      <div 
                        key={date}
                        className={`w-4 h-4 rounded-sm transition-colors ${
                          isCompleted 
                            ? 'bg-orange-500' 
                            : isToday
                            ? 'bg-zinc-700 ring-1 ring-orange-500/50'
                            : 'bg-zinc-800'
                        }`}
                        title={new Date(date).toLocaleDateString('fr-FR')}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </WidgetContainer>
  )
})
