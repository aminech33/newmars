import { useState, useEffect, useMemo, useCallback } from 'react'
import { BookOpen, X, Star, ChevronRight, Target, Clock, Play, Timer } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Book } from '../../types/library'
import { formatTimerDisplay, formatReadingTime, getBookProgress, truncateText, parsePages } from '../../utils/libraryFormatters'

export function LibraryWidget() {
  const { 
    books, setView, 
    readingGoal, getReadingStats,
    isReadingSession, currentReadingBookId, readingSessionStart,
    startReadingSession, endReadingSession
  } = useStore()
  
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [sessionTime, setSessionTime] = useState(0)
  
  // Stats mémorisées
  const stats = useMemo(() => getReadingStats(), [books, readingGoal])
  
  const readingBooks = useMemo(() => books.filter(b => b.status === 'reading'), [books])
  const completedBooks = useMemo(() => books.filter(b => b.status === 'completed'), [books])
  
  const currentReadingBook = useMemo(() => 
    books.find(b => b.id === currentReadingBookId), [books, currentReadingBookId])
  
  // Timer
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

  // Callbacks
  const handleGoToLibrary = useCallback(() => setView('library'), [setView])
  const handleSelectBook = useCallback((book: Book) => setSelectedBook(book), [])
  const handleCloseBook = useCallback(() => setSelectedBook(null), [])
  
  const handleEndSession = useCallback(() => {
    const input = window.prompt('Pages lues ?')
    const pagesRead = parsePages(input)
    endReadingSession(pagesRead)
  }, [endReadingSession])

  const handleStartReading = useCallback((bookId: string) => {
    startReadingSession(bookId)
  }, [startReadingSession])

  const handleStartReadingFromModal = useCallback(() => {
    if (selectedBook) {
      startReadingSession(selectedBook.id)
      setSelectedBook(null)
    }
  }, [selectedBook, startReadingSession])

  return (
    <div className="h-full flex flex-col">
      {/* Header - cliquable */}
      <button 
        onClick={handleGoToLibrary}
        className="flex items-center justify-between mb-3 w-full hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-amber-500 rounded"
        aria-label="Ouvrir la bibliothèque"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-500" aria-hidden="true" />
          <h3 className="font-medium text-zinc-200">Bibliothèque</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-600">{books.length} livres</span>
          <ChevronRight className="w-4 h-4 text-zinc-600" aria-hidden="true" />
        </div>
      </button>
      
      {/* Session en cours */}
      {isReadingSession && currentReadingBook && (
        <div 
          className="mb-3 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Timer className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" aria-hidden="true" />
              <span className="text-xs text-amber-300 truncate">{truncateText(currentReadingBook.title, 15)}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span 
                className="text-sm font-mono text-amber-400 tabular-nums"
                aria-label={`Temps écoulé: ${formatTimerDisplay(sessionTime)}`}
              >
                {formatTimerDisplay(sessionTime)}
              </span>
              <button
                onClick={handleEndSession}
                className="px-2 py-1 text-xs bg-amber-500 text-black rounded font-medium hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
              >
                Stop
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Objectif mini */}
      {readingGoal && (
        <div className="mb-3 p-2 bg-zinc-900/50 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Target className="w-3 h-3 text-amber-500" aria-hidden="true" />
              <span className="text-xs text-zinc-500">Objectif {readingGoal.year}</span>
            </div>
            <span className="text-xs text-amber-400">{stats.completedThisYear}/{readingGoal.targetBooks}</span>
          </div>
          <div 
            className="h-1.5 bg-zinc-800 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={stats.goalProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progression objectif annuel"
          >
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
              style={{ width: `${Math.min(100, stats.goalProgress)}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Étagère avec texture bois */}
      <div className="flex-1 relative">
        <div 
          className="relative rounded-lg overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #3d2817 0%, #2a1a0f 50%, #1a0f08 100%)',
            boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.05)'
          }}
          role="list"
          aria-label="Étagère de livres"
        >
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)`
            }}
            aria-hidden="true"
          />
          
          <div className="relative flex items-end gap-1 p-3 pt-4 min-h-[120px]">
            {books.slice(0, 8).map((book, index) => (
              <WidgetBookSpine
                key={book.id}
                book={book}
                index={index}
                onSelect={() => handleSelectBook(book)}
                onStartReading={() => handleStartReading(book.id)}
                isReadingSession={isReadingSession}
                isCurrentReading={currentReadingBookId === book.id}
              />
            ))}
            
            {books.length < 4 && (
              <div className="flex-1 flex items-center justify-center opacity-30">
                <span className="text-xs text-zinc-500">+ Livres</span>
              </div>
            )}
          </div>
          
          <div 
            className="h-2 rounded-b-lg"
            style={{
              background: 'linear-gradient(180deg, #4a3020 0%, #2d1c12 100%)',
              boxShadow: '0 4px 8px rgba(0,0,0,0.4)'
            }}
            aria-hidden="true"
          />
        </div>
      </div>
      
      {/* Stats mini */}
      <div 
        className="grid grid-cols-3 gap-2 mt-3"
        role="group"
        aria-label="Statistiques rapides"
      >
        <div className="text-center p-2 bg-zinc-900/30 rounded-lg">
          <p className="text-lg font-semibold text-amber-400">{readingBooks.length}</p>
          <p className="text-[10px] text-zinc-600">En cours</p>
        </div>
        <div className="text-center p-2 bg-zinc-900/30 rounded-lg">
          <p className="text-lg font-semibold text-emerald-400">{completedBooks.length}</p>
          <p className="text-[10px] text-zinc-600">Terminés</p>
        </div>
        <div className="text-center p-2 bg-zinc-900/30 rounded-lg">
          <p className="text-lg font-semibold text-zinc-400">{formatReadingTime(stats.totalReadingTime)}</p>
          <p className="text-[10px] text-zinc-600">Lecture</p>
        </div>
      </div>
      
      {/* Modal livre ouvert */}
      {selectedBook && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={handleCloseBook}
          role="dialog"
          aria-modal="true"
          aria-labelledby="widget-book-title"
        >
          <div 
            className="relative w-full max-w-md bg-mars-surface border border-zinc-800 rounded-2xl overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`h-24 bg-gradient-to-br ${selectedBook.coverColor} relative`}>
              <button
                onClick={handleCloseBook}
                className="absolute top-3 right-3 p-1.5 bg-black/30 hover:bg-black/50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Fermer"
              >
                <X className="w-4 h-4 text-white" aria-hidden="true" />
              </button>
              
              <div className="absolute bottom-3 left-4 flex items-center gap-2">
                <span className={`
                  px-2 py-1 rounded-full text-xs font-medium
                  ${selectedBook.status === 'reading' ? 'bg-amber-500/20 text-amber-300' : ''}
                  ${selectedBook.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : ''}
                  ${selectedBook.status === 'to-read' ? 'bg-blue-500/20 text-blue-300' : ''}
                  ${selectedBook.status === 'abandoned' ? 'bg-zinc-500/20 text-zinc-300' : ''}
                `}>
                  {selectedBook.status === 'reading' && '📖 En lecture'}
                  {selectedBook.status === 'completed' && '✓ Terminé'}
                  {selectedBook.status === 'to-read' && '📚 À lire'}
                  {selectedBook.status === 'abandoned' && '✗ Abandonné'}
                </span>
                
                {selectedBook.status === 'reading' && !isReadingSession && (
                  <button
                    onClick={handleStartReadingFromModal}
                    className="flex items-center gap-1 px-2 py-1 bg-amber-500 text-black rounded-full text-xs font-medium hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
                    aria-label="Démarrer une session de lecture"
                  >
                    <Play className="w-3 h-3 fill-black" aria-hidden="true" />
                    Lire
                  </button>
                )}
              </div>
              
              {selectedBook.totalReadingTime > 0 && (
                <div className="absolute bottom-3 right-4 flex items-center gap-1 px-2 py-1 bg-black/30 rounded-full">
                  <Clock className="w-3 h-3 text-white/70" aria-hidden="true" />
                  <span className="text-xs text-white/90">{formatReadingTime(selectedBook.totalReadingTime)}</span>
                </div>
              )}
            </div>
            
            <div className="p-5">
              <h2 id="widget-book-title" className="text-xl font-semibold text-zinc-100 mb-1">
                {selectedBook.title}
              </h2>
              <p className="text-sm text-zinc-400 mb-4">{selectedBook.author}</p>
              
              {selectedBook.status === 'reading' && selectedBook.pages && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-zinc-500 mb-1">
                    <span>Progression</span>
                    <span>{selectedBook.currentPage || 0} / {selectedBook.pages} pages</span>
                  </div>
                  <div 
                    className="h-2 bg-zinc-800 rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={getBookProgress(selectedBook.currentPage, selectedBook.pages)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div 
                      className={`h-full bg-gradient-to-r ${selectedBook.coverColor}`}
                      style={{ width: `${getBookProgress(selectedBook.currentPage, selectedBook.pages)}%` }}
                    />
                  </div>
                </div>
              )}
              
              {selectedBook.rating && (
                <div className="flex items-center gap-1 mb-4" aria-label={`Note: ${selectedBook.rating} sur 5`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star}
                      className={`w-4 h-4 ${star <= selectedBook.rating! ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'}`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              )}
              
              {/* Citations preview */}
              {selectedBook.quotes && selectedBook.quotes.length > 0 && (
                <div className="mb-4 p-3 bg-zinc-900/50 rounded-lg border-l-2 border-violet-500/50">
                  <blockquote className="text-xs text-zinc-400 italic">
                    "{truncateText(selectedBook.quotes[0].text, 100)}"
                  </blockquote>
                  <p className="text-[10px] text-zinc-600 mt-1">
                    {selectedBook.quotes.length} citation{selectedBook.quotes.length > 1 ? 's' : ''}
                  </p>
                </div>
              )}
              
              <button
                onClick={() => {
                  setSelectedBook(null)
                  setView('library')
                }}
                className="w-full py-2 text-sm text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded-lg hover:bg-amber-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                Voir les détails
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Composant BookSpine pour le widget
interface WidgetBookSpineProps {
  book: Book
  index: number
  onSelect: () => void
  onStartReading: () => void
  isReadingSession: boolean
  isCurrentReading: boolean
}

function WidgetBookSpine({ book, index, onSelect, onStartReading, isReadingSession, isCurrentReading }: WidgetBookSpineProps) {
  return (
    <div className="group relative flex-shrink-0" role="listitem">
      <button
        onClick={onSelect}
        className="relative transition-all duration-300 hover:-translate-y-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 focus:ring-offset-[#2a1a0f] rounded-sm"
        style={{ animationDelay: `${index * 50}ms` }}
        aria-label={`${book.title} par ${book.author}`}
      >
        <div 
          className={`
            relative w-7 rounded-sm cursor-pointer transition-all duration-300
            group-hover:shadow-lg group-hover:shadow-black/50
            ${book.status === 'reading' ? 'ring-2 ring-amber-500/50' : ''}
            ${isCurrentReading ? 'ring-2 ring-amber-400' : ''}
          `}
          style={{
            height: `${Math.max(70, Math.min(100, (book.pages || 200) / 4))}px`,
          }}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${book.coverColor} rounded-sm`} />
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/30 rounded-l-sm" aria-hidden="true" />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <span 
              className="text-[7px] font-medium text-white/90 whitespace-nowrap overflow-hidden"
              style={{
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                transform: 'rotate(180deg)',
                maxHeight: '90%'
              }}
              aria-hidden="true"
            >
              {truncateText(book.title, 12)}
            </span>
          </div>
          
          {book.status === 'reading' && (
            <div 
              className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse" 
              aria-hidden="true"
            />
          )}
          
          {book.status === 'completed' && (
            <div 
              className="absolute top-0.5 right-0.5 w-2 h-2 bg-emerald-500 rounded-full flex items-center justify-center"
              aria-hidden="true"
            >
              <span className="text-[6px]">✓</span>
            </div>
          )}
        </div>
      </button>
      
      {/* Quick play button */}
      {book.status === 'reading' && !isReadingSession && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onStartReading()
          }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-amber-300 focus:opacity-100"
          aria-label={`Lire ${book.title}`}
        >
          <Play className="w-2 h-2 text-black fill-black" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
