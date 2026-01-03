/**
 * 📚 Library Page - Bibliothèque
 */

import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { Book as BookIcon, Plus, Search, Star, BookOpen, Clock } from 'lucide-react'
import { Book } from '../types/library'
import { AddBookModal } from './library/AddBookModal'
import { BookDetailModal } from './library/BookDetailModal'

export function LibraryPage() {
  const { books, addBook, updateBook, deleteBook } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'reading' | 'completed' | 'to-read'>('all')

  // Filter books
  const filteredBooks = useMemo(() => {
    let result = books

    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter(b => b.status === filterStatus)
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(b => 
        b.title.toLowerCase().includes(query) ||
        b.author.toLowerCase().includes(query)
      )
    }

    return result
  }, [books, filterStatus, searchQuery])

  // Stats
  const stats = useMemo(() => ({
    total: books.length,
    reading: books.filter(b => b.status === 'reading').length,
    completed: books.filter(b => b.status === 'completed').length,
    toRead: books.filter(b => b.status === 'to-read').length
  }), [books])

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-black">
      {/* Header */}
      <header className="flex-shrink-0 px-4 py-2 border-b border-zinc-800/50 bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
            <BookIcon className="w-4 h-4 text-white" />
          </div>
          
          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un livre..."
              className="w-full pl-10 pr-4 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex-1" />

          {/* Add button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-sm font-medium transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un livre</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-3">
          {[
            { value: 'all', label: 'Tous', count: stats.total },
            { value: 'reading', label: 'En cours', count: stats.reading },
            { value: 'completed', label: 'Terminés', count: stats.completed },
            { value: 'to-read', label: 'À lire', count: stats.toRead }
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setFilterStatus(filter.value as any)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filterStatus === filter.value
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {filter.label} {filter.count > 0 && `(${filter.count})`}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6 bg-zinc-950">
        {filteredBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-6">
              <BookIcon className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              {searchQuery ? 'Aucun livre trouvé' : 'Ta bibliothèque est vide'}
            </h2>
            <p className="text-zinc-400 mb-6 text-center max-w-md">
              {searchQuery 
                ? 'Essaie une autre recherche'
                : 'Commence à construire ta bibliothèque en ajoutant ton premier livre'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-medium transition-all hover:scale-105"
              >
                Ajouter un livre
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredBooks.map((book) => (
              <button
                key={book.id}
                onClick={() => setSelectedBook(book)}
                className="group flex flex-col gap-3 text-left transition-all hover:scale-105"
              >
                {/* Book cover */}
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-lg group-hover:shadow-xl transition-shadow">
                  {book.coverUrl ? (
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookIcon className="w-12 h-12 text-zinc-700" />
                    </div>
                  )}
                  
                  {/* Status badge */}
                  <div className="absolute top-2 right-2">
                    {book.status === 'reading' && (
                      <div className="px-2 py-1 bg-green-500/90 backdrop-blur-sm rounded text-xs font-medium text-white">
                        <BookOpen className="w-3 h-3" />
                      </div>
                    )}
                    {book.status === 'completed' && book.rating && (
                      <div className="px-2 py-1 bg-yellow-500/90 backdrop-blur-sm rounded text-xs font-medium text-white flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {book.rating}
                      </div>
                    )}
                  </div>
                </div>

                {/* Book info */}
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-white line-clamp-2 group-hover:text-blue-400 transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-xs text-zinc-500 line-clamp-1">
                    {book.author}
                  </p>
                  
                  {/* Progress or time */}
                  {book.status === 'reading' && book.currentPage && book.totalPages && (
                    <div className="flex items-center gap-1 text-xs text-zinc-600">
                      <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{ width: `${(book.currentPage / book.totalPages) * 100}%` }}
                        />
                      </div>
                      <span>{Math.round((book.currentPage / book.totalPages) * 100)}%</span>
                    </div>
                  )}
                  
                  {book.totalReadingTime && book.totalReadingTime > 0 && (
                    <div className="flex items-center gap-1 text-xs text-zinc-600">
                      <Clock className="w-3 h-3" />
                      {Math.round(book.totalReadingTime / 60)}h
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {showAddModal && (
        <AddBookModal
          onClose={() => setShowAddModal(false)}
          onAdd={addBook}
        />
      )}

      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onUpdate={(updates) => updateBook(selectedBook.id, updates)}
          onDelete={() => {
            deleteBook(selectedBook.id)
            setSelectedBook(null)
          }}
        />
      )}
    </div>
  )
}

