import { useMemo } from 'react'
import { Target, TrendingUp, TrendingDown, Check } from 'lucide-react'
import { MealEntry } from '../../types/health'

interface DailyCalorieTrackerProps {
  todayMeals: MealEntry[]
  targetCalories: number
  targetProtein?: number
  targetCarbs?: number
  targetFat?: number
}

export function DailyCalorieTracker({ 
  todayMeals, 
  targetCalories,
  targetProtein = 0,
  targetCarbs = 0,
  targetFat = 0
}: DailyCalorieTrackerProps) {
  
  // Calculer les totaux du jour
  const dailyTotals = useMemo(() => {
    return todayMeals.reduce((acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + (meal.protein || 0),
      carbs: acc.carbs + (meal.carbs || 0),
      fat: acc.fat + (meal.fat || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
  }, [todayMeals])

  // Calculs
  const caloriesRemaining = targetCalories - dailyTotals.calories
  const percentageConsumed = Math.round((dailyTotals.calories / targetCalories) * 100)
  const isOverTarget = dailyTotals.calories > targetCalories
  const isNearTarget = Math.abs(caloriesRemaining) <= 100
  
  // Couleurs dynamiques
  const getProgressColor = () => {
    if (isOverTarget) return 'bg-rose-500'
    if (isNearTarget) return 'bg-emerald-500'
    if (percentageConsumed >= 75) return 'bg-amber-500'
    return 'bg-cyan-500'
  }

  const getTextColor = () => {
    if (isOverTarget) return 'text-rose-400'
    if (isNearTarget) return 'text-emerald-400'
    return 'text-cyan-400'
  }

  return (
    <div className="bg-gradient-to-br from-zinc-900/50 to-zinc-800/30 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/50 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-zinc-200">Objectif du jour</h3>
        </div>
        <div className="flex items-center gap-2">
          {isOverTarget ? (
            <TrendingUp className="w-4 h-4 text-rose-400" />
          ) : isNearTarget ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-cyan-400" />
          )}
          <span className={`text-sm font-medium ${getTextColor()}`}>
            {percentageConsumed}%
          </span>
        </div>
      </div>

      {/* Calories principales */}
      <div className="mb-6">
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <span className="text-4xl font-bold text-white">
              {dailyTotals.calories.toLocaleString()}
            </span>
            <span className="text-zinc-500 text-lg ml-2">
              / {targetCalories.toLocaleString()} kcal
            </span>
          </div>
        </div>

        {/* Barre de progression */}
        <div 
          className="relative h-3 bg-zinc-800 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={dailyTotals.calories}
          aria-valuemin={0}
          aria-valuemax={targetCalories}
          aria-label="Calories consommées aujourd'hui"
        >
          <div 
            className={`absolute inset-y-0 left-0 ${getProgressColor()} transition-[width] duration-500 rounded-full`}
            style={{ width: `${Math.min(percentageConsumed, 100)}%` }}
          />
          {/* Indicateur de dépassement */}
          {isOverTarget && (
            <div 
              className="absolute inset-y-0 left-0 bg-rose-500/30 rounded-full"
              style={{ width: '100%' }}
            />
          )}
        </div>

        {/* Message de statut */}
        <div className="mt-3 text-center">
          {isOverTarget ? (
            <p className="text-sm text-rose-400 font-medium">
              ⚠️ Dépassement de {Math.abs(caloriesRemaining)} kcal
            </p>
          ) : isNearTarget ? (
            <p className="text-sm text-emerald-400 font-medium flex items-center justify-center gap-2">
              <Check className="w-4 h-4" aria-hidden="true" />
              Objectif atteint ! Excellent travail 🎉
            </p>
          ) : (
            <p className="text-sm text-zinc-400">
              Il reste <span className={`font-bold ${getTextColor()}`}>
                {caloriesRemaining} kcal
              </span> à consommer
            </p>
          )}
        </div>
      </div>

      {/* Macros détaillées */}
      <div className="grid grid-cols-3 gap-4">
        {/* Protéines */}
        <div className="bg-zinc-800/30 rounded-xl p-3 border border-zinc-800/50">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2 h-2 rounded-full bg-rose-400" />
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Protéines</p>
          </div>
          <p className="text-xl font-bold text-rose-400">{dailyTotals.protein.toFixed(1)}g</p>
          {targetProtein > 0 && (
            <div className="mt-1">
              <div 
                className="h-1 bg-zinc-900 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={dailyTotals.protein}
                aria-valuemin={0}
                aria-valuemax={targetProtein}
                aria-label="Protéines consommées"
              >
                <div 
                  className="h-full bg-rose-400 transition-[width] duration-300"
                  style={{ width: `${Math.min((dailyTotals.protein / targetProtein) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-zinc-600 mt-0.5">sur {targetProtein}g</p>
            </div>
          )}
        </div>

        {/* Glucides */}
        <div className="bg-zinc-800/30 rounded-xl p-3 border border-zinc-800/50">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Glucides</p>
          </div>
          <p className="text-xl font-bold text-amber-400">{dailyTotals.carbs.toFixed(1)}g</p>
          {targetCarbs > 0 && (
            <div className="mt-1">
              <div 
                className="h-1 bg-zinc-900 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={dailyTotals.carbs}
                aria-valuemin={0}
                aria-valuemax={targetCarbs}
                aria-label="Glucides consommés"
              >
                <div 
                  className="h-full bg-amber-400 transition-[width] duration-300"
                  style={{ width: `${Math.min((dailyTotals.carbs / targetCarbs) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-zinc-600 mt-0.5">sur {targetCarbs}g</p>
            </div>
          )}
        </div>

        {/* Lipides */}
        <div className="bg-zinc-800/30 rounded-xl p-3 border border-zinc-800/50">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Lipides</p>
          </div>
          <p className="text-xl font-bold text-yellow-400">{dailyTotals.fat.toFixed(1)}g</p>
          {targetFat > 0 && (
            <div className="mt-1">
              <div 
                className="h-1 bg-zinc-900 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={dailyTotals.fat}
                aria-valuemin={0}
                aria-valuemax={targetFat}
                aria-label="Lipides consommés"
              >
                <div 
                  className="h-full bg-yellow-400 transition-[width] duration-300"
                  style={{ width: `${Math.min((dailyTotals.fat / targetFat) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-zinc-600 mt-0.5">sur {targetFat}g</p>
            </div>
          )}
        </div>
      </div>

      {/* Repas du jour */}
      {todayMeals.length > 0 && (
        <div className="mt-4 pt-4 border-t border-zinc-800/50">
          <p className="text-xs text-zinc-500 mb-2">Repas d'aujourd'hui ({todayMeals.length})</p>
          <div className="space-y-1.5">
            {todayMeals.map((meal) => (
              <div 
                key={meal.id}
                className="flex items-center justify-between text-xs bg-zinc-800/20 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-base">
                    {meal.type === 'breakfast' && '🌅'}
                    {meal.type === 'lunch' && '☀️'}
                    {meal.type === 'dinner' && '🌙'}
                    {meal.type === 'snack' && '🍎'}
                  </span>
                  <span className="text-zinc-400 truncate">{meal.name}</span>
                </div>
                <span className="text-orange-400 font-medium ml-2 flex-shrink-0">
                  {meal.calories} kcal
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

