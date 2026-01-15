/**
 * Page Santé indépendante
 * Nutrition + Poids + Composition corporelle
 */

import { useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useHealthData } from '../../hooks/useHealthData'
import { HealthTab } from '../myday/HealthTab'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { UndoToast } from '../ui/UndoToast'

export function HealthPage() {
  const setView = useStore((state) => state.setView)
  const userProfile = useStore((state) => state.userProfile)

  const {
    filteredMealEntries,
    filteredWeightEntries,
    todayCalories,
    targetCalories,
    todayMeals,
    trend,
    targetWeight,
    latestWeight,
    weightEntries,
    mealEntries,
    handleAddWeight,
    handleAddMeal,
    deleteWeightEntry,
    deleteMealEntry
  } = useHealthData()

  // Calculer todayMacros localement
  const todayMacros = useMemo(() => ({
    protein: todayMeals.reduce((sum, m) => sum + (m.protein || 0), 0),
    carbs: todayMeals.reduce((sum, m) => sum + (m.carbs || 0), 0),
    fat: todayMeals.reduce((sum, m) => sum + (m.fat || 0), 0)
  }), [todayMeals])

  // Objectif utilisateur
  const userGoal = userProfile.goal || 'maintain'

  // Prédiction semaines pour atteindre l'objectif
  const predictedWeeks = useMemo(() => {
    if (!targetWeight || weightEntries.length < 2) return undefined
    const remainingKg = Math.abs(targetWeight - latestWeight)
    const weeklyChange = Math.abs(trend.weeklyChange)
    if (weeklyChange === 0) return Infinity
    return Math.ceil(remainingKg / weeklyChange)
  }, [targetWeight, weightEntries.length, latestWeight, trend.weeklyChange])

  // Poids le plus récent pour le composant
  const latestWeightEntry = useMemo(() => {
    if (weightEntries.length === 0) return undefined
    const sorted = [...weightEntries].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    return { weight: sorted[0].weight, date: sorted[0].date }
  }, [weightEntries])

  // États pour confirmation et undo
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'weight' | 'meal'; id: string } | null>(null)
  const [undoData, setUndoData] = useState<{ type: 'weight' | 'meal'; data: any } | null>(null)
  const [showUndo, setShowUndo] = useState(false)

  // Handlers de suppression
  const handleDeleteMeal = (id: string) => {
    setDeleteConfirm({ type: 'meal', id })
  }

  const handleDeleteWeight = (id: string) => {
    setDeleteConfirm({ type: 'weight', id })
  }

  const confirmDelete = () => {
    if (!deleteConfirm) return

    if (deleteConfirm.type === 'meal') {
      const meal = mealEntries.find(m => m.id === deleteConfirm.id)
      if (meal) {
        setUndoData({ type: 'meal', data: meal })
        deleteMealEntry(deleteConfirm.id)
        setShowUndo(true)
      }
    } else {
      const weight = weightEntries.find(w => w.id === deleteConfirm.id)
      if (weight) {
        setUndoData({ type: 'weight', data: weight })
        deleteWeightEntry(deleteConfirm.id)
        setShowUndo(true)
      }
    }

    setDeleteConfirm(null)
  }

  const handleUndo = () => {
    if (!undoData) return

    if (undoData.type === 'meal') {
      handleAddMeal(undoData.data)
    } else {
      handleAddWeight(undoData.data)
    }

    setUndoData(null)
    setShowUndo(false)
  }

  // Handler pour dupliquer un repas
  const handleDuplicateMeal = (meal: any) => {
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toTimeString().slice(0, 5)

    handleAddMeal({
      ...meal,
      id: undefined,
      date: today,
      time: now
    })
  }

  return (
    <div className="h-full w-full bg-black flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setView('hub')}
            className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-all"
            aria-label="Retour au Hub"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold text-zinc-200">Santé</h1>
        </div>
      </header>

      {/* Contenu */}
      <main className="flex-1 overflow-hidden">
        <HealthTab
          mealEntries={mealEntries}
          weightEntries={weightEntries}
          filteredMealEntries={filteredMealEntries}
          filteredWeightEntries={filteredWeightEntries}
          todayCalories={todayCalories}
          targetCalories={targetCalories}
          todayMacros={todayMacros}
          trend={trend}
          targetWeight={targetWeight}
          predictedWeeks={predictedWeeks}
          latestWeight={latestWeightEntry}
          userGoal={userGoal as 'lose' | 'maintain' | 'gain'}
          handleDeleteMeal={handleDeleteMeal}
          handleDeleteWeight={handleDeleteWeight}
          handleDuplicateMeal={handleDuplicateMeal}
          handleAddMeal={handleAddMeal}
          handleAddWeight={handleAddWeight}
        />
      </main>

      {/* Dialogs */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Supprimer ?"
        message={`Supprimer ${deleteConfirm?.type === 'weight' ? 'cette pesée' : 'ce repas'} ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="warning"
      />

      {showUndo && undoData && (
        <UndoToast
          message={`${undoData.type === 'weight' ? 'Pesée' : 'Repas'} supprimé`}
          onUndo={handleUndo}
          onClose={() => setShowUndo(false)}
          isVisible={showUndo}
        />
      )}
    </div>
  )
}
