import { useMemo } from 'react'
import { Habit } from '../../types/widgets'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface HabitCalendarProps {
  habits: Habit[]
}

export function HabitCalendar({ habits }: HabitCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Get all dates for the current month
  const monthData = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add previous month's days
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      })
    }

    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      })
    }

    // Add next month's days to complete the grid
    const remainingDays = 42 - days.length // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      })
    }

    return days
  }, [year, month])

  const today = new Date().toISOString().split('T')[0]

  const getCompletionForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    const completedCount = habits.filter(h => h.completedDates.includes(dateStr)).length
    return {
      count: completedCount,
      total: habits.length,
      percentage: habits.length > 0 ? (completedCount / habits.length) * 100 : 0
    }
  }

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1))
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">
          {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-400" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-zinc-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {monthData.map((day, i) => {
          const completion = getCompletionForDate(day.date)
          const dateStr = day.date.toISOString().split('T')[0]
          const isToday = dateStr === today

          return (
            <div
              key={i}
              className={`aspect-square rounded-lg p-2 transition-all ${
                !day.isCurrentMonth
                  ? 'opacity-30'
                  : ''
              } ${
                isToday
                  ? 'ring-2 ring-amber-400'
                  : ''
              } ${
                completion.percentage > 0
                  ? 'bg-amber-500/20 hover:bg-amber-500/30'
                  : 'bg-white/5 hover:bg-white/8'
              }`}
            >
              <div className="flex flex-col h-full">
                <div className="text-xs text-zinc-400 mb-1">
                  {day.date.getDate()}
                </div>
                <div className="flex-1 flex items-center justify-center">
                  {completion.count > 0 && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-amber-400">
                        {completion.count}
                      </div>
                      <div className="text-[10px] text-zinc-600">
                        /{completion.total}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-4 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-white/5" />
          <span>Aucune</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500/20" />
          <span>Partiel</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500" />
          <span>Complet</span>
        </div>
      </div>
    </div>
  )
}

