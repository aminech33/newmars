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

  // Small: Juste nombre de livres + objectif
  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="Bibliothèque" currentSize={size} onClick={() => setView('library')}>
        <div className="flex flex-col items-center justify-center h-full">
          <div className="relative mb-2">
            <BookOpen className="w-12 h-12 text-amber-400" />
            {readingBooks.length > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">{readingBooks.length}</span>
              </div>
            )}
          </div>
          <p className="text-sm text-zinc-500 font-medium">{books.length} livres</p>
          {readingGoal && (
            <div className="mt-2 w-full px-2">
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                  style={{ width: `${Math.min(100, stats.goalProgress)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </WidgetContainer>
    )
  }

  // Medium: Liste des livres en cours + stats
  if (size === 'medium') {
    return (
      <WidgetContainer 
        id={id} 
        title="Bibliothèque"
        currentSize={size}
        onClick={() => setView('library')}
        actions={
          <button
            onClick={(e) => {
              e.stopPropagation()
              setView('library')
            }}
            className="text-amber-400 hover:text-amber-300 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        }
      >
        <div className="flex flex-col h-full">
          {/* Objectif */}
          {readingGoal && (
            <div className="mb-3 p-2 bg-amber-500/10 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Target className="w-3 h-3 text-amber-400" />
                  <span className="text-xs text-amber-300">Objectif {readingGoal.year}</span>
                </div>
                <span className="text-xs font-bold text-amber-400">{stats.completedThisYear}/{readingGoal.targetBooks}</span>
              </div>
              <div className="h-1.5 bg-amber-900/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, stats.goalProgress)}%` }}
                />
              </div>
            </div>
          )}

          {/* Livres en cours */}
          <div className="space-y-2 flex-1 overflow-auto">
            {readingBooks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <BookOpen className="w-12 h-12 text-zinc-700 mb-2" />
                <p className="text-sm text-zinc-500">Aucune lecture</p>
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
                    className="flex items-center gap-3 w-full text-left hover:bg-white/5 p-2 -m-2 rounded-xl transition-colors group"
                  >
                    <div 
                      className={`w-8 h-10 rounded-sm bg-gradient-to-br ${book.coverColor} flex-shrink-0 shadow-lg`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 truncate font-medium">{book.title}</p>
                      <p className="text-xs text-zinc-600 truncate">{book.author}</p>
                    </div>
                    {!isReadingSession && (
                      <Play className="w-4 h-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      </WidgetContainer>
    )
  }

  // Large: Stats + livres en cours + détails
  return (
    <WidgetContainer 
      id={id} 
      title="Bibliothèque"
      currentSize={size}
      onClick={() => setView('library')}
      actions={
        <button
          onClick={(e) => {
            e.stopPropagation()
            setView('library')
          }}
          className="text-amber-400 hover:text-amber-300 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      }
    >
      <div className="flex flex-col h-full">
        {/* Stats header */}
        <div className="flex gap-2 mb-3 pb-3 border-b border-white/5">
          <div className="flex-1 bg-amber-500/10 rounded-lg p-2">
            <div className="text-xl font-bold text-amber-400">{readingBooks.length}</div>
            <div className="text-[10px] text-amber-300/70 uppercase tracking-wide">En cours</div>
          </div>
          <div className="flex-1 bg-emerald-500/10 rounded-lg p-2">
            <div className="text-xl font-bold text-emerald-400">{completedBooks.length}</div>
            <div className="text-[10px] text-emerald-300/70 uppercase tracking-wide">Terminés</div>
          </div>
          <div className="flex-1 bg-violet-500/10 rounded-lg p-2">
            <div className="text-xl font-bold text-violet-400">{books.length}</div>
            <div className="text-[10px] text-violet-300/70 uppercase tracking-wide">Total</div>
          </div>
        </div>

        {/* Objectif avec progress */}
        {readingGoal && (
          <div className="mb-3 p-3 bg-amber-500/10 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-amber-300 font-medium">Objectif {readingGoal.year}</span>
              </div>
              <span className="text-sm font-bold text-amber-400">{stats.completedThisYear}/{readingGoal.targetBooks}</span>
            </div>
            <div className="h-2 bg-amber-900/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                style={{ width: `${Math.min(100, stats.goalProgress)}%` }}
              />
            </div>
            <div className="text-xs text-amber-400/70 mt-1 text-center">
              {stats.goalProgress}% complété
            </div>
          </div>
        )}

        {/* Livres en cours avec détails */}
        <div className="space-y-2 flex-1 overflow-auto">
          {readingBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <BookOpen className="w-12 h-12 text-zinc-700 mb-2" />
              <p className="text-sm text-zinc-500 mb-1">Aucune lecture en cours</p>
              <p className="text-xs text-zinc-700">Ajoutez un livre pour commencer</p>
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
                    className="flex gap-3 w-full text-left hover:bg-white/5 p-2 -m-2 rounded-xl transition-colors group"
                  >
                    <div 
                      className={`w-12 h-16 rounded-sm bg-gradient-to-br ${book.coverColor} flex-shrink-0 shadow-lg relative overflow-hidden`}
                    >
                      {/* Progress bar on cover */}
                      {progress > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                          <div 
                            className="h-full bg-amber-400"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 font-medium mb-0.5 line-clamp-1">{book.title}</p>
                      <p className="text-xs text-zinc-600 mb-1">{book.author}</p>
                      {book.pages && book.currentPage && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-amber-500 transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-zinc-600">{progress}%</span>
                        </div>
                      )}
                    </div>
                    {!isReadingSession && (
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
              
              {/* Stats supplémentaires */}
              <div className="pt-2 mt-2 border-t border-white/5">
                <div className="text-xs text-zinc-600 text-center">
                  {stats.totalPagesRead} pages • {formatReadingTime(stats.totalReadingTime)}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </WidgetContainer>
  )
})
