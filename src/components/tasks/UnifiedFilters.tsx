import { useState } from 'react'
import { Filter, X, ChevronDown } from 'lucide-react'
import { TaskCategory, TaskPriority, TaskStatus } from '../../store/useStore'
import { QuickFilter } from '../../hooks/useTaskFilters'

export interface TaskFilterState {
  categories: TaskCategory[]
  priorities: TaskPriority[]
  statuses: TaskStatus[]
  showCompleted: boolean
  hasSubtasks: boolean | null
  hasDueDate: boolean | null
}

interface UnifiedFiltersProps {
  quickFilter: QuickFilter
  onQuickFilterChange: (filter: QuickFilter) => void
  advancedFilters: TaskFilterState
  onAdvancedFilterChange: (filters: TaskFilterState) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  onReset: () => void
}

const dateFilters: { key: QuickFilter; label: string; shortLabel: string; emoji: string }[] = [
  { key: 'all', label: 'Toutes', shortLabel: 'Tout', emoji: '📋' },
  { key: 'today', label: "Aujourd'hui", shortLabel: "Auj.", emoji: '📅' },
  { key: 'this-week', label: 'Cette semaine', shortLabel: 'Sem.', emoji: '🔥' },
  { key: 'next-week', label: 'Semaine pro.', shortLabel: 'S+1', emoji: '📆' },
  { key: 'this-month', label: 'Ce mois', shortLabel: 'Mois', emoji: '🗓️' },
  { key: 'no-deadline', label: 'Sans deadline', shortLabel: 'Sans', emoji: '💭' },
  { key: 'overdue', label: 'En retard', shortLabel: 'Retard', emoji: '⚠️' },
]

const categoryOptions: { value: TaskCategory; label: string }[] = [
  { value: 'dev', label: 'Dev' },
  { value: 'design', label: 'Design' },
  { value: 'work', label: 'Travail' },
  { value: 'personal', label: 'Perso' },
  { value: 'urgent', label: 'Urgent' },
]

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Basse' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'high', label: 'Haute' },
  { value: 'urgent', label: 'Urgente' },
]

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'À faire' },
  { value: 'in-progress', label: 'En cours' },
  { value: 'done', label: 'Terminé' },
]

export function UnifiedFilters({
  quickFilter,
  onQuickFilterChange,
  advancedFilters,
  onAdvancedFilterChange,
  searchQuery,
  onSearchChange,
  onReset
}: UnifiedFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const activeCount = 
    advancedFilters.categories.length + 
    advancedFilters.priorities.length + 
    advancedFilters.statuses.length + 
    (advancedFilters.showCompleted ? 0 : 1) +
    (quickFilter !== 'all' ? 1 : 0)

  const toggleCategory = (cat: TaskCategory) => {
    const updated = advancedFilters.categories.includes(cat)
      ? advancedFilters.categories.filter(c => c !== cat)
      : [...advancedFilters.categories, cat]
    onAdvancedFilterChange({ ...advancedFilters, categories: updated })
  }

  const togglePriority = (pri: TaskPriority) => {
    const updated = advancedFilters.priorities.includes(pri)
      ? advancedFilters.priorities.filter(p => p !== pri)
      : [...advancedFilters.priorities, pri]
    onAdvancedFilterChange({ ...advancedFilters, priorities: updated })
  }

  const toggleStatus = (status: TaskStatus) => {
    const updated = advancedFilters.statuses.includes(status)
      ? advancedFilters.statuses.filter(s => s !== status)
      : [...advancedFilters.statuses, status]
    onAdvancedFilterChange({ ...advancedFilters, statuses: updated })
  }

  return (
    <div className="space-y-3 mb-6">
      {/* Main filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/5">
        {/* Date filters - scrollable on mobile */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1">
          {dateFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => onQuickFilterChange(filter.key)}
              className={`
                flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium 
                transition-colors duration-200 whitespace-nowrap flex-shrink-0
                ${quickFilter === filter.key
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                }
              `}
            >
              <span>{filter.emoji}</span>
              <span className="hidden lg:inline">{filter.label}</span>
              <span className="lg:hidden">{filter.shortLabel}</span>
            </button>
          ))}
        </div>

        {/* Separator - hidden on mobile */}
        <div className="hidden sm:block w-px h-6 bg-white/10 self-center" />

        {/* Search + Advanced */}
        <div className="flex items-center gap-2 flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher..."
            className="flex-1 min-w-0 bg-white/5 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none px-3 py-1.5 rounded-lg"
          />

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`
              flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${showAdvanced || activeCount > 0
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              }
            `}
          >
            <Filter className="w-3.5 h-3.5" />
            {activeCount > 0 && (
              <span className="px-1.5 py-0.5 bg-indigo-500 text-white text-[10px] rounded-full min-w-[18px]">
                {activeCount}
              </span>
            )}
            <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {/* Reset */}
          {activeCount > 0 && (
            <button
              onClick={onReset}
              className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-lg transition-colors"
              title="Réinitialiser"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Advanced filters panel */}
      {showAdvanced && (
        <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 space-y-4 animate-slide-up">
          {/* Categories */}
          <div>
            <label className="block text-xs text-zinc-500 mb-2">Catégories</label>
            <div className="flex flex-wrap gap-1.5">
              {categoryOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => toggleCategory(opt.value)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                    advancedFilters.categories.includes(opt.value)
                      ? 'bg-white/10 text-white'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priorities */}
          <div>
            <label className="block text-xs text-zinc-500 mb-2">Priorités</label>
            <div className="flex flex-wrap gap-1.5">
              {priorityOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => togglePriority(opt.value)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                    advancedFilters.priorities.includes(opt.value)
                      ? 'bg-white/10 text-white'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Statuses */}
          <div>
            <label className="block text-xs text-zinc-500 mb-2">Statuts</label>
            <div className="flex flex-wrap gap-1.5">
              {statusOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => toggleStatus(opt.value)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                    advancedFilters.statuses.includes(opt.value)
                      ? 'bg-white/10 text-white'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center gap-4 pt-3 border-t border-white/5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={advancedFilters.showCompleted}
                onChange={() => onAdvancedFilterChange({ 
                  ...advancedFilters, 
                  showCompleted: !advancedFilters.showCompleted 
                })}
                className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
              />
              <span className="text-xs text-zinc-400">Afficher terminées</span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
