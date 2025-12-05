import { useState, useCallback, useMemo } from 'react'
import { Search, Plus, X, UtensilsCrossed, Minus } from 'lucide-react'
import { searchFoods, getFoodById, calculateNutrition, FOOD_CATEGORIES, FoodItem } from '../../utils/foodDatabase'
import { FoodPortion } from '../../types/health'

interface FoodSelectorProps {
  selectedFoods: FoodPortion[]
  onChange: (foods: FoodPortion[]) => void
}

export function FoodSelector({ selectedFoods, onChange }: FoodSelectorProps) {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FoodItem[]>([])
  const [showResults, setShowResults] = useState(false)

  // Recherche d'aliments
  const handleSearch = useCallback((value: string) => {
    setQuery(value)
    if (value.length >= 2) {
      const results = searchFoods(value)
      setSearchResults(results)
      setShowResults(true)
    } else {
      setSearchResults([])
      setShowResults(false)
    }
  }, [])

  // Ajouter un aliment
  const handleAddFood = useCallback((food: FoodItem) => {
    const defaultGrams = food.gramsPerUnit || 100
    const newPortion: FoodPortion = {
      foodId: food.id,
      grams: defaultGrams,
      unit: food.commonUnit,
      unitCount: 1
    }
    onChange([...selectedFoods, newPortion])
    setQuery('')
    setSearchResults([])
    setShowResults(false)
  }, [selectedFoods, onChange])

  // Modifier la quantité d'un aliment
  const handleUpdateGrams = useCallback((index: number, grams: number) => {
    const updated = [...selectedFoods]
    updated[index] = { ...updated[index], grams: Math.max(1, grams) }
    onChange(updated)
  }, [selectedFoods, onChange])

  // Supprimer un aliment
  const handleRemoveFood = useCallback((index: number) => {
    onChange(selectedFoods.filter((_, i) => i !== index))
  }, [selectedFoods, onChange])

  // Calculer le total des macros
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

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => query.length >= 2 && setShowResults(true)}
            placeholder="Rechercher un aliment..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-[background-color] duration-200"
            autoComplete="off"
          />
        </div>

        {/* Résultats de recherche */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-2 bg-zinc-900 border border-zinc-800/50 rounded-xl shadow-xl max-h-64 overflow-y-auto">
            {searchResults.map((food) => {
              const categoryInfo = FOOD_CATEGORIES.find(c => c.value === food.category)
              return (
                <button
                  key={food.id}
                  onClick={() => handleAddFood(food)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800/50 transition-[background-color] duration-200 text-left border-b border-zinc-800/50 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{categoryInfo?.emoji}</span>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{food.name}</p>
                      <p className="text-xs text-zinc-500">
                        {food.caloriesPer100g} kcal / 100g
                        {food.commonUnit && ` • ${food.gramsPerUnit}g par ${food.commonUnit === 'piece' ? 'pièce' : food.commonUnit}`}
                      </p>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-emerald-400" />
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Aliments sélectionnés */}
      {selectedFoods.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4" aria-hidden="true" />
            Aliments du repas ({selectedFoods.length})
          </h3>
          
          <div className="space-y-2">
            {selectedFoods.map((portion, index) => {
              const food = getFoodById(portion.foodId)
              if (!food) return null

              const nutrition = calculateNutrition(food, portion.grams)
              const categoryInfo = FOOD_CATEGORIES.find(c => c.value === food.category)

              return (
                <div
                  key={index}
                  className="p-3 bg-zinc-800/30 rounded-xl border border-zinc-800/50 hover:border-zinc-700 transition-[background-color] duration-200"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-base">{categoryInfo?.emoji}</span>
                      <span className="text-sm font-medium text-zinc-200 truncate">{food.name}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveFood(index)}
                      className="p-1 hover:bg-rose-500/10 rounded-lg text-zinc-600 hover:text-rose-400 transition-[background-color] duration-200"
                      aria-label={`Retirer ${food.name}`}
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Contrôles quantité */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateGrams(index, portion.grams - 10)}
                        className="p-1 bg-zinc-700/50 hover:bg-zinc-700 rounded-lg transition-[background-color] duration-200"
                        disabled={portion.grams <= 10}
                      >
                        <Minus className="w-3 h-3 text-zinc-400" />
                      </button>
                      <input
                        type="number"
                        value={portion.grams}
                        onChange={(e) => handleUpdateGrams(index, parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-center text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/50"
                        min="1"
                      />
                      <span className="text-xs text-zinc-500">g</span>
                      <button
                        onClick={() => handleUpdateGrams(index, portion.grams + 10)}
                        className="p-1 bg-zinc-700/50 hover:bg-zinc-700 rounded-lg transition-[background-color] duration-200"
                      >
                        <Plus className="w-3 h-3 text-zinc-400" />
                      </button>
                    </div>

                    {/* Macros */}
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span className="text-orange-400 font-medium">{nutrition.calories} kcal</span>
                      <span>P: {nutrition.protein}g</span>
                      <span>G: {nutrition.carbs}g</span>
                      <span>L: {nutrition.fat}g</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Totaux */}
          <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-xl border border-emerald-500/20">
            <h4 className="text-sm font-medium text-zinc-300 mb-2">Total du repas</h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="text-center">
                <p className="text-lg font-bold text-orange-400">{totalNutrition.calories}</p>
                <p className="text-xs text-zinc-500">Calories</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-rose-400">{totalNutrition.protein}g</p>
                <p className="text-xs text-zinc-500">Protéines</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-amber-400">{totalNutrition.carbs}g</p>
                <p className="text-xs text-zinc-500">Glucides</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-yellow-400">{totalNutrition.fat}g</p>
                <p className="text-xs text-zinc-500">Lipides</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-400">{totalNutrition.fiber}g</p>
                <p className="text-xs text-zinc-500">Fibres</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message si aucun aliment */}
      {selectedFoods.length === 0 && (
        <div className="text-center py-8 text-zinc-600">
          <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Recherchez et ajoutez des aliments</p>
        </div>
      )}
    </div>
  )
}

