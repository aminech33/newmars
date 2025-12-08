import { useState, useMemo } from 'react'
import { Search, Book, X } from 'lucide-react'
import { FOOD_DATABASE, FOOD_CATEGORIES, FoodItem } from '../../utils/foodDatabase'
import { FoodDetailModal } from './FoodDetailModal'

interface FoodDatabaseViewerProps {
  isOpen: boolean
  onClose: () => void
  onSelectFood?: (food: FoodItem) => void
}

export function FoodDatabaseViewer({ isOpen, onClose, onSelectFood }: FoodDatabaseViewerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [customFoods, setCustomFoods] = useState<Record<string, FoodItem>>({})

  // Merge base database avec les aliments modifiés
  const foodDatabase = useMemo(() => {
    return FOOD_DATABASE.map(food => customFoods[food.id] || food)
  }, [customFoods])

  // Filtrer les aliments
  const filteredFoods = useMemo(() => {
    let foods = foodDatabase

    // Filtre par catégorie
    if (selectedCategory !== 'all') {
      foods = foods.filter(f => f.category === selectedCategory)
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      foods = foods.filter(f => 
        f.name.toLowerCase().includes(query) ||
        f.searchTerms?.some(term => term.toLowerCase().includes(query))
      )
    }

    return foods
  }, [searchQuery, selectedCategory, foodDatabase])

  // Stats
  const stats = useMemo(() => {
    return {
      total: foodDatabase.length,
      byCategory: FOOD_CATEGORIES.map(cat => ({
        ...cat,
        count: foodDatabase.filter(f => f.category === cat.value).length
      }))
    }
  }, [foodDatabase])

  const handleFoodClick = (food: FoodItem) => {
    setSelectedFood(food)
    setShowDetailModal(true)
  }

  const handleUpdateFood = (updatedFood: FoodItem) => {
    setCustomFoods(prev => ({
      ...prev,
      [updatedFood.id]: updatedFood
    }))
    setShowDetailModal(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-800/50 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl">
              <Book className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-zinc-200">Base de données alimentaire</h2>
              <p className="text-sm text-zinc-500">{stats.total} aliments référencés</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-xl transition-[background-color] duration-200"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-6 space-y-4 border-b border-zinc-800/50">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un aliment..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-[background-color] duration-200"
              autoComplete="off"
            />
          </div>

          {/* Category filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-[background-color] duration-200 ${
                selectedCategory === 'all'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 border border-transparent'
              }`}
            >
              Tous ({stats.total})
            </button>
            {stats.byCategory.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-[background-color] duration-200 flex items-center gap-2 ${
                  selectedCategory === cat.value
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 border border-transparent'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label} ({cat.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Foods list */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredFoods.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 mb-2">Aucun aliment trouvé</p>
              <p className="text-zinc-600 text-sm">Essayez une autre recherche ou catégorie</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredFoods.map((food) => {
                const categoryInfo = FOOD_CATEGORIES.find(c => c.value === food.category)
                return (
                  <div
                    key={food.id}
                    className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-800/50 hover:border-zinc-700 transition-[background-color] duration-200 group cursor-pointer"
                    onClick={() => handleFoodClick(food)}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{categoryInfo?.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-zinc-200 mb-1 truncate">{food.name}</h3>
                        
                        {/* Macros pour 100g */}
                        <div className="grid grid-cols-4 gap-2 mb-2">
                          <div>
                            <p className="text-xs text-zinc-600">Calories</p>
                            <p className="text-sm font-bold text-orange-400">{Math.round(food.caloriesPer100g)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-600">Protéines</p>
                            <p className="text-sm font-bold text-rose-400">{Math.round(food.proteinPer100g * 10) / 10}g</p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-600">Glucides</p>
                            <p className="text-sm font-bold text-amber-400">{Math.round(food.carbsPer100g * 10) / 10}g</p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-600">Lipides</p>
                            <p className="text-sm font-bold text-yellow-400">{Math.round(food.fatPer100g * 10) / 10}g</p>
                          </div>
                        </div>

                        {/* Unité commune */}
                        {food.commonUnit && (
                          <p className="text-xs text-zinc-500">
                            {food.gramsPerUnit}g par {food.commonUnit === 'piece' ? 'pièce' : food.commonUnit}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800/50 bg-zinc-900/50">
          <p className="text-xs text-zinc-600 text-center">
            Données issues de USDA FoodData Central et CIQUAL (ANSES France) • Valeurs pour 100g
          </p>
        </div>
      </div>

      {/* Detail Modal */}
      <FoodDetailModal
        food={selectedFood}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onUpdate={handleUpdateFood}
      />
    </div>
  )
}




