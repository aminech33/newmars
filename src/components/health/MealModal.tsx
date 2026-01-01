import { useState, useEffect, useRef, useMemo } from 'react'
import { Apple, Sparkles } from 'lucide-react'
import { detectMealType } from '../../utils/healthIntelligence'
import { calculateNutrition, getFoodById } from '../../utils/foodDatabase'
import { FoodPortion } from '../../types/health'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { FoodSelector } from './FoodSelector'
import { generateOptimalMeals, UserGoal, MealCount } from '../../utils/simpleMealGenerator'

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
  latestWeight?: { weight: number; date: string }
  targetCalories?: number
  userGoal?: UserGoal
}

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Petit-déjeuner', emoji: '🌅' },
  { value: 'lunch', label: 'Déjeuner', emoji: '☀️' },
  { value: 'dinner', label: 'Dîner', emoji: '🌙' },
  { value: 'snack', label: 'Collation', emoji: '🍎' }
] as const

export function MealModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  latestWeight,
  targetCalories,
  userGoal = 'maintain'
}: MealModalProps) {
  const [name, setName] = useState('')
  const [selectedFoods, setSelectedFoods] = useState<FoodPortion[]>([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5))
  const [type, setType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch')
  const [error, setError] = useState('')
  const [mealCount, setMealCount] = useState<MealCount>(2)
  const [showManualMode, setShowManualMode] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)

  // Fonction pour générer les repas automatiquement (1 ou 2)
  const handleGenerateMeals = () => {
    if (!targetCalories) {
      setError('Configurez votre profil d\'abord (⚙️ Profil)')
      return
    }

    try {
      const meals = generateOptimalMeals(
        targetCalories,
        userGoal,
        mealCount,
        latestWeight?.weight || 75
      )

      if (meals.length > 0) {
        // Utiliser le premier repas généré
        const meal = meals[0]
        setName(meal.name)
        setSelectedFoods(meal.foods)
        setShowManualMode(true) // Afficher le mode manuel après génération
        setError('')
      }
    } catch (err) {
      setError('Erreur lors de la génération')
      console.error(err)
    }
  }

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
      setShowManualMode(false) // Reset au mode générateur
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
        showManualMode ? (
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
        ) : null
      }
    >
      {/* Header with icon */}
      <div className="flex items-center gap-3 mb-6 -mt-2">
        <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl border border-emerald-500/20">
          <Apple className="w-5 h-5 text-emerald-400" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-100">
          Ajouter un repas
        </h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-sm text-rose-400" role="alert">
          {error}
        </div>
      )}

      {/* MODE GÉNÉRATEUR (par défaut) */}
      {!showManualMode && latestWeight && targetCalories && (
        <div className="space-y-5">
          {/* Banner premium */}
          <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1">
                <p className="text-base font-semibold text-indigo-300 mb-1">
                  📊 {latestWeight.weight.toFixed(1)} kg
                </p>
                <p className="text-xs text-zinc-400">
                  Objectif : <span className="text-indigo-400 font-medium">{Math.round(targetCalories)} kcal/jour</span>
                </p>
              </div>
            </div>
          </div>

          {/* Choix 1 ou 2 repas - Design premium */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-zinc-300">Répartition quotidienne</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMealCount(1)}
                className={`group relative p-4 rounded-xl text-left transition-all border-2 ${
                  mealCount === 1
                    ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/50'
                    : 'bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">🍽️</span>
                  <span className={`text-sm font-semibold ${mealCount === 1 ? 'text-indigo-300' : 'text-zinc-400'}`}>
                    1 repas
                  </span>
                </div>
                <p className={`text-xs ${mealCount === 1 ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  OMAD
                </p>
                <p className={`text-[10px] mt-1 ${mealCount === 1 ? 'text-indigo-400/70' : 'text-zinc-700'}`}>
                  {Math.round(targetCalories)} kcal
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMealCount(2)}
                className={`group relative p-4 rounded-xl text-left transition-all border-2 ${
                  mealCount === 2
                    ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/50'
                    : 'bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">🍽️🍽️</span>
                  <span className={`text-sm font-semibold ${mealCount === 2 ? 'text-indigo-300' : 'text-zinc-400'}`}>
                    2 repas
                  </span>
                </div>
                <p className={`text-xs ${mealCount === 2 ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {userGoal === 'lose' ? '40/60' : '50/50'}
                </p>
                <p className={`text-[10px] mt-1 ${mealCount === 2 ? 'text-indigo-400/70' : 'text-zinc-700'}`}>
                  {Math.round(targetCalories * (userGoal === 'lose' ? 0.4 : 0.5))} + {Math.round(targetCalories * (userGoal === 'lose' ? 0.6 : 0.5))} kcal
                </p>
              </button>
            </div>
          </div>

          {/* Bouton générer - ÉNORME et premium */}
          <button
            type="button"
            onClick={handleGenerateMeals}
            className="w-full group relative overflow-hidden p-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40"
          >
            <div className="relative flex items-center justify-center gap-3">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
              <span className="text-base font-semibold text-white">
                Générer {mealCount === 1 ? 'mon repas' : 'mes repas'} optimal{mealCount === 2 ? 's' : ''}
              </span>
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
          </button>

          {/* Lien mode manuel - Discret */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setShowManualMode(true)}
              className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors underline decoration-dotted"
            >
              ou ajouter manuellement
            </button>
          </div>
        </div>
      )}

      {/* MODE MANUEL */}
      {showManualMode && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bouton retour au générateur */}
          {latestWeight && targetCalories && (
            <button
              type="button"
              onClick={() => setShowManualMode(false)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              Retour au générateur
            </button>
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

          {/* Type de repas - Auto-détecté, affiché simplement */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Type détecté : {MEAL_TYPES.find(t => t.value === type)?.emoji} {MEAL_TYPES.find(t => t.value === type)?.label}
            </label>
          </div>

          {/* FoodSelector - Nouveau composant */}
          <div className="border-t border-zinc-800/50 pt-4">
            <FoodSelector
              selectedFoods={selectedFoods}
              onChange={setSelectedFoods}
            />
          </div>
        </form>
      )}
    </Modal>
  )
}
