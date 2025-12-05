import { useState, useEffect } from 'react'
import { Plus, Flame } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

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
            variant="warning"
            icon={Plus}
            onClick={handleSubmit}
            disabled={!name.trim()}
          >
            Créer l'habitude
          </Button>
        </>
      }
    >
      {/* Header with icon */}
      <div className="flex items-center gap-3 mb-6 -mt-2">
        <div className="p-2 bg-amber-500/20 rounded-xl">
          <Flame className="w-5 h-5 text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-200">
          Nouvelle habitude
        </h3>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Input */}
        <Input
          label="Nom de l'habitude"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setShowSuggestions(false)
          }}
          placeholder="Ex: Méditation 10 minutes"
          autoFocus
        />

        {/* Suggestions */}
        {showSuggestions && !name && (
          <div className="mt-4">
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
      </form>
    </Modal>
  )
}
