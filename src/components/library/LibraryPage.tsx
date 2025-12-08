import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { ArrowLeft, Plus, BookOpen, Search, Target, Trophy, BarChart3, Download, Upload, FileText } from 'lucide-react'
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
  GenreBadge
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

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      {/* Header - Compact */}
      <header className="flex-shrink-0 px-4 py-2 border-b border-zinc-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('hub')}
              className="p-1.5 text-zinc-600 hover:text-zinc-400 transition-colors rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <BookOpen className="w-4 h-4 text-amber-500" />
            <h1 className="text-lg font-semibold text-zinc-200">Bibliothèque</h1>
            <span className="text-xs text-zinc-600">{stats.totalBooks} livres • {stats.totalPagesRead}p</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            {/* Import/Export */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-1.5 bg-zinc-800/50 text-zinc-400 rounded-lg hover:bg-zinc-700/50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              
              {showExportMenu && (
                <div className="absolute right-0 top-8 z-50 w-40 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl p-1 text-xs">
                  <button onClick={handleExport} className="w-full flex items-center gap-2 px-2 py-1.5 text-zinc-300 hover:bg-zinc-800 rounded">
                    <Download className="w-3 h-3" /> JSON
                  </button>
                  <button onClick={handleExportQuotes} className="w-full flex items-center gap-2 px-2 py-1.5 text-zinc-300 hover:bg-zinc-800 rounded">
                    <FileText className="w-3 h-3" /> Citations
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-2 px-2 py-1.5 text-zinc-300 hover:bg-zinc-800 rounded">
                    <Upload className="w-3 h-3" /> Import
                  </button>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
            </div>
            
            <button
              onClick={() => setShowQuotesLibrary(true)}
              className="p-1.5 bg-zinc-800/50 text-zinc-400 rounded-lg hover:bg-zinc-700/50 transition-colors"
              title="Bibliothèque de citations"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setView('dashboard')}
              className="p-1.5 bg-zinc-800/50 text-zinc-400 rounded-lg hover:bg-zinc-700/50 transition-colors"
              title="Voir les statistiques dans le Dashboard"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
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

      {/* Objectif + Filtres - Combined Compact Bar */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-zinc-800/30">
        <div className="flex flex-wrap items-center gap-3">
          {/* Objectif */}
          <button
            onClick={handleOpenGoalModal}
            className="flex items-center gap-2 px-2 py-1 bg-zinc-900/50 rounded-lg border border-zinc-800/50 hover:border-amber-500/30 transition-colors"
          >
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-zinc-400">{stats.completedThisYear}/{readingGoal?.targetBooks || 12}</span>
            <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, stats.goalProgress)}%` }} />
            </div>
            <span className={`text-xs font-medium ${stats.goalProgress >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {stats.goalProgress}%
            </span>
            {stats.goalProgress >= 100 && <Trophy className="w-3 h-3 text-amber-400" />}
          </button>

          {/* Recherche */}
          <div className="relative flex-1 min-w-[150px] max-w-xs">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-full bg-zinc-900/50 text-zinc-300 placeholder:text-zinc-600 pl-7 pr-2 py-1 text-xs rounded-lg border border-zinc-800 focus:outline-none"
            />
          </div>
          
          {/* Filtres statut */}
          <div className="flex items-center gap-1">
            {filters.map(({ status, label }) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-2 py-1 text-[10px] rounded-md transition-colors ${
                  filterStatus === status ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Filtres par genre */}
          {Object.keys(genreCounts).length > 0 && (
            <div className="flex items-center gap-1 flex-wrap max-w-md">
              <button
                onClick={() => setFilterGenre(null)}
                className={`px-2 py-1 text-[10px] rounded-md transition-colors ${
                  !filterGenre ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                Tous genres
              </button>
              {BOOK_GENRES
                .filter(genre => genreCounts[genre.id] > 0)
                .slice(0, 5) // Montrer les 5 premiers genres avec des livres
                .map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => setFilterGenre(genre.id)}
                    className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded-md border transition-all ${
                      filterGenre === genre.id
                        ? genre.color
                        : 'text-zinc-600 border-transparent hover:text-zinc-400'
                    }`}
                    title={genre.label}
                  >
                    <span>{genre.emoji}</span>
                    <span>{genreCounts[genre.id]}</span>
                  </button>
                ))}
            </div>
          )}
          
          {/* Tri */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-2 py-1 text-[10px] bg-zinc-900/50 text-zinc-400 border border-zinc-800 rounded-md"
          >
            <option value="recent">Récent</option>
            <option value="title">Titre</option>
            <option value="author">Auteur</option>
            <option value="rating">Note</option>
            <option value="progress">Progression</option>
          </select>
        </div>
      </div>

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
              <button onClick={handleOpenAddModal} className="mt-2 text-amber-500 text-xs hover:underline">
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
