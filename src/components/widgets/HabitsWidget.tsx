import { memo, useMemo } from 'react'
import { Flame, Check, ArrowRight, CheckCircle2 } from 'lucide-react'
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

  // Small: Streak first (Apple style)
  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="" currentSize={size} onClick={() => setView('hub')}>
        <div className="h-full flex flex-col justify-between p-4">
          {/* Main metric - Streak */}
          <div>
            <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
              Habitudes
            </div>
            {currentStreak > 0 ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-5xl">🔥</span>
                  <div className="text-5xl font-bold text-white tabular-nums leading-none">
                    {currentStreak}
                  </div>
                </div>
                <div className="text-xs text-zinc-400 font-medium">
                  jours consécutifs
                </div>
              </>
            ) : (
              <div className="text-sm text-zinc-600">Aucune série active</div>
            )}
          </div>

          {/* Today's progress */}
          <div className="p-2.5 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-medium">Aujourd'hui</span>
              <span className="text-xs text-white font-semibold tabular-nums">
                {todayCompleted}/{habits.length}
              </span>
            </div>
          </div>
        </div>
      </WidgetContainer>
    )
  }

  // Medium: Habits list with checkboxes
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
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        }
      >
        <div className="h-full flex flex-col gap-3">
          {/* Progress card */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-xs text-zinc-500 mb-0.5">Progression</div>
                <div className="text-2xl font-bold text-white tabular-nums">
                  {todayCompleted}/{habits.length}
                </div>
              </div>
              {currentStreak > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 rounded-lg border border-white/10">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs text-white font-medium tabular-nums">{currentStreak}</span>
                </div>
              )}
            </div>
            
            {/* Progress bar */}
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${habits.length > 0 ? (todayCompleted / habits.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Habits list */}
          <div className="flex-1 space-y-1.5 overflow-auto">
            {habits.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <CheckCircle2 className="w-10 h-10 text-zinc-600 mb-2" />
                <p className="text-sm text-zinc-500 font-medium">Aucune habitude</p>
              </div>
            ) : (
              habits.slice(0, 5).map(habit => {
                const isCompleted = habit.completedDates.includes(today)
                return (
                  <button
                    key={habit.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleHabitToday(habit.id)
                    }}
                    className="flex items-center gap-2 w-full text-left p-2 rounded-lg hover:bg-white/5 transition-colors group"
                  >
                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                      isCompleted 
                        ? 'bg-amber-400 border-amber-400' 
                        : 'border-zinc-600 group-hover:border-amber-400/50'
                    }`}>
                      {isCompleted && <Check className="w-3 h-3 text-zinc-900" />}
                    </div>
                    <span className={`text-xs flex-1 transition-colors ${
                      isCompleted ? 'text-zinc-400 line-through' : 'text-zinc-300 group-hover:text-white'
                    }`}>
                      {habit.title}
                    </span>
                    <span className="text-xs text-zinc-600">{habit.icon}</span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </WidgetContainer>
    )
  }

  // Large: Full view with 7-day calendar
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
          className="text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      }
    >
      <div className="h-full flex flex-col gap-3">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-center">
            <Flame className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-white tabular-nums">{currentStreak}</div>
            <div className="text-[9px] text-zinc-600 uppercase tracking-wide">Série</div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-white tabular-nums">{todayCompleted}</div>
            <div className="text-[9px] text-zinc-600 uppercase tracking-wide">Aujourd'hui</div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-center">
            <div className="text-2xl font-bold text-white tabular-nums">{habits.length}</div>
            <div className="text-[9px] text-zinc-600 uppercase tracking-wide">Total</div>
          </div>
        </div>

        {/* 7-day mini calendar */}
        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-2">
            Cette semaine
          </div>
          <div className="grid grid-cols-7 gap-1">
            {last7Days.map(date => {
              const dayCompleted = habits.filter(h => h.completedDates.includes(date)).length
              const allCompleted = habits.length > 0 && dayCompleted === habits.length
              const isToday = date === today
              
              return (
                <div 
                  key={date}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-center ${
                    isToday 
                      ? 'bg-white/10 border border-white/20' 
                      : allCompleted 
                        ? 'bg-amber-500/20 border border-amber-500/30' 
                        : dayCompleted > 0
                          ? 'bg-white/5 border border-white/10'
                          : 'bg-transparent border border-white/5'
                  }`}
                >
                  <div className="text-[8px] text-zinc-600 uppercase">
                    {new Date(date).toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 1)}
                  </div>
                  <div className={`text-xs font-bold ${
                    allCompleted ? 'text-amber-400' : isToday ? 'text-white' : 'text-zinc-500'
                  }`}>
                    {new Date(date).getDate()}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Habits list */}
        <div className="flex-1 overflow-auto">
          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-2">
            Liste des habitudes
          </div>
          <div className="space-y-1.5">
            {habits.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-6">
                <CheckCircle2 className="w-12 h-12 text-zinc-600 mb-2" />
                <p className="text-sm text-zinc-500 font-medium">Aucune habitude</p>
              </div>
            ) : (
              habits.map(habit => {
                const isCompleted = habit.completedDates.includes(today)
                return (
                  <button
                    key={habit.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleHabitToday(habit.id)
                    }}
                    className="flex items-center gap-2 w-full text-left p-2 rounded-lg hover:bg-white/5 transition-colors group"
                  >
                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                      isCompleted 
                        ? 'bg-amber-400 border-amber-400' 
                        : 'border-zinc-600 group-hover:border-amber-400/50'
                    }`}>
                      {isCompleted && <Check className="w-3 h-3 text-zinc-900" />}
                    </div>
                    <span className="text-base">{habit.icon}</span>
                    <span className={`text-xs flex-1 transition-colors ${
                      isCompleted ? 'text-zinc-400 line-through' : 'text-zinc-300 group-hover:text-white'
                    }`}>
                      {habit.title}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>
    </WidgetContainer>
  )
})
