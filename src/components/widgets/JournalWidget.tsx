import { memo, useMemo } from 'react'
import { BookOpen, Flame } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'
import { getTodayEntry, calculateJournalStats } from '../../utils/journalUtils'

interface JournalWidgetProps {
  widget: Widget
}

export const JournalWidget = memo(function JournalWidget({ widget }: JournalWidgetProps) {
  const { id } = widget
  const { setView, journalEntries } = useStore()
  
  const todayEntry = getTodayEntry(journalEntries)
  const stats = useMemo(() => calculateJournalStats(journalEntries), [journalEntries])

  return (
    <WidgetContainer id={id} title="" currentSize="notification" onClick={() => setView('journal')}>
      <div className="h-full flex flex-col p-6 gap-4 relative">
        {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <BookOpen className="w-12 h-12 text-violet-400" strokeWidth={1.5} />
              </div>
          {stats.currentStreak > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full shadow-lg shadow-orange-500/30">
              <Flame className="w-4 h-4 text-white" />
              <span className="text-sm font-bold text-white">{stats.currentStreak}</span>
            </div>
          )}
        </div>
        
        {/* Status */}
        <div className="text-center">
          <div className="text-6xl font-bold text-white tabular-nums leading-none mb-2">
            {todayEntry ? '✓' : '○'}
          </div>
          <div className="text-sm text-zinc-500 uppercase tracking-wide">
            {todayEntry ? 'Entrée créée' : 'Pas d\'entrée'}
          </div>
        </div>

        {/* Entry excerpt or prompt */}
        <div className="flex-1 overflow-hidden">
          {todayEntry ? (
            <div className="space-y-3">
              {todayEntry.mainGoal && (
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-[10px] text-violet-400 uppercase font-semibold tracking-wide mb-1">
                    Objectif
                  </div>
                  <p className="text-sm text-zinc-300 line-clamp-2">
                    {todayEntry.mainGoal}
                  </p>
                </div>
              )}
              
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                  {todayEntry.reflection}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-zinc-500 text-sm px-4">
                Prends un moment pour écrire 📝
              </div>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
          <div className="text-center">
            <div className="text-lg font-bold text-white">{stats.totalEntries}</div>
            <div className="text-[10px] text-zinc-600 uppercase">Entrées</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-amber-400">{stats.favoriteCount}</div>
            <div className="text-[10px] text-zinc-600 uppercase">Favoris</div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  )
})
