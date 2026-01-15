/**
 * 📖 JournalHistoryModal — Historique complet du journal
 * 
 * Philosophie : Simple, accessible, transparent
 * Pas de magie, juste une liste chronologique
 */

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Heart, Search, Trash2, X, Lock, Loader2, Download, Eye, BookOpen, Lightbulb, Trophy, Printer } from 'lucide-react'
import { JournalEntry } from '../../types/journal'
import { formatRelativeDate, isEntryEditable } from '../../utils/journalUtils'
import { exportJournal, exportJournalForPrint } from '../../utils/journalExport'
import { Modal } from '../ui/Modal'
import { ConfirmDialog } from '../ui/ConfirmDialog'
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
  const { searchQuery, setSearchQuery, filterMode, setFilterMode, filteredEntries, isSearching } = useJournalSearch(entries, currentMonth)

  // État pour la confirmation de suppression
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  // État pour le mode lecture
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null)

  const handleSelectEntry = (entry: JournalEntry) => {
    const editable = isEntryEditable(entry.date)
    if (editable) {
      // Mode édition : ouvrir dans l'éditeur
      onSelectEntry(entry)
      onClose()
    } else {
      // Mode lecture : afficher dans le modal
      setViewingEntry(entry)
    }
  }

  const handleDeleteEntry = (entryId: string) => {
    setDeleteConfirmId(entryId)
  }

  const confirmDelete = () => {
    if (deleteConfirmId && onDeleteEntry) {
      onDeleteEntry(deleteConfirmId)
      setDeleteConfirmId(null)
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportJournalForPrint(entries)}
              className="p-2 rounded-lg text-zinc-500 hover:text-amber-400 hover:bg-zinc-800 transition-colors"
              title="Imprimer / Exporter PDF"
              aria-label="Imprimer le journal"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={() => exportJournal(entries, 'markdown')}
              className="p-2 rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800 transition-colors"
              title="Exporter en Markdown"
              aria-label="Exporter le journal"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Recherche et filtres */}
        <div className="px-6 py-3 border-b border-zinc-800/50 space-y-3">
          {/* Barre de recherche */}
          <div className="relative">
            {isSearching ? (
              <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            )}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans vos entrées..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
              aria-label="Rechercher dans le journal"
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
                    className={`w-full flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border transition-all group text-left ${
                      editable
                        ? 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 cursor-pointer'
                        : 'border-zinc-800/50 hover:border-zinc-700/50 hover:bg-zinc-800/30 cursor-pointer'
                    }`}
                    title={editable ? 'Cliquer pour éditer' : 'Cliquer pour lire'}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Mood emoji */}
                      <span className="text-2xl flex-shrink-0">{entry.moodEmoji || '🙂'}</span>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium line-clamp-1 ${editable ? 'text-zinc-200' : 'text-zinc-400'}`}>
                            {entry.intention || entry.mainGoal || 'Sans titre'}
                          </p>
                          {!editable && (
                            <Eye className="w-3 h-3 text-zinc-600 flex-shrink-0" />
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

      {/* Confirmation de suppression */}
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDelete}
        title="Supprimer cette entrée ?"
        message="Cette action supprimera définitivement cette entrée de journal. Vous pourrez annuler pendant quelques secondes."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
      />

      {/* Modal de lecture seule */}
      {viewingEntry && (
        <Modal isOpen={!!viewingEntry} onClose={() => setViewingEntry(null)} size="lg">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{viewingEntry.moodEmoji || '🙂'}</span>
                <div>
                  <h2 className="text-lg font-medium text-zinc-100">
                    {new Date(viewingEntry.date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Lock className="w-3 h-3 text-zinc-500" />
                    <span className="text-sm text-zinc-500">Lecture seule</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingEntry(null)}
                className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenu principal */}
            <div className="space-y-4">
              {(viewingEntry.intention || viewingEntry.mainGoal) && (
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-zinc-400">Réflexion du jour</span>
                  </div>
                  <p className="text-zinc-200 whitespace-pre-wrap leading-relaxed">
                    {viewingEntry.intention || viewingEntry.mainGoal}
                  </p>
                </div>
              )}

              {/* Sections structurées */}
              {viewingEntry.gratitudeText && (
                <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="w-4 h-4 text-rose-400" />
                    <span className="text-sm font-medium text-rose-400">Gratitude</span>
                  </div>
                  <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed text-sm">
                    {viewingEntry.gratitudeText}
                  </p>
                </div>
              )}

              {viewingEntry.learningText && (
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-amber-400">Apprentissage</span>
                  </div>
                  <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed text-sm">
                    {viewingEntry.learningText}
                  </p>
                </div>
              )}

              {viewingEntry.victoryText && (
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-400">Victoire</span>
                  </div>
                  <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed text-sm">
                    {viewingEntry.victoryText}
                  </p>
                </div>
              )}

              {/* Tags */}
              {viewingEntry.tags && viewingEntry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {viewingEntry.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-zinc-800 rounded-full text-xs text-zinc-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Footer avec actions */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <button
                onClick={() => {
                  toggleFavorite(viewingEntry.id)
                  setViewingEntry({ ...viewingEntry, isFavorite: !viewingEntry.isFavorite })
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  viewingEntry.isFavorite
                    ? 'bg-rose-500/10 text-rose-400'
                    : 'bg-zinc-800 text-zinc-400 hover:text-rose-400'
                }`}
              >
                <Heart className={`w-4 h-4 ${viewingEntry.isFavorite ? 'fill-current' : ''}`} />
                {viewingEntry.isFavorite ? 'Favori' : 'Ajouter aux favoris'}
              </button>
              <button
                onClick={() => setViewingEntry(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  )
}











