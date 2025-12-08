import { Lock, Unlock, Settings } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Tooltip } from '../ui/Tooltip'

interface TaskQuotaDisplayProps {
  onSettingsClick?: () => void
}

export function TaskQuotaDisplay({ onSettingsClick }: TaskQuotaDisplayProps) {
  const { taskQuota, getVisibleTasks, getHiddenTasks, unlockNextTasks } = useStore()
  
  const visibleTasks = getVisibleTasks()
  const hiddenTasks = getHiddenTasks()
  const visibleCount = visibleTasks.length
  const hiddenCount = hiddenTasks.length
  
  // Debug: vérifier les tâches visibles vs quota
  const progress = taskQuota > 0 ? Math.min((visibleCount / taskQuota) * 100, 100) : 0
  const isFull = visibleCount >= taskQuota
  const isEmpty = visibleCount === 0 && hiddenCount === 0
  
  console.log('TaskQuota Debug:', { visibleCount, hiddenCount, taskQuota, progress, isFull })

  // Ne rien afficher si pas de tâches
  if (isEmpty) {
    return null
  }

  const canUnlock = !isFull && hiddenCount > 0
  const unlockCount = Math.min(taskQuota - visibleCount, hiddenCount)

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
      {/* Icône */}
      <div className={`p-1.5 rounded-md ${isFull ? 'bg-amber-500/20' : 'bg-indigo-500/20'}`}>
        {isFull ? (
          <Lock className="w-3.5 h-3.5 text-amber-400" />
        ) : (
          <Unlock className="w-3.5 h-3.5 text-indigo-400" />
        )}
      </div>
      
      {/* Progress bar mini */}
      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isFull ? 'bg-amber-500' : 'bg-indigo-500'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <span className="text-xs text-zinc-500 tabular-nums">
          {visibleCount}/{taskQuota}
        </span>
      </div>
      
      {/* Cachées */}
      {hiddenCount > 0 && (
        <span className="text-xs text-zinc-600">
          🔒 {hiddenCount}
        </span>
      )}
      
      {/* Bouton débloquer */}
      {canUnlock && (
        <button
          onClick={() => unlockNextTasks(unlockCount)}
          className="px-2 py-1 text-[10px] font-medium text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded transition-colors"
        >
          +{unlockCount}
        </button>
      )}
      
      {/* Settings */}
      {onSettingsClick && (
        <Tooltip content="Paramètres">
          <button
            onClick={onSettingsClick}
            className="p-1 text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
      )}
    </div>
  )
}


