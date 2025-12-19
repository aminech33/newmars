import { useState, useEffect, useCallback, useMemo } from 'react'
import { ArrowLeft, Heart, Scale, Apple, Plus } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useHealthData, HealthTab } from '../../hooks/useHealthData'

// Components
import { WeightChart } from './WeightChart'
import { WeightList } from './WeightList'
import { MealList } from './MealList'
import { WeightModal } from './WeightModal'
import { MealModal } from './MealModal'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { UndoToast } from '../ui/UndoToast'
import { MacrosCircularChart } from './MacrosCircularChart'

const TABS: { id: HealthTab; label: string; icon: typeof Heart }[] = [
  { id: 'nutrition', label: 'Nutrition', icon: Apple },
  { id: 'weight', label: 'Poids', icon: Scale }
]

export function HealthPage() {
  const { setView } = useStore()
  const {
    activeTab,
    setActiveTab,
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

  // Modal states
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [showMealModal, setShowMealModal] = useState(false)
  
  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'weight' | 'meal'; id: string } | null>(null)
  
  // Undo state
  const [undoData, setUndoData] = useState<{ type: 'weight' | 'meal'; data: any } | null>(null)
  const [showUndo, setShowUndo] = useState(false)

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Today's date
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])
  const todayMeals = useMemo(() => filteredMealEntries.filter(m => m.date === today), [filteredMealEntries, today])
  
  // Macros calculations
  const todayMacros = useMemo(() => ({
    protein: todayMeals.reduce((sum, m) => sum + (m.protein || 0), 0),
    carbs: todayMeals.reduce((sum, m) => sum + (m.carbs || 0), 0),
    fat: todayMeals.reduce((sum, m) => sum + (m.fat || 0), 0)
  }), [todayMeals])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        if (activeTab === 'nutrition') setShowMealModal(true)
        if (activeTab === 'weight') setShowWeightModal(true)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTab])

  // Handlers
  const handleWeightSubmit = useCallback((data: { weight: number; date: string; note?: string }) => {
    const result = handleAddWeight(data)
    if (result.success) {
      setToast({ message: 'Poids ajouté', type: 'success' })
      setTimeout(() => setToast(null), 2000)
    }
    return result
  }, [handleAddWeight])

  const handleMealSubmit = useCallback((data: { 
    name: string
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber?: number
    foods: any[]
    date: string
    time: string
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack' 
  }) => {
    const result = handleAddMeal(data)
    if (result.success) {
      setToast({ message: 'Repas ajouté', type: 'success' })
      setTimeout(() => setToast(null), 2000)
    }
    return result
  }, [handleAddMeal])

  const handleDeleteWeight = useCallback((id: string) => {
    setDeleteConfirm({ type: 'weight', id })
  }, [])

  const handleDeleteMeal = useCallback((id: string) => {
    setDeleteConfirm({ type: 'meal', id })
  }, [])

  const handleDuplicateMeal = useCallback((meal: any) => {
    const result = handleAddMeal({
      ...meal,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5)
    })
    if (result.success) {
      setToast({ message: 'Repas dupliqué', type: 'success' })
      setTimeout(() => setToast(null), 2000)
    }
  }, [handleAddMeal])

  const confirmDelete = useCallback(() => {
    if (!deleteConfirm) return
    
    if (deleteConfirm.type === 'weight') {
      const entry = filteredWeightEntries.find(e => e.id === deleteConfirm.id)
      if (entry) {
        setUndoData({ type: 'weight', data: entry })
        deleteWeightEntry(deleteConfirm.id)
        setShowUndo(true)
        setTimeout(() => setShowUndo(false), 5000)
      }
    } else {
      const entry = filteredMealEntries.find(e => e.id === deleteConfirm.id)
      if (entry) {
        setUndoData({ type: 'meal', data: entry })
        deleteMealEntry(deleteConfirm.id)
        setShowUndo(true)
        setTimeout(() => setShowUndo(false), 5000)
      }
    }
    
    setDeleteConfirm(null)
  }, [deleteConfirm, filteredWeightEntries, filteredMealEntries, deleteWeightEntry, deleteMealEntry])

  const handleUndo = useCallback(() => {
    if (!undoData) return
    
    if (undoData.type === 'weight') {
      handleAddWeight(undoData.data)
    } else {
      handleAddMeal(undoData.data)
    }
    
    setUndoData(null)
    setShowUndo(false)
  }, [undoData, handleAddWeight, handleAddMeal])

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-zinc-950">
      {/* Header compact */}
      <header className="flex-shrink-0 px-4 py-3 border-b border-zinc-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('hub')}
              className="p-1 text-zinc-500 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <Heart className="w-4 h-4 text-rose-400" />
            <h1 className="text-lg font-semibold text-white">Santé</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-zinc-900/50 rounded-lg p-1">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-all ${
                    activeTab === tab.id 
                      ? 'bg-zinc-800 text-white' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-4">
        {/* NUTRITION */}
        {activeTab === 'nutrition' && (
          <div className="h-full flex flex-col">
            {/* ACTION DOMINANTE : Ajouter un repas */}
            <div className="flex items-center justify-center mb-6">
              <button
                onClick={() => setShowMealModal(true)}
                className="flex items-center gap-3 px-8 py-4 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 rounded-2xl transition-all text-lg font-medium shadow-lg shadow-emerald-500/10"
              >
                <Plus className="w-6 h-6" />
                Ajouter un repas
              </button>
            </div>

            {/* État vide ou contenu secondaire */}
            {mealEntries.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-zinc-600 max-w-md">
                  <Apple className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
                  <p className="text-lg mb-2">Commencez à suivre vos repas</p>
                  <p className="text-sm">Ajoutez votre premier repas pour débuter le suivi nutritionnel</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 grid grid-cols-3 gap-3 overflow-hidden">
                {/* Données secondaires - Taille réduite, contraste bas */}
                <div className="space-y-3">
                  {/* Calories du jour */}
                  <div className="bg-zinc-900/30 rounded-xl p-3 border border-zinc-800/30">
                    <p className="text-[11px] text-zinc-600 mb-1">Aujourd'hui</p>
                    <div className="text-xl font-semibold text-zinc-400">
                      {todayCalories}
                      <span className="text-sm text-zinc-700 ml-1">/ {targetCalories}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800/50 rounded-full overflow-hidden mt-2">
                      <div 
                        className="h-full bg-emerald-500/40" 
                        style={{ width: `${Math.min(100, (todayCalories / targetCalories) * 100)}%` }} 
                      />
                    </div>
                  </div>

                  {/* Macros */}
                  <div className="bg-zinc-900/30 rounded-xl p-3 border border-zinc-800/30">
                    <p className="text-[11px] text-zinc-600 mb-2">Macros</p>
                    <div className="opacity-60">
                      <MacrosCircularChart 
                        protein={todayMacros.protein} 
                        carbs={todayMacros.carbs} 
                        fat={todayMacros.fat} 
                      />
                    </div>
                  </div>
                </div>

                {/* Liste des repas - secondaire */}
                <div className="col-span-2 bg-zinc-900/30 rounded-xl p-3 border border-zinc-800/30 overflow-hidden flex flex-col">
                  <p className="text-[11px] text-zinc-600 mb-3">Historique</p>
                  <div className="flex-1 overflow-y-auto opacity-75">
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

        {/* POIDS */}
        {activeTab === 'weight' && (
          <div className="h-full flex flex-col">
            {/* ACTION DOMINANTE : Ajouter une entrée */}
            <div className="flex items-center justify-center mb-6">
              <button
                onClick={() => setShowWeightModal(true)}
                className="flex items-center gap-3 px-8 py-4 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 hover:border-rose-500/50 text-rose-300 rounded-2xl transition-all text-lg font-medium shadow-lg shadow-rose-500/10"
              >
                <Plus className="w-6 h-6" />
                Ajouter une entrée
              </button>
            </div>

            {/* État vide ou contenu secondaire */}
            {weightEntries.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-zinc-600 max-w-md">
                  <Scale className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
                  <p className="text-lg mb-2">Commencez à suivre votre poids</p>
                  <p className="text-sm">Ajoutez votre première pesée pour débuter le suivi</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 grid grid-cols-3 gap-3 overflow-hidden">
                {/* Graphique - secondaire */}
                <div className="col-span-2 bg-zinc-900/30 rounded-xl p-3 border border-zinc-800/30 flex flex-col">
                  <p className="text-[11px] text-zinc-600 mb-3">Évolution</p>
                  <div className="flex-1 min-h-0 opacity-75">
                    <WeightChart entries={weightEntries} trend={trend} />
                  </div>
                </div>

                {/* Liste - secondaire */}
                <div className="bg-zinc-900/30 rounded-xl p-3 border border-zinc-800/30 overflow-hidden flex flex-col">
                  <p className="text-[11px] text-zinc-600 mb-3">Historique</p>
                  <div className="flex-1 overflow-y-auto opacity-75">
                    <WeightList entries={filteredWeightEntries} onDelete={handleDeleteWeight} compact />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
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

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Supprimer ?"
        message={`Supprimer ${deleteConfirm?.type === 'weight' ? 'cette entrée de poids' : 'ce repas'} ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="warning"
      />

      {/* Undo Toast */}
      <UndoToast
        message={`${undoData?.type === 'weight' ? 'Poids' : 'Repas'} supprimé`}
        onUndo={handleUndo}
        isVisible={showUndo}
      />

      {/* Success Toast */}
      {toast && (
        <div 
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg animate-fade-in text-sm ${
            toast.type === 'success' 
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' 
              : 'bg-rose-500/20 border border-rose-500/30 text-rose-400'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
