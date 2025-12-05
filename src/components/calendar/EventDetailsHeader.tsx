import { X, Trash2 } from 'lucide-react'
import { Event } from '../../types/calendar'

interface EventDetailsHeaderProps {
  event: Event
  editTitle: string
  onTitleChange: (title: string) => void
  onClose: () => void
  onDelete: () => void
}

export function EventDetailsHeader({
  event,
  editTitle,
  onTitleChange,
  onClose,
  onDelete
}: EventDetailsHeaderProps) {
  return (
    <div className="sticky top-0 z-10 backdrop-blur-xl bg-mars-surface/80 border-b border-zinc-800 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full text-xl font-semibold text-zinc-200 bg-transparent border-none focus:outline-none"
            placeholder="Titre de l'événement"
          />
          <p className="text-sm text-zinc-600 mt-1">
            Créé le {new Date(event.createdAt || Date.now()).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onDelete}
            className="p-2 text-rose-500 hover:text-rose-400 transition-colors rounded-xl hover:bg-rose-500/10"
            aria-label="Supprimer l'événement"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-zinc-600 hover:text-zinc-400 transition-colors rounded-xl hover:bg-zinc-800/50"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

