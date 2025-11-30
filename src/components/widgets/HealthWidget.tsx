import { Heart, TrendingDown, TrendingUp, Minus, Flame, Apple } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { calculateBMI, getBMICategory, analyzeWeightTrend } from '../../utils/healthIntelligence'

interface HealthWidgetProps {
  id: string
  size: 'small' | 'medium' | 'large'
}

export function HealthWidget({ id, size }: HealthWidgetProps) {
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
    return { icon: Minus, color: 'text-zinc-600', text: 'Stable' }
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
  const caloriesColor = todayCalories > targetCalories ? 'text-rose-400' : 'text-emerald-400'

  // BMI
  const bmi = latestWeight > 0 ? calculateBMI(latestWeight, userProfile.height) : 0
  const bmiCategory = getBMICategory(bmi)

  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="Santé" currentSize={size} onClick={() => setView('health')}>
        <div className="flex flex-col items-center justify-center h-full">
          <Heart className="w-8 h-8 text-rose-400 mb-2" />
          {latestWeight > 0 ? (
            <>
              <p className="text-2xl font-bold text-zinc-200">{latestWeight}kg</p>
              <div className={`flex items-center gap-1 text-xs ${trendInfo.color}`}>
                <TrendIcon className="w-3 h-3" />
                <span>{trendInfo.text}</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-zinc-600">Aucune donnée</p>
          )}
        </div>
      </WidgetContainer>
    )
  }

  if (size === 'medium') {
    return (
      <WidgetContainer id={id} title="Santé & Nutrition" currentSize={size} onClick={() => setView('health')}>
        <div className="space-y-4">
          {/* Poids */}
          {latestWeight > 0 && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-600">Poids actuel</p>
                <p className="text-2xl font-bold text-zinc-200">{latestWeight}kg</p>
              </div>
              <div className={`flex items-center gap-1 ${trendInfo.color}`}>
                <TrendIcon className="w-4 h-4" />
                <span className="text-sm">{trendInfo.text}</span>
              </div>
            </div>
          )}

          {/* Objectif poids */}
          {targetWeight > 0 && latestWeight > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-600 mb-1">
                <span>Objectif</span>
                <span>{targetWeight}kg</span>
              </div>
              <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-rose-500/60 to-rose-400/40 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((latestWeight / targetWeight) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Calories */}
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-600 mb-1">
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3" />
                Calories
              </span>
              <span className={caloriesColor}>{todayCalories} / {targetCalories}</span>
            </div>
            <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  todayCalories > targetCalories 
                    ? 'bg-gradient-to-r from-rose-500/60 to-rose-400/40' 
                    : 'bg-gradient-to-r from-emerald-500/60 to-emerald-400/40'
                }`}
                style={{ width: `${caloriesPercent}%` }}
              />
            </div>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-900">
            <div className="text-center">
              <p className="text-xs text-zinc-600">IMC</p>
              <p className="text-lg font-bold text-zinc-200">{bmi > 0 ? bmi : '--'}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-zinc-600">Repas</p>
              <p className="text-lg font-bold text-zinc-200">{todayMeals.length}</p>
            </div>
          </div>
        </div>
      </WidgetContainer>
    )
  }

  // Large size
  return (
    <WidgetContainer id={id} title="Santé & Nutrition" currentSize={size} onClick={() => setView('health')}>
      <div className="space-y-4">
        {/* Poids & Objectif */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-rose-400" />
              <p className="text-xs text-zinc-600">Poids actuel</p>
            </div>
            {latestWeight > 0 ? (
              <>
                <p className="text-3xl font-bold text-zinc-200">{latestWeight}kg</p>
                <div className={`flex items-center gap-1 text-xs ${trendInfo.color} mt-1`}>
                  <TrendIcon className="w-3 h-3" />
                  <span>{trendInfo.text}/sem</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-zinc-600">Aucune donnée</p>
            )}
          </div>

          <div className="bg-zinc-900/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Apple className="w-4 h-4 text-emerald-400" />
              <p className="text-xs text-zinc-600">Calories</p>
            </div>
            <p className="text-3xl font-bold text-zinc-200">{todayCalories}</p>
            <p className={`text-xs ${caloriesColor} mt-1`}>
              {targetCalories > 0 ? `${Math.round(caloriesPercent)}% de l'objectif` : 'Aucun objectif'}
            </p>
          </div>
        </div>

        {/* Barre de progression objectif poids */}
        {targetWeight > 0 && latestWeight > 0 && (
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-600 mb-2">
              <span>Objectif poids</span>
              <span>{latestWeight}kg → {targetWeight}kg</span>
            </div>
            <div className="h-3 bg-zinc-900 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-rose-500/60 to-rose-400/40 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((latestWeight / targetWeight) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Barre de progression calories */}
        <div>
          <div className="flex items-center justify-between text-xs text-zinc-600 mb-2">
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3" />
              Calories aujourd'hui
            </span>
            <span className={caloriesColor}>{todayCalories} / {targetCalories} kcal</span>
          </div>
          <div className="h-3 bg-zinc-900 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                todayCalories > targetCalories 
                  ? 'bg-gradient-to-r from-rose-500/60 to-rose-400/40' 
                  : 'bg-gradient-to-r from-emerald-500/60 to-emerald-400/40'
              }`}
              style={{ width: `${caloriesPercent}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-900">
          <div className="text-center">
            <p className="text-xs text-zinc-600">IMC</p>
            <p className="text-xl font-bold text-zinc-200">{bmi > 0 ? bmi : '--'}</p>
            <p className="text-xs text-zinc-600">{bmi > 0 ? bmiCategory : ''}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-zinc-600">Repas</p>
            <p className="text-xl font-bold text-zinc-200">{todayMeals.length}</p>
            <p className="text-xs text-zinc-600">aujourd'hui</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-zinc-600">Entrées</p>
            <p className="text-xl font-bold text-zinc-200">{weightEntries.length}</p>
            <p className="text-xs text-zinc-600">poids</p>
          </div>
        </div>
      </div>
    </WidgetContainer>
  )
}
