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
  const totalPending = visibleCount + hiddenCount
  
  const progress = taskQuota > 0 ? (visibleCount / taskQuota) * 100 : 0
  const isFull = visibleCount >= taskQuota
  const isEmpty = visibleCount === 0 && hiddenCount === 0

  if (isEmpty) {
    return (
      <div className="glass-widget p-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mb-4">
          <span className="text-3xl">🎉</span>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Incroyable !</h3>
        <p className="text-sm text-zinc-400 mb-1">
          Tu as terminé TOUTES tes tâches
        </p>
        <p className="text-sm text-zinc-400">
          visibles ET cachées !
        </p>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
          <span className="text-lg">🏆</span>
          <span className="text-sm font-semibold">Badge "Task Master"</span>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-widget p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isFull ? 'bg-amber-500/20' : 'bg-indigo-500/20'}`}>
            {isFull ? (
              <Lock className="w-5 h-5 text-amber-400" />
            ) : (
              <Unlock className="w-5 h-5 text-indigo-400" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-300">Quota de tâches</h3>
            <p className="text-xs text-zinc-600">
              {visibleCount}/{taskQuota} visibles
            </p>
          </div>
        </div>
        
        {onSettingsClick && (
          <Tooltip content="Paramètres du quota">
            <button
              onClick={onSettingsClick}
              className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </Tooltip>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="h-3 bg-zinc-800 rounded-full overflow-hidden relative">
          <div
            className={`h-full transition-all duration-500 ${
              isFull 
                ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                : 'bg-gradient-to-r from-indigo-500 to-cyan-500'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
          {isFull && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse-slow" />
          )}
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">
            {Math.round(progress)}% rempli
          </span>
          {hiddenCount > 0 && (
            <span className="text-zinc-500">
              🔒 {hiddenCount} cachée{hiddenCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Status Message */}
      {hiddenCount > 0 && (
        <div className={`p-3 rounded-lg ${
          isFull 
            ? 'bg-amber-500/10 border border-amber-500/30' 
            : 'bg-indigo-500/10 border border-indigo-500/30'
        }`}>
          <p className={`text-sm ${isFull ? 'text-amber-300' : 'text-indigo-300'}`}>
            {isFull ? (
              <>
                <strong>Quota atteint !</strong> Termine une tâche pour en débloquer une nouvelle.
              </>
            ) : (
              <>
                <strong>Déblocage automatique</strong> : {taskQuota - visibleCount} place{taskQuota - visibleCount > 1 ? 's' : ''} disponible{taskQuota - visibleCount > 1 ? 's' : ''}.
              </>
            )}
          </p>
        </div>
      )}

      {/* Manual Unlock (if not full and has hidden tasks) */}
      {!isFull && hiddenCount > 0 && (
        <button
          onClick={() => unlockNextTasks(Math.min(taskQuota - visibleCount, hiddenCount))}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors text-sm font-medium"
        >
          <Unlock className="w-4 h-4" />
          Débloquer {Math.min(taskQuota - visibleCount, hiddenCount)} tâche{Math.min(taskQuota - visibleCount, hiddenCount) > 1 ? 's' : ''}
        </button>
      )}

      {/* Stats */}
      <div className="pt-3 border-t border-white/5 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-lg font-bold text-white font-mono-display">{visibleCount}</p>
          <p className="text-[10px] text-zinc-600 uppercase">Visibles</p>
        </div>
        <div>
          <p className="text-lg font-bold text-amber-400 font-mono-display">{hiddenCount}</p>
          <p className="text-[10px] text-zinc-600 uppercase">Cachées</p>
        </div>
        <div>
          <p className="text-lg font-bold text-indigo-400 font-mono-display">{totalPending}</p>
          <p className="text-[10px] text-zinc-600 uppercase">Total</p>
        </div>
      </div>
    </div>
  )
}

