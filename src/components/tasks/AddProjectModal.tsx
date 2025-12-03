import { X } from 'lucide-react'
import { PROJECT_COLORS, PROJECT_ICONS } from '../../store/useStore'

interface AddProjectModalProps {
  isOpen: boolean
  onClose: () => void
  projectName: string
  onNameChange: (name: string) => void
  projectColor: string
  onColorChange: (color: string) => void
  projectIcon: string
  onIconChange: (icon: string) => void
  onCreate: () => void
}

export function AddProjectModal({
  isOpen,
  onClose,
  projectName,
  onNameChange,
  projectColor,
  onColorChange,
  projectIcon,
  onIconChange,
  onCreate
}: AddProjectModalProps) {
  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (projectName.trim()) {
      onCreate()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 animate-scale-in shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl">
              <span className="text-2xl">{projectIcon}</span>
            </div>
            <h3 className="text-lg font-semibold text-zinc-200">
              Nouveau projet
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Project Name */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Nom du projet
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Ex: Application mobile, Site web..."
              className="w-full bg-zinc-800 text-zinc-200 placeholder:text-zinc-600 px-4 py-3 rounded-lg border border-zinc-700 focus:outline-none focus:border-indigo-500 transition-colors"
              autoFocus
            />
          </div>

          {/* Color Picker */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-zinc-400 mb-3">
              Couleur
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onColorChange(color)}
                  className={`w-10 h-10 rounded-xl transition-all ${
                    projectColor === color 
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110' 
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Icon Picker */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-400 mb-3">
              Icône
            </label>
            <div className="grid grid-cols-8 gap-2">
              {PROJECT_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => onIconChange(icon)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                    projectIcon === icon 
                      ? 'bg-indigo-500/20 ring-2 ring-indigo-500 scale-110' 
                      : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                  title={icon}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!projectName.trim()}
              className="flex items-center gap-2 px-6 py-2 text-sm bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Créer le projet
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

