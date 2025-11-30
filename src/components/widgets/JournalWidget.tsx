import { BookOpen, TrendingUp, Calendar, Star } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'
import { getTodayEntry, calculateJournalStats } from '../../utils/journalUtils'
import { useMemo } from 'react'

interface JournalWidgetProps {
  widget: Widget
}

export function JournalWidget({ widget }: JournalWidgetProps) {
  const { setView, journalEntries } = useStore()
  
  const todayEntry = getTodayEntry(journalEntries)
  const stats = useMemo(() => calculateJournalStats(journalEntries), [journalEntries])
  const recentEntries = journalEntries.slice(-5).reverse()

  if (widget.size === 'small') {
    return (
      <WidgetContainer widget={widget} onClick={() => setView('journal')}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-white">Journal</span>
          </div>
          {todayEntry && (
            <span className="text-2xl">{todayEntry.moodEmoji}</span>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="text-xs text-mars-500">Série</p>
              <p className="text-lg font-bold text-white">{stats.currentStreak}j</p>
            </div>
          </div>
        </div>
      </WidgetContainer>
    )
  }

  if (widget.size === 'medium') {
    return (
      <WidgetContainer widget={widget} onClick={() => setView('journal')}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <span className="font-medium text-white">Journal</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setView('journal')
            }}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            Écrire →
          </button>
        </div>

        {/* Today's Entry */}
        {todayEntry ? (
          <div className="bg-mars-800/30 rounded-2xl p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{todayEntry.moodEmoji}</span>
              <span className="text-sm text-white font-medium">Aujourd'hui</span>
            </div>
            <p className="text-xs text-mars-300 line-clamp-2">{todayEntry.reflection}</p>
          </div>
        ) : (
          <div className="bg-mars-800/30 rounded-2xl p-3 mb-4 text-center">
            <p className="text-sm text-mars-400">Pas encore d'entrée aujourd'hui</p>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setView('journal')
              }}
              className="text-xs text-purple-400 hover:text-purple-300 mt-2"
            >
              Commencer à écrire
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-mars-800/30 rounded-xl p-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🔥</span>
              <span className="text-xs text-mars-500">Série</span>
            </div>
            <p className="text-xl font-bold text-white">{stats.currentStreak}j</p>
          </div>
          <div className="bg-mars-800/30 rounded-xl p-2">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-mars-500">Entrées</span>
            </div>
            <p className="text-xl font-bold text-white">{stats.totalEntries}</p>
          </div>
        </div>
      </WidgetContainer>
    )
  }

  // Large size
  return (
    <WidgetContainer widget={widget} onClick={() => setView('journal')}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-400" />
          <span className="font-medium text-white">Journal Quotidien</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setView('journal')
          }}
          className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
        >
          Voir tout →
        </button>
      </div>

      {/* Today's Entry */}
      {todayEntry ? (
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{todayEntry.moodEmoji}</span>
            <div>
              <p className="text-sm font-medium text-white">Aujourd'hui</p>
              <p className="text-xs text-mars-400">{new Date().toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
          {todayEntry.mainGoal && (
            <div className="mb-2">
              <span className="text-xs text-blue-400">🎯 Objectif: </span>
              <span className="text-sm text-white">{todayEntry.mainGoal}</span>
            </div>
          )}
          <p className="text-sm text-mars-300 line-clamp-3">{todayEntry.reflection}</p>
        </div>
      ) : (
        <div className="bg-mars-800/30 rounded-2xl p-4 mb-4 text-center">
          <BookOpen className="w-12 h-12 text-mars-600 mx-auto mb-2" />
          <p className="text-sm text-mars-400 mb-3">Pas encore d'entrée aujourd'hui</p>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setView('journal')
            }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-4 py-2 rounded-xl hover:shadow-lg transition-all"
          >
            Commencer à écrire
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-mars-800/30 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🔥</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.currentStreak}</p>
          <p className="text-xs text-mars-500">jours de série</p>
        </div>
        <div className="bg-mars-800/30 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalEntries}</p>
          <p className="text-xs text-mars-500">entrées</p>
        </div>
        <div className="bg-mars-800/30 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.favoriteCount}</p>
          <p className="text-xs text-mars-500">favoris</p>
        </div>
      </div>

      {/* Recent Entries */}
      <div>
        <h3 className="text-xs font-medium text-mars-400 mb-2">Entrées récentes</h3>
        <div className="space-y-2">
          {recentEntries.slice(0, 3).map((entry) => (
            <div
              key={entry.id}
              className="bg-mars-800/30 rounded-xl p-2 hover:bg-mars-800/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{entry.moodEmoji}</span>
                <span className="text-xs text-mars-400">{new Date(entry.date).toLocaleDateString('fr-FR')}</span>
                {entry.isFavorite && <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />}
              </div>
              <p className="text-xs text-mars-300 line-clamp-1">{entry.reflection}</p>
            </div>
          ))}
        </div>
      </div>
    </WidgetContainer>
  )
}
