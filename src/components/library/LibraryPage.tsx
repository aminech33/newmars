import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { ArrowLeft, Plus, BookOpen, Search, Target, Trophy, BarChart3, Download, Upload, FileText, MoreVertical, ChevronDown, X } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Book } from '../../types/library'
import { useLibraryStats } from '../../hooks/useLibraryStats'
import { useReadingSessionPersistence } from '../../hooks/useReadingSessionPersistence'
import { useDebounce } from '../../hooks/useDebounce'
import { exportLibrary, importLibrary, exportQuotesAsMarkdown } from '../../utils/libraryImportExport'
import {
  Bookshelf,
  ReadingSessionBar,
  BookDetailModal,
  AddBookModal,
  GoalModal,
  QuotesLibraryPage,
} from './components'
import { BOOK_GENRES } from '../../constants/bookGenres'

type FilterStatus = 'all' | 'reading' | 'completed' | 'to-read'
type SortOption = 'recent' | 'title' | 'author' | 'rating' | 'progress' | 'pages'

export function LibraryPage() {
  const { 
    books, addBook, updateBook, deleteBook, setView,
    readingGoal, setReadingGoal,
    isReadingSession, currentReadingBookId, readingSessionStart,
    startReadingSession, endReadingSession, cancelReadingSession,
    addQuote, deleteQuote, updateQuote, addBookNote, deleteBookNote,
    selectedBookId, setSelectedBookId
  } = useStore()
  
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [showQuotesLibrary, setShowQuotesLibrary] = useState(false)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterGenre, setFilterGenre] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [sessionTime, setSessionTime] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Fairphone UI states
  const [showMenu, setShowMenu] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showGenreDropdown, setShowGenreDropdown] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)
  const genreRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)
  
  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setShowStatusDropdown(false)
      if (genreRef.current && !genreRef.current.contains(e.target as Node)) setShowGenreDropdown(false)
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Deep linking: ouvrir le livre sélectionné depuis la recherche
  useEffect(() => {
    if (selectedBookId) {
      const book = books.find(b => b.id === selectedBookId)
      if (book) {
        setSelectedBook(book)
      }
      // Reset après utilisation
      setSelectedBookId(null)
    }
  }, [selectedBookId, books, setSelectedBookId])

  // Debounce de la recherche pour optimiser les performances
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Stats optimisées avec cache
  const stats = useLibraryStats(books, readingGoal)
  
  // Persister les sessions de lecture
  useReadingSessionPersistence(
    isReadingSession,
    currentReadingBookId,
    readingSessionStart,
    startReadingSession,
    endReadingSession
  )
  
  // Timer pour la session de lecture
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isReadingSession && readingSessionStart) {
      interval = setInterval(() => {
        setSessionTime(Math.floor((Date.now() - readingSessionStart) / 1000))
      }, 1000)
    } else {
      setSessionTime(0)
    }
    return () => clearInterval(interval)
  }, [isReadingSession, readingSessionStart])

  // Filtrage et tri mémorisés
  const filteredAndSortedBooks = useMemo(() => {
    // Filtrage
    let filtered = books.filter(book => {
      const matchesStatus = filterStatus === 'all' || book.status === filterStatus
      const matchesGenre = !filterGenre || book.genre === filterGenre
      const matchesSearch = debouncedSearchQuery === '' || 
        book.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        (book.genre && book.genre.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
      return matchesStatus && matchesGenre && matchesSearch
    })
    
    // Tri
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'author':
          return a.author.localeCompare(b.author)
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'progress':
          const progressA = a.pages ? ((a.currentPage || 0) / a.pages) : 0
          const progressB = b.pages ? ((b.currentPage || 0) / b.pages) : 0
          return progressB - progressA
        case 'pages':
          return (b.pages || 0) - (a.pages || 0)
        case 'recent':
        default:
          return b.updatedAt - a.updatedAt
      }
    })
  }, [books, filterStatus, filterGenre, debouncedSearchQuery, sortBy])

  // Compter les livres par genre
  const genreCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    books.forEach(book => {
      if (book.genre) {
        counts[book.genre] = (counts[book.genre] || 0) + 1
      }
    })
    return counts
  }, [books])

  // Stats de page mémorisées
  const pageStats = useMemo(() => ({
    total: books.length,
    reading: books.filter(b => b.status === 'reading').length,
    completed: books.filter(b => b.status === 'completed').length,
    toRead: books.filter(b => b.status === 'to-read').length,
  }), [books])

  // Livres en cours
  const readingBooks = useMemo(() => 
    books.filter(b => b.status === 'reading'), [books])

  // Livre actuel de la session
  const currentReadingBook = useMemo(() => 
    books.find(b => b.id === currentReadingBookId), [books, currentReadingBookId])

  // Callbacks
  const handleSelectBook = useCallback((book: Book) => setSelectedBook(book), [])
  const handleCloseBook = useCallback(() => setSelectedBook(null), [])
  const handleOpenAddModal = useCallback(() => setShowAddModal(true), [])
  const handleCloseAddModal = useCallback(() => setShowAddModal(false), [])
  const handleOpenGoalModal = useCallback(() => setShowGoalModal(true), [])
  const handleCloseGoalModal = useCallback(() => setShowGoalModal(false), [])
  
  const handleAddBook = useCallback((book: Parameters<typeof addBook>[0]) => {
    addBook(book)
    setShowAddModal(false)
  }, [addBook])

  const handleUpdateBook = useCallback((updates: Partial<Book>) => {
    if (selectedBook) {
      updateBook(selectedBook.id, updates)
      setSelectedBook(prev => prev ? { ...prev, ...updates } : null)
    }
  }, [selectedBook, updateBook])

  const handleDeleteBook = useCallback(() => {
    if (selectedBook) {
      deleteBook(selectedBook.id)
      setSelectedBook(null)
    }
  }, [selectedBook, deleteBook])

  const handleSaveGoal = useCallback((goal: { year: number; targetBooks: number }) => {
    setReadingGoal(goal)
    setShowGoalModal(false)
  }, [setReadingGoal])

  const handleExport = useCallback(() => {
    exportLibrary(books)
    setShowMenu(false)
  }, [books])

  const handleExportQuotes = useCallback(() => {
    exportQuotesAsMarkdown(books)
    setShowMenu(false)
  }, [books])

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const importedBooks = await importLibrary(file)
      // Ajouter les livres importés
      importedBooks.forEach(book => {
        addBook({
          title: book.title,
          author: book.author,
          coverColor: book.coverColor,
          coverUrl: book.coverUrl,
          status: book.status,
          pages: book.pages,
          currentPage: book.currentPage,
          genre: book.genre,
          rating: book.rating,
          startedAt: book.startedAt,
          finishedAt: book.finishedAt,
          isFavorite: book.isFavorite
        })
      })
      alert(`${importedBooks.length} livre(s) importé(s) avec succès !`)
    } catch (error) {
      alert(`Erreur lors de l'import: ${error}`)
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setShowMenu(false)
  }, [addBook])

  // Labels
  const statusLabels: Record<FilterStatus, string> = {
    all: 'Tous',
    reading: 'En cours',
    completed: 'Terminés',
    'to-read': 'À lire'
  }

  const sortLabels: Record<SortOption, string> = {
    recent: 'Récent',
    title: 'Titre',
    author: 'Auteur',
    rating: 'Note',
    progress: 'Progression',
    pages: 'Pages'
  }

  // Genres avec livres
  const genresWithBooks = BOOK_GENRES.filter(genre => genreCounts[genre.id] > 0)

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-black">
      {/* Header Fairphone - Une seule ligne */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/30">
        {/* Back */}
        <button
          onClick={() => setView('hub')}
          className="p-1 text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        
        {/* Search */}
        <div className="flex-1 max-w-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
            <Search className="w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="flex-1 bg-transparent text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-zinc-500 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        
        {/* Status Filter Dropdown */}
        <div className="relative" ref={statusRef}>
          <button
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
              filterStatus !== 'all' 
                ? 'bg-white/10 text-white' 
                : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            {statusLabels[filterStatus]}
            <ChevronDown className="w-3 h-3" />
          </button>
          {showStatusDropdown && (
            <div className="absolute top-full mt-1 right-0 w-32 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 py-1">
              {(Object.keys(statusLabels) as FilterStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => { setFilterStatus(status); setShowStatusDropdown(false) }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                    filterStatus === status ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  {statusLabels[status]} ({status === 'all' ? pageStats.total : status === 'reading' ? pageStats.reading : status === 'completed' ? pageStats.completed : pageStats.toRead})
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Genre Filter Dropdown */}
        {genresWithBooks.length > 0 && (
          <div className="relative" ref={genreRef}>
            <button
              onClick={() => setShowGenreDropdown(!showGenreDropdown)}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                filterGenre 
                  ? 'bg-white/10 text-white' 
                  : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              {filterGenre ? BOOK_GENRES.find(g => g.id === filterGenre)?.emoji : 'Genre'}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showGenreDropdown && (
              <div className="absolute top-full mt-1 right-0 w-40 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 py-1 max-h-64 overflow-y-auto">
                <button
                  onClick={() => { setFilterGenre(null); setShowGenreDropdown(false) }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                    !filterGenre ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  Tous genres
                </button>
                {genresWithBooks.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => { setFilterGenre(genre.id); setShowGenreDropdown(false) }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-2 ${
                      filterGenre === genre.id ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    <span>{genre.emoji}</span>
                    <span>{genre.label}</span>
                    <span className="ml-auto text-zinc-600">{genreCounts[genre.id]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Sort Dropdown */}
        <div className="relative" ref={sortRef}>
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
              sortBy !== 'recent' 
                ? 'bg-white/10 text-white' 
                : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            {sortLabels[sortBy]}
            <ChevronDown className="w-3 h-3" />
          </button>
          {showSortDropdown && (
            <div className="absolute top-full mt-1 right-0 w-32 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 py-1">
              {(Object.keys(sortLabels) as SortOption[]).map((sort) => (
                <button
                  key={sort}
                  onClick={() => { setSortBy(sort); setShowSortDropdown(false) }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                    sortBy === sort ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  {sortLabels[sort]}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Menu ⋮ */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-zinc-800/50"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {showMenu && (
            <div className="absolute top-full mt-1 right-0 w-44 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 py-1">
              <button
                onClick={() => { setView('dashboard'); setShowMenu(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Dashboard
              </button>
              <button
                onClick={() => { setShowQuotesLibrary(true); setShowMenu(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                Citations
              </button>
              <button
                onClick={() => { handleOpenGoalModal(); setShowMenu(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <Target className="w-3.5 h-3.5" />
                Objectif ({stats.completedThisYear}/{readingGoal?.targetBooks || 12})
              </button>
              <div className="border-t border-zinc-800 my-1" />
              <button
                onClick={handleExport}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export JSON
              </button>
              <button
                onClick={handleExportQuotes}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                Export Citations
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Import
              </button>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
            </div>
          )}
        </div>
        
        {/* Add Button */}
        <button
          onClick={handleOpenAddModal}
          className="p-1.5 text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Barre de session de lecture active */}
      {isReadingSession && currentReadingBook && (
        <ReadingSessionBar
          bookTitle={currentReadingBook.title}
          sessionTime={sessionTime}
          onCancel={cancelReadingSession}
          onEnd={endReadingSession}
        />
      )}

      {/* Contenu principal - Étagères */}
      <main className="flex-1 overflow-auto px-4 py-3">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Livres en cours */}
          {readingBooks.length > 0 && filterStatus === 'all' && (
            <section>
              <h2 className="text-xs font-medium text-amber-400 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                En cours ({readingBooks.length})
              </h2>
              <Bookshelf 
                books={readingBooks} 
                onSelectBook={handleSelectBook}
                onStartReading={startReadingSession}
                isReadingSession={isReadingSession}
                currentReadingBookId={currentReadingBookId}
              />
            </section>
          )}

          {/* Tous les livres filtrés */}
          <section>
            <h2 className="text-xs font-medium text-zinc-500 mb-2">
              {filterStatus === 'all' ? 'Tous' : filterStatus === 'reading' ? 'En cours' : filterStatus === 'completed' ? 'Terminés' : 'À lire'} ({filteredAndSortedBooks.length})
            </h2>
            <Bookshelf 
              books={filteredAndSortedBooks} 
              onSelectBook={handleSelectBook}
              onStartReading={startReadingSession}
              isReadingSession={isReadingSession}
              currentReadingBookId={currentReadingBookId}
            />
          </section>

          {/* État vide */}
          {filteredAndSortedBooks.length === 0 && (
            <div className="text-center py-8">
              <BookOpen className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-600">Aucun livre</p>
              <button onClick={handleOpenAddModal} className="mt-2 text-white text-xs hover:underline">
                + Ajouter
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {selectedBook && (
        <BookDetailModal 
          book={selectedBook} 
          onClose={handleCloseBook}
          onUpdate={handleUpdateBook}
          onDelete={handleDeleteBook}
          onAddQuote={(quote) => {
            addQuote(selectedBook.id, quote)
            // Rafraîchir le livre sélectionné
            const updated = books.find(b => b.id === selectedBook.id)
            if (updated) setSelectedBook(updated)
          }}
          onDeleteQuote={(quoteId) => {
            deleteQuote(selectedBook.id, quoteId)
            const updated = books.find(b => b.id === selectedBook.id)
            if (updated) setSelectedBook(updated)
          }}
          onUpdateQuote={(quoteId, updates) => {
            updateQuote(selectedBook.id, quoteId, updates)
            const updated = books.find(b => b.id === selectedBook.id)
            if (updated) setSelectedBook(updated)
          }}
          onAddNote={(note) => {
            addBookNote(selectedBook.id, note)
            const updated = books.find(b => b.id === selectedBook.id)
            if (updated) setSelectedBook(updated)
          }}
          onDeleteNote={(noteId) => {
            deleteBookNote(selectedBook.id, noteId)
            const updated = books.find(b => b.id === selectedBook.id)
            if (updated) setSelectedBook(updated)
          }}
          onStartReading={() => startReadingSession(selectedBook.id)}
          isReadingSession={isReadingSession}
        />
      )}

      {showAddModal && (
        <AddBookModal 
          onClose={handleCloseAddModal}
          onAdd={handleAddBook}
        />
      )}

      {showGoalModal && (
        <GoalModal 
          currentGoal={readingGoal}
          completedThisYear={stats.completedThisYear}
          onClose={handleCloseGoalModal}
          onSave={handleSaveGoal}
        />
      )}

      {showQuotesLibrary && (
        <QuotesLibraryPage
          books={books}
          onBack={() => setShowQuotesLibrary(false)}
          onAddQuote={addQuote}
          onUpdateQuote={updateQuote}
          onDeleteQuote={deleteQuote}
        />
      )}
    </div>
  )
}
