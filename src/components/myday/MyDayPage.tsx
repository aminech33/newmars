/**
 * 📅 MyDayPage - Page Ma Journée
 *
 * Journal quotidien + rituels/habitudes
 * (Santé déplacée dans page indépendante HealthPage)
 */

import { useState, useMemo, useCallback } from 'react'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { moodEmojiToLevel, getTodayEntry } from '../../utils/journalUtils'
import { AddHabitModal } from '../habits/AddHabitModal'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { useHabitsStats } from '../../hooks/useGlobalStats'
import { JournalHistoryModal } from './JournalHistoryModal'
import { UndoToast } from '../ui/UndoToast'
import { useJournalEntry } from '../../hooks/useJournalEntry'
import { useAutoSave } from '../../hooks/useAutoSave'

// Composants extraits
import { JournalTab } from './JournalTab'

export function MyDayPage() {
  const {
    setView,
    habits,
    addHabit,
    toggleHabitToday,
    deleteHabit,
    journalEntries,
    addJournalEntry,
    updateJournalEntry,
    toggleJournalFavorite,
    deleteJournalEntry,
    addToast,
    tasks
  } = useStore()

  const pomodoroSessions = useStore(state => state.pomodoroSessions || [])

  // Journal states
  const [showAddHabitModal, setShowAddHabitModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  const today = useMemo(() => new Date().toISOString().split('T')[0], [])
  const todayEntry = getTodayEntry(journalEntries)

  const habitsStats = useHabitsStats()

  // Hook personnalisé pour gérer l'entrée de journal
  const {
    intention, setIntention,
    mood, setMood,
    tags, setTags,
    gratitudeText, setGratitudeText,
    learningText, setLearningText,
    victoryText, setVictoryText,
    canSave, hasChanges
  } = useJournalEntry(todayEntry)

  // Timestamp de dernière sauvegarde (pour l'indicateur auto-save)
  const [lastSavedAt, setLastSavedAt] = useState<number | undefined>(undefined)

  const handleSave = useCallback(() => {
    if (!canSave) return
    setIsSaving(true)

    const entryData = {
      date: today,
      intention: intention.trim(),
      mood: moodEmojiToLevel(mood),
      moodEmoji: mood,
      mainGoal: intention.trim(),
      reflection: intention.trim(),
      tags,
      // Sections structurées
      gratitudeText: gratitudeText.trim() || undefined,
      learningText: learningText.trim() || undefined,
      victoryText: victoryText.trim() || undefined,
    }

    if (todayEntry) {
      updateJournalEntry(todayEntry.id, entryData)
      addToast('Journal mis à jour', 'success')
    } else {
      addJournalEntry(entryData)
      addToast('Entrée sauvegardée', 'success')
    }
    setIsSaving(false)
    setLastSavedAt(Date.now())
  }, [intention, mood, tags, gratitudeText, learningText, victoryText, today, todayEntry, canSave, addJournalEntry, updateJournalEntry, addToast])

  // Auto-save avec hook personnalisé
  useAutoSave(handleSave, [intention, mood], hasChanges && canSave, 3000)

  const handleToggleHabit = (habitId: string) => {
    toggleHabitToday(habitId)
    const habit = habits.find(h => h.id === habitId)
    const isCompleting = !habit?.completedDates.includes(today)
    if (isCompleting) addToast(`${habit?.name} accompli`, 'success')
  }

  const handleDeleteHabit = () => {
    if (confirmDelete) {
      deleteHabit(confirmDelete)
      addToast('Habitude supprimée', 'info')
      setConfirmDelete(null)
    }
  }

  const handleAddHabit = (name: string) => {
    if (name.trim()) {
      addHabit(name.trim())
      addToast('Nouvelle habitude créée', 'success')
      setShowAddHabitModal(false)
    }
  }

  const handleSelectHistoryEntry = (entry: typeof journalEntries[0]) => {
    setIntention(entry.intention || entry.mainGoal || '')
    setMood(entry.moodEmoji || '🙂')
    addToast('Entrée chargée', 'info')
  }

  // Undo pour suppression d'entrée de journal
  const [deletedJournalEntry, setDeletedJournalEntry] = useState<typeof journalEntries[0] | null>(null)
  const [showJournalUndo, setShowJournalUndo] = useState(false)

  const handleDeleteJournalEntry = (id: string) => {
    const entry = journalEntries.find(e => e.id === id)
    if (entry) {
      setDeletedJournalEntry(entry)
      deleteJournalEntry(id)
      setShowJournalUndo(true)
      setTimeout(() => {
        setShowJournalUndo(false)
        setDeletedJournalEntry(null)
      }, 5000)
    }
  }

  const handleUndoJournalDelete = () => {
    if (deletedJournalEntry) {
      addJournalEntry(deletedJournalEntry)
      setShowJournalUndo(false)
      setDeletedJournalEntry(null)
      addToast('Entrée restaurée', 'success')
    }
  }

  const { todayCompleted } = habitsStats

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-black">
      {/* Header */}
      <header className="flex items-center justify-between h-14 px-6 border-b border-zinc-800/40 bg-zinc-900/25 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setView('hub')}
            className="p-2 -ml-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-xl transition-all duration-150"
          >
            <ArrowLeft className="w-[18px] h-[18px]" />
          </button>
          <h1 className="font-serif text-base font-semibold text-zinc-100 tracking-tight">
            Ma Journée
          </h1>
        </div>

        {/* Streak badge */}
        {habitsStats.globalStreak > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-medium text-amber-300">{habitsStats.globalStreak} jours</span>
          </div>
        )}
      </header>

      {/* Content */}
      <div className="relative flex-1 overflow-y-auto">
        <JournalTab
          intention={intention}
          setIntention={setIntention}
          mood={mood}
          setMood={setMood}
          tags={tags}
          setTags={setTags}
          gratitudeText={gratitudeText}
          setGratitudeText={setGratitudeText}
          learningText={learningText}
          setLearningText={setLearningText}
          victoryText={victoryText}
          setVictoryText={setVictoryText}
          handleSave={handleSave}
          canSave={canSave}
          isSaving={isSaving}
          hasChanges={hasChanges}
          setShowHistoryModal={setShowHistoryModal}
          lastSavedAt={lastSavedAt}
          habits={habits}
          tasks={tasks}
          today={today}
          todayCompleted={todayCompleted}
          pomodoroSessions={pomodoroSessions}
          handleToggleHabit={handleToggleHabit}
          setShowAddHabitModal={setShowAddHabitModal}
        />
      </div>

      {/* Modals */}
      <AddHabitModal
        isOpen={showAddHabitModal}
        onClose={() => setShowAddHabitModal(false)}
        onAdd={handleAddHabit}
      />

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDeleteHabit}
        title="Supprimer le rituel ?"
        message="Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="warning"
      />

      <JournalHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        entries={journalEntries}
        onSelectEntry={handleSelectHistoryEntry}
        toggleFavorite={toggleJournalFavorite}
        onDeleteEntry={handleDeleteJournalEntry}
      />

      {/* Toast Undo pour suppression de journal */}
      {showJournalUndo && deletedJournalEntry && (
        <UndoToast
          message={`Entrée du ${new Date(deletedJournalEntry.date).toLocaleDateString('fr-FR')} supprimée`}
          onUndo={handleUndoJournalDelete}
          onClose={() => setShowJournalUndo(false)}
          isVisible={showJournalUndo}
        />
      )}
    </div>
  )
}
