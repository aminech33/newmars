import { ArrowLeft, Plus, Search, Grid3x3, List, X, Filter } from 'lucide-react'
import { Book } from '../../types/library'
import { useMemo, useState, useRef, useEffect } from 'react'

type FilterStatus = 'all' | 'reading' | 'completed' | 'to-read'
type ViewMode = 'grid' | 'list'
type SortOption = 'recent' | 'added' | 'title'

interface LibraryHeaderProps {
  onBack: () => void
  onAddBook: () => void
  books: Book[]
  filterStatus: FilterStatus
  filterGenre: string | null
  onFilterStatusChange: (status: FilterStatus) => void
  onFilterGenreChange: (genre: string | null) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  searchQuery?: string
  onSearchChange?: (query: string) => void
  sortBy?: SortOption
  onSortChange?: (sort: SortOption) => void
}

export function LibraryHeader({ 
  onBack, 
  onAddBook,
  books,
  filterStatus,
  filterGenre,
  onFilterStatusChange,
  onFilterGenreChange,
  viewMode,
  onViewModeChange,
  searchQuery = '',
  onSearchChange,
  sortBy = 'recent',
  onSortChange
}: LibraryHeaderProps) {
  // Calculer les compteurs
  const counts = useMemo(() => {
    const reading = books.filter(b => b.status === 'reading').length
    const completed = books.filter(b => b.status === 'completed').length
    const toRead = books.filter(b => b.status === 'to-read').length
    
    return {
      all: books.length,
      reading,
      completed,
      toRead
    }
  }, [books])

  // Extraire les genres avec compteurs
  const genreCounts = useMemo(() => {
    const genreMap = new Map<string, number>()
    
    books.forEach(book => {
      if (book.genre) {
        genreMap.set(book.genre, (genreMap.get(book.genre) || 0) + 1)
      }
    })
    
    return Array.from(genreMap.entries())
      .sort((a, b) => b[1] - a[1])
  }, [books])

  // État du dropdown filtres
  const [showFilters, setShowFilters] = useState(false)
  const filtersRef = useRef<HTMLDivElement>(null)

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setShowFilters(false)
      }
    }
    
    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFilters])

  // Compter les filtres actifs
  const activeFiltersCount = (filterStatus !== 'all' ? 1 : 0) + (filterGenre ? 1 : 0)

  return (
    <header className="flex flex-col border-b border-zinc-800/40 bg-zinc-900/25 backdrop-blur-sm">
      {/* Première ligne : Navigation et actions */}
      <div className="flex items-center gap-4 h-14 px-5">
        {/* Retour */}
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-xl transition-all duration-150"
          aria-label="Retour"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
        </button>
        
        {/* Barre de recherche */}
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-zinc-800/40 rounded-lg max-w-md">
          <Search className="w-4 h-4 text-zinc-500 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Rechercher par titre, auteur ou genre..."
            className="flex-1 bg-transparent text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange?.('')}
              className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label="Effacer la recherche"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        
        {/* Tri rapide */}
        <select
          value={sortBy}
          onChange={(e) => onSortChange?.(e.target.value as SortOption)}
          className="px-2 py-1.5 text-xs bg-zinc-800/40 text-zinc-300 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
        >
          <option value="recent">Récents</option>
          <option value="added">Date ajout</option>
          <option value="title">Titre</option>
        </select>

        {/* Toggle de vue */}
        <div className="hidden md:flex items-center gap-1 bg-zinc-800/40 rounded-lg p-0.5">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-1.5 rounded-md transition-all duration-150 ${
              viewMode === 'grid'
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Grille (1)"
            aria-label="Vue grille"
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-1.5 rounded-md transition-all duration-150 ${
              viewMode === 'list'
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Liste (2)"
            aria-label="Vue liste"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
        
        {/* Actions */}
        {/* Dropdown Filtres */}
        <div className="relative" ref={filtersRef}>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-xl transition-all duration-150 relative"
            aria-label="Filtres"
          >
            <Filter className="w-[18px] h-[18px]" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg shadow-amber-500/50 ring-2 ring-zinc-900">
                {activeFiltersCount}
              </span>
            )}
          </button>
          
          {/* Dropdown menu */}
          {showFilters && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden">
              {/* Statut */}
              <div className="p-4 border-b border-zinc-800">
                <p className="text-xs font-medium text-zinc-400 mb-3">Statut</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onFilterStatusChange('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      filterStatus === 'all'
                        ? 'bg-zinc-700 text-zinc-100'
                        : 'bg-zinc-800/40 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Tous ({counts.all})
                  </button>
                  <button
                    onClick={() => onFilterStatusChange('reading')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      filterStatus === 'reading'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-zinc-800/40 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    En cours ({counts.reading})
                  </button>
                  <button
                    onClick={() => onFilterStatusChange('completed')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      filterStatus === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-zinc-800/40 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Terminés ({counts.completed})
                  </button>
                  <button
                    onClick={() => onFilterStatusChange('to-read')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      filterStatus === 'to-read'
                        ? 'bg-zinc-700 text-zinc-100'
                        : 'bg-zinc-800/40 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    À lire ({counts.toRead})
                  </button>
                </div>
              </div>
              
              {/* Genres */}
              {genreCounts.length > 0 && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-zinc-400">Genre</p>
                    {filterGenre && (
                      <button
                        onClick={() => onFilterGenreChange(null)}
                        className="text-xs text-zinc-500 hover:text-zinc-300"
                      >
                        Effacer
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    {genreCounts.map(([genre, count]) => (
                      <button
                        key={genre}
                        onClick={() => onFilterGenreChange(filterGenre === genre ? null : genre)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          filterGenre === genre
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-zinc-800/40 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {genre} ({count})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <button 
          onClick={onAddBook}
          className="px-4 py-1.5 bg-zinc-100 text-zinc-900 rounded-xl text-sm font-semibold hover:bg-white transition-all duration-150 active:scale-[0.98] flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Ajouter</span>
        </button>
      </div>

    </header>
  )
}

