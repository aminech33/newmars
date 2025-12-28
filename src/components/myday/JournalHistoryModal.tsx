/**
 * 📖 JournalHistoryModal — Historique complet du journal
 * 
 * Philosophie : Simple, accessible, transparent
 * Pas de magie, juste une liste chronologique
 */

import { useState, useMemo } from 'react'
import { X, ChevronLeft, ChevronRight, Heart } from 'lucide-react'
import { JournalEntry } from '../../types/journal'
import { formatRelativeDate } from '../../utils/journalUtils'

interface JournalHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  entries: JournalEntry[]
  onSelectEntry: (entry: JournalEntry) => void
  toggleFavorite: (id: string) => void
}

export function JournalHistoryModal({
  isOpen,
  onClose,
  entries,
  onSelectEntry,
  toggleFavorite
}: JournalHistoryModalProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Grouper les entrées par mois
  const entriesByMonth = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    return entries.filter(entry => {
      const entryDate = new Date(entry.date)
      return entryDate.getFullYear() === year && entryDate.getMonth() === month
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [entries, currentMonth])

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))
  }

  const handleSelectEntry = (entry: JournalEntry) => {
    onSelectEntry(entry)
    onClose()
  }

  const monthName = currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const formattedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1)

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-medium text-zinc-100">Historique du journal</h2>
            <p className="text-sm text-zinc-500">{entries.length} entrée{entries.length > 1 ? 's' : ''} au total</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation mensuelle */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800/50 bg-zinc-900/50">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-zinc-300">{formattedMonth}</span>
          <button
            onClick={handleNextMonth}
            disabled={currentMonth >= new Date()}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Liste des entrées */}
        <div className="max-h-[500px] overflow-y-auto p-6">
          {entriesByMonth.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-zinc-500 text-sm">Aucune entrée pour ce mois</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entriesByMonth.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => handleSelectEntry(entry)}
                  className="w-full flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all group text-left"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Mood emoji */}
                    <span className="text-2xl flex-shrink-0">{entry.moodEmoji || '🙂'}</span>
                    
                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 line-clamp-1">
                        {entry.intention || entry.mainGoal || 'Sans titre'}
                      </p>
                      {entry.freeNotes && (
                        <p className="text-xs text-zinc-500 line-clamp-1 mt-1">
                          {entry.freeNotes}
                        </p>
                      )}
                      <p className="text-xs text-zinc-600 mt-1">
                        {formatRelativeDate(entry.date)}
                      </p>
                    </div>
                  </div>

                  {/* Favori */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(entry.id)
                    }}
                    className="flex-shrink-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Heart 
                      className={`w-4 h-4 ${
                        entry.isFavorite 
                          ? 'fill-rose-400 text-rose-400' 
                          : 'text-zinc-600 hover:text-rose-400'
                      }`} 
                    />
                  </button>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
          <p className="text-xs text-zinc-500 text-center">
            Cliquez sur une entrée pour la charger et la modifier
          </p>
        </div>
      </div>
    </div>
  )
}









