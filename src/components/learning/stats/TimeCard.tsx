import { Clock } from 'lucide-react'

interface TimeCardProps {
  totalTimeSpent: number
  sessionsCount: number
}

export function TimeCard({ totalTimeSpent, sessionsCount }: TimeCardProps) {
  return (
    <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50 hover:border-zinc-700 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-zinc-500 mb-1">Temps total</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-white">
              {Math.floor(totalTimeSpent / 60)}
            </p>
            <span className="text-xs text-zinc-400">heures</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
          <Clock className="w-4 h-4 text-cyan-400" />
        </div>
      </div>
      
      {/* Moyenne par session */}
      {sessionsCount > 0 && (
        <div className="text-xs text-zinc-500">
          ~{Math.round(totalTimeSpent / sessionsCount)} min/session
        </div>
      )}
    </div>
  )
}


