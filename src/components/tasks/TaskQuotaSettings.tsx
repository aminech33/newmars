import { X, Info } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useState } from 'react'

interface TaskQuotaSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export function TaskQuotaSettings({ isOpen, onClose }: TaskQuotaSettingsProps) {
  const { taskQuota, setTaskQuota } = useStore()
  const [localQuota, setLocalQuota] = useState(taskQuota)

  if (!isOpen) return null

  const handleSave = () => {
    setTaskQuota(localQuota)
    onClose()
  }

  const presets = [
    { value: 5, label: 'Minimaliste', description: 'Focus extrême' },
    { value: 10, label: 'Équilibré', description: 'Recommandé' },
    { value: 15, label: 'Productif', description: 'Plus de choix' },
    { value: 20, label: 'Power User', description: 'Maximum' },
    { value: 9999, label: 'Illimité', description: 'Pas de limite' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 animate-scale-in shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-zinc-200">
            Paramètres du quota
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Info */}
        <div className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-indigo-300">
              <p className="font-semibold mb-1">Comment ça marche ?</p>
              <ul className="space-y-1 text-xs text-indigo-300/80">
                <li>• Limite le nombre de tâches visibles simultanément</li>
                <li>• Finir 1 tâche = débloquer 1 nouvelle automatiquement</li>
                <li>• Les tâches urgentes sont débloquées en priorité</li>
                <li>• Évite la surcharge mentale et maintient le focus</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Current Quota */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-400 mb-3">
            Quota de tâches visibles
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="5"
              max="20"
              value={localQuota > 100 ? 20 : localQuota}
              onChange={(e) => setLocalQuota(parseInt(e.target.value))}
              className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-5
                         [&::-webkit-slider-thumb]:h-5
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-indigo-500
                         [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:hover:bg-indigo-400
                         [&::-webkit-slider-thumb]:transition-colors"
            />
            <div className="w-16 text-center">
              <span className="text-2xl font-bold text-white font-mono-display">
                {localQuota > 100 ? '∞' : localQuota}
              </span>
            </div>
          </div>
        </div>

        {/* Presets */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-400 mb-3">
            Préréglages
          </label>
          <div className="grid grid-cols-2 gap-3">
            {presets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setLocalQuota(preset.value)}
                className={`p-4 rounded-lg border transition-all text-left ${
                  localQuota === preset.value
                    ? 'bg-indigo-500/20 border-indigo-500 ring-2 ring-indigo-500/50'
                    : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-zinc-200">
                    {preset.label}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">
                    {preset.value > 100 ? '∞' : preset.value}
                  </span>
                </div>
                <p className="text-xs text-zinc-500">{preset.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Priority Info */}
        <div className="mb-6 p-4 bg-zinc-800/50 rounded-lg">
          <h4 className="text-sm font-semibold text-zinc-300 mb-2">
            Ordre de déblocage
          </h4>
          <ol className="space-y-1 text-xs text-zinc-500">
            <li className="flex items-center gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-[10px] font-bold">1</span>
              Tâches urgentes (priority = urgent)
            </li>
            <li className="flex items-center gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-[10px] font-bold">2</span>
              Tâches en retard (overdue)
            </li>
            <li className="flex items-center gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">3</span>
              Deadline proche (&lt; 3 jours)
            </li>
            <li className="flex items-center gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold">4</span>
              Deadline plus lointaine
            </li>
            <li className="flex items-center gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-zinc-500/20 text-zinc-400 flex items-center justify-center text-[10px] font-bold">5</span>
              Backlog (sans date)
            </li>
          </ol>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 text-sm bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors font-medium"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

