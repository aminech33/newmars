import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { 
  ArrowLeft, 
  Feather, 
  Check, 
  Sun,
  Sparkles,
  BookOpen,
  Heart,
  Plus,
  ChevronDown,
  ChevronUp,
  Apple,
  Scale,
  Utensils
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
import { useHealthData } from '../../hooks/useHealthData'

// Health components
import { WeightChart } from '../health/WeightChart'
import { WeightList } from '../health/WeightList'
import { MealList } from '../health/MealList'
import { WeightModal } from '../health/WeightModal'
import { MealModal } from '../health/MealModal'
import { MacrosCircularChart } from '../health/MacrosCircularChart'
import { UndoToast } from '../ui/UndoToast'

type PageTab = 'journal' | 'nutrition' | 'weight'

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

  // Tab state
  const [activeTab, setActiveTab] = useState<PageTab>('journal')

  // Journal states
  const [showAddHabitModal, setShowAddHabitModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showStats, setShowStats] = useState(false)

  // Health data
  const {
    trend,
    todayCalories,
    targetCalories,
    filteredWeightEntries,
    filteredMealEntries,
    weightEntries,
    mealEntries,
    handleAddWeight,
    handleAddMeal,
    deleteWeightEntry,
    deleteMealEntry
  } = useHealthData()

  // Health modal states
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [showMealModal, setShowMealModal] = useState(false)
  const [healthDeleteConfirm, setHealthDeleteConfirm] = useState<{ type: 'weight' | 'meal'; id: string } | null>(null)
  const [undoData, setUndoData] = useState<{ type: 'weight' | 'meal'; data: any } | null>(null)
  const [showUndo, setShowUndo] = useState(false)

  const today = useMemo(() => new Date().toISOString().split('T')[0], [])
  const todayEntry = getTodayEntry(journalEntries)
  const todayMeals = useMemo(() => filteredMealEntries.filter(m => m.date === today), [filteredMealEntries, today])

  const todayMacros = useMemo(() => ({
    protein: todayMeals.reduce((sum, m) => sum + (m.protein || 0), 0),
    carbs: todayMeals.reduce((sum, m) => sum + (m.carbs || 0), 0),
    fat: todayMeals.reduce((sum, m) => sum + (m.fat || 0), 0)
  }), [todayMeals])

  const habitsStats = useHabitsStats()
  const journalStats = useJournalStats()

  // Journal states
  const [intention, setIntention] = useState('')
  const [action, setAction] = useState('')
  const [mood, setMood] = useState<MoodEmoji>('🙂')
  const [freeNotes, setFreeNotes] = useState('')

  useEffect(() => {
    if (todayEntry) {
      setIntention(todayEntry.intention || todayEntry.mainGoal || '')
      setAction(todayEntry.action || '')
      setMood(todayEntry.moodEmoji || '🙂')
      setFreeNotes(todayEntry.freeNotes || todayEntry.reflection || '')
    }
  }, [todayEntry?.id])

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
      mainGoal: intention.trim(),
      reflection: freeNotes.trim() || intention.trim(),
    }

    if (todayEntry) {
      updateJournalEntry(todayEntry.id, entryData)
      addToast('Journal mis à jour', 'success')
    } else {
      addJournalEntry(entryData)
      addToast('Entrée sauvegardée', 'success')
    }
    setIsSaving(false)
  }, [intention, action, mood, freeNotes, today, todayEntry, canSave, addJournalEntry, updateJournalEntry, addToast])

  // Auto-save
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    if (!hasChanges || !canSave) return
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => handleSave(), 3000)
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current) }
  }, [intention, action, mood, freeNotes, hasChanges, canSave, handleSave])

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

  // Health handlers
  const handleWeightSubmit = useCallback((data: { weight: number; date: string; note?: string }) => {
    const result = handleAddWeight(data)
    if (result.success) addToast('Poids ajouté', 'success')
    return result
  }, [handleAddWeight, addToast])

  const handleMealSubmit = useCallback((data: any) => {
    const result = handleAddMeal(data)
    if (result.success) addToast('Repas ajouté', 'success')
    return result
  }, [handleAddMeal, addToast])

  const handleDeleteWeight = useCallback((id: string) => {
    setHealthDeleteConfirm({ type: 'weight', id })
  }, [])

  const handleDeleteMeal = useCallback((id: string) => {
    setHealthDeleteConfirm({ type: 'meal', id })
  }, [])

  const handleDuplicateMeal = useCallback((meal: any) => {
    const result = handleAddMeal({
      ...meal,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5)
    })
    if (result.success) addToast('Repas dupliqué', 'success')
  }, [handleAddMeal, addToast])

  const confirmHealthDelete = useCallback(() => {
    if (!healthDeleteConfirm) return
    
    if (healthDeleteConfirm.type === 'weight') {
      const entry = filteredWeightEntries.find(e => e.id === healthDeleteConfirm.id)
      if (entry) {
        setUndoData({ type: 'weight', data: entry })
        deleteWeightEntry(healthDeleteConfirm.id)
        setShowUndo(true)
        setTimeout(() => setShowUndo(false), 5000)
      }
    } else {
      const entry = filteredMealEntries.find(e => e.id === healthDeleteConfirm.id)
      if (entry) {
        setUndoData({ type: 'meal', data: entry })
        deleteMealEntry(healthDeleteConfirm.id)
        setShowUndo(true)
        setTimeout(() => setShowUndo(false), 5000)
      }
    }
    setHealthDeleteConfirm(null)
  }, [healthDeleteConfirm, filteredWeightEntries, filteredMealEntries, deleteWeightEntry, deleteMealEntry])

  const handleUndo = useCallback(() => {
    if (!undoData) return
    if (undoData.type === 'weight') handleAddWeight(undoData.data)
    else handleAddMeal(undoData.data)
    setUndoData(null)
    setShowUndo(false)
  }, [undoData, handleAddWeight, handleAddMeal])

  const moods: MoodEmoji[] = ['😢', '😐', '🙂', '😊', '🤩']
  const priorityTask = getPriorityTask()
  const firstTask = priorityTask || tasks.filter(t => !t.completed)[0]

  const formattedDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })

  const { todayCompleted } = habitsStats

  const TABS: { id: PageTab; label: string; icon: typeof Feather }[] = [
    { id: 'journal', label: 'Journal', icon: Feather },
    { id: 'nutrition', label: 'Nutrition', icon: Apple },
    { id: 'weight', label: 'Poids', icon: Scale }
  ]

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-[#0C0A09]">
      {/* Background texture */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(196, 120, 92, 0.08) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(123, 158, 135, 0.06) 0%, transparent 50%)`,
        }}
      />

      {/* Header */}
      <header className="relative flex-shrink-0 px-6 py-4 border-b border-stone-800/50">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('hub')}
              className="p-2 -ml-2 rounded-xl text-stone-500 hover:text-stone-300 hover:bg-stone-800/50 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-serif text-xl font-semibold text-stone-100 tracking-tight">
                Ma Journée
              </h1>
              <p className="text-xs text-stone-500 capitalize">
                {formattedDate}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-stone-900/60 rounded-xl p-1 border border-stone-800/50">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
                    activeTab === tab.id 
                      ? 'bg-stone-800 text-stone-100' 
                      : 'text-stone-500 hover:text-stone-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>

          {habitsStats.globalStreak > 0 && activeTab === 'journal' && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-300">
                {habitsStats.globalStreak}j
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="relative flex-1 overflow-y-auto">
        
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* JOURNAL TAB */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'journal' && (
          <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
            
            {/* INTENTION DU JOUR */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center border border-amber-500/20">
                  <Feather className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-medium text-stone-200">
                    Intention du jour
                  </h2>
                  <p className="text-sm text-stone-500">
                    Qu'est-ce qui compte vraiment aujourd'hui ?
                  </p>
                </div>
              </div>
              
              <input
                type="text"
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                placeholder="Écrire mon intention..."
                className="w-full bg-stone-900/50 border-2 border-stone-800 focus:border-amber-500/40 rounded-xl px-5 py-4 text-lg text-stone-100 placeholder:text-stone-600 focus:outline-none transition-all font-serif italic"
                autoFocus
              />
            </section>

            <div className="h-px bg-gradient-to-r from-transparent via-stone-700/50 to-transparent" />

            {/* ACTION CONCRÈTE */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="font-serif text-lg font-medium text-stone-200">
                  Première action
                </h2>
              </div>
              
              {firstTask && !action && (
                <button
                  onClick={() => setAction(firstTask.title)}
                  className="w-full text-left p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/10 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-stone-400 group-hover:text-stone-200 transition-colors">
                      {firstTask.title}
                    </span>
                    {priorityTask && (
                      <span className="ml-auto text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Prioritaire
                      </span>
                    )}
                  </div>
                </button>
              )}

              <input
                type="text"
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder="Quelle est la première chose à faire ?"
                className="w-full bg-stone-900/50 border border-stone-800 focus:border-emerald-500/40 rounded-xl px-5 py-3.5 text-stone-200 placeholder:text-stone-600 focus:outline-none transition-all"
              />
            </section>

            {/* HABITUDES */}
            {habits.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/10 flex items-center justify-center border border-rose-500/20">
                      <Heart className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                      <h2 className="font-serif text-lg font-medium text-stone-200">
                        Rituels
                      </h2>
                      <p className="text-sm text-stone-500">
                        {todayCompleted}/{habits.length} accomplis
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddHabitModal(true)}
                    className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-amber-400 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {habits.map((habit) => {
                    const isCompleted = habit.completedDates.includes(today)
                    return (
                      <button
                        key={habit.id}
                        onClick={() => handleToggleHabit(habit.id)}
                        className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                          isCompleted 
                            ? 'bg-emerald-500/10 border-2 border-emerald-500/30' 
                            : 'bg-stone-900/50 border border-stone-800 hover:border-stone-700'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          isCompleted ? 'bg-emerald-500 text-white' : 'border-2 border-stone-600'
                        }`}>
                          {isCompleted && <Check className="w-3 h-3" strokeWidth={3} />}
                        </div>
                        <span className={`text-sm font-medium truncate ${
                          isCompleted ? 'text-emerald-300' : 'text-stone-400'
                        }`}>
                          {habit.name}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            )}

            {habits.length === 0 && (
              <button
                onClick={() => setShowAddHabitModal(true)}
                className="w-full p-5 bg-stone-900/30 border-2 border-dashed border-stone-700 rounded-xl text-stone-500 hover:text-amber-400 hover:border-amber-500/30 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Créer un premier rituel</span>
              </button>
            )}

            {/* NOTES LIBRES */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/10 flex items-center justify-center border border-sky-500/20">
                  <BookOpen className="w-5 h-5 text-sky-400" />
                </div>
                <h2 className="font-serif text-lg font-medium text-stone-200">
                  Notes & réflexions
                </h2>
              </div>
              
              <textarea
                value={freeNotes}
                onChange={(e) => setFreeNotes(e.target.value)}
                placeholder="Pensées, gratitudes, apprentissages du jour..."
                rows={4}
                className="w-full bg-stone-900/50 border border-stone-800 focus:border-sky-500/40 rounded-xl px-5 py-4 text-stone-300 placeholder:text-stone-600 focus:outline-none transition-all resize-none font-serif leading-relaxed"
              />
            </section>

            {/* HUMEUR */}
            <section className="text-center py-4">
              <p className="text-sm text-stone-500 mb-4">Comment te sens-tu ?</p>
              <div className="flex items-center justify-center gap-4">
                {moods.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMood(m)}
                    className={`text-3xl transition-all duration-200 ${
                      mood === m 
                        ? 'scale-125 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]' 
                        : 'opacity-40 hover:opacity-80 hover:scale-110 grayscale hover:grayscale-0'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </section>

            {/* Bouton Sauvegarder */}
            <button
              onClick={handleSave}
              disabled={!canSave || isSaving}
              className={`w-full py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-base font-medium ${
                canSave && !isSaving
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-900 shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5'
                  : 'bg-stone-800 text-stone-500 cursor-not-allowed'
              }`}
            >
              {isSaving ? 'Sauvegarde...' : hasChanges ? <><Feather className="w-4 h-4" />Sauvegarder</> : <><Check className="w-4 h-4" />Sauvegardé</>}
            </button>

            {/* Stats - Pliables */}
            <section className="border-t border-stone-800/50 pt-6">
              <button
                onClick={() => setShowStats(!showStats)}
                className="w-full flex items-center justify-between text-sm text-stone-500 hover:text-stone-400 transition-colors"
              >
                <span>Statistiques & historique</span>
                {showStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showStats && (
                <div className="mt-6 space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-stone-900/50 rounded-xl p-4 text-center border border-stone-800">
                      <div className="text-2xl mb-1">🔥</div>
                      <div className="text-xl font-bold text-stone-200">{journalStats.currentStreak}</div>
                      <div className="text-xs text-stone-500">jours</div>
                    </div>
                    <div className="bg-stone-900/50 rounded-xl p-4 text-center border border-stone-800">
                      <div className="text-2xl mb-1">{mood}</div>
                      <div className="text-xl font-bold text-stone-200">{journalStats.averageMood.toFixed(1)}</div>
                      <div className="text-xs text-stone-500">humeur</div>
                    </div>
                    <div className="bg-stone-900/50 rounded-xl p-4 text-center border border-stone-800">
                      <div className="text-xl font-bold text-stone-200">{journalStats.totalEntries}</div>
                      <div className="text-xs text-stone-500">entrées</div>
                    </div>
                    <div className="bg-stone-900/50 rounded-xl p-4 text-center border border-stone-800">
                      <div className="text-xl font-bold text-stone-200">{habits.length}</div>
                      <div className="text-xs text-stone-500">rituels</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-stone-400">Dernières entrées</h3>
                    {journalEntries.slice(-5).reverse().map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 bg-stone-900/50 rounded-xl border border-stone-800 hover:border-stone-700 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{entry.moodEmoji}</span>
                          <div>
                            <p className="text-sm text-stone-300 line-clamp-1">{entry.intention || entry.mainGoal}</p>
                            <p className="text-xs text-stone-500">{formatRelativeDate(entry.date)}</p>
                          </div>
                        </div>
                        <button onClick={() => toggleJournalFavorite(entry.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Heart className={`w-4 h-4 ${entry.isFavorite ? 'fill-rose-400 text-rose-400' : 'text-stone-600'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* NUTRITION TAB */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'nutrition' && (
          <div className="h-full flex flex-col p-6">
            {/* Action principale */}
            <div className="flex items-center justify-center mb-6">
              <button
                onClick={() => setShowMealModal(true)}
                className="flex items-center gap-3 px-8 py-4 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 rounded-2xl transition-all text-lg font-medium shadow-lg shadow-emerald-500/10"
              >
                <Plus className="w-6 h-6" />
                Ajouter un repas
              </button>
            </div>

            {mealEntries.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-stone-600 max-w-md">
                  <Utensils className="w-16 h-16 mx-auto mb-4 text-stone-700" />
                  <p className="text-lg mb-2 text-stone-400">Commencez à suivre vos repas</p>
                  <p className="text-sm">Ajoutez votre premier repas pour débuter le suivi nutritionnel</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
                {/* Calories & Macros */}
                <div className="space-y-4">
                  <div className="bg-stone-900/50 rounded-xl p-4 border border-stone-800">
                    <p className="text-xs text-stone-500 mb-2">Aujourd'hui</p>
                    <div className="text-2xl font-bold text-stone-200">
                      {todayCalories}
                      <span className="text-sm text-stone-600 ml-1 font-normal">/ {targetCalories} kcal</span>
                    </div>
                    <div className="h-2 bg-stone-800 rounded-full overflow-hidden mt-3">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all" 
                        style={{ width: `${Math.min(100, (todayCalories / targetCalories) * 100)}%` }} 
                      />
                    </div>
                  </div>

                  <div className="bg-stone-900/50 rounded-xl p-4 border border-stone-800">
                    <p className="text-xs text-stone-500 mb-3">Macros</p>
                    <MacrosCircularChart 
                      protein={todayMacros.protein} 
                      carbs={todayMacros.carbs} 
                      fat={todayMacros.fat} 
                    />
                  </div>
                </div>

                {/* Liste des repas */}
                <div className="lg:col-span-2 bg-stone-900/50 rounded-xl p-4 border border-stone-800 overflow-hidden flex flex-col">
                  <p className="text-xs text-stone-500 mb-3">Historique</p>
                  <div className="flex-1 overflow-y-auto">
                    <MealList 
                      entries={filteredMealEntries} 
                      onDelete={handleDeleteMeal} 
                      onDuplicate={handleDuplicateMeal} 
                      compact 
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* WEIGHT TAB */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'weight' && (
          <div className="h-full flex flex-col p-6">
            {/* Action principale */}
            <div className="flex items-center justify-center mb-6">
              <button
                onClick={() => setShowWeightModal(true)}
                className="flex items-center gap-3 px-8 py-4 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 hover:border-rose-500/50 text-rose-300 rounded-2xl transition-all text-lg font-medium shadow-lg shadow-rose-500/10"
              >
                <Plus className="w-6 h-6" />
                Ajouter une pesée
              </button>
            </div>

            {weightEntries.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-stone-600 max-w-md">
                  <Scale className="w-16 h-16 mx-auto mb-4 text-stone-700" />
                  <p className="text-lg mb-2 text-stone-400">Commencez à suivre votre poids</p>
                  <p className="text-sm">Ajoutez votre première pesée pour débuter le suivi</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
                {/* Graphique */}
                <div className="lg:col-span-2 bg-stone-900/50 rounded-xl p-4 border border-stone-800 flex flex-col">
                  <p className="text-xs text-stone-500 mb-3">Évolution</p>
                  <div className="flex-1 min-h-[200px]">
                    <WeightChart entries={weightEntries} trend={trend} />
                  </div>
                </div>

                {/* Liste */}
                <div className="bg-stone-900/50 rounded-xl p-4 border border-stone-800 overflow-hidden flex flex-col">
                  <p className="text-xs text-stone-500 mb-3">Historique</p>
                  <div className="flex-1 overflow-y-auto">
                    <WeightList entries={filteredWeightEntries} onDelete={handleDeleteWeight} compact />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
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

      <WeightModal
        isOpen={showWeightModal}
        onClose={() => setShowWeightModal(false)}
        onSubmit={handleWeightSubmit}
      />

      <MealModal
        isOpen={showMealModal}
        onClose={() => setShowMealModal(false)}
        onSubmit={handleMealSubmit}
      />

      <ConfirmDialog
        isOpen={!!healthDeleteConfirm}
        onClose={() => setHealthDeleteConfirm(null)}
        onConfirm={confirmHealthDelete}
        title="Supprimer ?"
        message={`Supprimer ${healthDeleteConfirm?.type === 'weight' ? 'cette entrée de poids' : 'ce repas'} ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="warning"
      />

      <UndoToast
        message={`${undoData?.type === 'weight' ? 'Poids' : 'Repas'} supprimé`}
        onUndo={handleUndo}
        isVisible={showUndo}
      />
    </div>
  )
}
