import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { MealEntry } from '../../types/health'

interface WeeklyHistoryProps {
  mealEntries: MealEntry[]
  targetCalories: number
}

interface DayData {
  date: string
  dayName: string
  calories: number
  protein: number
  carbs: number
  fat: number
  mealsCount: number
  percentOfTarget: number
}

export function WeeklyHistory({ mealEntries, targetCalories }: WeeklyHistoryProps) {
  
  // Calculer les 7 derniers jours
  const weekData = useMemo(() => {
    const days: DayData[] = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split('T')[0]
      
      const dayMeals = mealEntries.filter(m => m.date === dateString)
      
      const totals = dayMeals.reduce((acc, meal) => ({
        calories: acc.calories + meal.calories,
        protein: acc.protein + (meal.protein || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        fat: acc.fat + (meal.fat || 0)
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
      
      days.push({
        date: dateString,
        dayName: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
        calories: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat,
        mealsCount: dayMeals.length,
        percentOfTarget: targetCalories > 0 ? Math.round((totals.calories / targetCalories) * 100) : 0
      })
    }
    
    return days
  }, [mealEntries, targetCalories])

  // Calculer les tendances
  const avgCalories = useMemo(() => {
    const total = weekData.reduce((sum, day) => sum + day.calories, 0)
    return Math.round(total / 7)
  }, [weekData])

  const trend = useMemo(() => {
    const firstHalf = weekData.slice(0, 3).reduce((sum, day) => sum + day.calories, 0) / 3
    const secondHalf = weekData.slice(4, 7).reduce((sum, day) => sum + day.calories, 0) / 3
    const diff = secondHalf - firstHalf
    return { value: Math.round(diff), direction: diff > 50 ? 'up' : diff < -50 ? 'down' : 'stable' }
  }, [weekData])

  const maxCalories = Math.max(...weekData.map(d => d.calories), targetCalories)

  return (
    <div className="bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-zinc-200">Historique 7 jours</h3>
          <p className="text-sm text-zinc-500">Vue d'ensemble de votre semaine</p>
        </div>
        
        {/* Tendance */}
        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 rounded-xl">
          {trend.direction === 'up' && <TrendingUp className="w-4 h-4 text-rose-400" />}
          {trend.direction === 'down' && <TrendingDown className="w-4 h-4 text-emerald-400" />}
          {trend.direction === 'stable' && <Minus className="w-4 h-4 text-zinc-400" />}
          <span className={`text-sm font-medium ${
            trend.direction === 'up' ? 'text-rose-400' : 
            trend.direction === 'down' ? 'text-emerald-400' : 
            'text-zinc-400'
          }`}>
            {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '' : ''}{trend.value} kcal
          </span>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-800/50">
          <p className="text-xs text-zinc-500 mb-1">Moyenne journalière</p>
          <p className="text-2xl font-bold text-white">{avgCalories}</p>
          <p className="text-xs text-zinc-600">kcal/jour</p>
        </div>
        <div className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-800/50">
          <p className="text-xs text-zinc-500 mb-1">Objectif moyen</p>
          <p className="text-2xl font-bold text-cyan-400">{Math.round((avgCalories / targetCalories) * 100)}%</p>
          <p className="text-xs text-zinc-600">de {targetCalories} kcal</p>
        </div>
      </div>

      {/* Graphique en barres */}
      <div className="space-y-3">
        {weekData.map((day) => {
          const isToday = day.date === new Date().toISOString().split('T')[0]
          const barHeight = maxCalories > 0 ? (day.calories / maxCalories) * 100 : 0
          const targetHeight = maxCalories > 0 ? (targetCalories / maxCalories) * 100 : 0
          
          return (
            <div key={day.date} className="relative">
              <div className="flex items-center gap-3">
                {/* Day label */}
                <div className="w-12 text-right">
                  <p className={`text-xs font-medium ${isToday ? 'text-cyan-400' : 'text-zinc-500'}`}>
                    {day.dayName}
                  </p>
                </div>

                {/* Bar */}
                <div className="flex-1 relative h-10">
                  {/* Target line */}
                  <div 
                    className="absolute left-0 w-full h-full border-l-2 border-dashed border-zinc-700"
                    style={{ left: `${targetHeight}%` }}
                  />
                  
                  {/* Actual bar */}
                  <div 
                    className={`h-full rounded-r-lg transition-all duration-500 ${
                      day.calories === 0 ? 'bg-zinc-800/30' :
                      day.percentOfTarget >= 90 && day.percentOfTarget <= 110 ? 'bg-gradient-to-r from-emerald-500/30 to-emerald-500/50' :
                      day.percentOfTarget > 110 ? 'bg-gradient-to-r from-rose-500/30 to-rose-500/50' :
                      'bg-gradient-to-r from-cyan-500/30 to-cyan-500/50'
                    } ${isToday ? 'ring-2 ring-cyan-400/50' : ''}`}
                    style={{ width: `${barHeight}%` }}
                  >
                    {day.calories > 0 && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{day.calories}</span>
                        <span className="text-[10px] text-zinc-400">({day.mealsCount} repas)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Percentage */}
                <div className="w-16 text-right">
                  <span className={`text-xs font-medium ${
                    day.percentOfTarget >= 90 && day.percentOfTarget <= 110 ? 'text-emerald-400' :
                    day.percentOfTarget > 110 ? 'text-rose-400' :
                    'text-cyan-400'
                  }`}>
                    {day.percentOfTarget}%
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Légende */}
      <div className="mt-6 pt-4 border-t border-zinc-800/50 flex items-center justify-center gap-4 text-xs text-zinc-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-cyan-500/50" />
          <span>En cours</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-500/50" />
          <span>Objectif atteint</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-rose-500/50" />
          <span>Dépassement</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1 h-3 border-l-2 border-dashed border-zinc-700" />
          <span>Objectif ({targetCalories} kcal)</span>
        </div>
      </div>
    </div>
  )
}

