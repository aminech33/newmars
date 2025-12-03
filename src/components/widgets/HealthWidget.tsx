import { memo } from 'react'
import { Heart, TrendingDown, TrendingUp, Minus, Activity } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { calculateBMI, getBMICategory, analyzeWeightTrend } from '../../utils/healthIntelligence'
import { Widget } from '../../types/widgets'

interface HealthWidgetProps {
  widget: Widget
}

export const HealthWidget = memo(function HealthWidget({ widget }: HealthWidgetProps) {
  const { id } = widget
  const { weightEntries, mealEntries, healthGoals, userProfile, setView } = useStore()

  // Calculer les stats
  const latestWeight = weightEntries.length > 0 
    ? weightEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].weight
    : 0

  const weightGoal = healthGoals.find(g => g.type === 'weight' && g.active)
  const targetWeight = weightGoal?.target || 0

  const trend = analyzeWeightTrend(weightEntries)
  
  const getTrendIcon = () => {
    if (trend.trend === 'increasing') return { icon: TrendingUp, color: 'text-rose-400', text: `+${Math.abs(trend.weeklyChange)}kg` }
    if (trend.trend === 'decreasing') return { icon: TrendingDown, color: 'text-emerald-400', text: `${trend.weeklyChange}kg` }
    return { icon: Minus, color: 'text-zinc-500', text: 'Stable' }
  }

  const trendInfo = getTrendIcon()
  const TrendIcon = trendInfo.icon

  // Calories aujourd'hui
  const today = new Date().toISOString().split('T')[0]
  const todayMeals = mealEntries.filter(m => m.date === today)
  const todayCalories = todayMeals.reduce((sum, m) => sum + m.calories, 0)
  
  const caloriesGoal = healthGoals.find(g => g.type === 'calories' && g.active)
  const targetCalories = caloriesGoal?.target || 2000
  const caloriesPercent = Math.min((todayCalories / targetCalories) * 100, 100)

  // BMI
  const bmi = latestWeight > 0 ? calculateBMI(latestWeight, userProfile.height) : 0
  const bmiCategory = getBMICategory(bmi)

  return (
    <WidgetContainer id={id} title="" currentSize="notification" onClick={() => setView('health')}>
      <div className="h-full flex flex-col p-6 gap-4">
        {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <Heart className="w-12 h-12 text-rose-400" strokeWidth={1.5} />
              </div>
          {latestWeight > 0 && (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${
              trend.trend === 'decreasing' 
                ? 'bg-emerald-500/20' 
                : trend.trend === 'increasing'
                ? 'bg-rose-500/20'
                : 'bg-zinc-700/50'
            }`}>
              <TrendIcon className={`w-4 h-4 ${trendInfo.color}`} />
              <span className={`text-xs font-medium ${trendInfo.color}`}>{trendInfo.text}</span>
            </div>
          )}
        </div>

        {/* Big Weight */}
        <div className="text-center">
          {latestWeight > 0 ? (
            <>
              <div className="text-6xl font-bold text-white tabular-nums leading-none">
                {latestWeight}
                <span className="text-2xl text-zinc-500">kg</span>
              </div>
              <div className="text-sm text-zinc-500 uppercase tracking-wide mt-2">
                poids actuel
              </div>
            </>
          ) : (
            <div className="text-sm text-zinc-500 py-8">
              Aucune donnée
            </div>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="flex-1 space-y-2">
          {/* BMI */}
          {bmi > 0 && (
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-zinc-400">IMC</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-white">{bmi.toFixed(1)}</div>
                <div className="text-[10px] text-zinc-500">{bmiCategory.label}</div>
              </div>
            </div>
          )}

          {/* Calories */}
          {todayCalories > 0 && (
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-400">Calories</span>
                <span className="text-xs font-bold text-white tabular-nums">
                  {todayCalories}/{targetCalories}
                </span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-500"
                  style={{ width: `${caloriesPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer - Weight Goal */}
        {weightGoal && targetWeight > 0 && (
          <div className="pt-2 border-t border-white/10 text-center">
            <div className="text-xs text-zinc-400">
              Objectif: <span className="text-white font-medium">{targetWeight}kg</span>
            </div>
            <div className="text-[10px] text-zinc-600 mt-1">
              {latestWeight > targetWeight 
                ? `${(latestWeight - targetWeight).toFixed(1)}kg à perdre` 
                : `Objectif atteint !`
              }
            </div>
          </div>
        )}
      </div>
    </WidgetContainer>
  )
})
