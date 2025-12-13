import { memo } from 'react'
import { Plus } from 'lucide-react'

interface EmptyStateProps {
  onCreateCourse: () => void
}

export const EmptyState = memo(function EmptyState({ onCreateCourse }: EmptyStateProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <p className="text-zinc-500 mb-6">Aucun cours</p>
      <button
        onClick={onCreateCourse}
        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
      >
        <Plus className="w-4 h-4" />
        Nouveau cours
      </button>
    </div>
  )
})
