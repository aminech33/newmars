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

const typeOptions: { value: EventType; label: string; icon: string; description: string }[] = [
  { value: 'meeting', label: 'Réunion', icon: '🗓️', description: 'Rencontre, rendez-vous' },
  { value: 'deadline', label: 'Deadline', icon: '⏰', description: 'Échéance, date limite' },
  { value: 'reminder', label: 'Rappel', icon: '🔔', description: 'Pense-bête' },
  { value: 'birthday', label: 'Anniversaire', icon: '🎂', description: 'Date de naissance' },
  { value: 'holiday', label: 'Vacances', icon: '🎉', description: 'Congés, jour férié' },
  { value: 'custom', label: 'Autre', icon: '📌', description: 'Événement personnalisé' },
]

const categoryOptions: { value: EventCategory; label: string; icon: string; color: string; description: string }[] = [
  { value: 'work', label: 'Travail', icon: '💼', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', description: 'Professionnel, bureau' },
  { value: 'personal', label: 'Personnel', icon: '🏠', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', description: 'Vie privée, famille' },
  { value: 'health', label: 'Santé', icon: '💚', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', description: 'Médical, sport, bien-être' },
  { value: 'social', label: 'Social', icon: '👥', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', description: 'Amis, sorties, loisirs' },
  { value: 'learning', label: 'Formation', icon: '📚', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30', description: 'Études, apprentissage' },
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
        <div className="absolute right-0 top-12 z-50 w-96 bg-mars-surface border border-zinc-800 rounded-2xl p-5 shadow-2xl animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-200">Filtrer les événements</h3>
            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleReset}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
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

          <div className="space-y-5">
            {/* Types */}
            <div>
              <div className="mb-2">
                <label className="block text-xs font-medium text-zinc-400">Nature de l'événement</label>
                <p className="text-[10px] text-zinc-600 mt-0.5">Ce que c'est (réunion, rappel, etc.)</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {typeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleToggleType(option.value)}
                    title={option.description}
                    className={`px-2.5 py-1.5 text-xs rounded-lg border transition-all ${
                      filters.types.includes(option.value)
                        ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 scale-95'
                        : 'bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-400'
                    }`}
                  >
                    {option.icon} {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-zinc-800/50" />

            {/* Categories */}
            <div>
              <div className="mb-2">
                <label className="block text-xs font-medium text-zinc-400">Domaine de vie</label>
                <p className="text-[10px] text-zinc-600 mt-0.5">Le contexte (travail, santé, etc.)</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleToggleCategory(option.value)}
                    title={option.description}
                    className={`px-2.5 py-1.5 text-xs rounded-lg border transition-all ${
                      filters.categories.includes(option.value)
                        ? `${option.color} scale-95`
                        : 'bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-400'
                    }`}
                  >
                    {option.icon} {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-zinc-800/50" />

            {/* Priorities */}
            <div>
              <div className="mb-2">
                <label className="block text-xs font-medium text-zinc-400">Priorité</label>
                <p className="text-[10px] text-zinc-600 mt-0.5">Niveau d'importance</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {priorityOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleTogglePriority(option.value)}
                    className={`px-2.5 py-1.5 text-xs rounded-lg border transition-all ${
                      filters.priorities.includes(option.value)
                        ? `${option.color} scale-95`
                        : 'bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-400'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Show Completed */}
            <div className="pt-3 border-t border-zinc-800/50">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.showCompleted}
                  onChange={handleToggleCompleted}
                  className="form-checkbox h-4 w-4 text-indigo-500 bg-zinc-800 border-zinc-700 rounded focus:ring-2 focus:ring-indigo-500/50"
                />
                <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">Afficher les événements terminés</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
