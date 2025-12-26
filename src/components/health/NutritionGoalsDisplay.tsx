import { memo, useMemo } from 'react'
import { Target, TrendingUp, TrendingDown, Minus, Check, AlertCircle } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Tooltip } from '../ui/Tooltip'

export const NutritionGoalsDisplay = memo(function NutritionGoalsDisplay() {
  const { mealEntries, healthGoals } = useStore()
  
  const today = new Date().toISOString().split('T')[0]
  const todayMeals = useMemo(() => 
    mealEntries.filter(m => m.date === today),
    [mealEntries, today]
  )
  
  // Totaux du jour
  const todayTotals = useMemo(() => ({
    calories: todayMeals.reduce((sum, m) => sum + m.calories, 0),
    protein: todayMeals.reduce((sum, m) => sum + (m.protein || 0), 0),
    carbs: todayMeals.reduce((sum, m) => sum + (m.carbs || 0), 0),
    fat: todayMeals.reduce((sum, m) => sum + (m.fat || 0), 0)
  }), [todayMeals])
  
  // Objectifs actifs
  const caloriesGoal = healthGoals.find(g => g.type === 'calories' && g.active)?.target || 2000
  const proteinGoal = healthGoals.find(g => g.type === 'protein' && g.active)?.target || 150
  
  // Calculer glucides et lipides recommandés (si pas d'objectif spécifique)
  const carbsGoal = Math.round(caloriesGoal * 0.4 / 4) // 40% des calories, 4 cal/g
  const fatGoal = Math.round(caloriesGoal * 0.3 / 9) // 30% des calories, 9 cal/g
  
  const goals = [
    {
      name: 'Calories',
      current: todayTotals.calories,
      target: caloriesGoal,
      unit: 'kcal',
      color: 'orange',
      icon: Target,
      description: 'Énergie totale'
    },
    {
      name: 'Protéines',
      current: todayTotals.protein,
      target: proteinGoal,
      unit: 'g',
      color: 'rose',
      icon: TrendingUp,
      description: 'Muscles & récupération'
    },
    {
      name: 'Glucides',
      current: todayTotals.carbs,
      target: carbsGoal,
      unit: 'g',
      color: 'amber',
      icon: TrendingUp,
      description: 'Énergie & performance'
    },
    {
      name: 'Lipides',
      current: todayTotals.fat,
      target: fatGoal,
      unit: 'g',
      color: 'yellow',
      icon: TrendingUp,
      description: 'Hormones & vitamines'
    }
  ]
  
  const getProgressColor = (percent: number) => {
    if (percent >= 90 && percent <= 110) return 'emerald' // Zone verte
    if (percent >= 80 && percent < 90) return 'cyan' // Légèrement en-dessous
    if (percent > 110 && percent <= 120) return 'amber' // Légèrement au-dessus
    if (percent > 120) return 'rose' // Trop au-dessus
    return 'zinc' // Pas assez
  }
  
  const getStatusIcon = (percent: number) => {
    if (percent >= 90 && percent <= 110) return Check
    if (percent > 120) return AlertCircle
    return Minus
  }
  
  return (
    <div 
      className="bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
      style={{ border: '1px solid rgba(255,255,255,0.08)' }}
      role="region"
      aria-label="Objectifs nutritionnels"
    >
      <h3 className="text-lg font-medium text-zinc-200 mb-6 flex items-center gap-2">
        <Target className="w-5 h-5 text-indigo-400" />
        Objectifs du jour
      </h3>
      
      <div className="space-y-5">
        {goals.map((goal) => {
          const percent = (goal.current / goal.target) * 100
          const progressColor = getProgressColor(percent)
          const StatusIcon = getStatusIcon(percent)
          const remaining = goal.target - goal.current
          
          return (
            <div key={goal.name} className="space-y-2">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <goal.icon className={`w-4 h-4 text-${goal.color}-400`} aria-hidden="true" />
                  <span className="text-sm font-medium text-zinc-300">{goal.name}</span>
                  <Tooltip content={goal.description}>
                    <span className="text-xs text-zinc-600 cursor-help">ℹ️</span>
                  </Tooltip>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold text-${goal.color}-400`}>
                    {Math.round(goal.current)}
                  </span>
                  <span className="text-xs text-zinc-600">/</span>
                  <span className="text-sm text-zinc-500">
                    {goal.target} {goal.unit}
                  </span>
                  
                  <Tooltip content={
                    percent >= 90 && percent <= 110 
                      ? '✅ Objectif atteint !' 
                      : percent > 120 
                      ? '⚠️ Dépassement significatif'
                      : `${remaining > 0 ? 'Reste' : 'Excès de'} ${Math.abs(Math.round(remaining))} ${goal.unit}`
                  }>
                    <StatusIcon 
                      className={`w-4 h-4 text-${progressColor}-400`} 
                      aria-label={`Statut ${goal.name}`}
                    />
                  </Tooltip>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="relative">
                <div 
                  className="h-2 bg-zinc-800 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={goal.current}
                  aria-valuemin={0}
                  aria-valuemax={goal.target}
                  aria-label={`${goal.name} : ${Math.round(percent)}%`}
                >
                  <div 
                    className={`h-full bg-gradient-to-r from-${goal.color}-500 to-${goal.color}-400 rounded-full transition-[width] duration-500`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
                
                {/* Markers pour zone idéale (90-110%) */}
                <div className="absolute top-0 left-[90%] w-px h-2 bg-emerald-500/50" />
                <div className="absolute top-0 right-0 w-px h-2 bg-rose-500/50" />
              </div>
              
              {/* Percentage & Remaining */}
              <div className="flex items-center justify-between text-xs">
                <span className={`text-${progressColor}-400 font-medium`}>
                  {Math.round(percent)}%
                </span>
                
                {remaining > 0 ? (
                  <span className="text-zinc-600">
                    Reste <span className="text-zinc-500 font-medium">{Math.round(remaining)} {goal.unit}</span>
                  </span>
                ) : (
                  <span className="text-rose-400">
                    Excès de <span className="font-medium">{Math.abs(Math.round(remaining))} {goal.unit}</span>
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Zone idéale légende */}
      <div className="mt-6 pt-4 border-t border-zinc-800/50">
        <div className="flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-zinc-500">90-110% = Zone idéale</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-zinc-500">80-120% = Acceptable</span>
          </div>
        </div>
      </div>
      
      {/* Résumé global */}
      <div className="mt-4 p-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Objectifs atteints aujourd'hui</span>
          <span className="text-lg font-bold text-indigo-400">
            {goals.filter(g => {
              const p = (g.current / g.target) * 100
              return p >= 90 && p <= 110
            }).length} / {goals.length}
          </span>
        </div>
      </div>
    </div>
  )
})




