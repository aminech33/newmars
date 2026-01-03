/**
 * 💾 Storage Monitor - Affiche l'utilisation du localStorage
 */

import { useMemo } from 'react'
import { HardDrive, AlertTriangle } from 'lucide-react'

export function StorageMonitor() {
  const storageInfo = useMemo(() => {
    try {
      // Calculer la taille totale utilisée
      let totalSize = 0
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          const value = localStorage.getItem(key) || ''
          totalSize += key.length + value.length
        }
      }
      
      // Taille en KB
      const usedKB = totalSize / 1024
      const limitKB = 10 * 1024 // 10MB en KB (Chrome/Firefox)
      const percent = (usedKB / limitKB) * 100
      
      // Breakdown par clé
      const breakdown: Array<{ key: string; size: number }> = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          const value = localStorage.getItem(key) || ''
          const size = (key.length + value.length) / 1024
          breakdown.push({ key, size })
        }
      }
      breakdown.sort((a, b) => b.size - a.size)
      
      return {
        usedKB,
        limitKB,
        percent,
        breakdown: breakdown.slice(0, 5) // Top 5
      }
    } catch (error) {
      console.error('Error calculating storage:', error)
      return null
    }
  }, [])

  if (!storageInfo) {
    return (
      <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
        <p className="text-sm text-zinc-500">Impossible de calculer l'utilisation du stockage</p>
      </div>
    )
  }

  const { usedKB, limitKB, percent, breakdown } = storageInfo
  const isWarning = percent > 70
  const isDanger = percent > 90

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          isDanger ? 'bg-red-500/10' : isWarning ? 'bg-yellow-500/10' : 'bg-blue-500/10'
        }`}>
          <HardDrive className={`w-5 h-5 ${
            isDanger ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-blue-400'
          }`} />
        </div>
        <div>
          <h3 className="text-sm font-medium text-white">Stockage local</h3>
          <p className="text-xs text-zinc-500">localStorage (navigateur)</p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-400">
            {usedKB.toFixed(0)} KB / {(limitKB / 1024).toFixed(0)} MB
          </span>
          <span className={`text-xs font-medium ${
            isDanger ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-blue-400'
          }`}>
            {percent.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all ${
              isDanger ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      </div>

      {/* Warning */}
      {isWarning && (
        <div className={`flex items-start gap-2 p-3 rounded-lg border ${
          isDanger 
            ? 'bg-red-500/5 border-red-500/20' 
            : 'bg-yellow-500/5 border-yellow-500/20'
        }`}>
          <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
            isDanger ? 'text-red-400' : 'text-yellow-400'
          }`} />
          <div className="space-y-1">
            <p className={`text-xs font-medium ${
              isDanger ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {isDanger ? 'Stockage presque plein' : 'Attention au stockage'}
            </p>
            <p className="text-xs text-zinc-400">
              {isDanger 
                ? 'Considère supprimer les vieux cours ou backups pour libérer de l\'espace.'
                : 'Surveille ton utilisation. Envisage un nettoyage si nécessaire.'
              }
            </p>
          </div>
        </div>
      )}

      {/* Breakdown */}
      <div>
        <h4 className="text-xs font-medium text-zinc-400 mb-2">Plus gros éléments</h4>
        <div className="space-y-1">
          {breakdown.map((item) => (
            <div key={item.key} className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 truncate flex-1 mr-2">
                {item.key.replace('newmars_backup_', 'backup_').slice(0, 30)}
                {item.key.length > 30 && '...'}
              </span>
              <span className="text-zinc-400 font-mono">
                {item.size.toFixed(1)} KB
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="pt-3 border-t border-zinc-800">
        <p className="text-xs text-zinc-500">
          💡 Le nettoyage automatique garde les 7 derniers backups.
          {percent < 50 && ' Tu as encore beaucoup d\'espace !'}
        </p>
      </div>
    </div>
  )
}

