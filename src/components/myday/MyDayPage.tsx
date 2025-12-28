import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { 
  ArrowLeft, 
  Feather, 
  Check, 
  Sparkles,
  BookOpen,
  Heart,
  Plus,
  Apple,
  Scale,
  Utensils,
  CheckCircle2,
  ExternalLink,
  Timer
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { MoodEmoji } from '../../types/journal'
import { 
  moodEmojiToLevel,
  getTodayEntry
} from '../../utils/journalUtils'
import { AddHabitModal } from '../habits/AddHabitModal'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { useHabitsStats } from '../../hooks/useGlobalStats'
import { useHealthData } from '../../hooks/useHealthData'
import { JournalHistoryModal } from './JournalHistoryModal'
import { calculateTaskMetrics } from '../../utils/metrics'
import { calculatePomodoroMetrics } from '../../utils/pomodoroMetrics'

// Health components
import { WeightChart } from '../health/WeightChart'
import { WeightList } from '../health/WeightList'
import { MealList } from '../health/MealList'
import { WeightModal } from '../health/WeightModal'
import { MealModal } from '../health/MealModal'
import { MacrosCircularChart } from '../health/MacrosCircularChart'
import { ProfileSetupModal } from '../health/ProfileSetupModal'
import { BodyCompositionDisplay } from '../health/BodyCompositionDisplay'
import { UndoToast } from '../ui/UndoToast'

type PageTab = 'journal' | 'sante'

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
  
  const learningCourses = useStore(state => state.learningCourses || [])
  const pomodoroSessions = useStore(state => state.pomodoroSessions || [])

  // Tab state
  const [activeTab, setActiveTab] = useState<PageTab>('journal')

  // Journal states
  const [showAddHabitModal, setShowAddHabitModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)

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
  const [showProfileModal, setShowProfileModal] = useState(false)
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
  
  // Calcul des métriques
  const taskMetrics = calculateTaskMetrics(tasks)
  const pomodoroMetrics = calculatePomodoroMetrics(pomodoroSessions, tasks)

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

  const handleSelectHistoryEntry = (entry: typeof journalEntries[0]) => {
    setIntention(entry.intention || entry.mainGoal || '')
    setAction(entry.action || '')
    setMood(entry.moodEmoji || '🙂')
    setFreeNotes(entry.freeNotes || entry.reflection || '')
    addToast('Entrée chargée', 'info')
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

  const { todayCompleted } = habitsStats

  // Tâches accomplies aujourd'hui (Interconnexion A)
  const tasksCompletedToday = useMemo(() => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    return tasks.filter(t => 
      t.completed && 
      t.createdAt >= todayStart.getTime()
    )
  }, [tasks])

  const TABS: { id: PageTab; label: string; icon: typeof Feather }[] = [
    { id: 'journal', label: 'Journal', icon: Feather },
    { id: 'sante', label: 'Santé', icon: Heart }
  ]

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
          <div>
            <h1 className="font-serif text-base font-semibold text-zinc-100 tracking-tight">
              Ma Journée
            </h1>
          </div>
        </div>

        {/* Tabs à droite */}
        <div className="flex items-center gap-2">
          {/* Streak badge */}
          {habitsStats.globalStreak > 0 && activeTab === 'journal' && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-medium text-amber-300">{habitsStats.globalStreak} jours</span>
            </div>
          )}
          
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-zinc-800/40 rounded-lg p-0.5">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const badgeCount = tab.id === 'journal' ? tasksCompletedToday.length : 0
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-all ${
                    activeTab === tab.id 
                      ? 'bg-zinc-700/60 text-zinc-100' 
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {badgeCount > 0 && (
                    <span className="w-5 h-5 flex items-center justify-center text-xs bg-emerald-500/20 text-emerald-400 rounded-full font-medium">
                      {badgeCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="relative flex-1 overflow-y-auto">
        
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* JOURNAL TAB */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'journal' && (
          <div className="px-6 py-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* ===== COLONNE GAUCHE : JOURNAL (2/3) ===== */}
              <div className="xl:col-span-2 space-y-8">
            
            {/* INTENTION DU JOUR */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center border border-amber-500/20">
                  <Feather className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-medium text-zinc-200">
                    Intention du jour
                  </h2>
                  <p className="text-sm text-zinc-500">
                    Qu'est-ce qui compte vraiment aujourd'hui ?
                  </p>
                </div>
              </div>
              
              <input
                type="text"
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                placeholder="Écrire mon intention..."
                className="w-full bg-zinc-900/50 border-2 border-zinc-800 focus:border-amber-500/40 rounded-xl px-5 py-4 text-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-all font-serif italic"
                autoFocus
              />
            </section>

            <div className="h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />

            {/* ACTION CONCRÈTE */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="font-serif text-lg font-medium text-zinc-200">
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
                    <span className="text-zinc-400 group-hover:text-zinc-200 transition-colors">
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
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-emerald-500/40 rounded-xl px-5 py-3.5 text-zinc-200 placeholder:text-zinc-600 focus:outline-none transition-all"
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
                      <h2 className="font-serif text-lg font-medium text-zinc-200">
                        Rituels
                      </h2>
                      <p className="text-sm text-zinc-500">
                        {todayCompleted}/{habits.length} accomplis
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddHabitModal(true)}
                    className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-400 transition-colors"
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
                            : 'bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          isCompleted ? 'bg-emerald-500 text-white' : 'border-2 border-zinc-600'
                        }`}>
                          {isCompleted && <Check className="w-3 h-3" strokeWidth={3} />}
                        </div>
                        <span className={`text-sm font-medium truncate ${
                          isCompleted ? 'text-emerald-300' : 'text-zinc-400'
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
                className="w-full p-5 bg-zinc-900/30 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-500 hover:text-amber-400 hover:border-amber-500/30 transition-all flex items-center justify-center gap-2"
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
                <h2 className="font-serif text-lg font-medium text-zinc-200">
                  Notes & réflexions
                </h2>
              </div>
              
              <textarea
                value={freeNotes}
                onChange={(e) => setFreeNotes(e.target.value)}
                placeholder="Pensées, gratitudes, apprentissages du jour..."
                rows={4}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-sky-500/40 rounded-xl px-5 py-4 text-zinc-300 placeholder:text-zinc-600 focus:outline-none transition-all resize-none font-serif leading-relaxed"
              />
            </section>

            {/* TÂCHES ACCOMPLIES AUJOURD'HUI - Interconnexion A */}
            {tasksCompletedToday.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center border border-emerald-500/20">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="font-serif text-lg font-medium text-zinc-200">
                        Tâches accomplies
                      </h2>
                      <p className="text-sm text-zinc-500">
                        {tasksCompletedToday.length} tâche{tasksCompletedToday.length > 1 ? 's' : ''} aujourd'hui
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setView('tasks')}
                    className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-emerald-400 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Voir tout
                  </button>
                </div>
                
                <div className="space-y-2">
                  {tasksCompletedToday.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl"
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-sm text-emerald-300 line-through opacity-80">
                        {task.title}
                      </span>
                    </div>
                  ))}
                  {tasksCompletedToday.length > 5 && (
                    <p className="text-xs text-zinc-500 text-center">
                      +{tasksCompletedToday.length - 5} autres tâches
                    </p>
                  )}
                </div>
              </section>
            )}

            <div className="h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />

            {/* HUMEUR */}
            <section className="text-center py-4">
              <p className="text-sm text-zinc-500 mb-4">Comment te sens-tu ?</p>
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
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {isSaving ? 'Sauvegarde...' : hasChanges ? <><Feather className="w-4 h-4" />Sauvegarder</> : <><Check className="w-4 h-4" />Sauvegardé</>}
            </button>

            {/* Historique complet */}
            <button
              onClick={() => setShowHistoryModal(true)}
              className="w-full py-3 mt-4 bg-zinc-900/50 hover:bg-zinc-800/50 border border-zinc-800 hover:border-zinc-700 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 transition-all flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Voir l'historique complet
            </button>
          </div>

          {/* ===== COLONNE DROITE : MÉTRIQUES (1/3) ===== */}
          <div className="space-y-3">
            
            {/* Card TÂCHES — 3 lignes factuelles */}
            <div className="p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-zinc-500" />
                <h3 className="text-sm font-medium text-zinc-400">Tâches</h3>
              </div>
              <div className="space-y-2.5">
                {/* 1. Volume */}
                <p className="text-sm text-zinc-300">
                  Terminées aujourd'hui : <span className="text-zinc-100 font-medium">{taskMetrics.todayCount}</span>
                </p>
                
                {/* 2. Nature de l'activité */}
                <p className="text-sm text-zinc-300">
                  Nature : <span className="text-zinc-100 font-medium">
                    {taskMetrics.activityType === 'avancée' ? 'Avancée réelle' : 'Préparation / maintenance'}
                  </span>
                </p>
                
                {/* 3. Tendance 14 jours */}
                <p className="text-sm text-zinc-300">
                  Sur 14 jours : <span className="text-zinc-100 font-medium">
                    rythme {taskMetrics.trend14d}
                  </span>
                </p>
              </div>
            </div>

            {/* Card POMODORO — 3 lignes de métriques focus */}
            <div className="p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Timer className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-medium text-zinc-400">Pomodoro</h3>
              </div>
              <div className="space-y-2.5">
                {/* 1️⃣ Volume */}
                <p className="text-sm text-zinc-300">
                  Volume : <span className="text-zinc-100 font-medium">{pomodoroMetrics.todayVolume} tâche{pomodoroMetrics.todayVolume > 1 ? 's' : ''} terminée{pomodoroMetrics.todayVolume > 1 ? 's' : ''}</span>
                </p>
                
                {/* 2️⃣ Qualité du focus */}
                <p className="text-sm text-zinc-300">
                  Focus : <span className={`font-medium ${pomodoroMetrics.hasQualityFocus ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {pomodoroMetrics.hasQualityFocus ? 'Focus de qualité' : 'Focus fragmenté'}
                  </span>
                </p>
                
                {/* 3️⃣ Tendance 14 jours */}
                <p className="text-sm text-zinc-300">
                  Tendance : <span className={`font-medium ${pomodoroMetrics.trend14d === 'stable' ? 'text-zinc-100' : 'text-amber-400'}`}>
                    {pomodoroMetrics.trend14d}
                  </span>
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SANTÉ TAB (Nutrition + Poids fusionnés) */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'sante' && (
          <div className="h-full flex flex-col p-6 overflow-y-auto">
            
            {/* Actions principales */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
              <button
                onClick={() => setShowMealModal(true)}
                className="flex items-center gap-3 px-6 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 rounded-xl transition-all font-medium shadow-lg shadow-emerald-500/10"
              >
                <Plus className="w-5 h-5" />
                Ajouter un repas
              </button>
              <button
                onClick={() => setShowWeightModal(true)}
                className="flex items-center gap-3 px-6 py-3 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 hover:border-rose-500/50 text-rose-300 rounded-xl transition-all font-medium shadow-lg shadow-rose-500/10"
              >
                <Plus className="w-5 h-5" />
                Ajouter une pesée
              </button>
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center gap-3 px-6 py-3 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 hover:border-indigo-500/50 text-indigo-300 rounded-xl transition-all font-medium shadow-lg shadow-indigo-500/10"
              >
                <Heart className="w-5 h-5" />
                Configurer profil
              </button>
            </div>

            {/* Layout 2 colonnes : Nutrition (gauche) + Poids (droite) */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
              
              {/* ===== NUTRITION (3/5) ===== */}
              <div className="xl:col-span-3 space-y-4">
                <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <Apple className="w-4 h-4" />
                  Nutrition
                </h3>

                {mealEntries.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center text-zinc-600 max-w-md">
                      <Utensils className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
                      <p className="text-sm mb-1 text-zinc-400">Aucun repas enregistré</p>
                      <p className="text-xs">Ajoutez votre premier repas</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Calories & Macros */}
                    <div className="space-y-4">
                      <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
                        <p className="text-xs text-zinc-500 mb-2">Aujourd'hui</p>
                        <div className="text-2xl font-bold text-zinc-200">
                          {todayCalories}
                          <span className="text-sm text-zinc-600 ml-1 font-normal">/ {targetCalories} kcal</span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mt-3">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all" 
                            style={{ width: `${Math.min(100, (todayCalories / targetCalories) * 100)}%` }} 
                          />
                        </div>
                      </div>

                      <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
                        <p className="text-xs text-zinc-500 mb-3">Macros</p>
                        <MacrosCircularChart 
                          protein={todayMacros.protein} 
                          carbs={todayMacros.carbs} 
                          fat={todayMacros.fat} 
                        />
                      </div>
                    </div>

                    {/* Liste des repas */}
                    <div className="lg:col-span-2 bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 max-h-[500px] overflow-hidden flex flex-col">
                      <p className="text-xs text-zinc-500 mb-3">Historique</p>
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

              {/* ===== POIDS (2/5) ===== */}
              <div className="xl:col-span-2 space-y-4">
                <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  Poids
                </h3>

                {weightEntries.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center text-zinc-600 max-w-md">
                      <Scale className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
                      <p className="text-sm mb-1 text-zinc-400">Aucune pesée enregistrée</p>
                      <p className="text-xs">Ajoutez votre première pesée</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Composition corporelle (si données Withings) */}
                    <BodyCompositionDisplay latestEntry={weightEntries[weightEntries.length - 1]} />
                    
                    {/* Graphique */}
                    <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
                      <p className="text-xs text-zinc-500 mb-3">Évolution</p>
                      <div className="h-[200px]">
                        <WeightChart entries={weightEntries} trend={trend} />
                      </div>
                    </div>

                    {/* Liste */}
                    <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 max-h-[260px] overflow-hidden flex flex-col">
                      <p className="text-xs text-zinc-500 mb-3">Historique</p>
                      <div className="flex-1 overflow-y-auto">
                        <WeightList entries={filteredWeightEntries} onDelete={handleDeleteWeight} compact />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
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

      <ProfileSetupModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
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

      {/* Journal History Modal */}
      <JournalHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        entries={journalEntries}
        onSelectEntry={handleSelectHistoryEntry}
        toggleFavorite={toggleJournalFavorite}
      />
    </div>
  )
}
