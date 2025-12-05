import { Filter, X } from 'lucide-react'
import { useState } from 'react'
import { EventType, EventCategory, EventPriority } from '../../types/calendar'

interface CalendarFiltersProps {
  onFilterChange: (filters: FilterState) => void
}

export interface FilterState {
  types: EventType[]
  categories: EventCategory[]
  priorities: EventPriority[]
  showCompleted: boolean
}

const typeOptions: { value: EventType; label: string; icon: string }[] = [
  { value: 'meeting', label: 'Réunion', icon: '🗓️' },
  { value: 'deadline', label: 'Deadline', icon: '⏰' },
  { value: 'reminder', label: 'Rappel', icon: '🔔' },
  { value: 'birthday', label: 'Anniversaire', icon: '🎂' },
  { value: 'holiday', label: 'Vacances', icon: '🎉' },
  { value: 'custom', label: 'Personnalisé', icon: '📌' },
]

const categoryOptions: { value: EventCategory; label: string; color: string }[] = [
  { value: 'work', label: 'Travail', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { value: 'personal', label: 'Personnel', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { value: 'health', label: 'Santé', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  { value: 'social', label: 'Social', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { value: 'learning', label: 'Formation', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
]

const priorityOptions: { value: EventPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Basse', color: 'bg-zinc-700/30 text-zinc-500 border-zinc-600/30' },
  { value: 'medium', label: 'Moyenne', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  { value: 'high', label: 'Haute', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { value: 'urgent', label: 'Urgent', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
]

export function CalendarFilters({ onFilterChange }: CalendarFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    types: [],
    categories: [],
    priorities: [],
    showCompleted: true,
  })

  const handleToggleType = (type: EventType) => {
    const updated = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type]
    const newFilters = { ...filters, types: updated }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleToggleCategory = (category: EventCategory) => {
    const updated = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category]
    const newFilters = { ...filters, categories: updated }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleTogglePriority = (priority: EventPriority) => {
    const updated = filters.priorities.includes(priority)
      ? filters.priorities.filter(p => p !== priority)
      : [...filters.priorities, priority]
    const newFilters = { ...filters, priorities: updated }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleToggleCompleted = () => {
    const newFilters = { ...filters, showCompleted: !filters.showCompleted }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleReset = () => {
    const newFilters: FilterState = {
      types: [],
      categories: [],
      priorities: [],
      showCompleted: true,
    }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const activeFiltersCount = filters.types.length + filters.categories.length + filters.priorities.length + (filters.showCompleted ? 0 : 1)

  return (
    <div className="relative">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl transition-colors ${
          activeFiltersCount > 0
            ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
            : 'text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-800'
        }`}
      >
        <Filter className="w-3.5 h-3.5" />
        Filtres
        {activeFiltersCount > 0 && (
          <span className="px-1.5 py-0.5 bg-indigo-500 text-white text-[10px] rounded-full">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {showFilters && (
        <div className="absolute right-0 top-12 z-50 w-80 bg-mars-surface border border-zinc-800 rounded-2xl p-4 shadow-2xl animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-zinc-200">Filtres</h3>
            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleReset}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Réinitialiser
                </button>
              )}
              <button
                onClick={() => setShowFilters(false)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Types */}
            <div>
              <label className="block text-xs text-zinc-500 mb-2">Types</label>
              <div className="flex flex-wrap gap-2">
                {typeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleToggleType(option.value)}
                    className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                      filters.types.includes(option.value)
                        ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                        : 'bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-800'
                    }`}
                  >
                    {option.icon} {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-xs text-zinc-500 mb-2">Catégories</label>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleToggleCategory(option.value)}
                    className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                      filters.categories.includes(option.value)
                        ? option.color
                        : 'bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-800'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priorities */}
            <div>
              <label className="block text-xs text-zinc-500 mb-2">Priorités</label>
              <div className="flex flex-wrap gap-2">
                {priorityOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleTogglePriority(option.value)}
                    className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                      filters.priorities.includes(option.value)
                        ? option.color
                        : 'bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-800'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Show Completed */}
            <div className="pt-3 border-t border-zinc-900/50">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showCompleted}
                  onChange={handleToggleCompleted}
                  className="form-checkbox h-4 w-4 text-indigo-600 bg-zinc-700 border-zinc-600 rounded focus:ring-indigo-500"
                />
                <span className="text-xs text-zinc-300">Afficher les événements terminés</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
