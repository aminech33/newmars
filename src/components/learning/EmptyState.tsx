import { memo } from 'react'

interface EmptyStateProps {
  onCreateCourse: () => void
}

export const EmptyState = memo(function EmptyState({ onCreateCourse }: EmptyStateProps) {
  return (
    <div className="h-full flex items-center justify-center px-6">
      {/* Structure verticale claire */}
      <div className="max-w-sm text-center space-y-6">
        {/* Titre principal */}
        <div className="space-y-2">
          <h2 className="text-lg font-medium text-zinc-300">
            Aucun cours
          </h2>
          <p className="text-sm text-zinc-600">
            Créez un cours pour commencer
          </p>
        </div>
        
        {/* Action principale claire */}
        <button
          onClick={onCreateCourse}
          className="px-5 py-2.5 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-200 rounded-xl text-sm font-medium transition-colors border border-zinc-700/50"
        >
          Créer un cours
        </button>
      </div>
    </div>
  )
})
