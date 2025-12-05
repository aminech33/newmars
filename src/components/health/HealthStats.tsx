import { memo } from 'react'
import { Scale, Heart, Flame, Target, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Tooltip } from '../ui/Tooltip'

interface HealthStatsProps {
  latestWeight: number
  targetWeight: number
  bmi: number
  bmiLabel: string
  bmiColor: string
  todayCalories: number
  targetCalories: number
  streak: number
  trend: {
    trend: 'increasing' | 'decreasing' | 'stable'
    weeklyChange: number
  }
}

export const HealthStats = memo(function HealthStats({
  latestWeight,
  targetWeight,
  bmi,
  bmiLabel,
  bmiColor,
  todayCalories,
  targetCalories,
  streak,
  trend
}: HealthStatsProps) {
  const getTrendIcon = () => {
    if (trend.trend === 'increasing') return { Icon: TrendingUp, color: 'text-rose-400' }
    if (trend.trend === 'decreasing') return { Icon: TrendingDown, color: 'text-emerald-400' }
    return { Icon: Minus, color: 'text-zinc-600' }
  }

  const trendInfo = getTrendIcon()
  const caloriesPercent = Math.min((todayCalories / targetCalories) * 100, 100)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Poids actuel */}
      <Tooltip content="Votre dernier poids enregistré">
        <div 
          className="bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] cursor-default"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          role="region"
          aria-label="Poids actuel"
        >
          <div className="flex items-center gap-2 mb-2">
            <Scale className="w-5 h-5 text-rose-400" aria-hidden="true" />
            <p className="text-xs text-zinc-600">Poids actuel</p>
          </div>
          {latestWeight > 0 ? (
            <>
              <p className="text-4xl font-bold text-zinc-200">{latestWeight}<span className="text-xl text-zinc-500">kg</span></p>
              <div className="flex items-center gap-2 mt-2">
                <trendInfo.Icon className={`w-4 h-4 ${trendInfo.color}`} aria-hidden="true" />
                <span className={`text-xs ${trendInfo.color}`}>
                  {trend.weeklyChange > 0 ? '+' : ''}{trend.weeklyChange}kg/sem
                </span>
              </div>
              {targetWeight > 0 && (
                <p className="text-xs text-zinc-600 mt-1">Objectif: {targetWeight}kg</p>
              )}
            </>
          ) : (
            <p className="text-sm text-zinc-600">Aucune donnée</p>
          )}
        </div>
      </Tooltip>

      {/* IMC */}
      <Tooltip content="Indice de Masse Corporelle">
        <div 
          className="bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] cursor-default"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          role="region"
          aria-label="IMC"
        >
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-indigo-400" aria-hidden="true" />
            <p className="text-xs text-zinc-600">IMC</p>
          </div>
          {bmi > 0 ? (
            <>
              <p className="text-4xl font-bold text-zinc-200">{bmi}</p>
              <p className={`text-xs ${bmiColor} mt-1`}>{bmiLabel}</p>
              {/* Progress bar IMC */}
              <div 
                className="mt-3 h-1.5 bg-zinc-800 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={bmi}
                aria-valuemin={0}
                aria-valuemax={40}
                aria-label="Indice de masse corporelle"
              >
                <div 
                  className={`h-full rounded-full transition-[width] duration-500 ${
                    bmiColor.includes('emerald') ? 'bg-emerald-500' :
                    bmiColor.includes('amber') ? 'bg-amber-500' :
                    bmiColor.includes('orange') ? 'bg-orange-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min((bmi / 40) * 100, 100)}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-zinc-600">--</p>
          )}
        </div>
      </Tooltip>

      {/* Calories */}
      <Tooltip content="Calories consommées aujourd'hui">
        <div 
          className="bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] cursor-default"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          role="region"
          aria-label="Calories"
        >
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-orange-400" aria-hidden="true" />
            <p className="text-xs text-zinc-600">Calories</p>
          </div>
          <p className="text-4xl font-bold text-zinc-200">{todayCalories}</p>
          <p className="text-xs text-zinc-600 mt-1">/ {targetCalories} kcal</p>
          {/* Progress bar calories */}
          <div 
            className="mt-3 h-1.5 bg-zinc-800 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={todayCalories}
            aria-valuemin={0}
            aria-valuemax={targetCalories}
            aria-label="Calories consommées"
          >
            <div 
              className={`h-full rounded-full transition-[width] duration-500 ${
                todayCalories > targetCalories ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${caloriesPercent}%` }}
            />
          </div>
        </div>
      </Tooltip>

      {/* Streak */}
      <Tooltip content="Jours consécutifs de suivi">
        <div 
          className="bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] cursor-default"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          role="region"
          aria-label="Streak"
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-emerald-400" aria-hidden="true" />
            <p className="text-xs text-zinc-600">Streak</p>
          </div>
          <p className="text-4xl font-bold text-zinc-200">{streak}</p>
          <p className="text-xs text-zinc-600 mt-1">jours consécutifs</p>
          {streak >= 7 && (
            <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
              🔥 En feu !
            </span>
          )}
        </div>
      </Tooltip>
    </div>
  )
})

