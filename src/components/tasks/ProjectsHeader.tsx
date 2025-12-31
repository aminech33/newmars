/**
 * 📁 ProjectsHeader - Header de la page Projets avec navigation et actions
 */

import { ArrowLeft, Plus, ListPlus, FolderKanban, Search, X, SlidersHorizontal, Archive } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { fontStack } from './taskUtils'

interface ProjectsHeaderProps {
  totalProjects: number
  totalTasks: number
  onAddSimple: () => void
  onAddWithTasks: () => void
  searchQuery?: string
  onSearchChange?: (query: string) => void
  showFilters?: boolean
  onToggleFilters?: () => void
  showArchived?: boolean
  onToggleArchived?: () => void
  archivedCount?: number
}

export function ProjectsHeader({
  totalProjects,
  totalTasks,
  onAddSimple,
  onAddWithTasks,
  searchQuery = '',
  onSearchChange,
  showFilters = false,
  onToggleFilters,
  showArchived = false,
  onToggleArchived,
  archivedCount = 0
}: ProjectsHeaderProps) {
  const { setView } = useStore()
  
  return (
    <header className="flex items-center gap-3 h-14 px-5 border-b border-zinc-800/40 bg-zinc-900/25 backdrop-blur-sm">
      <button
        onClick={() => setView('tasks')}
        className="p-2 -ml-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-xl transition-all duration-150"
        aria-label="Retour aux tâches"
      >
        <ArrowLeft className="w-[18px] h-[18px]" />
      </button>
      
      {/* Titre et stats */}
      <div className="flex items-center gap-2.5">
        <FolderKanban className="w-5 h-5 text-indigo-400" />
        <h1 className={`text-[15px] font-semibold text-zinc-100 ${fontStack}`}>
          Projets
        </h1>
        <div className={`text-[12px] text-zinc-500 ${fontStack} hidden lg:block`}>
          {totalProjects} projet{totalProjects > 1 ? 's' : ''} · {totalTasks} tâche{totalTasks > 1 ? 's' : ''}
        </div>
      </div>
      
      {/* Barre de recherche */}
      {onSearchChange && (
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher..."
            className={`w-full h-9 pl-9 pr-9 bg-zinc-800/60 border border-zinc-700/50 rounded-lg text-[13px] text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-2 focus:ring-zinc-600/20 transition-all ${fontStack}`}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
      
      <div className="flex-1" />
      
      {/* Toggle Archivés */}
      {onToggleArchived && (
        <button
          onClick={onToggleArchived}
          className={`h-9 px-3 rounded-lg transition-all duration-150 text-[13px] font-medium flex items-center gap-2 ${
            showArchived 
              ? 'bg-zinc-700/40 text-zinc-300 border border-zinc-600/50' 
              : 'bg-zinc-800/60 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-400 border border-transparent'
          } ${fontStack}`}
          aria-label="Afficher les projets archivés"
          title={`${archivedCount} projet${archivedCount > 1 ? 's' : ''} archivé${archivedCount > 1 ? 's' : ''}`}
        >
          <Archive className="w-4 h-4" />
          <span className="hidden md:inline">Archivés</span>
          {archivedCount > 0 && (
            <span className="px-1.5 py-0.5 bg-zinc-600/40 text-zinc-400 text-[10px] font-bold rounded tabular-nums">
              {archivedCount}
            </span>
          )}
        </button>
      )}
      
      {/* Filtres */}
      {onToggleFilters && (
        <button
          onClick={onToggleFilters}
          className={`h-9 px-3 rounded-lg transition-all duration-150 text-[13px] font-medium flex items-center gap-2 ${
            showFilters 
              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
              : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 border border-transparent'
          } ${fontStack}`}
          aria-label="Filtres"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden md:inline">Filtres</span>
        </button>
      )}
      
      {/* Actions */}
      <button
        onClick={onAddSimple}
        className={`h-9 px-3 text-zinc-300 bg-zinc-800/60 hover:bg-zinc-800 rounded-lg transition-all duration-150 text-[13px] font-medium flex items-center gap-2 active:scale-[0.98] ${fontStack}`}
        aria-label="Créer un projet simple"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden lg:inline">Simple</span>
      </button>
      
      <button
        onClick={onAddWithTasks}
        className={`h-9 px-3 text-indigo-400 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-lg transition-all duration-150 text-[13px] font-medium flex items-center gap-2 active:scale-[0.98] ${fontStack}`}
        aria-label="Créer un projet avec des tâches"
      >
        <ListPlus className="w-4 h-4" />
        <span className="hidden lg:inline">+ Tâches</span>
      </button>
    </header>
  )
}

