import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { ArrowLeft, Plus, BookOpen, Search, Filter, Target, Trophy, TrendingUp, Download, Upload, FileText } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Book } from '../../types/library'
import { formatReadingTime } from '../../utils/libraryFormatters'
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
  LibraryStatsPage
} from './components'

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
  const [showStatsPage, setShowStatsPage] = useState(false)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [sessionTime, setSessionTime] = useState(0)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
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
      const matchesSearch = debouncedSearchQuery === '' || 
        book.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        (book.genre && book.genre.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
      return matchesStatus && matchesSearch
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
  }, [books, filterStatus, debouncedSearchQuery, sortBy])

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
    setShowExportMenu(false)
  }, [books])

  const handleExportQuotes = useCallback(() => {
    exportQuotesAsMarkdown(books)
    setShowExportMenu(false)
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
  }, [addBook])

  const filters: { status: FilterStatus; label: string }[] = [
    { status: 'all', label: `Tous (${pageStats.total})` },
    { status: 'reading', label: `En cours (${pageStats.reading})` },
    { status: 'completed', label: `Terminés (${pageStats.completed})` },
    { status: 'to-read', label: `À lire (${pageStats.toRead})` },
  ]

  // Show stats sub-page if activated
  if (showStatsPage) {
    return <LibraryStatsPage books={books} onBack={() => setShowStatsPage(false)} />
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-mars-bg">
      {/* Header */}
      <header className="flex-shrink-0 px-4 md:px-6 py-4 md:py-5 border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => setView('hub')}
              className="p-2 -ml-2 text-zinc-600 hover:text-zinc-400 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg"
              aria-label="Retour au hub"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-medium tracking-tight text-zinc-200 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" aria-hidden="true" />
                Ma Bibliothèque
              </h1>
              <p className="text-xs md:text-sm text-zinc-600">
                {stats.totalBooks} livres • {stats.totalPagesRead} pages • {formatReadingTime(stats.totalReadingTime)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Import/Export */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 text-zinc-400 rounded-xl hover:bg-zinc-700/50 border border-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Export</span>
              </button>
              
              {showExportMenu && (
                <div className="absolute right-0 top-12 z-50 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl p-2 animate-scale-in">
                  <button
                    onClick={handleExport}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Exporter JSON
                  </button>
                  <button
                    onClick={handleExportQuotes}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Exporter citations
                  </button>
                  <hr className="my-2 border-zinc-800" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Importer JSON
                  </button>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </div>
            
            <button
              onClick={() => setShowStatsPage(true)}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 text-zinc-400 rounded-xl hover:bg-zinc-700/50 border border-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <TrendingUp className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Statistiques</span>
            </button>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-xl hover:bg-amber-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Ajouter</span>
            </button>
          </div>
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
            className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50 hover:border-zinc-800/50 transition-colors group focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-colors duration-500"
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

      {/* Stats rapides - Inline compact */}
      <div className="px-4 md:px-6 py-3 border-b border-zinc-800/30">
        <div className="max-w-6xl mx-auto flex items-center gap-6 text-sm text-zinc-500">
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-zinc-300">{stats.totalBooks}</span> livres
          </span>
          <span className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-zinc-300">{stats.totalPagesRead}</span> pages
          </span>
          <span className="flex items-center gap-2 hidden sm:flex">
            📚 <span className="font-semibold text-zinc-300">{formatReadingTime(stats.totalReadingTime)}</span> de lecture
          </span>
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
              className="w-full bg-zinc-900/50 text-zinc-300 placeholder:text-zinc-700 pl-10 pr-4 py-2 rounded-xl border border-zinc-800 focus:outline-none focus:border-zinc-800 focus:ring-2 focus:ring-zinc-700/50"
            />
          </div>
          
          {/* Filtres et tri */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Filtres statut */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
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
            
            {/* Tri */}
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-xs text-zinc-600 whitespace-nowrap">Trier par:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-1.5 text-xs bg-zinc-900/50 text-zinc-300 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="recent">Récent</option>
                <option value="title">Titre</option>
                <option value="author">Auteur</option>
                <option value="rating">Note</option>
                <option value="progress">Progression</option>
                <option value="pages">Pages</option>
              </select>
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
                books={filteredAndSortedBooks} 
                onSelectBook={handleSelectBook}
                onStartReading={startReadingSession}
                isReadingSession={isReadingSession}
                currentReadingBookId={currentReadingBookId}
              />
            </section>
          </div>

          {/* État vide */}
          {filteredAndSortedBooks.length === 0 && (
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
