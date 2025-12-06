import { memo } from 'react'
import { Calendar, Apple, Flame, Trash2, Copy } from 'lucide-react'
import { MealEntry } from '../../types/health'
import { Tooltip } from '../ui/Tooltip'

interface MealListProps {
  entries: MealEntry[]
  onDelete: (id: string) => void
  onDuplicate?: (meal: MealEntry) => void
  compact?: boolean
}

const MEAL_EMOJIS = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎'
}

const MEAL_LABELS = {
  breakfast: 'Petit-déj',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
  snack: 'Collation'
}

export const MealList = memo(function MealList({ entries, onDelete, onDuplicate, compact = false }: MealListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <Apple className="w-12 h-12 text-zinc-700 mx-auto mb-3" aria-hidden="true" />
        <p className="text-zinc-500 mb-2">Aucun repas enregistré</p>
        <p className="text-zinc-600 text-sm">Commencez à suivre votre alimentation</p>
      </div>
    )
  }

  // Group by date
  const groupedByDate = entries.reduce((acc, meal) => {
    const dateKey = meal.date
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(meal)
    return acc
  }, {} as Record<string, MealEntry[]>)

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  )

  return (
    <div className="space-y-6" role="list" aria-label="Journal alimentaire">
      {sortedDates.map((dateKey) => {
        const meals = groupedByDate[dateKey]
        const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0)
        const isToday = dateKey === new Date().toISOString().split('T')[0]
        
        return (
          <div key={dateKey} role="group" aria-label={`Repas du ${new Date(dateKey).toLocaleDateString('fr-FR')}`}>
            {/* Date header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-zinc-600" aria-hidden="true" />
                <span className={`text-sm font-medium ${isToday ? 'text-indigo-400' : 'text-zinc-400'}`}>
                  {isToday ? "Aujourd'hui" : new Date(dateKey).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Flame className="w-4 h-4 text-orange-400" aria-hidden="true" />
                <span className="text-orange-400 font-medium">{totalCalories} kcal</span>
              </div>
            </div>

            {/* Meals */}
            <div className="space-y-2">
              {meals.map((meal) => (
                <div 
                  key={meal.id} 
                  className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-2xl hover:bg-zinc-800/50 transition-[background-color] duration-200 group"
                  role="listitem"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-lg" aria-hidden="true">{MEAL_EMOJIS[meal.type]}</span>
                      <div>
                        <span className="text-xs text-zinc-600 block">{meal.time}</span>
                        <span className="text-xs text-zinc-500">{MEAL_LABELS[meal.type]}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-zinc-200 block truncate">{meal.name}</span>
                      {/* Affichage des macros */}
                      <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                        {meal.protein !== undefined && (
                          <span className="text-rose-400/80">P: {meal.protein}g</span>
                        )}
                        {meal.carbs !== undefined && (
                          <span className="text-amber-400/80">G: {meal.carbs}g</span>
                        )}
                        {meal.fat !== undefined && (
                          <span className="text-yellow-400/80">L: {meal.fat}g</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Flame className="w-4 h-4 text-orange-400" aria-hidden="true" />
                      <span className="text-sm font-bold text-orange-400">{meal.calories}</span>
                      <span className="text-xs text-zinc-600">kcal</span>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onDuplicate && (
                        <Tooltip content="Dupliquer ce repas">
                          <button
                            onClick={() => onDuplicate(meal)}
                            className="p-2 text-zinc-600 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-[background-color] duration-200"
                            aria-label={`Dupliquer ${meal.name}`}
                          >
                            <Copy className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </Tooltip>
                      )}
                      
                      <Tooltip content="Supprimer ce repas">
                        <button
                          onClick={() => onDelete(meal.id)}
                          className="p-2 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-[background-color] duration-200"
                          aria-label={`Supprimer ${meal.name}`}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
})

