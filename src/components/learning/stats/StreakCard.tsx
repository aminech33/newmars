import { Flame } from 'lucide-react'

interface StreakCardProps {
  streak: number
  longestStreak: number
}

export function StreakCard({ streak, longestStreak }: StreakCardProps) {
  return (
    <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50 hover:border-zinc-700 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-zinc-500 mb-1">Série active</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-white">
              {streak}
            </p>
            <span className="text-xs text-zinc-400">jours</span>
          </div>
          {longestStreak > streak && (
            <p className="text-xs text-zinc-600 mt-1">
              Record: {longestStreak} jours
            </p>
          )}
        </div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          streak >= 7 
            ? 'bg-orange-500/10' 
            : 'bg-zinc-800'
        }`}>
          <Flame className={`w-4 h-4 ${
            streak >= 7 
              ? 'text-orange-400' 
              : 'text-zinc-600'
          }`} />
        </div>
      </div>
      
      {/* Barre de progression vers le prochain palier */}
      {streak < 30 && (
        <div className="space-y-1">
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-500"
              style={{ 
                width: `${(streak % 7) * 100 / 7}%` 
              }}
            />
          </div>
          <p className="text-[10px] text-zinc-600">
            {7 - (streak % 7)} jours avant palier
          </p>
        </div>
      )}
    </div>
  )
}


