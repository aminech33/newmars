import { Target } from 'lucide-react'

interface MasteryCardProps {
  currentMastery: number
  masteryTrend: Array<{ date: string; masteryLevel: number }>
}

export function MasteryCard({ currentMastery, masteryTrend }: MasteryCardProps) {
  const hasTrend = masteryTrend.length >= 2
  const trendDelta = hasTrend 
    ? masteryTrend[masteryTrend.length - 1].masteryLevel - masteryTrend[0].masteryLevel
    : 0
  const isPositiveTrend = trendDelta > 0

  return (
    <div className="relative group bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50 hover:border-zinc-700 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-zinc-500 mb-1">Maîtrise</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-white">
              {currentMastery}%
            </p>
            {hasTrend && trendDelta !== 0 && (
              <span className={`text-xs ${
                isPositiveTrend ? 'text-green-400' : 'text-red-400'
              }`}>
                {isPositiveTrend ? '+' : ''}{trendDelta.toFixed(0)}%
              </span>
            )}
          </div>
        </div>
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
          <Target className="w-4 h-4 text-indigo-400" />
        </div>
      </div>
      
      {/* Sparkline mini graphique */}
      {masteryTrend.length > 0 && (
        <div className="h-8 flex items-end gap-0.5">
          {masteryTrend.map((point, idx) => {
            const height = Math.max(4, (point.masteryLevel / 100) * 32)
            const isLast = idx === masteryTrend.length - 1
            
            return (
              <div
                key={point.date}
                className={`flex-1 rounded-sm transition-all ${
                  isLast 
                    ? 'bg-indigo-500' 
                    : 'bg-zinc-700 group-hover:bg-zinc-600'
                }`}
                style={{ height: `${height}px` }}
                title={`${point.date}: ${point.masteryLevel}%`}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

