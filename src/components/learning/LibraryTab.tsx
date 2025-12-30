import { useState, useEffect } from 'react'
import { Book } from '../../types/library'
import { Bookshelf } from '../library/components'
import { ShelfView } from '../library/ShelfView'
import { ListView } from '../library/ListView'
import { LibraryHeader } from '../library/LibraryHeader'

type FilterStatus = 'all' | 'reading' | 'completed' | 'to-read'
type ViewMode = 'grid' | 'shelf' | 'list'

interface LibraryTabProps {
  // Data
  filteredAndSortedBooks: Book[]
  readingBooks: Book[]
  allBooks: Book[]
  readingGoal?: number
  
  // State
  filterStatusLib: FilterStatus
  filterGenre: string | null
  isReadingSession: boolean
  currentReadingBookId: string | null
  searchQuery?: string
  
  // Actions
  onSelectBook: (book: Book) => void
  onStartReading: (bookId: string) => void
  onAddBook: () => void
  onFilterStatusChange: (status: FilterStatus) => void
  onFilterGenreChange: (genre: string | null) => void
  onSearchChange?: (query: string) => void
  onBack: () => void
  onShowStats?: () => void
}

export function LibraryTab({
  filteredAndSortedBooks,
  readingBooks,
  allBooks,
  readingGoal,
  filterStatusLib,
  filterGenre,
  isReadingSession,
  currentReadingBookId,
  searchQuery = '',
  onSelectBook,
  onStartReading,
  onAddBook,
  onFilterStatusChange,
  onFilterGenreChange,
  onSearchChange,
  onBack,
  onShowStats
}: LibraryTabProps) {
  // Persistance de la vue préférée
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('library_view_mode')
    return (saved as ViewMode) || 'shelf'
  })
  
  const [showSearch, setShowSearch] = useState(false)
  const [localSearch, setLocalSearch] = useState(searchQuery)
  
  // Sauvegarder la préférence
  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('library_view_mode', mode)
  }
  
  // Raccourcis clavier pour changer de vue
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignorer si on est dans un input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      if (e.key === '1') handleViewChange('grid')
      if (e.key === '2') handleViewChange('shelf')
      if (e.key === '3') handleViewChange('list')
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])
  
  // Composant de vue selon le mode sélectionné
  const BookView = viewMode === 'shelf' ? ShelfView : viewMode === 'list' ? ListView : Bookshelf
  
  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-zinc-950">
      {/* Header élégant avec filtres */}
      <LibraryHeader
        onBack={onBack}
        onAddBook={onAddBook}
        onShowStats={() => onShowStats?.()}
        onShowSearch={() => setShowSearch(!showSearch)}
        books={allBooks}
        filterStatus={filterStatusLib}
        filterGenre={filterGenre}
        onFilterStatusChange={onFilterStatusChange}
        onFilterGenreChange={onFilterGenreChange}
        viewMode={viewMode}
        onViewModeChange={handleViewChange}
        searchQuery={localSearch}
        onSearchChange={(query) => {
          setLocalSearch(query)
          onSearchChange?.(query)
        }}
        showSearchInput={showSearch}
      />
      
      {/* Contenu principal */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-[1800px] mx-auto px-8 md:px-16 py-8 md:py-12">
          {filteredAndSortedBooks.length === 0 ? (
            <div className="text-center py-32">
              <p className="text-sm text-zinc-600 mb-4">
                {allBooks.length === 0 
                  ? "Aucun livre dans votre bibliothèque"
                  : "Aucun livre ne correspond aux filtres"
                }
              </p>
              {allBooks.length === 0 && (
                <button 
                  onClick={onAddBook} 
                  className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Ajouter votre premier livre
                </button>
              )}
            </div>
          ) : (
            <BookView 
              books={filteredAndSortedBooks} 
              onSelectBook={onSelectBook}
            />
          )}
        </div>
      </main>
    </div>
  )
}

