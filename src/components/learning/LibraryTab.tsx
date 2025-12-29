import { useState } from 'react'
import { BookOpen, ChevronDown } from 'lucide-react'
import { Book } from '../../types/library'
import { Bookshelf } from '../library/components'

type FilterStatus = 'all' | 'reading' | 'completed' | 'to-read'

interface LibraryTabProps {
  // Data
  filteredAndSortedBooks: Book[]
  readingBooks: Book[]
  
  // State
  filterStatusLib: FilterStatus
  isReadingSession: boolean
  currentReadingBookId: string | null
  
  // Actions
  onSelectBook: (book: Book) => void
  onStartReading: (bookId: string) => void
  onAddBook: () => void
}

export function LibraryTab({
  filteredAndSortedBooks,
  readingBooks,
  filterStatusLib,
  isReadingSession,
  currentReadingBookId,
  onSelectBook,
  onStartReading,
  onAddBook
}: LibraryTabProps) {
  const [showAllBooks, setShowAllBooks] = useState(false)
  
  return (
    <main className="flex-1 overflow-auto px-4 py-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* En cours de lecture */}
        {readingBooks.length > 0 && filterStatusLib === 'all' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                En cours de lecture
              </h2>
              {readingBooks.length === 1 && (
                <span className="text-xs text-zinc-500">Votre lecture active</span>
              )}
            </div>
            
            {readingBooks.length === 1 ? (
              <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 rounded-2xl p-6">
                <Bookshelf 
                  books={readingBooks} 
                  onSelectBook={onSelectBook}
                  onStartReading={onStartReading}
                  isReadingSession={isReadingSession}
                  currentReadingBookId={currentReadingBookId}
                />
              </div>
            ) : (
              <Bookshelf 
                books={readingBooks} 
                onSelectBook={onSelectBook}
                onStartReading={onStartReading}
                isReadingSession={isReadingSession}
                currentReadingBookId={currentReadingBookId}
              />
            )}
          </section>
        )}

        {filterStatusLib === 'reading' && (
          <section>
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              En cours de lecture ({readingBooks.length})
            </h2>
            <Bookshelf 
              books={filteredAndSortedBooks} 
              onSelectBook={onSelectBook}
              onStartReading={onStartReading}
              isReadingSession={isReadingSession}
              currentReadingBookId={currentReadingBookId}
            />
          </section>
        )}

        {/* Bibliothèque complète - pliable */}
        {filterStatusLib === 'all' && (
          <section className="border-t border-zinc-800/50 pt-6">
            <button
              onClick={() => setShowAllBooks(!showAllBooks)}
              className="w-full flex items-center justify-between text-left mb-4 group"
            >
              <h2 className="text-sm font-medium text-zinc-500 group-hover:text-zinc-400 transition-colors">
                Bibliothèque complète ({filteredAndSortedBooks.length} livres)
              </h2>
              <ChevronDown className={`w-4 h-4 text-zinc-600 transition-transform ${showAllBooks ? 'rotate-180' : ''}`} />
            </button>
            
            {showAllBooks && (
              <div className="animate-in fade-in duration-200">
                <Bookshelf 
                  books={filteredAndSortedBooks} 
                  onSelectBook={onSelectBook}
                  onStartReading={onStartReading}
                  isReadingSession={isReadingSession}
                  currentReadingBookId={currentReadingBookId}
                />
              </div>
            )}
          </section>
        )}

        {/* Vue filtrée Terminés ou À lire */}
        {(filterStatusLib === 'completed' || filterStatusLib === 'to-read') && (
          <section>
            <h2 className="text-sm font-medium text-zinc-500 mb-4">
              {filterStatusLib === 'completed' ? 'Terminés' : 'À lire'} ({filteredAndSortedBooks.length})
            </h2>
            <Bookshelf 
              books={filteredAndSortedBooks} 
              onSelectBook={onSelectBook}
              onStartReading={onStartReading}
              isReadingSession={isReadingSession}
              currentReadingBookId={currentReadingBookId}
            />
          </section>
        )}

        {/* État vide */}
        {filteredAndSortedBooks.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-600 mb-2">Aucun livre dans cette section</p>
            <button onClick={onAddBook} className="text-white text-sm hover:underline">
              + Ajouter un livre
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

