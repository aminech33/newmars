import { useState, useCallback } from 'react'
import { Scale } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useHealthModal } from '../../hooks/useHealthModal'
import { PremiumModalHeader } from './shared/PremiumModalHeader'
import { ErrorBanner } from './shared/ErrorBanner'

interface WeightModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { weight: number; date: string; note?: string }) => { success: boolean; error?: string }
}

export function WeightModal({ isOpen, onClose, onSubmit }: WeightModalProps) {
  const [weight, setWeight] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')

  // Hook personnalisé pour gérer le cycle de vie du modal
  const { error, setError, inputRef, handleSubmit: handleModalSubmit } = useHealthModal(
    isOpen,
    onSubmit,
    onClose,
    useCallback(() => {
      setWeight('')
      setDate(new Date().toISOString().split('T')[0])
      setNote('')
    }, [])
  )

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    setError('')
    
    const weightNum = parseFloat(weight)
    if (isNaN(weightNum) || weightNum <= 0) {
      setError('Veuillez entrer un poids valide')
      return
    }
    
    handleModalSubmit({ weight: weightNum, date, note: note || undefined })
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
      <PremiumModalHeader icon={Scale} title="Ajouter un poids" colorFrom="rose" colorTo="pink" />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorBanner error={error} />

        <div>
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
          {weight && parseFloat(weight) > 0 && (
            <p className="mt-2 text-xs text-zinc-500 flex items-center gap-2">
              <span className="text-rose-400">⚖️</span>
              {parseFloat(weight).toFixed(1)} kg
            </p>
          )}
        </div>

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
