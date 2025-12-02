import { memo, useMemo } from 'react'
import { BookOpen, ArrowRight, Play, Target } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'
import { formatReadingTime } from '../../utils/libraryFormatters'

interface LibraryWidgetProps {
  widget: Widget
}

export const LibraryWidget = memo(function LibraryWidget({ widget }: LibraryWidgetProps) {
  const { id, size = 'small' } = widget
  const { 
    books, setView, 
    readingGoal, getReadingStats,
    isReadingSession,
    startReadingSession
  } = useStore()
  
  const stats = useMemo(() => getReadingStats(), [books, readingGoal])
  const readingBooks = useMemo(() => books.filter(b => b.status === 'reading'), [books])
  const completedBooks = useMemo(() => books.filter(b => b.status === 'completed'), [books])

  // Small: Juste nombre de livres + objectif avec gradient
  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="" currentSize={size} onClick={() => setView('library')}>
        <div 
          className="absolute inset-0 flex flex-col justify-between p-5 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
          }}
        >
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 30% 70%, rgba(255,255,255,0.3) 0%, transparent 50%)'
          }} />
          
          <div className="relative z-10 flex flex-col items-center justify-center flex-1">
            <div className="text-xs font-semibold text-white/80 uppercase tracking-wide mb-1">Bibliothèque</div>
            <div className="text-5xl font-bold text-white mb-1">{readingBooks.length}</div>
            <div className="text-xs text-white/70">
              {readingBooks.length > 1 ? 'lectures en cours' : 'lecture en cours'}
            </div>
            {readingGoal && (
              <div className="mt-3 w-full px-2">
                <div className="h-1.5 bg-white/20 backdrop-blur-sm rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-500"
                    style={{ width: `${Math.min(100, stats.goalProgress)}%` }}
                  />
                </div>
                <div className="text-xs text-white/70 mt-1 text-center">
                  {stats.completedThisYear}/{readingGoal.targetBooks} livres
                </div>
              </div>
            )}
          </div>
        </div>
      </WidgetContainer>
    )
  }

  // Medium: Liste des livres en cours + stats avec gradient
  if (size === 'medium') {
    return (
      <WidgetContainer 
        id={id} 
        title=""
        currentSize={size}
        onClick={() => setView('library')}
        actions={
          <button
            onClick={(e) => {
              e.stopPropagation()
              setView('library')
            }}
            className="text-pink-200 hover:text-white transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        }
      >
        <div 
          className="absolute inset-0 p-5 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
          }}
        >
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 30% 70%, rgba(255,255,255,0.3) 0%, transparent 50%)'
          }} />
          
          <div className="relative z-10 h-full flex flex-col">
            <div className="mb-3">
              <div className="text-xs font-semibold text-white/80 uppercase tracking-wide">Bibliothèque</div>
              <div className="text-3xl font-bold text-white">{readingBooks.length} en cours</div>
            </div>

            {/* Objectif */}
            {readingGoal && (
              <div className="mb-3 p-2 bg-white/10 backdrop-blur-sm shadow-md shadow-black/5 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3 h-3 text-white" />
                    <span className="text-xs text-white/90">Objectif {readingGoal.year}</span>
                  </div>
                  <span className="text-xs font-bold text-white">{stats.completedThisYear}/{readingGoal.targetBooks}</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-500"
                    style={{ width: `${Math.min(100, stats.goalProgress)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Livres en cours */}
            <div className="space-y-2 flex-1 overflow-hidden">
              {readingBooks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <BookOpen className="w-12 h-12 text-white/50 mb-2" />
                  <p className="text-sm text-white/80">Aucune lecture</p>
                </div>
              ) : (
                <>
                  {readingBooks.slice(0, 4).map((book) => (
                    <button
                      key={book.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!isReadingSession) {
                          startReadingSession(book.id)
                        }
                      }}
                      className="flex items-center gap-3 w-full text-left hover:bg-white/10 p-2 -m-2 rounded-xl transition-colors group"
                    >
                      <div 
                        className={`w-8 h-10 rounded-sm bg-gradient-to-br ${book.coverColor} flex-shrink-0 shadow-lg`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate font-medium">{book.title}</p>
                        <p className="text-xs text-white/70 truncate">{book.author}</p>
                      </div>
                      {!isReadingSession && (
                        <Play className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </WidgetContainer>
    )
  }

  // Large: Stats + livres en cours + détails avec gradient
  return (
    <WidgetContainer 
      id={id} 
      title=""
      currentSize={size}
      onClick={() => setView('library')}
      actions={
        <button
          onClick={(e) => {
            e.stopPropagation()
            setView('library')
          }}
          className="text-pink-200 hover:text-white transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      }
    >
      <div 
        className="absolute inset-0 p-5 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
        }}
      >
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 30% 70%, rgba(255,255,255,0.3) 0%, transparent 50%)'
        }} />
        
        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-white/80 uppercase tracking-wide">Bibliothèque</div>
            <div className="text-3xl font-bold text-white">{readingBooks.length} en cours</div>
          </div>

          {/* Stats header */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-white/10 backdrop-blur-sm shadow-md shadow-black/5 rounded-lg p-2">
              <div className="text-xl font-bold text-white">{readingBooks.length}</div>
              <div className="text-[10px] text-white/70 uppercase tracking-wide">En cours</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm shadow-md shadow-black/5 rounded-lg p-2">
              <div className="text-xl font-bold text-white">{completedBooks.length}</div>
              <div className="text-[10px] text-white/70 uppercase tracking-wide">Terminés</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm shadow-md shadow-black/5 rounded-lg p-2">
              <div className="text-xl font-bold text-white">{books.length}</div>
              <div className="text-[10px] text-white/70 uppercase tracking-wide">Total</div>
            </div>
          </div>

          {/* Objectif avec progress */}
          {readingGoal && (
            <div className="mb-3 p-3 bg-white/10 backdrop-blur-sm shadow-md shadow-black/5 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-white" />
                  <span className="text-sm text-white font-medium">Objectif {readingGoal.year}</span>
                </div>
                <span className="text-sm font-bold text-white">{stats.completedThisYear}/{readingGoal.targetBooks}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-500"
                  style={{ width: `${Math.min(100, stats.goalProgress)}%` }}
                />
              </div>
              <div className="text-xs text-white/70 mt-1 text-center">
                {stats.goalProgress}% complété
              </div>
            </div>
          )}

          {/* Livres en cours avec détails */}
          <div className="space-y-2 flex-1 overflow-auto">
            {readingBooks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <BookOpen className="w-12 h-12 text-white/50 mb-2" />
                <p className="text-sm text-white/80 mb-1">Aucune lecture en cours</p>
                <p className="text-xs text-white/60">Ajoutez un livre pour commencer</p>
              </div>
            ) : (
              <>
                {readingBooks.map((book) => {
                  const progress = book.pages && book.currentPage 
                    ? Math.round((book.currentPage / book.pages) * 100) 
                    : 0
                  
                  return (
                    <button
                      key={book.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!isReadingSession) {
                          startReadingSession(book.id)
                        }
                      }}
                      className="flex gap-3 w-full text-left hover:bg-white/10 p-2 -m-2 rounded-xl transition-colors group"
                    >
                      <div 
                        className={`w-12 h-16 rounded-sm bg-gradient-to-br ${book.coverColor} flex-shrink-0 shadow-lg relative overflow-hidden`}
                      >
                        {/* Progress bar on cover */}
                        {progress > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                            <div 
                              className="h-full bg-white"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium mb-0.5 line-clamp-1">{book.title}</p>
                        <p className="text-xs text-white/70 mb-1">{book.author}</p>
                        {book.pages && book.currentPage && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-white transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-white/70">{progress}%</span>
                          </div>
                        )}
                      </div>
                      {!isReadingSession && (
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-4 h-4 text-white fill-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  )
                })}
                
                {/* Stats supplémentaires */}
                <div className="pt-2 mt-2 border-t border-white/10">
                  <div className="text-xs text-white/70 text-center">
                    {stats.totalPagesRead} pages • {formatReadingTime(stats.totalReadingTime)}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </WidgetContainer>
  )
})
