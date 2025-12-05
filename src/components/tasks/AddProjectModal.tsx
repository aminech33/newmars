import { PROJECT_COLORS, PROJECT_ICONS } from '../../store/useStore'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (projectName.trim()) {
      onCreate()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            variant="primary"
            onClick={handleSubmit}
            disabled={!projectName.trim()}
          >
            Créer le projet
          </Button>
        </>
      }
    >
      {/* Header with icon */}
      <div className="flex items-center gap-3 mb-6 -mt-2">
        <div className="p-2 bg-indigo-500/20 rounded-xl">
          <span className="text-2xl">{projectIcon}</span>
        </div>
        <h3 className="text-lg font-semibold text-zinc-200">
          Nouveau projet
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Project Name */}
        <Input
          label="Nom du projet"
          value={projectName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Ex: Application mobile, Site web..."
          autoFocus
        />

        {/* Color Picker */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-3">
            Couleur
          </label>
          <div className="flex items-center gap-3 flex-wrap">
            {PROJECT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onColorChange(color)}
                className={`w-10 h-10 rounded-xl transition-colors ${
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
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-3">
            Icône
          </label>
          <div className="grid grid-cols-8 gap-2">
            {PROJECT_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => onIconChange(icon)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-colors ${
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
      </form>
    </Modal>
  )
}
