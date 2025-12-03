import { useMemo } from 'react'
import { Habit } from '../../types/widgets'
import { TrendingUp, Flame, Target, Award, Calendar } from 'lucide-react'

interface HabitStatsProps {
  habits: Habit[]
}

export function HabitStats({ habits }: HabitStatsProps) {
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    
    // Total completions
    const totalCompletions = habits.reduce((sum, h) => sum + h.completedDates.length, 0)
    
    // Today's rate
    const todayCompleted = habits.filter(h => h.completedDates.includes(today)).length
    const todayRate = habits.length > 0 ? Math.round((todayCompleted / habits.length) * 100) : 0
    
    // Best streak
    const bestStreak = Math.max(...habits.map(h => {
      let maxStreak = 0
      let currentStreak = 0
      const sortedDates = [...h.completedDates].sort()
      
      for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0) {
          currentStreak = 1
        } else {
          const prevDate = new Date(sortedDates[i - 1])
          const currDate = new Date(sortedDates[i])
          const dayDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
          
          if (dayDiff === 1) {
            currentStreak++
          } else {
            currentStreak = 1
          }
        }
        maxStreak = Math.max(maxStreak, currentStreak)
      }
      return maxStreak
    }), 0)
    
    // Last 30 days average
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    })
    
    const last30DaysCompletions = last30Days.map(date => 
      habits.filter(h => h.completedDates.includes(date)).length
    )
    
    const avgLast30Days = habits.length > 0
      ? Math.round((last30DaysCompletions.reduce((a, b) => a + b, 0) / (30 * habits.length)) * 100)
      : 0
    
    // Most consistent habit
    const mostConsistent = habits.reduce((best, h) => {
      if (!best || h.completedDates.length > best.completedDates.length) {
        return h
      }
      return best
    }, habits[0])
    
    // Longest active streak
    const longestActiveStreak = habits.reduce((max, h) => {
      let streak = 0
      let checkDate = new Date()
      const sortedDates = [...h.completedDates].sort().reverse()
      
      for (let i = 0; i < 365; i++) {
        const dateStr = checkDate.toISOString().split('T')[0]
        if (sortedDates.includes(dateStr)) {
          streak++
        } else if (i > 0) {
          break
        }
        checkDate.setDate(checkDate.getDate() - 1)
      }
      return Math.max(max, streak)
    }, 0)
    
    return {
      totalCompletions,
      todayRate,
      bestStreak,
      avgLast30Days,
      mostConsistent,
      longestActiveStreak
    }
  }, [habits])

  const statCards = [
    {
      icon: Target,
      label: "Aujourd'hui",
      value: `${stats.todayRate}%`,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30'
    },
    {
      icon: Flame,
      label: 'Plus longue série',
      value: `${stats.longestActiveStreak} jours`,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30'
    },
    {
      icon: TrendingUp,
      label: 'Moyenne 30j',
      value: `${stats.avgLast30Days}%`,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30'
    },
    {
      icon: Award,
      label: 'Total complétions',
      value: stats.totalCompletions,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/30'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div
              key={i}
              className={`p-6 rounded-2xl border ${stat.bg} ${stat.border}`}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-zinc-500">
                {stat.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* Individual Habit Stats */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          Statistiques par habitude
        </h3>
        
        <div className="space-y-3">
          {habits.map(habit => {
            // Calculate streak for this habit
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

            const completionRate = habit.completedDates.length > 0 
              ? Math.round((habit.completedDates.length / Math.max(1, Math.ceil((Date.now() - new Date(habit.completedDates[0]).getTime()) / (1000 * 60 * 60 * 24)))) * 100)
              : 0

            return (
              <div
                key={habit.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/8 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-white">{habit.name}</h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      {streak} jours
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {habit.completedDates.length} fois
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {completionRate}%
                  </div>
                  <div className="text-xs text-zinc-600">
                    Taux global
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Most Consistent */}
      {stats.mostConsistent && (
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-amber-500 rounded-xl">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-300">
                Habitude la plus régulière
              </h3>
              <p className="text-sm text-zinc-500">
                Bravo pour votre constance !
              </p>
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.mostConsistent.name}
          </div>
          <div className="text-sm text-zinc-400 mt-1">
            {stats.mostConsistent.completedDates.length} complétions
          </div>
        </div>
      )}
    </div>
  )
}

