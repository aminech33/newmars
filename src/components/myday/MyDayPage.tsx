import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { 
  ArrowLeft, 
  Flame, 
  Check, 
  Target,
  Zap,
  Save,
  Star,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { MoodEmoji } from '../../types/journal'
import { 
  moodEmojiToLevel,
  getTodayEntry,
  formatRelativeDate
} from '../../utils/journalUtils'
import { AddHabitModal } from '../habits/AddHabitModal'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { useHabitsStats, useJournalStats } from '../../hooks/useGlobalStats'

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
    addToast,
    tasks,
    getPriorityTask
  } = useStore()

  const [showAddHabitModal, setShowAddHabitModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showStats, setShowStats] = useState(false)

  const today = useMemo(() => new Date().toISOString().split('T')[0], [])
  const todayEntry = getTodayEntry(journalEntries)

  const habitsStats = useHabitsStats()
  const journalStats = useJournalStats()

  // ✨ NOUVEAUX ÉTATS SIMPLIFIÉS
  const [intention, setIntention] = useState('')
  const [action, setAction] = useState('')
  const [mood, setMood] = useState<MoodEmoji>('🙂')
  const [freeNotes, setFreeNotes] = useState('')

  // Sync avec todayEntry
  useEffect(() => {
    if (todayEntry) {
      setIntention(todayEntry.intention || todayEntry.mainGoal || '')
      setAction(todayEntry.action || '')
      setMood(todayEntry.moodEmoji || '🙂')
      setFreeNotes(todayEntry.freeNotes || todayEntry.reflection || '')
    }
  }, [todayEntry?.id])

  // Validation simplifiée
  const canSave = intention.trim().length > 0
  const hasChanges = useMemo(() => {
    if (!todayEntry) return intention.trim().length > 0
    return (
      intention !== (todayEntry.intention || todayEntry.mainGoal || '') ||
      action !== (todayEntry.action || '') ||
      mood !== (todayEntry.moodEmoji || '🙂') ||
      freeNotes !== (todayEntry.freeNotes || todayEntry.reflection || '')
    )
  }, [intention, action, mood, freeNotes, todayEntry])

  const handleSave = useCallback(() => {
    if (!canSave) return

    setIsSaving(true)
    
    const entryData = {
      date: today,
      intention: intention.trim(),
      action: action.trim() || undefined,
      mood: moodEmojiToLevel(mood),
      moodEmoji: mood,
      freeNotes: freeNotes.trim() || undefined,
      // Legacy support
      mainGoal: intention.trim(),
      reflection: freeNotes.trim() || intention.trim(),
    }

    if (todayEntry) {
      updateJournalEntry(todayEntry.id, entryData)
      addToast('Mis à jour 💾', 'success')
    } else {
      addJournalEntry(entryData)
      addToast('Sauvegardé ✨', 'success')
    }

    setIsSaving(false)
  }, [intention, action, mood, freeNotes, today, todayEntry, canSave, addJournalEntry, updateJournalEntry, addToast])

  // Auto-save
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    if (!hasChanges || !canSave) return

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)

    autoSaveTimerRef.current = setTimeout(() => {
      handleSave()
    }, 3000)

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [intention, action, mood, freeNotes, hasChanges, canSave, handleSave])

  const handleToggleHabit = (habitId: string) => {
    toggleHabitToday(habitId)
    const habit = habits.find(h => h.id === habitId)
    const isCompleting = !habit?.completedDates.includes(today)
    if (isCompleting) addToast(`${habit?.name} ✓`, 'success')
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
      addToast('Habitude créée 🔥', 'success')
      setShowAddHabitModal(false)
    }
  }

  const moods: MoodEmoji[] = ['😢', '😐', '🙂', '😊', '🤩']

  // Obtenir la tâche prioritaire ou la première tâche
  const priorityTask = getPriorityTask()
  const firstTask = priorityTask || tasks.filter(t => !t.completed)[0]

  // Date formatée
  const formattedDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })

  // Stats pour section pliable
  const { todayCompleted } = habitsStats

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-900 to-black">
      {/* Header minimaliste */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-zinc-800/30">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('hub')}
              className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-400" />
            </button>
            <div>
              <h1 className="text-xl font-medium text-white">Ma Journée</h1>
              <p className="text-xs text-zinc-500 capitalize">{formattedDate}</p>
            </div>
          </div>

          {habitsStats.globalStreak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-sm font-bold text-amber-200">{habitsStats.globalStreak}</span>
            </div>
          )}
        </div>
      </div>

      {/* Contenu principal - Centré et aéré */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
          
          {/* ✨ INTENTION UNIQUE - Prioritaire */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              <h2 className="text-sm font-medium text-zinc-400">Qu'est-ce qui compte aujourd'hui ?</h2>
            </div>
            <input
              type="text"
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="Mon intention du jour..."
              className="w-full bg-white/[0.03] border-2 border-white/10 focus:border-purple-500/50 rounded-2xl px-6 py-4 text-[18px] text-white placeholder-zinc-600 focus:outline-none transition-all leading-relaxed"
              autoFocus
            />
          </div>

          {/* 🎯 ACTION CONCRÈTE */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-medium text-zinc-400">Action concrète</h2>
            </div>
            
            {/* Suggestion de tâche prioritaire */}
            {firstTask && !action && (
              <button
                onClick={() => setAction(firstTask.title)}
                className="w-full text-left p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/10 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                    {firstTask.title}
                  </span>
                  {priorityTask && (
                    <span className="ml-auto text-xs text-emerald-400">Prioritaire</span>
                  )}
                </div>
              </button>
            )}

            <input
              type="text"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="Une tâche, une habitude, ou une action libre..."
              className="w-full bg-white/[0.03] border border-white/10 focus:border-emerald-500/50 rounded-xl px-5 py-3.5 text-[15px] text-white placeholder-zinc-600 focus:outline-none transition-all"
            />
          </div>

          {/* Habitudes - Compactes */}
          {habits.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <h2 className="text-sm font-medium text-zinc-400">Habitudes</h2>
                  <span className="text-xs text-zinc-600">{todayCompleted}/{habits.length}</span>
                </div>
                <button
                  onClick={() => setShowAddHabitModal(true)}
                  className="text-xs text-zinc-500 hover:text-white transition-colors"
                >
                  + Ajouter
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {habits.map((habit) => {
                  const isCompleted = habit.completedDates.includes(today)
                  return (
                    <button
                      key={habit.id}
                      onClick={() => handleToggleHabit(habit.id)}
                      className={`flex items-center gap-2 p-3 rounded-xl transition-all ${
                        isCompleted 
                          ? 'bg-amber-500/10 border border-amber-500/30' 
                          : 'bg-white/[0.03] border border-white/10 hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCompleted ? 'bg-amber-500 text-white' : 'border border-zinc-700'
                      }`}>
                        {isCompleted && <Check className="w-2.5 h-2.5" />}
                      </div>
                      <span className={`text-sm truncate ${isCompleted ? 'text-amber-200' : 'text-zinc-300'}`}>
                        {habit.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {habits.length === 0 && (
            <button
              onClick={() => setShowAddHabitModal(true)}
              className="w-full p-4 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-zinc-500 hover:text-white hover:bg-white/[0.05] transition-all"
            >
              + Créer une habitude
            </button>
          )}

          {/* Notes libres - Optionnel, visuellement atténué */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-500">Notes (optionnel)</span>
            </div>
            <textarea
              value={freeNotes}
              onChange={(e) => setFreeNotes(e.target.value)}
              placeholder="Pensées, gratitudes, apprentissages..."
              rows={4}
              className="w-full bg-white/[0.02] border border-white/5 focus:border-white/10 rounded-xl px-5 py-3.5 text-sm text-zinc-400 placeholder-zinc-700 focus:outline-none transition-all resize-none"
            />
          </div>

          {/* Mood - Subtil */}
          <div className="flex items-center justify-center gap-3 py-2">
            {moods.map((m) => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`text-2xl transition-all ${
                  mood === m ? 'scale-110' : 'opacity-30 hover:opacity-70 hover:scale-105'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Bouton Sauvegarder */}
          <button
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className={`w-full py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-medium ${
              canSave && !isSaving
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90'
                : 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Sauvegarde...' : hasChanges ? <><Save className="w-4 h-4" /> Sauvegarder</> : '✓ Sauvegardé'}
          </button>

          {/* Stats - Pliables, atténuées */}
          <div className="border-t border-zinc-800/30 pt-6">
            <button
              onClick={() => setShowStats(!showStats)}
              className="w-full flex items-center justify-between text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              <span>Statistiques & historique</span>
              {showStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showStats && (
              <div className="mt-4 space-y-3 animate-in fade-in duration-200">
                {/* Mini stats */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-white/[0.02] rounded-lg p-3 text-center border border-white/5">
                    <div className="text-xl mb-1">🔥</div>
                    <div className="text-lg font-bold text-zinc-400">{journalStats.currentStreak}</div>
                    <div className="text-[10px] text-zinc-600">streak</div>
                  </div>
                  <div className="bg-white/[0.02] rounded-lg p-3 text-center border border-white/5">
                    <div className="text-xl mb-1">{mood}</div>
                    <div className="text-lg font-bold text-zinc-400">{journalStats.averageMood.toFixed(1)}</div>
                    <div className="text-[10px] text-zinc-600">humeur</div>
                  </div>
                  <div className="bg-white/[0.02] rounded-lg p-3 text-center border border-white/5">
                    <div className="text-lg font-bold text-zinc-400">{journalStats.totalEntries}</div>
                    <div className="text-[10px] text-zinc-600">entrées</div>
                  </div>
                  <div className="bg-white/[0.02] rounded-lg p-3 text-center border border-white/5">
                    <div className="text-lg font-bold text-zinc-400">{habits.length}</div>
                    <div className="text-[10px] text-zinc-600">habitudes</div>
                  </div>
                </div>

                {/* Historique récent */}
                <div className="space-y-2">
                  <h3 className="text-xs text-zinc-600">Dernières entrées</h3>
                  {journalEntries.slice(-5).reverse().map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-2 bg-white/[0.02] rounded-lg border border-white/5 hover:border-white/10 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{entry.moodEmoji}</span>
                        <span className="text-xs text-zinc-500">{formatRelativeDate(entry.date)}</span>
                      </div>
                      <button onClick={() => toggleJournalFavorite(entry.id)} className="opacity-0 group-hover:opacity-100">
                        <Star className={`w-3 h-3 ${entry.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-700'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
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
        title="Supprimer l'habitude ?"
        message="Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="warning"
      />
    </div>
  )
}
