/**
 * Formulaire inline pour ajouter un repas
 * Remplace le modal pour une meilleure UX
 */
import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Apple, Sparkles, X, ChevronDown, ChevronUp } from 'lucide-react'
import { detectMealType } from '../../utils/healthIntelligence'
import { calculateNutrition, getFoodById } from '../../utils/foodDatabase'
import { FoodPortion } from '../../types/health'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { FoodSelector } from './FoodSelector'
import { generateOptimalMeals, UserGoal, MealCount } from '../../utils/simpleMealGenerator'

interface InlineMealFormProps {
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
  onCancel: () => void
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

export function InlineMealForm({
  onSubmit,
  onCancel,
  latestWeight,
  targetCalories,
  userGoal = 'maintain'
}: InlineMealFormProps) {
  const [name, setName] = useState('')
  const [selectedFoods, setSelectedFoods] = useState<FoodPortion[]>([])
  const [type, setType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>(
    detectMealType(new Date().toTimeString().slice(0, 5))
  )
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5))
  const [mealCount, setMealCount] = useState<MealCount>(2)
  const [showGenerator, setShowGenerator] = useState(!!latestWeight && !!targetCalories)
  const [error, setError] = useState('')
  const [isExpanded, setIsExpanded] = useState(true)

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!showGenerator && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showGenerator])

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

  // Générer les repas automatiquement
  const handleGenerateMeals = useCallback(() => {
    if (!targetCalories) {
      setError('Configurez votre profil d\'abord')
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
        const meal = meals[0]
        setName(meal.name)
        setSelectedFoods(meal.foods)
        setShowGenerator(false)
        setError('')
      }
    } catch (err) {
      setError('Erreur lors de la génération')
      console.error(err)
    }
  }, [targetCalories, userGoal, mealCount, latestWeight])

  const handleSubmit = useCallback((e?: React.FormEvent) => {
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
      // Reset form
      setName('')
      setSelectedFoods([])
      setShowGenerator(!!latestWeight && !!targetCalories)
      onCancel()
    } else if (result.error) {
      setError(result.error)
    }
  }, [name, selectedFoods, totalNutrition, date, time, type, onSubmit, onCancel, latestWeight, targetCalories])

  return (
    <div className="bg-zinc-900/80 rounded-xl border border-emerald-500/30 overflow-hidden">
      {/* Header cliquable */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Apple className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-zinc-200">Nouveau repas</h3>
            {totalNutrition.calories > 0 && (
              <p className="text-xs text-emerald-400">{Math.round(totalNutrition.calories)} kcal</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onCancel() }}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50 rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-zinc-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-zinc-500" />
          )}
        </div>
      </button>

      {/* Contenu */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* Erreur */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              <p className="text-xs text-rose-400">{error}</p>
            </div>
          )}

          {/* MODE GÉNÉRATEUR */}
          {showGenerator && latestWeight && targetCalories ? (
            <div className="space-y-4">
              {/* Stats utilisateur */}
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-indigo-300">
                    {latestWeight.weight.toFixed(1)} kg
                  </span>
                  <span className="text-xs text-zinc-500">
                    Objectif: <span className="text-indigo-400">{Math.round(targetCalories)} kcal/j</span>
                  </span>
                </div>
              </div>

              {/* Choix 1 ou 2 repas */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMealCount(1)}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    mealCount === 1
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                      : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-500 hover:border-zinc-600'
                  }`}
                >
                  <span className="text-lg">🍽️</span>
                  <span className="ml-2 text-sm font-medium">1 repas</span>
                  <p className="text-[10px] mt-1 opacity-70">{Math.round(targetCalories)} kcal</p>
                </button>
                <button
                  type="button"
                  onClick={() => setMealCount(2)}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    mealCount === 2
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                      : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-500 hover:border-zinc-600'
                  }`}
                >
                  <span className="text-lg">🍽️🍽️</span>
                  <span className="ml-2 text-sm font-medium">2 repas</span>
                  <p className="text-[10px] mt-1 opacity-70">
                    {Math.round(targetCalories * 0.5)} + {Math.round(targetCalories * 0.5)} kcal
                  </p>
                </button>
              </div>

              {/* Bouton générer */}
              <button
                type="button"
                onClick={handleGenerateMeals}
                className="w-full p-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
              >
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-white" />
                  <span className="text-sm font-semibold text-white">
                    Générer mon repas optimal
                  </span>
                </div>
              </button>

              {/* Lien mode manuel */}
              <button
                type="button"
                onClick={() => setShowGenerator(false)}
                className="w-full text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
              >
                ou ajouter manuellement
              </button>
            </div>
          ) : (
            /* MODE MANUEL */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Retour au générateur */}
              {latestWeight && targetCalories && (
                <button
                  type="button"
                  onClick={() => setShowGenerator(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Utiliser le générateur
                </button>
              )}

              {/* Info si pas de profil */}
              {(!latestWeight || !targetCalories) && (
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-[10px] text-amber-300">
                    Configurez votre profil pour le générateur intelligent
                  </p>
                </div>
              )}

              <Input
                ref={inputRef}
                label="Nom du repas"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mon petit-déjeuner protéiné"
                maxLength={100}
              />

              <div className="grid grid-cols-2 gap-3">
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

              {/* Type détecté */}
              <p className="text-xs text-zinc-500">
                Type: {MEAL_TYPES.find(t => t.value === type)?.emoji} {MEAL_TYPES.find(t => t.value === type)?.label}
              </p>

              {/* Sélecteur d'aliments */}
              <div className="border-t border-zinc-800/50 pt-3">
                <FoodSelector
                  selectedFoods={selectedFoods}
                  onChange={setSelectedFoods}
                />
              </div>

              {/* Résumé nutrition */}
              {selectedFoods.length > 0 && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-emerald-400">{Math.round(totalNutrition.calories)}</p>
                      <p className="text-[10px] text-zinc-500">kcal</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-rose-400">{Math.round(totalNutrition.protein)}g</p>
                      <p className="text-[10px] text-zinc-500">Prot</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-400">{Math.round(totalNutrition.carbs)}g</p>
                      <p className="text-[10px] text-zinc-500">Gluc</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-yellow-400">{Math.round(totalNutrition.fat)}g</p>
                      <p className="text-[10px] text-zinc-500">Lip</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="secondary"
                  onClick={onCancel}
                  type="button"
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  variant="success"
                  type="submit"
                  disabled={!name.trim() || selectedFoods.length === 0}
                  className="flex-1"
                >
                  Ajouter
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
