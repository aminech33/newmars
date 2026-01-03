import { memo, useMemo } from 'react'
import { TrendingUp, TrendingDown, Scale } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts'
import { WeightEntry } from '../../types/health'

interface WeightChartProps {
  entries: WeightEntry[]
  trend: {
    trend: 'increasing' | 'decreasing' | 'stable'
    weeklyChange: number
  }
  compact?: boolean
  targetWeight?: number // Poids objectif pour afficher la prédiction
  predictedWeeks?: number // Nombre de semaines estimées pour atteindre l'objectif
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload }: TooltipProps<number, string> & { payload?: any[] }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as any
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-xl">
        <div className="font-bold text-rose-400">{data.weight.toFixed(1)} kg</div>
        <div className="text-zinc-500 text-[10px] mt-0.5">{data.formattedDate}</div>
        {data.note && (
          <div className="text-zinc-400 text-[10px] mt-1 max-w-[120px]">{data.note}</div>
        )}
      </div>
    )
  }
  return null
}

export const WeightChart = memo(function WeightChart({ entries, trend, compact = false, targetWeight, predictedWeeks }: WeightChartProps) {
  const chartData = useMemo(() => {
    if (entries.length === 0) return []
    
    const sorted = [...entries]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(compact ? -7 : -14)
    
    const data = sorted.map((entry) => ({
      ...entry,
      weight: entry.weight,
      formattedDate: new Date(entry.date).toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short' 
      }),
      dateShort: new Date(entry.date).toLocaleDateString('fr-FR', { 
        day: 'numeric'
      })
    }))
    
    // Ajouter la prédiction si disponible
    if (targetWeight && predictedWeeks && predictedWeeks !== Infinity && predictedWeeks > 0) {
      const lastEntry = sorted[sorted.length - 1]
      const lastDate = new Date(lastEntry.date)
      const predictedDate = new Date(lastDate)
      predictedDate.setDate(predictedDate.getDate() + predictedWeeks * 7)
      
      data.push({
        date: predictedDate.toISOString().split('T')[0],
        weight: lastEntry.weight, // Point de départ de la prédiction
        formattedDate: new Date(lastDate).toLocaleDateString('fr-FR', { 
          day: 'numeric', 
          month: 'short' 
        }),
        dateShort: new Date(lastDate).toLocaleDateString('fr-FR', { 
          day: 'numeric'
        }),
        id: 'current',
        createdAt: Date.now(),
        source: 'manual' as const
      })
      
      data.push({
        date: predictedDate.toISOString().split('T')[0],
        weight: targetWeight,
        formattedDate: predictedDate.toLocaleDateString('fr-FR', { 
          day: 'numeric', 
          month: 'short' 
        }),
        dateShort: predictedDate.toLocaleDateString('fr-FR', { 
          day: 'numeric'
        }),
        id: 'prediction',
        createdAt: Date.now(),
        source: 'manual' as const,
        isPrediction: true
      })
    }
    
    return data
  }, [entries, compact, targetWeight, predictedWeeks])

  if (entries.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Scale className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">Ajoutez des entrées de poids</p>
          <p className="text-zinc-600 text-xs mt-1">pour voir le graphique</p>
        </div>
      </div>
    )
  }

  const latestWeight = chartData[chartData.length - 1]?.weight || 0
  const trendColor = trend.trend === 'increasing' ? 'text-rose-400' : trend.trend === 'decreasing' ? 'text-emerald-400' : 'text-zinc-500'

  // Calculate Y-axis domain with padding
  const weights = chartData.map(d => d.weight)
  const minWeight = Math.max(0, Math.floor(Math.min(...weights) - 2))
  const maxWeight = Math.ceil(Math.max(...weights) + 3)

  return (
    <div className="h-full flex flex-col">
      {!compact && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-zinc-400">Poids actuel</h3>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-white">{latestWeight.toFixed(1)}</span>
              <span className="text-sm text-zinc-500">kg</span>
            </div>
          </div>
          <div className="text-right">
            <h3 className="text-sm font-medium text-zinc-400">Tendance</h3>
            <div className={`flex items-center gap-1.5 mt-1 ${trendColor}`}>
              {trend.trend !== 'stable' && (
                <>
                  {trend.trend === 'increasing' && <TrendingUp className="w-5 h-5" />}
                  {trend.trend === 'decreasing' && <TrendingDown className="w-5 h-5" />}
                  <span className="text-lg font-bold">
                    {trend.trend === 'increasing' ? '+' : ''}{trend.weeklyChange.toFixed(1)}
                  </span>
                  <span className="text-sm">kg/sem</span>
                </>
              )}
              {trend.trend === 'stable' && <span className="text-zinc-500">Stable</span>}
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartData}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#27272a" 
              vertical={false}
              opacity={0.5}
            />
            
            <XAxis 
              dataKey="dateShort" 
              stroke="#71717a"
              tick={{ fill: '#71717a', fontSize: 11 }}
              axisLine={{ stroke: '#3f3f46' }}
            />
            
            <YAxis 
              domain={[minWeight, maxWeight]}
              stroke="#71717a"
              tick={{ fill: '#71717a', fontSize: 11 }}
              axisLine={{ stroke: '#3f3f46' }}
              label={{ 
                value: 'kg', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: '#71717a', fontSize: 11 }
              }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Line 
              type="natural"
              dataKey="weight" 
              stroke="#f43f5e" 
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              isAnimationActive={false}
              dot={(props: any) => {
                const { cx, cy, payload } = props
                if (payload.isPrediction) {
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={6}
                      fill="#18181b"
                      stroke="#10b981"
                      strokeWidth={3}
                      strokeDasharray="4 2"
                    />
                  )
                }
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill="#18181b"
                    stroke="#f43f5e"
                    strokeWidth={3}
                  />
                )
              }}
              activeDot={{ 
                r: 8,
                fill: '#f43f5e',
                stroke: '#18181b',
                strokeWidth: 3
              }}
              fill="url(#colorWeight)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
})
