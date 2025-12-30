import { memo, useMemo } from 'react'
import { Book } from '../../types/library'

type FilterStatus = 'all' | 'reading' | 'completed' | 'to-read'

interface LibraryFiltersProps {
  books: Book[]
  filterStatus: FilterStatus
  filterGenre: string | null
  onFilterStatusChange: (status: FilterStatus) => void
  onFilterGenreChange: (genre: string | null) => void
}

export const LibraryFilters = memo(function LibraryFilters({
  books,
  filterStatus,
  filterGenre,
  onFilterStatusChange,
  onFilterGenreChange
}: LibraryFiltersProps) {
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
    
    // Trier par nombre de livres (décroissant)
    return Array.from(genreMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6) // Top 6 genres
  }, [books])

  return (
    <div className="flex flex-wrap items-center gap-4 md:gap-6">
      {/* Filtres de statut - Pills */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onFilterStatusChange('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
            filterStatus === 'all'
              ? 'bg-zinc-700 text-zinc-100'
              : 'bg-zinc-800/40 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60'
          }`}
        >
          Tous <span className="opacity-60">({counts.all})</span>
        </button>
        
        <button
          onClick={() => onFilterStatusChange('reading')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
            filterStatus === 'reading'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-zinc-800/40 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60'
          }`}
        >
          En cours <span className="opacity-60">({counts.reading})</span>
        </button>
        
        <button
          onClick={() => onFilterStatusChange('completed')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
            filterStatus === 'completed'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-zinc-800/40 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60'
          }`}
        >
          Terminés <span className="opacity-60">({counts.completed})</span>
        </button>
        
        <button
          onClick={() => onFilterStatusChange('to-read')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
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
          <div className="w-px h-4 bg-zinc-800" />
          
          <div className="flex items-center gap-2">
            {genreCounts.slice(0, 5).map(([genre, count]) => (
              <button
                key={genre}
                onClick={() => onFilterGenreChange(filterGenre === genre ? null : genre)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
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
  )
})


