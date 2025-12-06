import { useState, useEffect, useCallback, useMemo } from 'react'
import { ArrowLeft, Heart, Scale, Apple, Book, TrendingUp, TrendingDown, Flame, Target } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useHealthData, HealthTab } from '../../hooks/useHealthData'

// Components
import { WeightChart } from './WeightChart'
import { WeightList } from './WeightList'
import { MealList } from './MealList'
import { HealthFilters } from './HealthFilters'
import { WeightModal } from './WeightModal'
import { MealModal } from './MealModal'
import { HealthFAB } from './HealthFAB'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { UndoToast } from '../ui/UndoToast'
import { FoodDatabaseViewer } from './FoodDatabaseViewer'
import { MacrosCircularChart } from './MacrosCircularChart'

const TABS: { id: HealthTab | 'stats'; label: string; icon: typeof Heart }[] = [
  { id: 'overview', label: "Aujourd'hui", icon: Heart },
  { id: 'weight', label: 'Poids', icon: Scale },
  { id: 'nutrition', label: 'Nutrition', icon: Apple },
  { id: 'stats', label: 'Stats', icon: TrendingUp }
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
    mealEntries,
    handleAddWeight,
    handleAddMeal,
    deleteWeightEntry,
    deleteMealEntry
  } = useHealthData()

  // Modal states
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [showMealModal, setShowMealModal] = useState(false)
  const [showFoodDatabase, setShowFoodDatabase] = useState(false)
  
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

  // Targets
  const targets = useMemo(() => ({
    protein: Math.round(targetCalories * 0.3 / 4),
    carbs: Math.round(targetCalories * 0.4 / 4),
    fat: Math.round(targetCalories * 0.3 / 9)
  }), [targetCalories])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        setShowWeightModal(true)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault()
        setShowMealModal(true)
      }
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

  // Dupliquer un repas
  const handleDuplicateMeal = useCallback((meal: any) => {
    const result = handleAddMeal({
      ...meal,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5)
    })
    if (result.success) {
      setToast({ message: 'Repas dupliqué avec succès', type: 'success' })
      setTimeout(() => setToast(null), 3000)
    }
  }, [handleAddMeal])

  // Ajouter un repas depuis suggestion
  const handleSelectSuggestion = useCallback((_suggestion: any) => {
    setShowMealModal(true)
    // TODO: Pré-remplir le modal avec la suggestion
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
    <div className="h-screen w-full flex flex-col overflow-hidden">
      {/* Header - Compact */}
      <header className="flex-shrink-0 px-4 py-2 border-b border-zinc-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('hub')}
              className="p-1.5 hover:bg-zinc-900/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-400" />
            </button>
            <Heart className="w-4 h-4 text-rose-400" />
            <h1 className="text-lg font-semibold text-zinc-200">Santé</h1>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Tabs inline */}
            <div className="flex gap-0.5 bg-zinc-800/50 rounded-lg p-0.5 mr-2">
              {TABS.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-2 py-1 rounded-md text-xs flex items-center gap-1 transition-colors ${
                      activeTab === tab.id ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setShowFoodDatabase(true)}
              className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
              title="Base d'aliments"
            >
              <Book className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowWeightModal(true)}
              className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30 transition-colors"
              title="Ajouter poids"
            >
              <Scale className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowMealModal(true)}
              className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 text-xs"
            >
              <Apple className="w-3.5 h-3.5" />
              <span>Repas</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content - Full Height, No Scroll */}
      <div className="flex-1 overflow-hidden p-3">
        {/* Tab: Aujourd'hui - Full screen layout */}
        {activeTab === 'overview' && (
          <div className="h-full grid grid-cols-4 grid-rows-2 gap-3">
            {/* Calories du jour - Large */}
            <div className="col-span-2 row-span-1 bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
                  <Flame className="w-3 h-3 text-orange-400" /> Calories
                </h3>
                <span className="text-xs text-zinc-600">{todayMeals.length} repas</span>
              </div>
              <div className="flex items-end gap-4">
                <div>
                  <div className="text-3xl font-bold text-white">{todayCalories}</div>
                  <div className="text-xs text-zinc-500">/ {targetCalories} kcal</div>
                </div>
                <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${todayCalories > targetCalories ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, (todayCalories / targetCalories) * 100)}%` }}
                  />
                </div>
                <span className={`text-sm font-medium ${todayCalories > targetCalories ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {Math.round((todayCalories / targetCalories) * 100)}%
                </span>
              </div>
              {/* Macros bars */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div>
                  <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                    <span>Protéines</span>
                    <span>{todayMacros.protein}g/{targets.protein}g</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (todayMacros.protein / targets.protein) * 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                    <span>Glucides</span>
                    <span>{todayMacros.carbs}g/{targets.carbs}g</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, (todayMacros.carbs / targets.carbs) * 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                    <span>Lipides</span>
                    <span>{todayMacros.fat}g/{targets.fat}g</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, (todayMacros.fat / targets.fat) * 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Macros Chart */}
            <div className="col-span-1 row-span-1 bg-zinc-900/50 rounded-xl p-3 border border-zinc-800/50 flex flex-col items-center justify-center">
              <h3 className="text-[10px] font-medium text-zinc-500 mb-2">Répartition</h3>
              <MacrosCircularChart
                protein={todayMacros.protein}
                carbs={todayMacros.carbs}
                fat={todayMacros.fat}
              />
            </div>

            {/* Stats rapides */}
            <div className="col-span-1 row-span-1 bg-zinc-900/50 rounded-xl p-3 border border-zinc-800/50">
              <h3 className="text-[10px] font-medium text-zinc-500 mb-2">Stats</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Poids</span>
                  <span className="text-sm font-medium text-white">{latestWeight ? `${latestWeight}kg` : '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">IMC</span>
                  <span className={`text-sm font-medium ${bmiColor}`}>{bmi ? bmi.toFixed(1) : '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Objectif</span>
                  <span className="text-sm font-medium text-cyan-400">{targetWeight ? `${targetWeight}kg` : '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Tendance</span>
                  <span className={`text-sm font-medium flex items-center gap-1 ${trend > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(trend).toFixed(1)}kg
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Streak</span>
                  <span className="text-sm font-medium text-orange-400 flex items-center gap-1">
                    <Flame className="w-3 h-3" /> {streak}j
                  </span>
                </div>
              </div>
            </div>

            {/* Repas du jour - Liste compacte */}
            <div className="col-span-2 row-span-1 bg-zinc-900/50 rounded-xl p-3 border border-zinc-800/50 overflow-hidden">
              <h3 className="text-xs font-medium text-zinc-500 mb-2">Repas du jour</h3>
              <div className="space-y-1.5 overflow-y-auto max-h-[calc(100%-24px)]">
                {todayMeals.length === 0 ? (
                  <p className="text-xs text-zinc-600 text-center py-4">Aucun repas enregistré</p>
                ) : (
                  todayMeals.map(meal => (
                    <div key={meal.id} className="flex items-center justify-between p-2 bg-zinc-800/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{meal.type === 'breakfast' ? '🌅' : meal.type === 'lunch' ? '☀️' : meal.type === 'dinner' ? '🌙' : '🍎'}</span>
                        <span className="text-xs text-zinc-300 truncate max-w-[150px]">{meal.name}</span>
                      </div>
                      <span className="text-xs font-medium text-zinc-400">{meal.calories} kcal</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Mini Weight Chart */}
            <div className="col-span-2 row-span-1 bg-zinc-900/50 rounded-xl p-3 border border-zinc-800/50 overflow-hidden">
              <h3 className="text-xs font-medium text-zinc-500 mb-2">Évolution poids (7j)</h3>
              <div className="h-[calc(100%-24px)]">
                <WeightChart entries={weightEntries.slice(-7)} trend={trend} compact />
              </div>
            </div>
          </div>
        )}

        {/* Tab: Poids */}
        {activeTab === 'weight' && (
          <div className="h-full grid grid-cols-3 gap-3">
            {/* Chart */}
            <div className="col-span-2 bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50">
              <h3 className="text-xs font-medium text-zinc-500 mb-3">Évolution du poids</h3>
              <div className="h-[calc(100%-32px)]">
                <WeightChart entries={weightEntries} trend={trend} />
              </div>
            </div>
            {/* Liste */}
            <div className="col-span-1 bg-zinc-900/50 rounded-xl p-3 border border-zinc-800/50 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-medium text-zinc-500">Historique</h3>
              </div>
              <HealthFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                dateFilter={dateFilter}
                onDateFilterChange={setDateFilter}
              />
              <div className="flex-1 overflow-y-auto mt-2">
                <WeightList entries={filteredWeightEntries} onDelete={handleDeleteWeight} compact />
              </div>
            </div>
          </div>
        )}

        {/* Tab: Nutrition */}
        {activeTab === 'nutrition' && (
          <div className="h-full grid grid-cols-3 gap-3">
            {/* Tracker + Macros */}
            <div className="col-span-1 space-y-3">
              <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800/50">
                <h3 className="text-xs font-medium text-zinc-500 mb-2">Aujourd'hui</h3>
                <div className="text-2xl font-bold text-white">{todayCalories} <span className="text-sm text-zinc-500">/ {targetCalories}</span></div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mt-2">
                  <div className={`h-full ${todayCalories > targetCalories ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (todayCalories / targetCalories) * 100)}%` }} />
                </div>
              </div>
              <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800/50 flex-1">
                <h3 className="text-xs font-medium text-zinc-500 mb-2">Macros</h3>
                <MacrosCircularChart protein={todayMacros.protein} carbs={todayMacros.carbs} fat={todayMacros.fat} />
              </div>
            </div>
            {/* Liste repas */}
            <div className="col-span-2 bg-zinc-900/50 rounded-xl p-3 border border-zinc-800/50 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-medium text-zinc-500">Journal alimentaire</h3>
              </div>
              <HealthFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                dateFilter={dateFilter}
                onDateFilterChange={setDateFilter}
              />
              <div className="flex-1 overflow-y-auto mt-2">
                <MealList entries={filteredMealEntries} onDelete={handleDeleteMeal} onDuplicate={handleDuplicateMeal} compact />
              </div>
            </div>
          </div>
        )}

        {/* Tab: Stats */}
        {activeTab === 'stats' && (
          <div className="h-full grid grid-cols-4 grid-rows-2 gap-3">
            {/* Poids actuel */}
            <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50 flex flex-col items-center justify-center">
              <Scale className="w-6 h-6 text-rose-400 mb-2" />
              <div className="text-2xl font-bold text-white">{latestWeight || '-'}</div>
              <div className="text-xs text-zinc-500">kg actuels</div>
            </div>
            {/* Objectif */}
            <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50 flex flex-col items-center justify-center">
              <Target className="w-6 h-6 text-cyan-400 mb-2" />
              <div className="text-2xl font-bold text-white">{targetWeight || '-'}</div>
              <div className="text-xs text-zinc-500">kg objectif</div>
            </div>
            {/* IMC */}
            <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50 flex flex-col items-center justify-center">
              <Heart className="w-6 h-6 text-purple-400 mb-2" />
              <div className={`text-2xl font-bold ${bmiColor}`}>{bmi ? bmi.toFixed(1) : '-'}</div>
              <div className="text-xs text-zinc-500">{bmiLabel || 'IMC'}</div>
            </div>
            {/* Tendance */}
            <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50 flex flex-col items-center justify-center">
              {trend > 0 ? <TrendingUp className="w-6 h-6 text-rose-400 mb-2" /> : <TrendingDown className="w-6 h-6 text-emerald-400 mb-2" />}
              <div className={`text-2xl font-bold ${trend > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{trend > 0 ? '+' : ''}{trend.toFixed(1)}</div>
              <div className="text-xs text-zinc-500">kg tendance</div>
            </div>
            {/* Calories moyennes */}
            <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50 flex flex-col items-center justify-center">
              <Flame className="w-6 h-6 text-orange-400 mb-2" />
              <div className="text-2xl font-bold text-white">{targetCalories}</div>
              <div className="text-xs text-zinc-500">kcal/jour cible</div>
            </div>
            {/* Streak */}
            <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50 flex flex-col items-center justify-center">
              <Flame className="w-6 h-6 text-amber-400 mb-2" />
              <div className="text-2xl font-bold text-amber-400">{streak}</div>
              <div className="text-xs text-zinc-500">jours streak</div>
            </div>
            {/* Total repas */}
            <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50 flex flex-col items-center justify-center">
              <Apple className="w-6 h-6 text-emerald-400 mb-2" />
              <div className="text-2xl font-bold text-white">{mealEntries.length}</div>
              <div className="text-xs text-zinc-500">repas total</div>
            </div>
            {/* Entrées poids */}
            <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50 flex flex-col items-center justify-center">
              <Scale className="w-6 h-6 text-blue-400 mb-2" />
              <div className="text-2xl font-bold text-white">{weightEntries.length}</div>
              <div className="text-xs text-zinc-500">pesées</div>
            </div>
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

      {/* Food Database Viewer */}
      <FoodDatabaseViewer
        isOpen={showFoodDatabase}
        onClose={() => setShowFoodDatabase(false)}
      />
    </div>
  )
}
