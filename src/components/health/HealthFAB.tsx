import { useState } from 'react'
import { Plus, Scale, Apple } from 'lucide-react'

interface HealthFABProps {
  onAddWeight: () => void
  onAddMeal: () => void
}

export function HealthFAB({ onAddWeight, onAddMeal }: HealthFABProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 md:hidden">
      {/* Expanded actions */}
      {isExpanded && (
        <div className="flex flex-col gap-2 animate-fade-in">
          <button
            onClick={() => {
              onAddWeight()
              setIsExpanded(false)
            }}
            className="flex items-center gap-2 px-4 py-3 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 transition-[background-color] duration-200"
            aria-label="Ajouter un poids"
          >
            <Scale className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm font-medium">Poids</span>
          </button>
          
          <button
            onClick={() => {
              onAddMeal()
              setIsExpanded(false)
            }}
            className="flex items-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 transition-[background-color] duration-200"
            aria-label="Ajouter un repas"
          >
            <Apple className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm font-medium">Repas</span>
          </button>
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`p-4 rounded-full shadow-xl transition-[background-color] duration-200 duration-300 ${
          isExpanded 
            ? 'bg-zinc-700 rotate-45' 
            : 'bg-indigo-500 hover:bg-indigo-600'
        }`}
        aria-label={isExpanded ? 'Fermer le menu' : 'Ajouter une entrée'}
        aria-expanded={isExpanded}
      >
        <Plus className="w-6 h-6 text-white transition-transform" />
      </button>
    </div>
  )
}

