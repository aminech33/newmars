import { useState, useEffect, useRef, useMemo } from 'react'
import { Apple } from 'lucide-react'
import { detectMealType } from '../../utils/healthIntelligence'
import { calculateNutrition, getFoodById } from '../../utils/foodDatabase'
import { FoodPortion } from '../../types/health'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { FoodSelector } from './FoodSelector'

interface MealModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { 
    name: string
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber?: number
    foods: FoodPortion[]
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
  const [selectedFoods, setSelectedFoods] = useState<FoodPortion[]>([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5))
  const [type, setType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch')
  const [error, setError] = useState('')
  
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      const now = new Date()
      setName('')
      setSelectedFoods([])
      setDate(now.toISOString().split('T')[0])
      setTime(now.toTimeString().slice(0, 5))
      setType(detectMealType(now.toTimeString().slice(0, 5)))
      setError('')
    }
  }, [isOpen])

  // Auto-detect meal type when time changes
  const handleTimeChange = (newTime: string) => {
    setTime(newTime)
    setType(detectMealType(newTime))
  }

  // Calculer les totaux depuis les aliments sélectionnés
  const totalNutrition = useMemo(() => {
    return selectedFoods.reduce((acc, portion) => {
      const food = getFoodById(portion.foodId)
      if (food) {
        const nutrition = calculateNutrition(food, portion.grams)
        return {
          calories: acc.calories + nutrition.calories,
          protein: acc.protein + nutrition.protein,
          carbs: acc.carbs + nutrition.carbs,
          fat: acc.fat + nutrition.fat,
          fiber: acc.fiber + nutrition.fiber
        }
      }
      return acc
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })
  }, [selectedFoods])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    setError('')
    
    if (!name.trim()) {
      setError('Veuillez entrer un nom de repas')
      return
    }

    if (selectedFoods.length === 0) {
      setError('Veuillez ajouter au moins un aliment')
      return
    }
    
    const result = onSubmit({ 
      name: name.trim(), 
      calories: totalNutrition.calories,
      protein: totalNutrition.protein,
      carbs: totalNutrition.carbs,
      fat: totalNutrition.fat,
      fiber: totalNutrition.fiber,
      foods: selectedFoods,
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
            variant="success"
            onClick={() => handleSubmit()}
            disabled={!name.trim() || selectedFoods.length === 0}
          >
            Ajouter le repas
          </Button>
        </>
      }
    >
      {/* Header with icon */}
      <div className="flex items-center gap-3 mb-6 -mt-2">
        <div className="p-2 bg-emerald-500/20 rounded-xl">
          <Apple className="w-5 h-5 text-emerald-400" />
        </div>
        <h2 className="text-lg font-medium text-zinc-200">
          Ajouter un repas
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
          label="Nom du repas"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Mon petit-déjeuner protéiné"
          required
          maxLength={100}
          hint="Ex: Petit-déj post-training, Déjeuner léger..."
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
          <Input
            label="Heure"
            type="time"
            value={time}
            onChange={(e) => handleTimeChange(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Type de repas
          </label>
          <div className="grid grid-cols-4 gap-2">
            {MEAL_TYPES.map((mealType) => (
              <button
                key={mealType.value}
                type="button"
                onClick={() => setType(mealType.value)}
                className={`p-3 rounded-xl text-center transition-[background-color] duration-200 border ${
                  type === mealType.value
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    : 'bg-zinc-800/50 border-zinc-800/50 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <span className="text-lg block mb-1">{mealType.emoji}</span>
                <span className="text-xs">{mealType.label.split('-')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* FoodSelector - Nouveau composant */}
        <div className="border-t border-zinc-800/50 pt-4">
          <FoodSelector
            selectedFoods={selectedFoods}
            onChange={setSelectedFoods}
          />
        </div>
      </form>
    </Modal>
  )
}
