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
      <div className="space-y-2.5">
        {/* 1️⃣ Volume */}
        <p className="text-sm text-zinc-300">
          Volume : <span className="text-zinc-100 font-medium">{pomodoroMetrics.todayVolume} tâche{pomodoroMetrics.todayVolume > 1 ? 's' : ''} terminée{pomodoroMetrics.todayVolume > 1 ? 's' : ''}</span>
        </p>
        
        {/* 2️⃣ Qualité du focus */}
        <p className="text-sm text-zinc-300">
          Focus : <span className={`font-medium ${pomodoroMetrics.hasQualityFocus ? 'text-emerald-400' : 'text-amber-400'}`}>
            {pomodoroMetrics.hasQualityFocus ? 'Focus de qualité' : 'Focus fragmenté'}
          </span>
        </p>
        
        {/* 3️⃣ Tendance 14 jours */}
        <p className="text-sm text-zinc-300">
          Tendance : <span className={`font-medium ${pomodoroMetrics.trend14d === 'stable' ? 'text-zinc-100' : 'text-amber-400'}`}>
            {pomodoroMetrics.trend14d}
          </span>
        </p>
      </div>
    </div>
  )
}

