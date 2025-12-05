import { Plus, Settings } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../../store/useStore'

interface WidgetFABProps {
  onAddWidget: () => void
}

export function WidgetFAB({ onAddWidget }: WidgetFABProps) {
  const { isEditMode, setEditMode } = useStore()
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 md:hidden">
      {/* Expanded actions */}
      {isExpanded && (
        <div className="flex flex-col gap-2 animate-fade-in">
          <button
            onClick={() => {
              setEditMode(!isEditMode)
              setIsExpanded(false)
            }}
            className={`p-3 rounded-full shadow-lg transition-colors ${
              isEditMode 
                ? 'bg-indigo-500 text-white' 
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
            aria-label={isEditMode ? 'Terminer la personnalisation' : 'Personnaliser'}
          >
            <Settings className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => {
              onAddWidget()
              setIsExpanded(false)
            }}
            className="p-3 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 transition-colors"
            aria-label="Ajouter un widget"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`p-4 rounded-full shadow-xl transition-colors duration-300 ${
          isExpanded 
            ? 'bg-zinc-700 rotate-45' 
            : 'bg-indigo-500 hover:bg-indigo-600'
        }`}
        aria-label={isExpanded ? 'Fermer le menu' : 'Menu widgets'}
        aria-expanded={isExpanded}
      >
        <Plus className="w-6 h-6 text-white transition-transform" />
      </button>
    </div>
  )
}

