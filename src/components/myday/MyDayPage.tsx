/**
 * 📅 MyDayPage - Page Ma Journée (refactorisée)
 * 
 * Composants extraits :
 * - JournalTab : Onglet journal complet
 * - HealthTab : Onglet santé complet
 * - TasksMetricsCard : Card métriques tâches
 * - PomodoroMetricsCard : Card métriques pomodoro
 */

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { ArrowLeft, Feather, Heart, Sparkles } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { MoodEmoji } from '../../types/journal'
import { moodEmojiToLevel, getTodayEntry } from '../../utils/journalUtils'
import { AddHabitModal } from '../habits/AddHabitModal'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { useHabitsStats } from '../../hooks/useGlobalStats'
import { useHealthData } from '../../hooks/useHealthData'
import { JournalHistoryModal } from './JournalHistoryModal'
import { WeightModal } from '../health/WeightModal'
import { MealModal } from '../health/MealModal'
import { ProfileSetupModal } from '../health/ProfileSetupModal'
import { UndoToast } from '../ui/UndoToast'

// Composants extraits
import { JournalTab } from './JournalTab'
import { HealthTab } from './HealthTab'

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
    deleteJournalEntry,
    addToast,
    tasks,
    getPriorityTask
  } = useStore()
  
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

  // Journal states
  const [intention, setIntention] = useState('')
  const [mood, setMood] = useState<MoodEmoji>('🙂')

  useEffect(() => {
    if (todayEntry) {
      setIntention(todayEntry.intention || todayEntry.mainGoal || '')
      setMood(todayEntry.moodEmoji || '🙂')
    }
  }, [todayEntry?.id])

  const canSave = intention.trim().length >= 10 // Minimum 10 caractères
  const hasChanges = useMemo(() => {
    if (!todayEntry) return intention.trim().length > 0
    return (
      intention !== (todayEntry.intention || todayEntry.mainGoal || '') ||
      mood !== (todayEntry.moodEmoji || '🙂')
    )
  }, [intention, mood, todayEntry])

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
    }

    if (todayEntry) {
      updateJournalEntry(todayEntry.id, entryData)
      addToast('Journal mis à jour', 'success')
    } else {
      addJournalEntry(entryData)
      addToast('Entrée sauvegardée', 'success')
    }
    setIsSaving(false)
  }, [intention, mood, today, todayEntry, canSave, addJournalEntry, updateJournalEntry, addToast])

  // Auto-save
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    if (!hasChanges || !canSave) return
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => handleSave(), 3000)
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current) }
  }, [intention, mood, hasChanges, canSave, handleSave])

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

  const priorityTask = getPriorityTask()
  const firstTask = priorityTask || tasks.filter(t => !t.completed)[0]
  const { todayCompleted } = habitsStats

  // Tâches accomplies aujourd'hui
  const tasksCompletedToday = useMemo(() => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    return tasks.filter(t => 
      t.completed && 
      t.createdAt >= todayStart.getTime()
    )
  }, [tasks])

  // Compter les repas d'aujourd'hui
  const todayMealsCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return mealEntries.filter(m => m.date === today).length
  }, [mealEntries])

  // Poids le plus récent pour MealModal
  const latestWeightEntry = useMemo(() => {
    if (weightEntries.length === 0) return undefined
    return {
      weight: weightEntries[weightEntries.length - 1].weight,
      date: weightEntries[weightEntries.length - 1].date
    }
  }, [weightEntries])

  // Objectif calorique pour MealModal
  const caloriesGoal = useMemo(() => {
    const { healthGoals } = useStore.getState()
    return healthGoals.find(g => g.type === 'calories' && g.active)
  }, [])

  // Objectif utilisateur pour MealModal
  const userGoal = useMemo(() => {
    const { userProfile } = useStore.getState()
    return userProfile.goal || 'maintain'
  }, [])

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
              const badgeCount = tab.id === 'journal' ? tasksCompletedToday.length : todayMealsCount
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
        {activeTab === 'journal' && (
          <JournalTab
            intention={intention}
            setIntention={setIntention}
            mood={mood}
            setMood={setMood}
            handleSave={handleSave}
            canSave={canSave}
            isSaving={isSaving}
            hasChanges={hasChanges}
            setShowHistoryModal={setShowHistoryModal}
            habits={habits}
            tasks={tasks}
            today={today}
            todayCompleted={todayCompleted}
            pomodoroSessions={pomodoroSessions}
            handleToggleHabit={handleToggleHabit}
            setShowAddHabitModal={setShowAddHabitModal}
          />
        )}

        {activeTab === 'sante' && (
          <HealthTab
            setShowMealModal={setShowMealModal}
            setShowWeightModal={setShowWeightModal}
            setShowProfileModal={setShowProfileModal}
            mealEntries={mealEntries}
            weightEntries={weightEntries}
            filteredMealEntries={filteredMealEntries}
            filteredWeightEntries={filteredWeightEntries}
            todayCalories={todayCalories}
            targetCalories={targetCalories}
            todayMacros={todayMacros}
            trend={trend}
            handleDeleteMeal={handleDeleteMeal}
            handleDeleteWeight={handleDeleteWeight}
            handleDuplicateMeal={handleDuplicateMeal}
          />
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
        latestWeight={latestWeightEntry}
        targetCalories={caloriesGoal?.target}
        userGoal={userGoal as 'lose' | 'maintain' | 'gain'}
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
        />
      )}
    </div>
  )
}
