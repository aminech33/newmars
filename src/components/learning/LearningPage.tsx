import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { BookOpen, GraduationCap, Plus, Search, X, ChevronDown, MoreVertical, Target, Download, Upload, FileText } from 'lucide-react'
import { useLearningData } from '../../hooks/useLearningData'
import { CourseList } from './CourseList'
import { CourseChat } from './CourseChat'
import { CourseModal } from './CourseModal'
import { EmptyState } from './EmptyState'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Toast, ToastType } from '../ui/Toast'
import { CreateCourseData, Course } from '../../types/learning'
import { generateGeminiStreamingResponse } from '../../utils/geminiAI'

// Library imports
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
} from '../library/components'
import { BOOK_GENRES } from '../../constants/bookGenres'

type PageTab = 'courses' | 'library'
type FilterStatus = 'all' | 'reading' | 'completed' | 'to-read'
type SortOption = 'recent' | 'title' | 'author' | 'rating' | 'progress' | 'pages'

// Hook local pour les toasts (sans Provider)
function useLocalToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type })
  }, [])
  
  const hideToast = useCallback(() => {
    setToast(null)
  }, [])
  
  return { toast, showToast, hideToast }
}

export function LearningPage() {
  const {
    uiState,
    filteredCourses,
    activeCourse,
    createCourse,
    updateCourse,
    deleteCourse,
    togglePinCourse,
    archiveCourse,
    sendMessage,
    addAIResponse,
    deleteMessage,
    setActiveCourse,
    setSearchQuery,
    setFilterStatus,
    setSortBy,
    setIsTyping
  } = useLearningData()

  // Tab state
  const [activeTab, setActiveTab] = useState<PageTab>('courses')

  // Local UI state
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'course' | 'message'; id: string; courseId?: string } | null>(null)
  const [sidebarHidden, setSidebarHidden] = useState(false)
  
  const { toast, showToast, hideToast } = useLocalToast()

  // ═══════════════════════════════════════════════════════════════
  // LIBRARY STATE
  // ═══════════════════════════════════════════════════════════════
  const { 
    books, addBook, updateBook, deleteBook,
    readingGoal, setReadingGoal,
    isReadingSession, currentReadingBookId, readingSessionStart,
    startReadingSession, endReadingSession, cancelReadingSession,
    addQuote, deleteQuote, updateQuote, addBookNote, deleteBookNote
  } = useStore()
  
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [showAddBookModal, setShowAddBookModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [showQuotesLibrary, setShowQuotesLibrary] = useState(false)
  const [librarySearch, setLibrarySearch] = useState('')
  const [filterStatusLib, setFilterStatusLib] = useState<FilterStatus>('all')
  const [filterGenre, setFilterGenre] = useState<string | null>(null)
  const [sortByLib, setSortByLib] = useState<SortOption>('recent')
  const [sessionTime, setSessionTime] = useState(0)
  const [showAllBooks, setShowAllBooks] = useState(false)
  
  // Dropdown states
  const [showMenu, setShowMenu] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showGenreDropdown, setShowGenreDropdown] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  
  const menuRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)
  const genreRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const debouncedLibrarySearch = useDebounce(librarySearch, 300)
  const stats = useLibraryStats(books, readingGoal)
  
  useReadingSessionPersistence(
    isReadingSession,
    currentReadingBookId,
    readingSessionStart,
    startReadingSession,
    endReadingSession
  )
  
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
  
  // Timer session lecture
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
    let filtered = books.filter(book => {
      const matchesStatus = filterStatusLib === 'all' || book.status === filterStatusLib
      const matchesGenre = !filterGenre || book.genre === filterGenre
      const matchesSearch = debouncedLibrarySearch === '' || 
        book.title.toLowerCase().includes(debouncedLibrarySearch.toLowerCase()) ||
        book.author.toLowerCase().includes(debouncedLibrarySearch.toLowerCase()) ||
        (book.genre && book.genre.toLowerCase().includes(debouncedLibrarySearch.toLowerCase()))
      return matchesStatus && matchesGenre && matchesSearch
    })
    
    return filtered.sort((a, b) => {
      switch (sortByLib) {
        case 'title': return a.title.localeCompare(b.title)
        case 'author': return a.author.localeCompare(b.author)
        case 'rating': return (b.rating || 0) - (a.rating || 0)
        case 'progress':
          const progressA = a.pages ? ((a.currentPage || 0) / a.pages) : 0
          const progressB = b.pages ? ((b.currentPage || 0) / b.pages) : 0
          return progressB - progressA
        case 'pages': return (b.pages || 0) - (a.pages || 0)
        case 'recent':
        default: return b.updatedAt - a.updatedAt
      }
    })
  }, [books, filterStatusLib, filterGenre, debouncedLibrarySearch, sortByLib])

  const genreCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    books.forEach(book => {
      if (book.genre) counts[book.genre] = (counts[book.genre] || 0) + 1
    })
    return counts
  }, [books])

  const pageStats = useMemo(() => ({
    total: books.length,
    reading: books.filter(b => b.status === 'reading').length,
    completed: books.filter(b => b.status === 'completed').length,
    toRead: books.filter(b => b.status === 'to-read').length,
  }), [books])

  const readingBooks = useMemo(() => books.filter(b => b.status === 'reading'), [books])
  const currentReadingBook = useMemo(() => books.find(b => b.id === currentReadingBookId), [books, currentReadingBookId])
  const genresWithBooks = BOOK_GENRES.filter(genre => genreCounts[genre.id] > 0)

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

  const handleSelectBook = useCallback((book: Book) => setSelectedBook(book), [])
  const handleCloseBook = useCallback(() => setSelectedBook(null), [])
  
  const handleAddBook = useCallback((book: Parameters<typeof addBook>[0]) => {
    addBook(book)
    setShowAddBookModal(false)
    showToast('Livre ajouté', 'success')
  }, [addBook, showToast])

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
      showToast('Livre supprimé', 'info')
    }
  }, [selectedBook, deleteBook, showToast])

  const handleSaveGoal = useCallback((goal: { year: number; targetBooks: number }) => {
    setReadingGoal(goal)
    setShowGoalModal(false)
    showToast('Objectif mis à jour', 'success')
  }, [setReadingGoal, showToast])

  const handleExport = useCallback(() => {
    exportLibrary(books)
    setShowMenu(false)
    showToast('Export réussi', 'success')
  }, [books, showToast])

  const handleExportQuotes = useCallback(() => {
    exportQuotesAsMarkdown(books)
    setShowMenu(false)
    showToast('Citations exportées', 'success')
  }, [books, showToast])

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const importedBooks = await importLibrary(file)
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
      showToast(`${importedBooks.length} livre(s) importé(s)`, 'success')
    } catch (error) {
      showToast(`Erreur: ${error}`, 'error')
    }
    
    if (fileInputRef.current) fileInputRef.current.value = ''
    setShowMenu(false)
  }, [addBook, showToast])

  // ═══════════════════════════════════════════════════════════════
  // COURSES LOGIC
  // ═══════════════════════════════════════════════════════════════

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        setSidebarHidden(prev => !prev)
      }
      
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault()
        if (activeTab === 'courses') setShowCourseModal(true)
        else setShowAddBookModal(true)
      }
      
      if (e.key === 'Escape') {
        if (showCourseModal) setShowCourseModal(false)
        else if (showAddBookModal) setShowAddBookModal(false)
        else if (showGoalModal) setShowGoalModal(false)
        else if (showQuotesLibrary) setShowQuotesLibrary(false)
        else if (confirmDelete) setConfirmDelete(null)
        else if (selectedBook) setSelectedBook(null)
        else if (activeCourse && window.innerWidth < 1024) setActiveCourse(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showCourseModal, showAddBookModal, showGoalModal, showQuotesLibrary, confirmDelete, activeCourse, selectedBook, activeTab, setActiveCourse])

  const handleCreateCourse = useCallback((data: CreateCourseData) => {
    if (editingCourse) {
      updateCourse(editingCourse.id, data)
      showToast('Cours mis à jour', 'success')
    } else {
      createCourse(data)
      showToast('Cours créé !', 'success')
    }
    setEditingCourse(null)
  }, [editingCourse, updateCourse, createCourse, showToast])

  const handleEditCourse = useCallback((course: Course) => {
    setEditingCourse(course)
    setShowCourseModal(true)
  }, [])

  const handleDeleteCourse = useCallback((courseId: string) => {
    setConfirmDelete({ type: 'course', id: courseId })
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (!confirmDelete) return
    
    if (confirmDelete.type === 'course') {
      deleteCourse(confirmDelete.id)
      showToast('Cours supprimé', 'info')
    } else if (confirmDelete.type === 'message' && confirmDelete.courseId) {
      deleteMessage(confirmDelete.courseId, confirmDelete.id)
    }
    
    setConfirmDelete(null)
  }, [confirmDelete, deleteCourse, deleteMessage, showToast])

  const handleSendMessage = useCallback(async (content: string, codeContext?: { code: string; language: string }) => {
    if (!activeCourse) return

    await sendMessage(activeCourse.id, content)
    setIsTyping(true)
    
    try {
      const conversationHistory = activeCourse.messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))

      let courseContext = ''
      const levelText = activeCourse.level === 'beginner' ? 'Débutant' : activeCourse.level === 'intermediate' ? 'Intermédiaire' : 'Avancé'
      
      if (activeCourse.systemPrompt && activeCourse.systemPrompt.trim()) {
        courseContext = activeCourse.systemPrompt
      } else {
        courseContext = `Tu es un tuteur IA expert en ${activeCourse.name}. 
Niveau de l'élève: ${levelText}.
${activeCourse.description ? `Contexte: ${activeCourse.description}` : ''}
${activeCourse.topics && activeCourse.topics.length > 0 ? `Sujets: ${activeCourse.topics.map(t => t.name).join(', ')}` : ''}

Réponds de manière pédagogique et claire. Adapte-toi au niveau de l'élève.`
      }

      let userPrompt = content
      
      if (codeContext) {
        const { code, language } = codeContext
        
        if (content === '▶ Exécuter') {
          userPrompt = `Analyse ce code ${language.toUpperCase()} et donne-moi :
1. Ce que fait le code (explication simple)
2. Le résultat attendu de l'exécution
3. Les erreurs ou problèmes éventuels

CODE:
\`\`\`${language}
${code}
\`\`\`

Réponds de façon concise. Ne répète pas le code dans ta réponse.`
        } else if (content === '💡 Aide sur mon code') {
          userPrompt = `J'ai besoin d'aide avec ce code ${language.toUpperCase()}. Analyse-le et dis-moi :
1. Ce qui pourrait être amélioré
2. Les erreurs potentielles
3. Des suggestions concrètes

CODE:
\`\`\`${language}
${code}
\`\`\`

Réponds de façon concise. Ne répète pas le code dans ta réponse.`
        } else {
          userPrompt = `Ma question : ${content}

Contexte - mon code actuel (${language}):
\`\`\`${language}
${code}
\`\`\`

Réponds à ma question. Ne répète pas le code dans ta réponse sauf si nécessaire pour montrer une correction.`
        }
      }

      let fullResponse = ''
      
      await generateGeminiStreamingResponse(
        courseContext,
        userPrompt,
        conversationHistory,
        (chunk) => {
          fullResponse += chunk
        }
      )
      
      addAIResponse(activeCourse.id, fullResponse)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      showToast(errorMessage, 'error')
    } finally {
      setIsTyping(false)
    }
  }, [activeCourse, sendMessage, setIsTyping, addAIResponse, showToast])

  const handleCopyMessage = useCallback(() => {
    showToast('Message copié !', 'success')
  }, [showToast])

  // Quotes Library overlay
  if (showQuotesLibrary) {
    return (
      <QuotesLibraryPage
        books={books}
        onBack={() => setShowQuotesLibrary(false)}
        onAddQuote={addQuote}
        onUpdateQuote={updateQuote}
        onDeleteQuote={deleteQuote}
      />
    )
  }

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-zinc-950">
      {/* Header avec onglets */}
      <header className="flex-shrink-0 px-4 py-2 border-b border-zinc-800/50 bg-zinc-900/50">
        <div className="flex items-center gap-3">
          {/* Tabs */}
          <div className="flex gap-1 bg-zinc-800/50 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-all ${
                activeTab === 'courses' 
                  ? 'bg-zinc-700 text-white' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Cours</span>
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-all ${
                activeTab === 'library' 
                  ? 'bg-zinc-700 text-white' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Livres</span>
              {readingBooks.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          </div>

          <div className="flex-1" />

          {/* Actions selon l'onglet */}
          {activeTab === 'library' && (
            <>
              {/* Search */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 rounded-lg max-w-xs">
                <Search className="w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="text"
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="flex-1 bg-transparent text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none w-24"
                />
                {librarySearch && (
                  <button onClick={() => setLibrarySearch('')} className="text-zinc-500 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="relative" ref={statusRef}>
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                    filterStatusLib !== 'all' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  {statusLabels[filterStatusLib]}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showStatusDropdown && (
                  <div className="absolute top-full mt-1 right-0 w-32 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 py-1">
                    {(Object.keys(statusLabels) as FilterStatus[]).map((status) => (
                      <button
                        key={status}
                        onClick={() => { setFilterStatusLib(status); setShowStatusDropdown(false) }}
                        className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                          filterStatusLib === status ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                        }`}
                      >
                        {statusLabels[status]} ({status === 'all' ? pageStats.total : status === 'reading' ? pageStats.reading : status === 'completed' ? pageStats.completed : pageStats.toRead})
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Genre Filter */}
              {genresWithBooks.length > 0 && (
                <div className="relative" ref={genreRef}>
                  <button
                    onClick={() => setShowGenreDropdown(!showGenreDropdown)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                      filterGenre ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
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

              {/* Sort */}
              <div className="relative" ref={sortRef}>
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                    sortByLib !== 'recent' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  {sortLabels[sortByLib]}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showSortDropdown && (
                  <div className="absolute top-full mt-1 right-0 w-32 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 py-1">
                    {(Object.keys(sortLabels) as SortOption[]).map((sort) => (
                      <button
                        key={sort}
                        onClick={() => { setSortByLib(sort); setShowSortDropdown(false) }}
                        className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                          sortByLib === sort ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
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
                      onClick={() => { setShowQuotesLibrary(true); setShowMenu(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Citations
                    </button>
                    <button
                      onClick={() => { setShowGoalModal(true); setShowMenu(false) }}
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
                onClick={() => setShowAddBookModal(true)}
                className="p-1.5 text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Session de lecture active */}
      {isReadingSession && currentReadingBook && (
        <ReadingSessionBar
          bookTitle={currentReadingBook.title}
          sessionTime={sessionTime}
          onCancel={cancelReadingSession}
          onEnd={endReadingSession}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* COURSES TAB */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'courses' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Course List */}
          {!sidebarHidden && (
            <CourseList
              courses={filteredCourses}
              activeCourseId={uiState.activeCourseId}
              searchQuery={uiState.searchQuery}
              filterStatus={uiState.filterStatus}
              sortBy={uiState.sortBy}
              collapsed={uiState.sidebarCollapsed}
              onSelectCourse={setActiveCourse}
              onSearchChange={setSearchQuery}
              onFilterChange={setFilterStatus}
              onSortChange={setSortBy}
              onCreateCourse={() => setShowCourseModal(true)}
              onEditCourse={handleEditCourse}
              onDeleteCourse={handleDeleteCourse}
              onPinCourse={togglePinCourse}
              onArchiveCourse={archiveCourse}
              onHideSidebar={() => setSidebarHidden(true)}
            />
          )}

          {/* Main Content */}
          <main className="flex-1 flex flex-col h-full">
            {activeCourse ? (
              <CourseChat
                course={activeCourse}
                isTyping={uiState.isTyping}
                onSendMessage={handleSendMessage}
                onCopyMessage={handleCopyMessage}
              />
            ) : (
              <EmptyState onCreateCourse={() => setShowCourseModal(true)} />
            )}
          </main>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* LIBRARY TAB */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'library' && (
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
                      onSelectBook={handleSelectBook}
                      onStartReading={startReadingSession}
                      isReadingSession={isReadingSession}
                      currentReadingBookId={currentReadingBookId}
                    />
                  </div>
                ) : (
                  <Bookshelf 
                    books={readingBooks} 
                    onSelectBook={handleSelectBook}
                    onStartReading={startReadingSession}
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
                  onSelectBook={handleSelectBook}
                  onStartReading={startReadingSession}
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
                      onSelectBook={handleSelectBook}
                      onStartReading={startReadingSession}
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
                  onSelectBook={handleSelectBook}
                  onStartReading={startReadingSession}
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
                <button onClick={() => setShowAddBookModal(true)} className="text-white text-sm hover:underline">
                  + Ajouter un livre
                </button>
              </div>
            )}
          </div>
        </main>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MODALS */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      {/* Course Modal */}
      <CourseModal
        isOpen={showCourseModal}
        course={editingCourse}
        onClose={() => {
          setShowCourseModal(false)
          setEditingCourse(null)
        }}
        onSubmit={handleCreateCourse}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title={confirmDelete?.type === 'course' ? 'Supprimer le cours ?' : 'Supprimer le message ?'}
        message={
          confirmDelete?.type === 'course'
            ? 'Cette action est irréversible. Tous les messages, notes et flashcards seront perdus.'
            : 'Ce message sera définitivement supprimé.'
        }
        confirmText="Supprimer"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirmDelete(null)}
      />

      {/* Book Detail Modal */}
      {selectedBook && (
        <BookDetailModal 
          book={selectedBook} 
          onClose={handleCloseBook}
          onUpdate={handleUpdateBook}
          onDelete={handleDeleteBook}
          onAddQuote={(quote) => {
            addQuote(selectedBook.id, quote)
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

      {/* Add Book Modal */}
      {showAddBookModal && (
        <AddBookModal 
          onClose={() => setShowAddBookModal(false)}
          onAdd={handleAddBook}
        />
      )}

      {/* Goal Modal */}
      {showGoalModal && (
        <GoalModal 
          currentGoal={readingGoal}
          completedThisYear={stats.completedThisYear}
          onClose={() => setShowGoalModal(false)}
          onSave={handleSaveGoal}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  )
}
