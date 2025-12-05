import { memo } from 'react'
import { Search, Calendar } from 'lucide-react'

interface HealthFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  dateFilter: 'all' | 'week' | 'month' | 'year'
  onDateFilterChange: (filter: 'all' | 'week' | 'month' | 'year') => void
}

const DATE_FILTERS = [
  { value: 'all', label: 'Tout' },
  { value: 'week', label: '7 jours' },
  { value: 'month', label: '30 jours' },
  { value: 'year', label: '1 an' }
] as const

export const HealthFilters = memo(function HealthFilters({
  searchQuery,
  onSearchChange,
  dateFilter,
  onDateFilterChange
}: HealthFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" aria-hidden="true" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher..."
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/50 rounded-xl text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-[background-color] duration-200"
          aria-label="Rechercher dans l'historique"
        />
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-zinc-600" aria-hidden="true" />
        <div className="flex gap-1 p-1 bg-zinc-800/50 rounded-xl">
          {DATE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => onDateFilterChange(filter.value)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-[background-color] duration-200 ${
                dateFilter === filter.value
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50'
              }`}
              aria-pressed={dateFilter === filter.value}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
})

