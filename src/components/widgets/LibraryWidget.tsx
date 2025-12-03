import { memo, useMemo } from 'react'
import { Library, Target, Play } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'

interface LibraryWidgetProps {
  widget: Widget
}

export const LibraryWidget = memo(function LibraryWidget({ widget }: LibraryWidgetProps) {
  const { id } = widget
  const { 
    books, 
    setView, 
    readingGoal, 
    getReadingStats,
    isReadingSession,
    startReadingSession
  } = useStore()
  
  const stats = useMemo(() => getReadingStats(), [books, readingGoal])
  const readingBooks = useMemo(() => books.filter(b => b.status === 'reading'), [books])
  const completedBooks = useMemo(() => books.filter(b => b.status === 'completed'), [books])

  return (
    <WidgetContainer id={id} title="" currentSize="notification" onClick={() => setView('library')}>
      <div className="h-full flex flex-col p-6 gap-4">
        {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <Library className="w-12 h-12 text-cyan-400" strokeWidth={1.5} />
              </div>
          {readingGoal && stats.goalProgress >= 100 && (
            <div className="px-3 py-1 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full shadow-lg shadow-emerald-500/30">
              <span className="text-xs font-bold text-white">✓ Objectif atteint</span>
            </div>
          )}
        </div>

        {/* Big Count */}
        <div className="text-center">
          <div className="text-6xl font-bold text-white tabular-nums leading-none">
            {readingBooks.length}
          </div>
          <div className="text-sm text-zinc-500 uppercase tracking-wide mt-2">
            en cours
          </div>
        </div>

        {/* Books List (top 2) */}
        <div className="flex-1 space-y-2 overflow-hidden">
          {readingBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-zinc-500 text-sm py-4">
              <Library className="w-8 h-8 text-zinc-600 mb-2" />
              <span>Aucune lecture</span>
            </div>
          ) : (
            readingBooks.slice(0, 2).map((book) => {
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
                  className="flex items-start gap-3 w-full text-left p-2 rounded-lg
                             hover:bg-white/5 transition-colors group"
                >
                  <div 
                    className={`w-8 h-11 rounded-sm bg-gradient-to-br ${book.coverColor} 
                                flex-shrink-0 shadow-md relative overflow-hidden`}
                  >
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
                    <p className="text-sm text-zinc-300 group-hover:text-white 
                                   transition-colors truncate font-medium">
                      {book.title}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">{book.author}</p>
                    {progress > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-cyan-400 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-zinc-600 tabular-nums">{progress}%</span>
                      </div>
                    )}
                  </div>
                  {!isReadingSession && (
                    <Play className="w-4 h-4 text-cyan-400 opacity-0 group-hover:opacity-100 
                                     transition-opacity flex-shrink-0 mt-1" />
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Footer - Reading Goal */}
        {readingGoal && (
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Target className="w-3 h-3 text-cyan-400" />
                <span className="text-xs text-zinc-400">Objectif {readingGoal.year}</span>
              </div>
              <span className="text-xs font-bold text-white tabular-nums">
                {stats.completedThisYear}/{readingGoal.targetBooks}
              </span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                style={{ width: `${Math.min(100, stats.goalProgress)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </WidgetContainer>
  )
})
