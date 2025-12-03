import { useState, useEffect } from 'react'
import { X, Plus, Flame } from 'lucide-react'

interface AddHabitModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (name: string) => void
}

const HABIT_SUGGESTIONS = [
  'Méditation',
  'Exercice physique',
  'Lecture',
  'Écriture',
  'Hydratation (2L d\'eau)',
  'Sommeil 8h',
  'Marche 10 000 pas',
  'Pratique d\'un instrument',
  'Apprentissage d\'une langue',
  'Gratitude journalière',
  'Pas de téléphone 1h avant de dormir',
  'Petit-déjeuner sain'
]

export function AddHabitModal({ isOpen, onClose, onAdd }: AddHabitModalProps) {
  const [name, setName] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(true)

  useEffect(() => {
    if (isOpen) {
      setName('')
      setShowSuggestions(true)
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onAdd(name)
      setName('')
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setName(suggestion)
    setShowSuggestions(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-xl">
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-200">
              Nouvelle habitude
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
          {/* Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Nom de l'habitude
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setShowSuggestions(false)
              }}
              placeholder="Ex: Méditation 10 minutes"
              className="w-full bg-zinc-800 text-zinc-200 placeholder:text-zinc-600 px-4 py-3 rounded-lg border border-zinc-700 focus:outline-none focus:border-amber-500 transition-colors"
              autoFocus
            />
          </div>

          {/* Suggestions */}
          {showSuggestions && !name && (
            <div className="mb-4">
              <p className="text-xs font-medium text-zinc-500 mb-2">
                Suggestions populaires :
              </p>
              <div className="flex flex-wrap gap-2">
                {HABIT_SUGGESTIONS.slice(0, 6).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-1.5 text-xs bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700 hover:text-amber-400 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
              Créer l'habitude
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

