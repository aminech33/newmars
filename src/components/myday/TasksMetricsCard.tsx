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
  
  // Comparaison avec la moyenne
  const isAboveAverage = taskMetrics.todayCount > taskMetrics.avg14d
  const isBelowAverage = taskMetrics.todayCount < taskMetrics.avg14d * 0.7
  
  return (
    <div className="p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        <h3 className="text-sm font-medium text-zinc-400">Tâches</h3>
      </div>
      <div className="space-y-3">
        {/* 1. Volume avec comparaison */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-zinc-400">Aujourd'hui :</span>
            <span className={`text-lg font-semibold ${
              isAboveAverage ? 'text-emerald-400' : 
              isBelowAverage ? 'text-amber-400' : 
              'text-zinc-100'
            }`}>
              {taskMetrics.todayCount}
            </span>
            <span className="text-xs text-zinc-600">
              (moy. {taskMetrics.avg14d}/jour)
            </span>
          </div>
        </div>
        
        {/* 2. Nature de l'activité avec explication */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">Nature :</span>
            <span className={`text-sm font-medium ${
              taskMetrics.activityType === 'avancée' ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {taskMetrics.activityType === 'avancée' ? 'Avancée réelle' : 'Préparation'}
            </span>
          </div>
          <p className="text-xs text-zinc-600 mt-0.5">
            {taskMetrics.activityType === 'avancée' 
              ? 'Tâches à impact direct sur tes projets' 
              : 'Tâches de setup et maintenance'}
          </p>
        </div>
        
        {/* 3. Tendance 14 jours avec détails */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">Tendance :</span>
            <span className={`text-sm font-medium ${
              taskMetrics.trend14d === 'en hausse' ? 'text-emerald-400' :
              taskMetrics.trend14d === 'en baisse' ? 'text-rose-400' :
              'text-zinc-300'
            }`}>
              {taskMetrics.trend14d}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-violet-500/50 transition-all"
                style={{ width: `${Math.min(100, (taskMetrics.last7DaysCount / Math.max(taskMetrics.last7DaysCount, taskMetrics.days8to14Count, 1)) * 100)}%` }}
              />
            </div>
            <span className="text-xs text-zinc-600">
              {taskMetrics.last7DaysCount} vs {taskMetrics.days8to14Count}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}


