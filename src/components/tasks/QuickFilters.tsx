import { QuickFilter } from '../../hooks/useTaskFilters'

interface QuickFiltersProps {
  quickFilter: QuickFilter
  onFilterChange: (filter: QuickFilter) => void
  activeFiltersCount: number
  onResetFilters: () => void
}

export function QuickFilters({ 
  quickFilter, 
  onFilterChange, 
  activeFiltersCount, 
  onResetFilters 
}: QuickFiltersProps) {
  const filters: { key: QuickFilter; label: string; icon: string }[] = [
    { key: 'all', label: 'Toutes', icon: '📋' },
    { key: 'today', label: "Aujourd'hui", icon: '📅' },
    { key: 'week', label: 'Cette semaine', icon: '📆' },
    { key: 'overdue', label: 'En retard', icon: '⚠️' },
  ]

  return (
    <div className="flex items-center gap-2 mb-4">
      {filters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onFilterChange(filter.key)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            quickFilter === filter.key
              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
              : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/30 border border-transparent'
          }`}
        >
          <span>{filter.icon}</span>
          <span>{filter.label}</span>
        </button>
      ))}
      
      {/* Badge filtres actifs */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-xl text-xs border border-indigo-500/30">
          <span className="font-semibold">{activeFiltersCount}</span>
          <span>filtre{activeFiltersCount > 1 ? 's' : ''} actif{activeFiltersCount > 1 ? 's' : ''}</span>
          <button
            onClick={onResetFilters}
            className="ml-1 hover:text-indigo-300 transition-colors"
            title="Réinitialiser tous les filtres"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}

