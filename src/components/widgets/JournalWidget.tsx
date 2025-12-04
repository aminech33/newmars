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
      <div className="h-full flex flex-col p-5 gap-2.5 relative">
        {/* Header compact */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-violet-400 hover-glow" strokeWidth={1.5} />
            <div className="text-2xl leading-none number-glow">
              {todayEntry ? '✓' : '○'}
            </div>
            <div className="text-[10px] text-violet-400/80 uppercase tracking-wider font-semibold">
              JOURNAL
            </div>
          </div>
          {stats.currentStreak > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full shadow-lg shadow-orange-500/30">
              <Flame className="w-3 h-3 text-white" />
              <span className="text-[10px] font-bold text-white">{stats.currentStreak}j</span>
            </div>
          )}
        </div>

        {/* Entry excerpt or prompt */}
        <div className="flex-1 overflow-hidden">
          {todayEntry ? (
            <div className="space-y-1.5">
              {todayEntry.mainGoal && (
                <div className="p-2 bg-violet-500/5 rounded-lg border border-violet-500/20">
                  <div className="text-[9px] text-violet-400 uppercase font-semibold tracking-wide mb-0.5">
                    Objectif du jour
                  </div>
                  <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                    {todayEntry.mainGoal}
                  </p>
                </div>
              )}
              
              <div className="p-2 bg-white/5 rounded-lg">
                <div className="text-[9px] text-zinc-500 uppercase font-semibold tracking-wide mb-0.5">
                  Réflexion
                </div>
                <p className="text-xs text-zinc-400 line-clamp-4 leading-relaxed">
                  {todayEntry.reflection}
                </p>
              </div>

              {/* Mood et gratitude si présents */}
              <div className="flex gap-1.5">
                {todayEntry.mood && (
                  <div className="flex-1 p-1.5 bg-white/5 rounded text-center">
                    <div className="text-lg">{todayEntry.mood}</div>
                  </div>
                )}
                {todayEntry.gratitude && todayEntry.gratitude.length > 0 && (
                  <div className="flex-1 p-1.5 bg-white/5 rounded text-center">
                    <div className="text-[9px] text-emerald-400 font-semibold">{todayEntry.gratitude.length} gratitudes</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="text-3xl mb-2">📝</div>
              <div className="text-xs text-zinc-500 px-4">
                Prends un moment pour écrire
              </div>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-white/10">
          <div className="text-center p-1.5 gradient-border-violet rounded">
            <div className="text-sm font-bold text-white tabular-nums">{stats.totalEntries}</div>
            <div className="text-[9px] text-zinc-600">Entrées</div>
          </div>
          <div className="text-center p-1.5 gradient-border-amber rounded">
            <div className="text-sm font-bold text-amber-400 tabular-nums">{stats.favoriteCount}</div>
            <div className="text-[9px] text-zinc-600">Favoris</div>
          </div>
          <div className="text-center p-1.5 gradient-border-amber rounded">
            <div className="text-sm font-bold text-orange-400 tabular-nums">{stats.currentStreak}</div>
            <div className="text-[9px] text-zinc-600">Streak</div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  )
})
