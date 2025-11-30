import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Heart, Scale, Apple } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useHealthData, HealthTab } from '../../hooks/useHealthData'

// Components
import { HealthStats } from './HealthStats'
import { HealthSuggestions } from './HealthSuggestions'
import { WeightChart } from './WeightChart'
import { WeightList } from './WeightList'
import { MealList } from './MealList'
import { HealthFilters } from './HealthFilters'
import { WeightModal } from './WeightModal'
import { MealModal } from './MealModal'
import { HealthFAB } from './HealthFAB'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { UndoToast } from '../ui/UndoToast'

const TABS: { id: HealthTab; label: string; icon: typeof Heart }[] = [
  { id: 'overview', label: "Vue d'ensemble", icon: Heart },
  { id: 'weight', label: 'Poids', icon: Scale },
  { id: 'nutrition', label: 'Nutrition', icon: Apple }
]

export function HealthPage() {
  const { setView } = useStore()
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    dateFilter,
    setDateFilter,
    latestWeight,
    targetWeight,
    bmi,
    bmiLabel,
    bmiColor,
    trend,
    todayCalories,
    targetCalories,
    streak,
    suggestions,
    filteredWeightEntries,
    filteredMealEntries,
    weightEntries,
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+P = Add weight
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        setShowWeightModal(true)
      }
      // Ctrl+M = Add meal
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault()
        setShowMealModal(true)
      }
      // 1, 2, 3 = Switch tabs
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === '1') setActiveTab('overview')
        if (e.key === '2') setActiveTab('weight')
        if (e.key === '3') setActiveTab('nutrition')
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setActiveTab])

  // Handlers
  const handleWeightSubmit = useCallback((data: { weight: number; date: string; note?: string }) => {
    const result = handleAddWeight(data)
    if (result.success) {
      setToast({ message: 'Poids ajouté avec succès', type: 'success' })
      setTimeout(() => setToast(null), 3000)
    }
    return result
  }, [handleAddWeight])

  const handleMealSubmit = useCallback((data: { name: string; calories: number; date: string; time: string; type: 'breakfast' | 'lunch' | 'dinner' | 'snack' }) => {
    const result = handleAddMeal(data)
    if (result.success) {
      setToast({ message: 'Repas ajouté avec succès', type: 'success' })
      setTimeout(() => setToast(null), 3000)
    }
    return result
  }, [handleAddMeal])

  const handleDeleteWeight = useCallback((id: string) => {
    setDeleteConfirm({ type: 'weight', id })
  }, [])

  const handleDeleteMeal = useCallback((id: string) => {
    setDeleteConfirm({ type: 'meal', id })
  }, [])

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
    <div className="min-h-screen w-full bg-mars-bg overflow-y-auto">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('hub')}
              className="p-2 hover:bg-zinc-900/50 rounded-xl transition-colors"
              aria-label="Retour au hub"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">Santé & Nutrition</h1>
              <p className="text-sm text-zinc-600">Suivez votre poids, nutrition et objectifs</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWeightModal(true)}
              className="px-4 py-2 bg-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500/30 transition-all duration-300 flex items-center gap-2"
              aria-label="Ajouter un poids (Ctrl+P)"
            >
              <Scale className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm hidden sm:inline">Poids</span>
            </button>
            <button
              onClick={() => setShowMealModal(true)}
              className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-all duration-300 flex items-center gap-2"
              aria-label="Ajouter un repas (Ctrl+M)"
            >
              <Apple className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm hidden sm:inline">Repas</span>
            </button>
          </div>
        </header>

        {/* Tabs */}
        <nav className="flex gap-2 mb-6 overflow-x-auto pb-2" role="tablist" aria-label="Sections santé">
          {TABS.map((tab, index) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                tabIndex={activeTab === tab.id ? 0 : -1}
                className={`px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-zinc-800 text-zinc-200'
                    : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900/30'
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span className="text-sm">{tab.label}</span>
                <kbd className="hidden sm:inline text-[10px] text-zinc-700 ml-1">{index + 1}</kbd>
              </button>
            )
          })}
        </nav>

        {/* Content */}
        <main>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div 
              id="panel-overview" 
              role="tabpanel" 
              aria-labelledby="tab-overview"
              className="space-y-6 animate-fade-in"
            >
              <HealthStats
                latestWeight={latestWeight}
                targetWeight={targetWeight}
                bmi={bmi}
                bmiLabel={bmiLabel}
                bmiColor={bmiColor}
                todayCalories={todayCalories}
                targetCalories={targetCalories}
                streak={streak}
                trend={trend}
              />

              <HealthSuggestions suggestions={suggestions} />

              <WeightChart entries={weightEntries} trend={trend} />
            </div>
          )}

          {/* Weight Tab */}
          {activeTab === 'weight' && (
            <div 
              id="panel-weight" 
              role="tabpanel" 
              aria-labelledby="tab-weight"
              className="space-y-6 animate-fade-in"
            >
              <div 
                className="bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <h2 className="text-lg font-medium text-zinc-200 mb-4">Historique du poids</h2>
                
                <HealthFilters
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  dateFilter={dateFilter}
                  onDateFilterChange={setDateFilter}
                />

                <WeightList 
                  entries={filteredWeightEntries} 
                  onDelete={handleDeleteWeight}
                />
              </div>
            </div>
          )}

          {/* Nutrition Tab */}
          {activeTab === 'nutrition' && (
            <div 
              id="panel-nutrition" 
              role="tabpanel" 
              aria-labelledby="tab-nutrition"
              className="space-y-6 animate-fade-in"
            >
              <div 
                className="bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <h2 className="text-lg font-medium text-zinc-200 mb-4">Journal alimentaire</h2>
                
                <HealthFilters
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  dateFilter={dateFilter}
                  onDateFilterChange={setDateFilter}
                />

                <MealList 
                  entries={filteredMealEntries} 
                  onDelete={handleDeleteMeal}
                />
              </div>
            </div>
          )}
        </main>
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
        title="Supprimer cette entrée ?"
        message={`Êtes-vous sûr de vouloir supprimer ${
          deleteConfirm?.type === 'weight' ? 'cette entrée de poids' : 'ce repas'
        } ? Cette action peut être annulée.`}
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
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-xl animate-fade-in ${
            toast.type === 'success' 
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' 
              : 'bg-rose-500/20 border border-rose-500/30 text-rose-400'
          }`}
          role="status"
          aria-live="polite"
        >
          {toast.message}
        </div>
      )}

      {/* Mobile FAB */}
      <HealthFAB
        onAddWeight={() => setShowWeightModal(true)}
        onAddMeal={() => setShowMealModal(true)}
      />
    </div>
  )
}
