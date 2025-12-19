import { memo } from 'react'
import { Calendar, Scale, Trash2 } from 'lucide-react'
import { WeightEntry } from '../../types/health'
import { Tooltip } from '../ui/Tooltip'

interface WeightListProps {
  entries: WeightEntry[]
  onDelete: (id: string) => void
  compact?: boolean
}

export const WeightList = memo(function WeightList({ entries, onDelete }: WeightListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <Scale className="w-12 h-12 text-zinc-700 mx-auto mb-3" aria-hidden="true" />
        <p className="text-zinc-500 mb-2">Aucune entrée de poids</p>
        <p className="text-zinc-600 text-sm">Commencez à suivre votre poids</p>
      </div>
    )
  }

  return (
    <div className="space-y-2" role="list" aria-label="Liste des entrées de poids">
      {entries.map((entry) => (
        <div 
          key={entry.id} 
          className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-2xl hover:bg-zinc-800/50 transition-[background-color] duration-200 group"
          role="listitem"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-zinc-400">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm">
                {new Date(entry.date).toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short'
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-rose-400" aria-hidden="true" />
              <span className="text-lg font-bold text-zinc-200">{entry.weight} kg</span>
            </div>
            {entry.note && (
              <span className="text-sm text-zinc-600 hidden sm:block">{entry.note}</span>
            )}
          </div>
          
          <Tooltip content="Supprimer cette entrée">
            <button
              onClick={() => onDelete(entry.id)}
              className="p-2 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-[background-color] duration-200"
              aria-label={`Supprimer l'entrée du ${new Date(entry.date).toLocaleDateString('fr-FR')}`}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </Tooltip>
        </div>
      ))}
    </div>
  )
})

