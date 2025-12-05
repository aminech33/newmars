import { useRef, useEffect, useState } from 'react'
import { Target } from 'lucide-react'
import { ReadingGoal } from '../../../types/library'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'

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

  // Auto-focus
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const targetBooks = parseInt(target) || 12
    if (targetBooks > 0 && targetBooks <= 100) {
      onSave({ year, targetBooks })
    }
  }

  const suggestions = [6, 12, 24, 52]

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="warning" onClick={() => handleSubmit()}>
            Enregistrer
          </Button>
        </>
      }
    >
      {/* Header with icon */}
      <div className="flex items-center gap-2 mb-6 -mt-2">
        <Target className="w-5 h-5 text-amber-500" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-zinc-200">
          Objectif de lecture {year}
        </h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Progression actuelle */}
        <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
          <p className="text-4xl font-bold text-amber-400">{completedThisYear}</p>
          <p className="text-zinc-500 text-sm">livres terminés cette année</p>
        </div>
        
        {/* Objectif */}
        <Input
          ref={inputRef}
          label="Objectif annuel (nombre de livres)"
          type="number"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          min={1}
          max={100}
          className="text-center text-2xl font-bold"
        />
        
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
        <p className="text-xs text-zinc-600 text-center">
          {parseInt(target) > 0 && (
            <>≈ {Math.ceil(parseInt(target) / 12)} livre{Math.ceil(parseInt(target) / 12) > 1 ? 's' : ''} par mois</>
          )}
        </p>
      </form>
    </Modal>
  )
}
