import { memo } from 'react'
import { Heart, TrendingDown, TrendingUp, Minus, Activity, Plus } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { calculateBMI, analyzeWeightTrend } from '../../utils/healthIntelligence'
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
  // bmiCategory disponible si besoin: getBMICategory(bmi)

  // Historique 7 derniers jours (mini graphique)
  const last7Days = weightEntries
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7)
    .reverse()

  return (
    <WidgetContainer id={id} title="" currentSize="notification" onClick={() => setView('health')}>
      <div className="h-full flex flex-col p-5 gap-2.5">
        {/* Header compact */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-400 hover-glow" strokeWidth={1.5} />
            {latestWeight > 0 && (
              <>
                <div className="text-3xl font-bold text-white tabular-nums leading-none font-mono-display number-glow">
                  {latestWeight}
                </div>
                <div className="text-[10px] text-rose-400/80 uppercase tracking-wider font-semibold">
                  KG
                </div>
              </>
            )}
          </div>
          {latestWeight > 0 && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
              trend.trend === 'decreasing' 
                ? 'bg-emerald-500/20' 
                : trend.trend === 'increasing'
                ? 'bg-rose-500/20'
                : 'bg-zinc-700/50'
            }`}>
              <TrendIcon className={`w-3 h-3 ${trendInfo.color}`} />
              <span className={`text-[10px] font-medium ${trendInfo.color}`}>{trendInfo.text}</span>
            </div>
          )}
        </div>

        {latestWeight > 0 ? (
          <>
            {/* Mini graphique 7 jours */}
            {last7Days.length > 1 && (
              <div className="h-12 flex items-end gap-1">
                {last7Days.map((entry, i) => {
                  const maxWeight = Math.max(...last7Days.map(e => e.weight))
                  const minWeight = Math.min(...last7Days.map(e => e.weight))
                  const range = maxWeight - minWeight || 1
                  const height = ((entry.weight - minWeight) / range) * 100
                  
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full chart-bar-rose rounded-t transition-colors hover:scale-105"
                        style={{ height: `${Math.max(30, height)}%` }}
                      />
                      <div className="text-[8px] text-zinc-600 font-semibold">
                        {new Date(entry.date).getDate()}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Stats Grid */}
            <div className="flex-1 space-y-1.5">
              {/* BMI */}
              {bmi > 0 && (
                <div className="flex items-center justify-between p-2 gradient-border-emerald rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] text-zinc-400 font-medium">IMC</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white tabular-nums">{bmi.toFixed(1)}</div>
                  </div>
                </div>
              )}

              {/* Calories aujourd'hui */}
              <div className="p-2 gradient-border-rose rounded-lg">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-zinc-400 font-medium">Calories aujourd'hui</span>
                  <span className="text-xs font-bold text-white tabular-nums">
                    {todayCalories}
                    <span className="text-zinc-600">/{targetCalories}</span>
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-colors duration-500 shadow-lg shadow-rose-500/30"
                    style={{ width: `${caloriesPercent}%` }}
                  />
                </div>
              </div>

              {/* Objectif poids */}
              {weightGoal && targetWeight > 0 && (
                <div className="p-2 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400 font-medium">Objectif</span>
                    <span className="text-xs font-bold text-white tabular-nums">{targetWeight}kg</span>
                  </div>
                  {latestWeight > targetWeight && (
                    <div className="text-[10px] text-zinc-600 mt-1">
                      {(latestWeight - targetWeight).toFixed(1)}kg à perdre
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer - Repas aujourd'hui */}
            {todayMeals.length > 0 && (
              <div className="pt-2 border-t border-white/10 text-center">
                <span className="text-[10px] text-rose-400 font-semibold">
                  {todayMeals.length} repas enregistré{todayMeals.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
            <Heart className="w-12 h-12 text-rose-400/40" />
            <div className="text-sm text-zinc-400 font-medium">
              Démarrer le Suivi ?
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setView('health')
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg
                        bg-gradient-to-br from-rose-500 to-rose-600
                        shadow-lg shadow-rose-500/30
                        hover:shadow-xl hover:shadow-rose-500/40
                        hover:scale-105 transition-colors duration-200"
            >
              <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
              <span className="text-xs font-bold text-white uppercase tracking-wide">
                ACTIVER
              </span>
            </button>
          </div>
        )}
      </div>
    </WidgetContainer>
  )
})
