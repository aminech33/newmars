import { ArrowLeft, Plus, Search, BarChart3, Grid3x3, List, BookMarked, X } from 'lucide-react'
import { Book } from '../../types/library'
import { useMemo } from 'react'

type FilterStatus = 'all' | 'reading' | 'completed' | 'to-read'
type ViewMode = 'grid' | 'shelf' | 'list'

interface LibraryHeaderProps {
  onBack: () => void
  onAddBook: () => void
  onShowStats: () => void
  onShowSearch: () => void
  books: Book[]
  filterStatus: FilterStatus
  filterGenre: string | null
  onFilterStatusChange: (status: FilterStatus) => void
  onFilterGenreChange: (genre: string | null) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  searchQuery?: string
  onSearchChange?: (query: string) => void
  showSearchInput?: boolean
}

export function LibraryHeader({ 
  onBack, 
  onAddBook, 
  onShowStats, 
  onShowSearch,
  books,
  filterStatus,
  filterGenre,
  onFilterStatusChange,
  onFilterGenreChange,
  viewMode,
  onViewModeChange,
  searchQuery = '',
  onSearchChange,
  showSearchInput = false
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
      .slice(0, 4) // Top 4 genres
  }, [books])

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
        
        {/* Titre */}
        <h1 className="text-base font-medium text-zinc-200">Bibliothèque</h1>
        
        <div className="flex-1" />
        
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
            onClick={() => onViewModeChange('shelf')}
            className={`p-1.5 rounded-md transition-all duration-150 ${
              viewMode === 'shelf'
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Étagère (2)"
            aria-label="Vue étagère"
          >
            <BookMarked className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-1.5 rounded-md transition-all duration-150 ${
              viewMode === 'list'
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Liste (3)"
            aria-label="Vue liste"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
        
        {/* Actions */}
        <button 
          onClick={onShowSearch}
          className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-xl transition-all duration-150"
          aria-label="Rechercher"
        >
          <Search className="w-[18px] h-[18px]" />
        </button>
        
        <button 
          onClick={onShowStats}
          className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-xl transition-all duration-150"
          aria-label="Statistiques"
        >
          <BarChart3 className="w-[18px] h-[18px]" />
        </button>
        
        <button 
          onClick={onAddBook}
          className="px-4 py-1.5 bg-zinc-100 text-zinc-900 rounded-xl text-sm font-semibold hover:bg-white transition-all duration-150 active:scale-[0.98] flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Ajouter</span>
        </button>
      </div>

      {/* Barre de recherche (si activée) */}
      {showSearchInput && (
        <div className="px-5 py-3 border-t border-zinc-800/30">
          <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/40 rounded-lg max-w-md">
            <Search className="w-4 h-4 text-zinc-500 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Rechercher par titre, auteur ou genre..."
              className="flex-1 bg-transparent text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange?.('')}
                className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label="Effacer la recherche"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Deuxième ligne : Filtres */}
      <div className="flex items-center gap-3 px-5 py-3 border-t border-zinc-800/30 overflow-x-auto">
        {/* Filtres de statut */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onFilterStatusChange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 whitespace-nowrap ${
              filterStatus === 'all'
                ? 'bg-zinc-700 text-zinc-100'
                : 'bg-zinc-800/40 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60'
            }`}
          >
            Tous <span className="opacity-60">({counts.all})</span>
          </button>
          
          <button
            onClick={() => onFilterStatusChange('reading')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 whitespace-nowrap ${
              filterStatus === 'reading'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-zinc-800/40 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60'
            }`}
          >
            En cours <span className="opacity-60">({counts.reading})</span>
          </button>
          
          <button
            onClick={() => onFilterStatusChange('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 whitespace-nowrap ${
              filterStatus === 'completed'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-zinc-800/40 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60'
            }`}
          >
            Terminés <span className="opacity-60">({counts.completed})</span>
          </button>
          
          <button
            onClick={() => onFilterStatusChange('to-read')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 whitespace-nowrap ${
              filterStatus === 'to-read'
                ? 'bg-zinc-700 text-zinc-100'
                : 'bg-zinc-800/40 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60'
            }`}
          >
            À lire <span className="opacity-60">({counts.toRead})</span>
          </button>
        </div>
        
        {/* Filtres de genre */}
        {genreCounts.length > 0 && (
          <>
            <div className="w-px h-4 bg-zinc-800 flex-shrink-0" />
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {genreCounts.map(([genre, count]) => (
                <button
                  key={genre}
                  onClick={() => onFilterGenreChange(filterGenre === genre ? null : genre)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                    filterGenre === genre
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-zinc-800/40 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60'
                  }`}
                >
                  {genre} <span className="opacity-60">({count})</span>
                </button>
              ))}
              
              {filterGenre && (
                <button
                  onClick={() => onFilterGenreChange(null)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-all duration-150"
                  aria-label="Effacer le filtre de genre"
                >
                  ×
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  )
}

