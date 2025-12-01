import { useState, useEffect, useMemo, useCallback } from 'react'
import { ArrowLeft, Plus, BookOpen, Search, Filter, Target, Trophy } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Book } from '../../types/library'
import { formatReadingTime } from '../../utils/libraryFormatters'
import {
  Bookshelf,
  StatsCards,
  ReadingSessionBar,
  BookDetailModal,
  AddBookModal,
  GoalModal
} from './components'

type FilterStatus = 'all' | 'reading' | 'completed' | 'to-read'

export function LibraryPage() {
  const { 
    books, addBook, updateBook, deleteBook, setView,
    readingGoal, setReadingGoal, getReadingStats,
    isReadingSession, currentReadingBookId, readingSessionStart,
    startReadingSession, endReadingSession, cancelReadingSession,
    addQuote, deleteQuote, updateQuote, addBookNote, deleteBookNote
  } = useStore()
  
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sessionTime, setSessionTime] = useState(0)

  // Mémorisation des stats
  const stats = useMemo(() => getReadingStats(), [books, readingGoal])
  
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

  // Filtrage mémorisé
  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const matchesStatus = filterStatus === 'all' || book.status === filterStatus
      const matchesSearch = searchQuery === '' || 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [books, filterStatus, searchQuery])

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

  const filters: { status: FilterStatus; label: string }[] = [
    { status: 'all', label: `Tous (${pageStats.total})` },
    { status: 'reading', label: `En cours (${pageStats.reading})` },
    { status: 'completed', label: `Terminés (${pageStats.completed})` },
    { status: 'to-read', label: `À lire (${pageStats.toRead})` },
  ]

  return (
    <div className="h-full w-full flex flex-col" style={{
      background: 'linear-gradient(180deg, #1a1410 0%, #0f0a08 100%)'
    }}>
      {/* Header - Style bibliothèque */}
      <header className="flex-shrink-0 px-4 md:px-6 py-4 md:py-5 bg-zinc-900/20 backdrop-blur-sm border-b border-amber-900/20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => setView('hub')}
              className="p-2 -ml-2 text-amber-600 hover:text-amber-400 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg"
              aria-label="Retour au hub"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-serif font-medium tracking-tight text-amber-200 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" aria-hidden="true" />
                Ma Bibliothèque
              </h1>
              <p className="text-xs md:text-sm text-amber-900/60">
                {stats.totalBooks} livres • {stats.totalPagesRead} pages • {formatReadingTime(stats.totalReadingTime)}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleOpenAddModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-xl hover:bg-amber-500/30 transition-all shadow-lg shadow-amber-500/10 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Ajouter un livre</span>
          </button>
        </div>
      </header>

      {/* Barre de session de lecture active */}
      {isReadingSession && currentReadingBook && (
        <ReadingSessionBar
          bookTitle={currentReadingBook.title}
          sessionTime={sessionTime}
          onCancel={cancelReadingSession}
          onEnd={endReadingSession}
        />
      )}

      {/* Objectif annuel */}
      <div className="px-4 md:px-6 py-4 border-b border-zinc-800/30">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={handleOpenGoalModal}
            className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50 hover:border-zinc-700/50 transition-colors group focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label={`Objectif ${readingGoal?.year || new Date().getFullYear()}: ${stats.completedThisYear} sur ${readingGoal?.targetBooks || 12} livres, ${stats.goalProgress}%`}
          >
            <div className="flex items-center gap-4">
              <div 
                className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0"
                aria-hidden="true"
              >
                <Target className="w-5 md:w-6 h-5 md:h-6 text-amber-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-zinc-300">
                  Objectif {readingGoal?.year || new Date().getFullYear()}
                </p>
                <p className="text-xs text-zinc-500">
                  {stats.completedThisYear} / {readingGoal?.targetBooks || 12} livres
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
              {/* Barre de progression */}
              <div 
                className="flex-1 sm:w-32 md:w-48 h-3 bg-zinc-800 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={stats.goalProgress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, stats.goalProgress)}%` }}
                />
              </div>
              <span className={`text-base md:text-lg font-semibold min-w-[3rem] text-right ${stats.goalProgress >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {stats.goalProgress}%
              </span>
              {stats.goalProgress >= 100 && (
                <Trophy className="w-5 h-5 text-amber-400 flex-shrink-0" aria-label="Objectif atteint !" />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="px-4 md:px-6 py-4 border-b border-zinc-800/30">
        <div className="max-w-6xl mx-auto">
          <StatsCards
            totalBooks={stats.totalBooks}
            totalReadingTime={stats.totalReadingTime}
            totalPagesRead={stats.totalPagesRead}
            averageRating={stats.averageRating}
          />
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="px-4 md:px-6 py-4 border-b border-zinc-800/30">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-stretch md:items-center gap-4">
          {/* Recherche */}
          <div className="relative flex-1 max-w-md">
            <Search 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" 
              aria-hidden="true" 
            />
            <label htmlFor="search-books" className="sr-only">Rechercher un livre</label>
            <input
              id="search-books"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un livre ou auteur..."
              className="w-full bg-zinc-900/50 text-zinc-300 placeholder:text-zinc-700 pl-10 pr-4 py-2 rounded-xl border border-zinc-800 focus:outline-none focus:border-zinc-700 focus:ring-2 focus:ring-zinc-700/50"
            />
          </div>
          
          {/* Filtres statut - scrollable sur mobile */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
            <Filter className="w-4 h-4 text-zinc-600 flex-shrink-0" aria-hidden="true" />
            <div role="group" aria-label="Filtrer par statut" className="flex gap-2">
              {filters.map(({ status, label }) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    filterStatus === status
                      ? 'bg-zinc-800 text-zinc-200'
                      : 'text-zinc-600 hover:text-zinc-400'
                  }`}
                  aria-pressed={filterStatus === status}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal - Étagères */}
      <main className="flex-1 overflow-auto px-4 md:px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-8">
            {/* Livres en cours */}
            {readingBooks.length > 0 && filterStatus === 'all' && (
              <section aria-labelledby="reading-section-title">
                <h2 
                  id="reading-section-title"
                  className="text-sm font-medium text-amber-400 mb-4 flex items-center gap-2"
                >
                  <span 
                    className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" 
                    aria-hidden="true"
                  />
                  En cours de lecture
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
            <section aria-labelledby="all-books-section-title">
              <h2 
                id="all-books-section-title"
                className="text-sm font-medium text-zinc-500 mb-4"
              >
                {filterStatus === 'all' ? 'Tous les livres' : 
                 filterStatus === 'reading' ? 'En cours' :
                 filterStatus === 'completed' ? 'Terminés' : 'À lire'}
              </h2>
              <Bookshelf 
                books={filteredBooks} 
                onSelectBook={handleSelectBook}
                onStartReading={startReadingSession}
                isReadingSession={isReadingSession}
                currentReadingBookId={currentReadingBookId}
              />
            </section>
          </div>

          {/* État vide */}
          {filteredBooks.length === 0 && (
            <div className="text-center py-16" role="status">
              <BookOpen className="w-12 h-12 text-zinc-700 mx-auto mb-4" aria-hidden="true" />
              <p className="text-zinc-600">Aucun livre trouvé</p>
              <button
                onClick={handleOpenAddModal}
                className="mt-4 text-amber-500 hover:text-amber-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 rounded px-2 py-1"
              >
                Ajouter ton premier livre
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
    </div>
  )
}
