import { memo } from 'react'
import { Calendar, Apple, Flame, Trash2 } from 'lucide-react'
import { MealEntry } from '../../types/health'
import { Tooltip } from '../ui/Tooltip'

interface MealListProps {
  entries: MealEntry[]
  onDelete: (id: string) => void
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

export const MealList = memo(function MealList({ entries, onDelete }: MealListProps) {
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
                  className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-2xl hover:bg-zinc-800/50 transition-all group"
                  role="listitem"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg" aria-hidden="true">{MEAL_EMOJIS[meal.type]}</span>
                      <div>
                        <span className="text-xs text-zinc-600 block">{meal.time}</span>
                        <span className="text-xs text-zinc-500">{MEAL_LABELS[meal.type]}</span>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-zinc-200">{meal.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Flame className="w-4 h-4 text-orange-400" aria-hidden="true" />
                      <span className="text-sm font-bold text-orange-400">{meal.calories}</span>
                      <span className="text-xs text-zinc-600">kcal</span>
                    </div>
                    
                    <Tooltip content="Supprimer ce repas">
                      <button
                        onClick={() => onDelete(meal.id)}
                        className="p-2 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        aria-label={`Supprimer ${meal.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </Tooltip>
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

