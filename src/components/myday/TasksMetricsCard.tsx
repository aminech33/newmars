/**
 * 📊 TasksMetricsCard - Card métriques des tâches
 */

import { CheckCircle2 } from 'lucide-react'
import { calculateTaskMetrics } from '../../utils/metrics'
import { Task } from '../../store/useStore'

interface TasksMetricsCardProps {
  tasks: Task[]
}

export function TasksMetricsCard({ tasks }: TasksMetricsCardProps) {
  const taskMetrics = calculateTaskMetrics(tasks)
  
  return (
    <div className="p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="w-4 h-4 text-zinc-500" />
        <h3 className="text-sm font-medium text-zinc-400">Tâches</h3>
      </div>
      <div className="space-y-2.5">
        {/* 1. Volume */}
        <p className="text-sm text-zinc-300">
          Terminées aujourd'hui : <span className="text-zinc-100 font-medium">{taskMetrics.todayCount}</span>
        </p>
        
        {/* 2. Nature de l'activité */}
        <p className="text-sm text-zinc-300">
          Nature : <span className="text-zinc-100 font-medium">
            {taskMetrics.activityType === 'avancée' ? 'Avancée réelle' : 'Préparation / maintenance'}
          </span>
        </p>
        
        {/* 3. Tendance 14 jours */}
        <p className="text-sm text-zinc-300">
          Sur 14 jours : <span className="text-zinc-100 font-medium">
            rythme {taskMetrics.trend14d}
          </span>
        </p>
      </div>
    </div>
  )
}

