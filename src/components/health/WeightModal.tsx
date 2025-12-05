import { useState, useEffect, useRef } from 'react'
import { Scale } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface WeightModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { weight: number; date: string; note?: string }) => { success: boolean; error?: string }
}

export function WeightModal({ isOpen, onClose, onSubmit }: WeightModalProps) {
  const [weight, setWeight] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setWeight('')
      setDate(new Date().toISOString().split('T')[0])
      setNote('')
      setError('')
    }
  }, [isOpen])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    setError('')
    
    const weightNum = parseFloat(weight)
    if (isNaN(weightNum) || weightNum <= 0) {
      setError('Veuillez entrer un poids valide')
      return
    }
    
    const result = onSubmit({ weight: weightNum, date, note: note || undefined })
    
    if (result.success) {
      onClose()
    } else {
      setError(result.error || 'Une erreur est survenue')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            variant="danger"
            onClick={() => handleSubmit()}
            disabled={!weight}
          >
            Ajouter
          </Button>
        </>
      }
    >
      {/* Header with icon */}
      <div className="flex items-center gap-3 mb-6 -mt-2">
        <div className="p-2 bg-rose-500/20 rounded-xl">
          <Scale className="w-5 h-5 text-rose-400" />
        </div>
        <h2 className="text-lg font-medium text-zinc-200">
          Ajouter un poids
        </h2>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-sm text-rose-400" role="alert">
            {error}
          </div>
        )}

        <Input
          ref={inputRef}
          label="Poids (kg)"
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="75.5"
          step="0.1"
          min="0"
          max="500"
          required
          hint="Entre 0 et 500 kg"
        />

        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
        />

        <Input
          label="Note (optionnel)"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Après le sport..."
          maxLength={100}
        />
      </form>
    </Modal>
  )
}
