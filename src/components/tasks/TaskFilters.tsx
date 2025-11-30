import { Filter, X } from 'lucide-react'
import { useState } from 'react'
import { TaskCategory, TaskPriority, TaskStatus } from '../../store/useStore'

interface TaskFiltersProps {
  onFilterChange: (filters: TaskFilterState) => void
}

export interface TaskFilterState {
  categories: TaskCategory[]
  priorities: TaskPriority[]
  statuses: TaskStatus[]
  showCompleted: boolean
  hasSubtasks: boolean | null
  hasDueDate: boolean | null
}

const categoryOptions: { value: TaskCategory; label: string; color: string }[] = [
  { value: 'dev', label: 'Dev', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  { value: 'design', label: 'Design', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { value: 'work', label: 'Travail', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { value: 'personal', label: 'Personnel', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { value: 'urgent', label: 'Urgent', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
]

const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Basse', color: 'bg-zinc-700/30 text-zinc-500 border-zinc-600/30' },
  { value: 'medium', label: 'Moyenne', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  { value: 'high', label: 'Haute', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { value: 'urgent', label: 'Urgent', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
]

const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'backlog', label: 'Backlog', color: 'bg-zinc-700/30 text-zinc-500 border-zinc-600/30' },
  { value: 'todo', label: 'À faire', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  { value: 'in-progress', label: 'En cours', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { value: 'done', label: 'Terminé', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
]

export function TaskFilters({ onFilterChange }: TaskFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<TaskFilterState>({
    categories: [],
    priorities: [],
    statuses: [],
    showCompleted: true,
    hasSubtasks: null,
    hasDueDate: null,
  })

  const handleToggleCategory = (category: TaskCategory) => {
    const updated = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category]
    const newFilters = { ...filters, categories: updated }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleTogglePriority = (priority: TaskPriority) => {
    const updated = filters.priorities.includes(priority)
      ? filters.priorities.filter(p => p !== priority)
      : [...filters.priorities, priority]
    const newFilters = { ...filters, priorities: updated }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleToggleStatus = (status: TaskStatus) => {
    const updated = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status]
    const newFilters = { ...filters, statuses: updated }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleToggleCompleted = () => {
    const newFilters = { ...filters, showCompleted: !filters.showCompleted }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleReset = () => {
    const newFilters: TaskFilterState = {
      categories: [],
      priorities: [],
      statuses: [],
      showCompleted: true,
      hasSubtasks: null,
      hasDueDate: null,
    }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const activeFiltersCount = 
    filters.categories.length + 
    filters.priorities.length + 
    filters.statuses.length + 
    (filters.showCompleted ? 0 : 1) +
    (filters.hasSubtasks !== null ? 1 : 0) +
    (filters.hasDueDate !== null ? 1 : 0)

  return (
    <div className="relative">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl transition-all ${
          activeFiltersCount > 0
            ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
            : 'text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-700'
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
            {/* Categories */}
            <div>
              <label className="block text-xs text-zinc-500 mb-2">Catégories</label>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleToggleCategory(option.value)}
                    className={`px-2 py-1 text-xs rounded-lg border transition-all ${
                      filters.categories.includes(option.value)
                        ? option.color
                        : 'bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-700'
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
                    className={`px-2 py-1 text-xs rounded-lg border transition-all ${
                      filters.priorities.includes(option.value)
                        ? option.color
                        : 'bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Statuses */}
            <div>
              <label className="block text-xs text-zinc-500 mb-2">Statuts</label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleToggleStatus(option.value)}
                    className={`px-2 py-1 text-xs rounded-lg border transition-all ${
                      filters.statuses.includes(option.value)
                        ? option.color
                        : 'bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Filters */}
            <div className="pt-3 border-t border-zinc-900/50 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showCompleted}
                  onChange={handleToggleCompleted}
                  className="form-checkbox h-4 w-4 text-indigo-600 bg-zinc-700 border-zinc-600 rounded focus:ring-indigo-500"
                />
                <span className="text-xs text-zinc-300">Afficher les tâches terminées</span>
              </label>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const newValue = filters.hasSubtasks === true ? null : true
                    const newFilters = { ...filters, hasSubtasks: newValue }
                    setFilters(newFilters)
                    onFilterChange(newFilters)
                  }}
                  className={`flex-1 px-2 py-1 text-xs rounded-lg border transition-all ${
                    filters.hasSubtasks === true
                      ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                      : 'bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  Avec sous-tâches
                </button>
                <button
                  onClick={() => {
                    const newValue = filters.hasDueDate === true ? null : true
                    const newFilters = { ...filters, hasDueDate: newValue }
                    setFilters(newFilters)
                    onFilterChange(newFilters)
                  }}
                  className={`flex-1 px-2 py-1 text-xs rounded-lg border transition-all ${
                    filters.hasDueDate === true
                      ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                      : 'bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  Avec deadline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
