import { memo } from 'react'
import { Heart, TrendingDown, TrendingUp, Minus, Flame, Activity, ArrowRight } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { calculateBMI, getBMICategory, analyzeWeightTrend } from '../../utils/healthIntelligence'
import { Widget } from '../../types/widgets'

interface HealthWidgetProps {
  widget: Widget
}

export const HealthWidget = memo(function HealthWidget({ widget }: HealthWidgetProps) {
  const { id, size = 'small' } = widget
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

  // SMALL - One main metric (Weight)
  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="" currentSize={size} onClick={() => setView('health')}>
        <div className="h-full flex flex-col justify-between p-4">
          {/* Main metric - Weight */}
          <div>
            <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
              Santé
            </div>
            {latestWeight > 0 ? (
              <>
                <div className="text-5xl font-bold text-white tabular-nums leading-none mb-2">
                  {latestWeight}
                  <span className="text-2xl text-zinc-500">kg</span>
                </div>
                <div className={`flex items-center gap-1.5 ${trendInfo.color}`}>
                  <TrendIcon className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">{trendInfo.text}</span>
                </div>
              </>
            ) : (
              <div className="text-sm text-zinc-600">Aucune donnée</div>
            )}
          </div>

          {/* Secondary metric - Calories badge */}
          <div className="p-2.5 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs text-zinc-400 font-medium">Calories</span>
              </div>
              <span className="text-xs text-white font-semibold tabular-nums">{todayCalories}</span>
            </div>
          </div>
        </div>
      </WidgetContainer>
    )
  }

  // MEDIUM - Weight + Calories with progress
  if (size === 'medium') {
    return (
      <WidgetContainer 
        id={id} 
        title="Santé"
        currentSize={size}
        onClick={() => setView('health')}
        actions={
          <button
            onClick={(e) => {
              e.stopPropagation()
              setView('health')
            }}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        }
      >
        <div className="h-full flex flex-col gap-3">
          {/* Weight Card */}
          {latestWeight > 0 && (
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs text-zinc-500 mb-0.5">Poids actuel</div>
                  <div className="text-3xl font-bold text-white tabular-nums">
                    {latestWeight}
                    <span className="text-lg text-zinc-500">kg</span>
                  </div>
                </div>
                <div className={`flex items-center gap-1 ${trendInfo.color}`}>
                  <TrendIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">{trendInfo.text}</span>
                </div>
              </div>
              
              {/* Progress to goal */}
              {targetWeight > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                    <span>Objectif</span>
                    <span className="tabular-nums">{targetWeight}kg</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-pink-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((latestWeight / targetWeight) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Calories Card */}
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-zinc-500">Calories aujourd'hui</span>
            </div>
            <div className="text-2xl font-bold text-white tabular-nums mb-2">
              {todayCalories} 
              <span className="text-sm font-normal text-zinc-500">/{targetCalories}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  todayCalories > targetCalories ? 'bg-rose-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${caloriesPercent}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="mt-auto grid grid-cols-2 gap-2">
            <div className="p-2 bg-white/5 rounded-lg border border-white/10 text-center">
              <div className="text-xs text-zinc-600 uppercase tracking-wide">IMC</div>
              <div className="text-lg font-bold text-white tabular-nums">{bmi > 0 ? bmi.toFixed(1) : '--'}</div>
            </div>
            <div className="p-2 bg-white/5 rounded-lg border border-white/10 text-center">
              <div className="text-xs text-zinc-600 uppercase tracking-wide">Repas</div>
              <div className="text-lg font-bold text-white tabular-nums">{todayMeals.length}</div>
            </div>
          </div>
        </div>
      </WidgetContainer>
    )
  }

  // LARGE - Full dashboard
  return (
    <WidgetContainer 
      id={id} 
      title="Santé"
      currentSize={size}
      onClick={() => setView('health')}
      actions={
        <button
          onClick={(e) => {
            e.stopPropagation()
            setView('health')
          }}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      }
    >
      <div className="h-full flex flex-col gap-3">
        {/* Main metrics */}
        <div className="grid grid-cols-2 gap-3">
          {/* Weight */}
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-pink-400" />
              <span className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Poids</span>
            </div>
            {latestWeight > 0 ? (
              <>
                <div className="text-3xl font-bold text-white tabular-nums mb-1">
                  {latestWeight}<span className="text-lg text-zinc-500">kg</span>
                </div>
                <div className={`flex items-center gap-1 text-xs ${trendInfo.color}`}>
                  <TrendIcon className="w-3.5 h-3.5" />
                  <span className="font-medium">{trendInfo.text}/sem</span>
                </div>
              </>
            ) : (
              <div className="text-sm text-zinc-600">Aucune donnée</div>
            )}
          </div>

          {/* Calories */}
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Calories</span>
            </div>
            <div className="text-3xl font-bold text-white tabular-nums mb-1">{todayCalories}</div>
            <div className="text-xs text-zinc-600">
              {Math.round(caloriesPercent)}% de {targetCalories} kcal
            </div>
          </div>
        </div>

        {/* Progress bars */}
        {targetWeight > 0 && latestWeight > 0 && (
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
              <span>Objectif poids</span>
              <span className="font-medium tabular-nums">{latestWeight}kg → {targetWeight}kg</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-pink-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((latestWeight / targetWeight) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Calories aujourd'hui
            </span>
            <span className="font-medium tabular-nums">{todayCalories} / {targetCalories} kcal</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                todayCalories > targetCalories ? 'bg-rose-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${caloriesPercent}%` }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-center">
            <div className="text-xs text-zinc-600 mb-1 uppercase tracking-wide">IMC</div>
            <div className="text-2xl font-bold text-white tabular-nums">{bmi > 0 ? bmi.toFixed(1) : '--'}</div>
            <div className="text-[9px] text-zinc-600">{bmi > 0 ? bmiCategory : ''}</div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-center">
            <Activity className="w-4 h-4 text-pink-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-white tabular-nums">{todayMeals.length}</div>
            <div className="text-[9px] text-zinc-600 uppercase tracking-wide">Repas</div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-center">
            <Heart className="w-4 h-4 text-pink-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-white tabular-nums">{weightEntries.length}</div>
            <div className="text-[9px] text-zinc-600 uppercase tracking-wide">Entrées</div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  )
})
