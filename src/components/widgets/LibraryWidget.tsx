import { memo, useMemo } from 'react'
import { Library, Target, Play } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useLibraryStats } from '../../hooks/useLibraryStats'
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
    isReadingSession,
    startReadingSession
  } = useStore()
  
  const stats = useLibraryStats(books, readingGoal)
  const readingBooks = useMemo(() => books.filter(b => b.status === 'reading'), [books])
  const completedBooks = useMemo(() => books.filter(b => b.status === 'completed'), [books])

  return (
    <WidgetContainer id={id} title="" currentSize="notification" onClick={() => setView('library')}>
      <div className="h-full flex flex-col p-5 gap-2.5">
        {/* Header compact */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Library className="w-6 h-6 text-cyan-400 hover-glow" strokeWidth={1.5} />
            <div className="text-3xl font-bold text-white tabular-nums leading-none font-mono-display number-glow">
              {readingBooks.length}
            </div>
            <div className="text-[10px] text-cyan-400/80 uppercase tracking-wider font-semibold">
              LIVRES
            </div>
          </div>
          {readingGoal && stats.goalProgress >= 100 && (
            <div className="px-2 py-0.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full shadow-lg shadow-emerald-500/30">
              <span className="text-[10px] font-bold text-white">✓ Atteint</span>
            </div>
          )}
        </div>

        {/* Books List - Top 3 */}
        <div className="flex-1 space-y-1.5 overflow-hidden">
          {readingBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center h-full">
              <Library className="w-10 h-10 text-zinc-600 mb-2" />
              <span className="text-xs text-zinc-500">Aucune lecture</span>
            </div>
          ) : (
            readingBooks.slice(0, 3).map((book) => {
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
                  className="flex items-start gap-2 w-full text-left p-2 rounded-lg
                             hover:bg-white/5 transition-colors group"
                >
                  <div 
                    className={`w-7 h-10 rounded-sm bg-gradient-to-br ${book.coverColor} 
                                flex-shrink-0 shadow-md relative overflow-hidden`}
                  >
                    {progress > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/30">
                        <div 
                          className="h-full bg-white"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-300 group-hover:text-white 
                                   transition-colors truncate font-medium">
                      {book.title}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate">{book.author}</p>
                    {progress > 0 && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-cyan-400 transition-colors"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-zinc-600 tabular-nums">{progress}%</span>
                      </div>
                    )}
                  </div>
                  {!isReadingSession && (
                    <Play className="w-3.5 h-3.5 text-cyan-400 opacity-0 group-hover:opacity-100 
                                     transition-opacity flex-shrink-0 mt-1" />
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Footer Stats */}
        <div className="pt-2 border-t border-white/10 space-y-1.5">
          {/* Reading Goal */}
          {readingGoal && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <Target className="w-3 h-3 text-cyan-400" />
                  <span className="text-[10px] text-zinc-500">Objectif {readingGoal.year}</span>
                </div>
                <span className="text-[10px] font-bold text-white tabular-nums">
                  {stats.completedThisYear}/{readingGoal.targetBooks}
                </span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-colors duration-500"
                  style={{ width: `${Math.min(100, stats.goalProgress)}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Quick stats */}
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-zinc-600">{completedBooks.length} terminés</span>
            <span className="text-cyan-400 font-semibold">{books.length} total</span>
          </div>
        </div>
      </div>
    </WidgetContainer>
  )
})
