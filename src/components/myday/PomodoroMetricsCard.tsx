/**
 * ⏱️ PomodoroMetricsCard - Card métriques Pomodoro
 */

import { Timer } from 'lucide-react'
import { calculatePomodoroMetrics } from '../../utils/pomodoroMetrics'
import { PomodoroSession, Task } from '../../store/useStore'

interface PomodoroMetricsCardProps {
  pomodoroSessions: PomodoroSession[]
  tasks: Task[]
}

export function PomodoroMetricsCard({ pomodoroSessions, tasks }: PomodoroMetricsCardProps) {
  const pomodoroMetrics = calculatePomodoroMetrics(pomodoroSessions, tasks)
  
  return (
    <div className="p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <Timer className="w-4 h-4 text-orange-500" />
        <h3 className="text-sm font-medium text-zinc-400">Pomodoro</h3>
      </div>
      <div className="space-y-3">
        {/* 1. Volume avec contexte */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-zinc-400">Sessions :</span>
            <span className="text-lg font-semibold text-zinc-100">
              {pomodoroMetrics.todayVolume}
            </span>
            <span className="text-xs text-zinc-600">
              tâche{pomodoroMetrics.todayVolume > 1 ? 's' : ''}
            </span>
          </div>
        </div>
        
        {/* 2. Qualité du focus avec explication */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">Focus :</span>
            <span className={`text-sm font-medium ${
              pomodoroMetrics.hasQualityFocus ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {pomodoroMetrics.hasQualityFocus ? 'De qualité' : 'Fragmenté'}
            </span>
          </div>
          <p className="text-xs text-zinc-600 mt-0.5">
            {pomodoroMetrics.hasQualityFocus 
              ? 'Sessions longues et concentrées' 
              : 'Plusieurs courtes sessions'}
          </p>
        </div>
        
        {/* 3. Tendance avec indicateur visuel */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">Tendance :</span>
            <span className={`text-sm font-medium ${
              pomodoroMetrics.trend14d === 'en hausse' ? 'text-emerald-400' :
              pomodoroMetrics.trend14d === 'en baisse' ? 'text-rose-400' :
              'text-zinc-300'
            }`}>
              {pomodoroMetrics.trend14d}
            </span>
          </div>
          <p className="text-xs text-zinc-600 mt-0.5">
            Rythme sur les 14 derniers jours
          </p>
        </div>
      </div>
    </div>
  )
}


