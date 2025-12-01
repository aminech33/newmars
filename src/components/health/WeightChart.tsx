import { memo, useMemo } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { WeightEntry } from '../../types/health'
import { Tooltip } from '../ui/Tooltip'

interface WeightChartProps {
  entries: WeightEntry[]
  trend: {
    trend: 'increasing' | 'decreasing' | 'stable'
    weeklyChange: number
  }
}

export const WeightChart = memo(function WeightChart({ entries, trend }: WeightChartProps) {
  const chartData = useMemo(() => {
    if (entries.length === 0) return []
    
    const sorted = [...entries]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14) // Last 14 entries
    
    const weights = sorted.map(e => e.weight)
    const minWeight = Math.min(...weights) - 1
    const maxWeight = Math.max(...weights) + 1
    const range = maxWeight - minWeight || 1
    
    return sorted.map(entry => ({
      ...entry,
      height: ((entry.weight - minWeight) / range) * 100,
      formattedDate: new Date(entry.date).toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short' 
      })
    }))
  }, [entries])

  if (entries.length === 0) {
    return (
      <div 
        className="bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <h2 className="text-lg font-medium text-zinc-200 mb-4">Évolution du poids</h2>
        <div className="h-48 flex items-center justify-center">
          <p className="text-zinc-600 text-sm">Ajoutez des entrées pour voir le graphique</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
      style={{ border: '1px solid rgba(255,255,255,0.08)' }}
      role="img"
      aria-label={`Graphique d'évolution du poids sur ${chartData.length} entrées`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-zinc-200">Évolution du poids</h2>
        <div className="flex items-center gap-2 text-sm">
          {trend.trend === 'increasing' && (
            <div className="flex items-center gap-1 text-rose-400">
              <TrendingUp className="w-4 h-4" aria-hidden="true" />
              <span>+{Math.abs(trend.weeklyChange)}kg/sem</span>
            </div>
          )}
          {trend.trend === 'decreasing' && (
            <div className="flex items-center gap-1 text-emerald-400">
              <TrendingDown className="w-4 h-4" aria-hidden="true" />
              <span>{trend.weeklyChange}kg/sem</span>
            </div>
          )}
          {trend.trend === 'stable' && (
            <span className="text-zinc-600">Stable</span>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 flex items-end gap-1 sm:gap-2">
        {chartData.map((entry) => (
          <Tooltip 
            key={entry.id} 
            content={`${entry.weight} kg - ${entry.formattedDate}${entry.note ? ` (${entry.note})` : ''}`}
          >
            <div className="flex-1 flex flex-col items-center gap-1 group cursor-default">
              <span className="text-xs text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">
                {entry.weight}
              </span>
              <div 
                className="w-full bg-gradient-to-t from-rose-500/60 to-rose-400/40 rounded-t-lg transition-all duration-300 hover:from-rose-500/80 hover:to-rose-400/60 min-h-[4px]"
                style={{ height: `${Math.max(entry.height, 5)}%` }}
              />
              <p className="text-[10px] text-zinc-600 truncate w-full text-center">
                {new Date(entry.date).getDate()}
              </p>
            </div>
          </Tooltip>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
        <div className="flex items-center gap-4 text-xs text-zinc-600">
          <span>Min: {Math.min(...chartData.map(e => e.weight))} kg</span>
          <span>Max: {Math.max(...chartData.map(e => e.weight))} kg</span>
        </div>
        <span className="text-xs text-zinc-600">
          {chartData.length} entrées
        </span>
      </div>
    </div>
  )
})

