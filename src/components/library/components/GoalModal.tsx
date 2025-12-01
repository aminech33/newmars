import { useRef, useEffect, useState } from 'react'
import { Target, X } from 'lucide-react'
import { ReadingGoal } from '../../../types/library'

interface GoalModalProps {
  currentGoal: ReadingGoal | null
  completedThisYear: number
  onClose: () => void
  onSave: (goal: ReadingGoal) => void
}

export function GoalModal({ currentGoal, completedThisYear, onClose, onSave }: GoalModalProps) {
  const [target, setTarget] = useState(currentGoal?.targetBooks?.toString() || '12')
  const year = new Date().getFullYear()
  const inputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Focus trap et fermeture avec Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    document.addEventListener('keydown', handleKeyDown)
    inputRef.current?.focus()
    
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const targetBooks = parseInt(target) || 12
    if (targetBooks > 0 && targetBooks <= 100) {
      onSave({ year, targetBooks })
    }
  }

  const suggestions = [6, 12, 24, 52]

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-modal-title"
    >
      <div 
        ref={modalRef}
        className="relative w-full max-w-md bg-mars-surface border border-zinc-800 rounded-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 
              id="goal-modal-title"
              className="text-lg font-semibold text-zinc-200 flex items-center gap-2"
            >
              <Target className="w-5 h-5 text-amber-500" aria-hidden="true" />
              Objectif de lecture {year}
            </h2>
            <button 
              type="button"
              onClick={onClose} 
              className="text-zinc-500 hover:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-500 rounded p-1"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Progression actuelle */}
            <div className="bg-zinc-900/50 rounded-xl p-4 text-center">
              <p className="text-4xl font-bold text-amber-400">{completedThisYear}</p>
              <p className="text-zinc-500 text-sm">livres terminés cette année</p>
            </div>
            
            {/* Objectif */}
            <div>
              <label 
                htmlFor="goal-input"
                className="block text-sm text-zinc-500 mb-2"
              >
                Objectif annuel (nombre de livres)
              </label>
              <input
                ref={inputRef}
                id="goal-input"
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full px-4 py-3 text-center text-2xl font-bold bg-zinc-900 text-zinc-200 rounded-xl border border-zinc-800 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                min={1}
                max={100}
                aria-describedby="goal-hint"
              />
            </div>
            
            {/* Suggestions */}
            <div 
              className="flex justify-center gap-2"
              role="group"
              aria-label="Suggestions d'objectifs"
            >
              {suggestions.map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setTarget(n.toString())}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    target === n.toString()
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'text-zinc-500 hover:text-zinc-300 bg-zinc-800/50'
                  }`}
                >
                  {n} livres
                </button>
              ))}
            </div>
            
            {/* Info */}
            <p id="goal-hint" className="text-xs text-zinc-600 text-center">
              {parseInt(target) > 0 && (
                <>≈ {Math.ceil(parseInt(target) / 12)} livre{Math.ceil(parseInt(target) / 12) > 1 ? 's' : ''} par mois</>
              )}
            </p>
          </div>
          
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-500 rounded"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

