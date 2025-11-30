import { useState, useEffect, useRef } from 'react'
import { X, Scale } from 'lucide-react'

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
  const modalRef = useRef<HTMLDivElement>(null)

  // Focus trap and auto-focus
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      
      // Trap focus
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
        
        if (e.key === 'Tab' && modalRef.current) {
          const focusables = modalRef.current.querySelectorAll<HTMLElement>(
            'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
          const first = focusables[0]
          const last = focusables[focusables.length - 1]
          
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault()
            last.focus()
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
      
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setWeight('')
      setDate(new Date().toISOString().split('T')[0])
      setNote('')
      setError('')
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
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

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="weight-modal-title"
    >
      <div 
        ref={modalRef}
        className="w-full max-w-md bg-zinc-900 rounded-3xl shadow-[0_16px_64px_rgba(0,0,0,0.5)] p-6 animate-scale-in"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 rounded-xl">
              <Scale className="w-5 h-5 text-rose-400" />
            </div>
            <h2 id="weight-modal-title" className="text-lg font-medium text-zinc-200">
              Ajouter un poids
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-xl transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-sm text-rose-400" role="alert">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="weight-input" className="text-sm text-zinc-400 mb-2 block">
              Poids (kg) <span className="text-rose-400">*</span>
            </label>
            <input
              ref={inputRef}
              id="weight-input"
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="75.5"
              step="0.1"
              min="0"
              max="500"
              required
              className="w-full bg-zinc-800/50 text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all"
              aria-describedby="weight-help"
            />
            <p id="weight-help" className="text-xs text-zinc-600 mt-1">
              Entre 0 et 500 kg
            </p>
          </div>

          <div>
            <label htmlFor="weight-date" className="text-sm text-zinc-400 mb-2 block">
              Date
            </label>
            <input
              id="weight-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full bg-zinc-800/50 text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all"
            />
          </div>

          <div>
            <label htmlFor="weight-note" className="text-sm text-zinc-400 mb-2 block">
              Note (optionnel)
            </label>
            <input
              id="weight-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Après le sport..."
              maxLength={100}
              className="w-full bg-zinc-800/50 text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-zinc-800 text-zinc-400 rounded-xl hover:bg-zinc-700 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500/30 transition-all font-medium"
            >
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

