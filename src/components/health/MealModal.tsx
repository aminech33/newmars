import { useState, useEffect, useRef } from 'react'
import { X, Apple } from 'lucide-react'
import { detectFoodCalories, detectMealType } from '../../utils/healthIntelligence'

interface MealModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { 
    name: string
    calories: number
    date: string
    time: string
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack' 
  }) => { success: boolean; error?: string }
}

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Petit-déjeuner', emoji: '🌅' },
  { value: 'lunch', label: 'Déjeuner', emoji: '☀️' },
  { value: 'dinner', label: 'Dîner', emoji: '🌙' },
  { value: 'snack', label: 'Collation', emoji: '🍎' }
] as const

export function MealModal({ isOpen, onClose, onSubmit }: MealModalProps) {
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5))
  const [type, setType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch')
  const [error, setError] = useState('')
  const [autoCalories, setAutoCalories] = useState<number | null>(null)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Focus trap and auto-focus
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      
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
      const now = new Date()
      setName('')
      setCalories('')
      setDate(now.toISOString().split('T')[0])
      setTime(now.toTimeString().slice(0, 5))
      setType(detectMealType(now.toTimeString().slice(0, 5)))
      setError('')
      setAutoCalories(null)
    }
  }, [isOpen])

  // Auto-detect calories when name changes
  useEffect(() => {
    if (name.trim()) {
      const detected = detectFoodCalories(name)
      setAutoCalories(detected)
    } else {
      setAutoCalories(null)
    }
  }, [name])

  // Auto-detect meal type when time changes
  const handleTimeChange = (newTime: string) => {
    setTime(newTime)
    setType(detectMealType(newTime))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!name.trim()) {
      setError('Veuillez entrer un nom de repas')
      return
    }
    
    const caloriesNum = calories ? parseInt(calories) : (autoCalories || 200)
    
    const result = onSubmit({ 
      name: name.trim(), 
      calories: caloriesNum, 
      date, 
      time, 
      type 
    })
    
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
      aria-labelledby="meal-modal-title"
    >
      <div 
        ref={modalRef}
        className="w-full max-w-md bg-zinc-900 rounded-3xl shadow-[0_16px_64px_rgba(0,0,0,0.5)] p-6 animate-scale-in"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl">
              <Apple className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 id="meal-modal-title" className="text-lg font-medium text-zinc-200">
              Ajouter un repas
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
            <label htmlFor="meal-name" className="text-sm text-zinc-400 mb-2 block">
              Nom du repas <span className="text-rose-400">*</span>
            </label>
            <input
              ref={inputRef}
              id="meal-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Poulet grillé avec riz"
              required
              maxLength={100}
              className="w-full bg-zinc-800/50 text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="meal-date" className="text-sm text-zinc-400 mb-2 block">
                Date
              </label>
              <input
                id="meal-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full bg-zinc-800/50 text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
            <div>
              <label htmlFor="meal-time" className="text-sm text-zinc-400 mb-2 block">
                Heure
              </label>
              <input
                id="meal-time"
                type="time"
                value={time}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full bg-zinc-800/50 text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="meal-type" className="text-sm text-zinc-400 mb-2 block">
              Type de repas
            </label>
            <div className="grid grid-cols-4 gap-2">
              {MEAL_TYPES.map((mealType) => (
                <button
                  key={mealType.value}
                  type="button"
                  onClick={() => setType(mealType.value)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    type === mealType.value
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                      : 'bg-zinc-800/50 border-transparent text-zinc-400 hover:bg-zinc-800'
                  }`}
                  style={{ border: '1px solid' }}
                >
                  <span className="text-lg block mb-1">{mealType.emoji}</span>
                  <span className="text-xs">{mealType.label.split('-')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="meal-calories" className="text-sm text-zinc-400 mb-2 block">
              Calories
              {autoCalories && !calories && (
                <span className="text-emerald-400 ml-2">
                  (détecté: ~{autoCalories} kcal)
                </span>
              )}
            </label>
            <input
              id="meal-calories"
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder={autoCalories ? `~${autoCalories} (auto)` : '200'}
              min="0"
              max="10000"
              className="w-full bg-zinc-800/50 text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              aria-describedby="calories-help"
            />
            <p id="calories-help" className="text-xs text-zinc-600 mt-1">
              Laissez vide pour détection automatique
            </p>
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
              className="flex-1 px-4 py-3 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-all font-medium"
            >
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

