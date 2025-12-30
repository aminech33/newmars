import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { BookOpen, GraduationCap, Plus, Search, X, ChevronDown, MoreVertical, Target, Download, Upload, FileText } from 'lucide-react'
import { useLearningData } from '../../hooks/useLearningData'
import { CourseModal } from './CourseModal'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Toast, ToastType } from '../ui/Toast'
import { CreateCourseData, Course } from '../../types/learning'
import { generateGeminiStreamingResponse } from '../../utils/geminiAI'

// New tab components
import { CoursesTab } from './CoursesTab'
import { LibraryTab } from './LibraryTab'

// Library imports
import { useStore } from '../../store/useStore'
import { Book } from '../../types/library'
import { useLibraryStats } from '../../hooks/useLibraryStats'
import { useReadingSessionPersistence } from '../../hooks/useReadingSessionPersistence'
import { useDebounce } from '../../hooks/useDebounce'
import { exportLibrary, importLibrary, exportQuotesAsMarkdown } from '../../utils/libraryImportExport'
import {
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

  // Détecter la vue actuelle pour afficher le bon onglet
  const currentView = useStore((state) => state.currentView)
  
  // Tab state - Définir selon la vue
  const [activeTab, setActiveTab] = useState<PageTab>(() => {
    return currentView === 'library' ? 'library' : 'courses'
  })
  
  // Synchroniser l'onglet avec la vue
  useEffect(() => {
    if (currentView === 'library') {
      setActiveTab('library')
    } else if (currentView === 'learning') {
      setActiveTab('courses')
    }
  }, [currentView])

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
    <div className="h-screen w-full flex flex-col overflow-hidden bg-black">
      {/* Header - Caché si bibliothèque (elle a son propre header) */}
      {currentView !== 'library' && (
        <header className="flex-shrink-0 px-4 py-2 border-b border-zinc-800/50 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-medium text-zinc-200">Apprentissage</h1>
            <div className="flex-1" />
          </div>
        </header>
      )}

      {/* Contenu selon l'onglet */}
      {activeTab === 'courses' && (
        <CoursesTab
          filteredCourses={filteredCourses}
          activeCourse={activeCourse}
          activeCourseId={activeCourse?.id || null}
          searchQuery={uiState.searchQuery}
          filterStatus={uiState.filterStatus}
          sortBy={uiState.sortBy}
          sidebarCollapsed={false}
          sidebarHidden={sidebarHidden}
          isTyping={uiState.isTyping}
          setActiveCourse={setActiveCourse}
          setSearchQuery={setSearchQuery}
          setFilterStatus={setFilterStatus}
          setSortBy={setSortBy}
          setSidebarHidden={setSidebarHidden}
          onCreateCourse={() => setShowCourseModal(true)}
          onEditCourse={(course) => {
            setEditingCourse(course)
            setShowCourseModal(true)
          }}
          onDeleteCourse={(courseId) => setConfirmDelete({ type: 'course', id: courseId })}
          onPinCourse={togglePinCourse}
          onArchiveCourse={archiveCourse}
          onSendMessage={handleSendMessage}
          onCopyMessage={handleCopyMessage}
        />
      )}

      {activeTab === 'library' && (
        <LibraryTab
          filteredAndSortedBooks={filteredAndSortedBooks}
          readingBooks={readingBooks}
          allBooks={books}
          readingGoal={readingGoal}
          filterStatusLib={filterStatusLib}
          filterGenre={filterGenre}
          isReadingSession={isReadingSession}
          currentReadingBookId={currentReadingBookId}
          searchQuery={librarySearch}
          onSelectBook={handleSelectBook}
          onStartReading={startReadingSession}
          onAddBook={() => setShowAddBookModal(true)}
          onFilterStatusChange={setFilterStatusLib}
          onFilterGenreChange={setFilterGenre}
          onSearchChange={setLibrarySearch}
          onBack={() => useStore.getState().setView('hub')}
        />
      )}

      {/* Modals */}
      <CourseModal
        isOpen={showCourseModal}
        course={editingCourse}
        onClose={() => {
          setShowCourseModal(false)
          setEditingCourse(null)
        }}
        onSubmit={handleCreateCourse}
      />

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

      {/* Modals bibliothèque */}
      {currentView === 'library' && (
        <>
          {/* Session de lecture active */}
          {isReadingSession && currentReadingBook && (
            <ReadingSessionBar
              bookTitle={currentReadingBook.title}
              sessionTime={sessionTime}
              onCancel={cancelReadingSession}
              onEnd={endReadingSession}
            />
          )}

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
        </>
      )}
    </div>
  )
}
