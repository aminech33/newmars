import { Timer, Pause } from 'lucide-react'
import { formatTimerDisplay, parsePages } from '../../../utils/libraryFormatters'

interface ReadingSessionBarProps {
  bookTitle: string
  sessionTime: number
  onCancel: () => void
  onEnd: (pagesRead?: number) => void
}

export function ReadingSessionBar({ bookTitle, sessionTime, onCancel, onEnd }: ReadingSessionBarProps) {
  const handleEndSession = () => {
    const input = window.prompt('Combien de pages as-tu lues ?')
    const pagesRead = parsePages(input)
    onEnd(pagesRead)
  }

  return (
    <div 
      className="px-4 md:px-6 py-3 bg-amber-500/10 border-b border-amber-500/20"
      role="status"
      aria-live="polite"
      aria-label={`Session de lecture en cours: ${bookTitle}, ${formatTimerDisplay(sessionTime)}`}
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 md:gap-4">
          <div 
            className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <Timer className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-amber-300">Session en cours</p>
            <p className="text-xs text-amber-400/70 truncate max-w-[200px]">{bookTitle}</p>
          </div>
          <div 
            className="text-xl md:text-2xl font-mono text-amber-400 tabular-nums"
            aria-label={`Temps écoulé: ${formatTimerDisplay(sessionTime)}`}
          >
            {formatTimerDisplay(sessionTime)}
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 rounded"
          >
            Annuler
          </button>
          <button
            onClick={handleEndSession}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-lg font-medium hover:bg-amber-400 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-amber-500/10"
          >
            <Pause className="w-4 h-4" aria-hidden="true" />
            Terminer
          </button>
        </div>
      </div>
    </div>
  )
}






