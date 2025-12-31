import { memo } from 'react'
import { Flame, Trash2, Copy, MoreHorizontal } from 'lucide-react'
import { MealEntry } from '../../types/health'
import { useState } from 'react'

interface MealListProps {
  entries: MealEntry[]
  onDelete: (id: string) => void
  onDuplicate?: (meal: MealEntry) => void
  compact?: boolean
  targetCalories?: number
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

export const MealList = memo(function MealList({ entries, onDelete, onDuplicate, targetCalories = 2000 }: MealListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  
  if (entries.length === 0) {
    return null // Empty state géré par le parent
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

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-1.5" role="list" aria-label="Journal alimentaire">
      {sortedDates.map((dateKey) => {
        const meals = groupedByDate[dateKey].sort((a, b) => a.time.localeCompare(b.time))
        const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0)
        const isToday = dateKey === today
        const progress = Math.round((totalCalories / targetCalories) * 100)
        
        // Séparateur de date (comme dans TasksPage)
        const dateLabel = isToday 
          ? "Aujourd'hui" 
          : dateKey === new Date(Date.now() - 86400000).toISOString().split('T')[0]
            ? "Hier"
            : new Date(dateKey).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
        
        return (
          <div key={dateKey} role="group">
            {/* Date separator (minimaliste) */}
            <div className="flex items-center gap-3 py-2 px-3">
              <span className={`text-xs font-medium ${isToday ? 'text-zinc-300' : 'text-zinc-600'}`}>
                {dateLabel}
              </span>
              <div className="flex-1 h-px bg-zinc-800/50" />
              <span className="text-xs font-semibold tabular-nums text-orange-400">
                {totalCalories} kcal
              </span>
              {isToday && (
                <span className="text-xs text-zinc-600">
                  {progress}%
                </span>
              )}
            </div>

            {/* Meals (format row comme TaskRow) */}
            <div className="space-y-1">
              {meals.map((meal) => (
                <div 
                  key={meal.id} 
                  className="group flex items-center gap-3 h-11 px-3 rounded-lg cursor-pointer bg-zinc-800/30 hover:bg-zinc-800/50 transition-all duration-150"
                  role="listitem"
                >
                  {/* Emoji + Time */}
                  <span className="text-base flex-shrink-0">{MEAL_EMOJIS[meal.type]}</span>
                  <span className="text-xs text-zinc-600 w-12 flex-shrink-0 tabular-nums">{meal.time}</span>
                  
                  {/* Nom du repas */}
                  <span className="flex-1 min-w-0 text-sm font-medium text-zinc-200 truncate">
                    {meal.name}
                  </span>
                  
                  {/* Macros (compactes) */}
                  {(meal.protein || meal.carbs || meal.fat) && (
                    <div className="hidden sm:flex items-center gap-2 text-xs flex-shrink-0">
                      {meal.protein !== undefined && (
                        <span className="text-rose-400 tabular-nums">{Math.round(meal.protein)}g</span>
                      )}
                      {meal.carbs !== undefined && (
                        <span className="text-amber-400 tabular-nums">{Math.round(meal.carbs)}g</span>
                      )}
                      {meal.fat !== undefined && (
                        <span className="text-yellow-400 tabular-nums">{Math.round(meal.fat)}g</span>
                      )}
                    </div>
                  )}
                  
                  {/* Calories */}
                  <span className="text-sm font-bold text-orange-400 tabular-nums flex-shrink-0 w-16 text-right">
                    {meal.calories}
                  </span>
                  
                  {/* Menu actions */}
                  <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === meal.id ? null : meal.id)}
                      className="p-1.5 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="Options"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {openMenuId === meal.id && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 py-1">
                        {onDuplicate && (
                          <button
                            onClick={() => { onDuplicate(meal); setOpenMenuId(null) }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700/50 transition-colors"
                          >
                            <Copy className="w-4 h-4" /> Dupliquer
                          </button>
                        )}
                        <button
                          onClick={() => { onDelete(meal.id); setOpenMenuId(null) }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" /> Supprimer
                        </button>
                      </div>
                    )}
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

