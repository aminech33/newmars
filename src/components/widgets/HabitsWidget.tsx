import { memo, useState, useMemo, useCallback } from 'react'
import { Plus, Flame } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'

interface HabitsWidgetProps {
  widget: Widget
}

export const HabitsWidget = memo(function HabitsWidget({ widget }: HabitsWidgetProps) {
  const { id, size = 'small' } = widget
  const { habits, toggleHabitToday, addHabit } = useStore()
  const [isAdding, setIsAdding] = useState(false)
  const [newHabit, setNewHabit] = useState('')

  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  const handleAdd = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (newHabit.trim()) {
      addHabit(newHabit.trim())
      setNewHabit('')
      setIsAdding(false)
    }
  }, [newHabit, addHabit])

  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toISOString().split('T')[0]
    })
  }, [])

  const getWeekStatus = useCallback((habit: typeof habits[0]) => {
    return last7Days.map(date => habit.completedDates.includes(date))
  }, [last7Days])

  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="Habitudes" currentSize={size}>
        <div className="flex flex-col items-center justify-center h-full">
          <Flame className="w-8 h-8 text-amber-500/60 mb-2" />
          <p className="text-2xl font-extralight text-zinc-200">{habits.length}</p>
          <p className="text-xs text-zinc-600">habitudes</p>
        </div>
      </WidgetContainer>
    )
  }

  return (
    <WidgetContainer 
      id={id} 
      title="Habitudes"
      currentSize={size}
      actions={
        !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-zinc-700 hover:text-zinc-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        )
      }
    >
      <div className="space-y-3 overflow-auto h-full">
        {isAdding && (
          <form onSubmit={handleAdd} className="animate-fade-in">
            <input
              type="text"
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
              placeholder="Nouvelle habitude..."
              className="w-full bg-transparent text-zinc-300 text-sm placeholder:text-zinc-700 border-b border-zinc-800 pb-2 focus:outline-none focus:border-zinc-600"
              autoFocus
              onBlur={() => {
                if (!newHabit.trim()) setIsAdding(false)
              }}
            />
          </form>
        )}
        
        {habits.map((habit) => {
          const weekStatus = getWeekStatus(habit)
          const isCompletedToday = habit.completedDates.includes(today)
          
          return (
            <div key={habit.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleHabitToday(habit.id)}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  <span className={`w-4 h-4 rounded-full border-2 transition-all ${
                    isCompletedToday 
                      ? 'bg-emerald-500/60 border-emerald-500/60' 
                      : 'border-zinc-700 hover:border-zinc-500'
                  }`} />
                  <span className="text-sm text-zinc-300">{habit.name}</span>
                </button>
                {habit.streak > 0 && (
                  <span className="flex items-center gap-1 text-xs text-amber-500/60">
                    <Flame className="w-3 h-3" />
                    {habit.streak}
                  </span>
                )}
              </div>
              
              {size === 'large' && (
                <div className="flex gap-1 pl-6">
                  {weekStatus.map((completed, i) => (
                    <div
                      key={i}
                      className={`w-6 h-1 rounded-full ${
                        completed ? 'bg-emerald-500/40' : 'bg-zinc-800'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
        
        {habits.length === 0 && !isAdding && (
          <div className="flex flex-col items-center justify-center h-full text-center py-4">
            <div className="text-4xl mb-3">🔥</div>
            <p className="text-zinc-400 text-sm font-medium mb-1">Aucune habitude</p>
            <p className="text-zinc-700 text-xs">Cliquez sur + pour commencer</p>
          </div>
        )}
      </div>
    </WidgetContainer>
  )
})
