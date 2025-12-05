import { useMemo } from 'react'
import { Lightbulb, ChefHat, TrendingUp, Flame } from 'lucide-react'
// Note: Ces imports seront utilisés quand les suggestions seront dynamiques
// import { searchFoods, getFoodById, calculateNutrition } from '../../utils/foodDatabase'

interface MealSuggestion {
  name: string
  foods: Array<{ id: string; grams: number }>
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface SmartMealSuggestionsProps {
  caloriesRemaining: number
  onSelectSuggestion: (suggestion: MealSuggestion) => void
}

// Suggestions pré-configurées
const MEAL_TEMPLATES: MealSuggestion[] = [
  {
    name: 'Petit-déj protéiné',
    foods: [
      { id: 'egg-whole', grams: 150 },
      { id: 'bread-whole-wheat', grams: 70 },
      { id: 'avocado', grams: 50 }
    ],
    calories: 450,
    protein: 35,
    carbs: 35,
    fat: 18
  },
  {
    name: 'Déjeuner équilibré',
    foods: [
      { id: 'chicken-breast', grams: 150 },
      { id: 'rice-white-cooked', grams: 200 },
      { id: 'broccoli', grams: 150 },
      { id: 'olive-oil', grams: 10 }
    ],
    calories: 550,
    protein: 55,
    carbs: 60,
    fat: 12
  },
  {
    name: 'Snack léger',
    foods: [
      { id: 'yogurt-greek', grams: 170 },
      { id: 'banana', grams: 120 }
    ],
    calories: 270,
    protein: 17,
    carbs: 40,
    fat: 8.5
  },
  {
    name: 'Dîner riche en protéines',
    foods: [
      { id: 'salmon', grams: 150 },
      { id: 'sweet-potato', grams: 200 },
      { id: 'green-beans', grams: 100 }
    ],
    calories: 520,
    protein: 38,
    carbs: 52,
    fat: 16
  },
  {
    name: 'Collation post-training',
    foods: [
      { id: 'protein-powder', grams: 30 },
      { id: 'banana', grams: 120 },
      { id: 'almond', grams: 20 }
    ],
    calories: 340,
    protein: 28,
    carbs: 35,
    fat: 14
  }
]

export function SmartMealSuggestions({ caloriesRemaining, onSelectSuggestion }: SmartMealSuggestionsProps) {
  
  // Filtrer les suggestions appropriées selon calories restantes
  const relevantSuggestions = useMemo(() => {
    if (caloriesRemaining <= 0) return []
    
    // Marge de ±100 kcal
    return MEAL_TEMPLATES.filter(template => 
      Math.abs(template.calories - caloriesRemaining) <= 150 ||
      template.calories <= caloriesRemaining
    ).sort((a, b) => {
      // Trier par proximité avec l'objectif
      const diffA = Math.abs(a.calories - caloriesRemaining)
      const diffB = Math.abs(b.calories - caloriesRemaining)
      return diffA - diffB
    }).slice(0, 3) // Max 3 suggestions
  }, [caloriesRemaining])

  if (relevantSuggestions.length === 0) return null

  return (
    <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-xl rounded-3xl p-6 border border-indigo-500/20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-500/20 rounded-xl">
          <Lightbulb className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-zinc-200">Suggestions intelligentes</h3>
          <p className="text-sm text-zinc-500">
            Pour atteindre votre objectif (~{caloriesRemaining} kcal restants)
          </p>
        </div>
      </div>

      {/* Suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {relevantSuggestions.map((suggestion, index) => {
          const isCloseMatch = Math.abs(suggestion.calories - caloriesRemaining) <= 50
          
          return (
            <button
              key={index}
              onClick={() => onSelectSuggestion(suggestion)}
              className={`p-4 rounded-xl transition-all duration-300 text-left border-2 hover:scale-105 ${
                isCloseMatch
                  ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-zinc-800/30 border-zinc-800/50 hover:bg-zinc-800/50'
              }`}
            >
              {/* Icon */}
              <div className="flex items-center gap-2 mb-3">
                <ChefHat className={`w-4 h-4 ${isCloseMatch ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <h4 className="text-sm font-semibold text-zinc-200">{suggestion.name}</h4>
                {isCloseMatch && (
                  <TrendingUp className="w-3 h-3 text-emerald-400 ml-auto" />
                )}
              </div>

              {/* Calories principales */}
              <div className="flex items-center gap-1.5 mb-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-xl font-bold text-orange-400">{suggestion.calories}</span>
                <span className="text-xs text-zinc-500">kcal</span>
              </div>

              {/* Macros mini */}
              <div className="flex items-center gap-3 text-xs">
                <span className="text-rose-400">P: {suggestion.protein}g</span>
                <span className="text-amber-400">G: {suggestion.carbs}g</span>
                <span className="text-yellow-400">L: {suggestion.fat}g</span>
              </div>

              {/* Badge si proche */}
              {isCloseMatch && (
                <div className="mt-2 px-2 py-1 bg-emerald-500/20 rounded-lg text-xs text-emerald-400 text-center font-medium">
                  ✨ Parfait pour votre objectif
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Info bulle */}
      <p className="text-xs text-zinc-600 mt-4 text-center">
        Cliquez sur une suggestion pour l'ajouter rapidement à votre journal
      </p>
    </div>
  )
}

