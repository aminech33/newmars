/**
 * 📖 JournalHistoryModal — Historique complet du journal
 * 
 * Philosophie : Simple, accessible, transparent
 * Pas de magie, juste une liste chronologique
 */

import { ChevronLeft, ChevronRight, Heart, Search, Trash2, X, Lock } from 'lucide-react'
import { JournalEntry } from '../../types/journal'
import { formatRelativeDate, isEntryEditable } from '../../utils/journalUtils'
import { Modal } from '../ui/Modal'
import { useMonthNavigation } from '../../hooks/useMonthNavigation'
import { useJournalSearch } from '../../hooks/useJournalSearch'

interface JournalHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  entries: JournalEntry[]
  onSelectEntry: (entry: JournalEntry) => void
  toggleFavorite: (id: string) => void
  onDeleteEntry?: (id: string) => void
}

export function JournalHistoryModal({
  isOpen,
  onClose,
  entries,
  onSelectEntry,
  toggleFavorite,
  onDeleteEntry
}: JournalHistoryModalProps) {
  // Hooks personnalisés
  const { currentMonth, formattedMonth, handlePrevMonth, handleNextMonth, handleToday } = useMonthNavigation()
  const { searchQuery, setSearchQuery, filterMode, setFilterMode, filteredEntries } = useJournalSearch(entries, currentMonth)

  const handleSelectEntry = (entry: JournalEntry) => {
    // Vérifier si l'entrée est éditable
    if (!isEntryEditable(entry.date)) {
      return // Bloqué si plus de 24h
    }
    onSelectEntry(entry)
    onClose()
  }

  const handleDeleteEntry = (entryId: string) => {
    if (onDeleteEntry && confirm('Supprimer cette entrée ?')) {
      onDeleteEntry(entryId)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
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

        {/* Recherche et filtres */}
        <div className="px-6 py-3 border-b border-zinc-800/50 space-y-3">
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans vos entrées..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
            />
          </div>

          {/* Filtres */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterMode === 'all'
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              Tous ({entries.length})
            </button>
            <button
              onClick={() => setFilterMode('favorites')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                filterMode === 'favorites'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <Heart className="w-3 h-3" />
              Favoris ({entries.filter(e => e.isFavorite).length})
            </button>
          </div>
        </div>

        {/* Navigation mensuelle */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800/50 bg-zinc-900/50">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="Mois précédent"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-300">{formattedMonth}</span>
            <button
              onClick={handleToday}
              className="px-2 py-1 text-xs text-zinc-500 hover:text-amber-400 hover:bg-zinc-800 rounded transition-colors"
              title="Revenir au mois actuel"
            >
              Aujourd'hui
            </button>
          </div>
          <button
            onClick={handleNextMonth}
            disabled={currentMonth >= new Date()}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Mois suivant"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Liste des entrées */}
        <div className="max-h-[500px] overflow-y-auto px-6 pb-6">
          {filteredEntries.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-zinc-500 text-sm">Aucune entrée pour ce mois</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((entry) => {
                const editable = isEntryEditable(entry.date)
                return (
                  <button
                    key={entry.id}
                    onClick={() => handleSelectEntry(entry)}
                    disabled={!editable}
                    className={`w-full flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border transition-all group text-left ${
                      editable 
                        ? 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 cursor-pointer' 
                        : 'border-zinc-800/50 opacity-60 cursor-not-allowed'
                    }`}
                    title={editable ? 'Cliquer pour éditer' : 'Lecture seule (plus de 24h)'}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Mood emoji */}
                      <span className="text-2xl flex-shrink-0">{entry.moodEmoji || '🙂'}</span>
                      
                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-zinc-200 line-clamp-1">
                            {entry.intention || entry.mainGoal || 'Sans titre'}
                          </p>
                          {!editable && (
                            <Lock className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                          )}
                        </div>
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

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                    {/* Favori */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(entry.id)
                      }}
                      className={`flex-shrink-0 p-2 transition-opacity ${
                        entry.isFavorite ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'
                      }`}
                      title={entry.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    >
                      <Heart 
                        className={`w-4 h-4 transition-colors ${
                          entry.isFavorite 
                            ? 'fill-rose-400 text-rose-400' 
                            : 'text-zinc-600 hover:text-rose-400'
                        }`} 
                      />
                    </button>

                    {/* Supprimer */}
                    {onDeleteEntry && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteEntry(entry.id)
                        }}
                        className="flex-shrink-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Supprimer cette entrée"
                      >
                        <Trash2 className="w-4 h-4 text-zinc-600 hover:text-rose-400 transition-colors" />
                      </button>
                    )}
                  </div>
                </button>
              )})}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
          <p className="text-xs text-zinc-500 text-center">
            Éditable : aujourd'hui et hier • 🔒 Lecture seule après 24h
          </p>
        </div>
      </div>
    </Modal>
  )
}











