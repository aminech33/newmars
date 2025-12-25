import { useState, useMemo, useEffect } from 'react'
import { 
  ArrowLeft, 
  Plus, 
  Scale, 
  Apple, 
  Droplets, 
  User,
  Activity,
  TrendingUp,
  Calendar,
  Settings
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useHealthData } from '../../hooks/useHealthData'

// Components
import { HealthStats } from './HealthStats'
import { WeightChart } from './WeightChart'
import { WeightList } from './WeightList'
import { MealList } from './MealList'
import { WeightModal } from './WeightModal'
import { MealModal } from './MealModal'
import { WaterTracker } from './WaterTracker'
import { ProfileSetupModal } from './ProfileSetupModal'
import { MacrosCircularChart } from './MacrosCircularChart'
import { DailyCalorieTracker } from './DailyCalorieTracker'
import { UndoToast } from '../ui/UndoToast'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Tooltip } from '../ui/Tooltip'

type HealthTab = 'overview' | 'nutrition' | 'weight' | 'water' | 'profile'

export function HealthPage() {
  const { setView, userProfile, healthGoals } = useStore()
  
  // Tab state
  const [activeTab, setActiveTab] = useState<HealthTab>('overview')
  
  // Modal states
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [showMealModal, setShowMealModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'weight' | 'meal'; id: string } | null>(null)
  const [undoData, setUndoData] = useState<{ type: 'weight' | 'meal'; data: any } | null>(null)
  const [showUndo, setShowUndo] = useState(false)
  
  // Health data
  const {
    latestWeight,
    targetWeight,
    bmi,
    bmiLabel,
    bmiColor,
    todayCalories,
    targetCalories,
    streak,
    trend,
    todayMeals,
    filteredWeightEntries,
    filteredMealEntries,
    handleAddWeight,
    handleAddMeal,
    deleteWeightEntry,
    deleteMealEntry
  } = useHealthData()
  
  // Calculer macros du jour
  const todayMacros = useMemo(() => ({
    protein: todayMeals.reduce((sum, m) => sum + (m.protein || 0), 0),
    carbs: todayMeals.reduce((sum, m) => sum + (m.carbs || 0), 0),
    fat: todayMeals.reduce((sum, m) => sum + (m.fat || 0), 0)
  }), [todayMeals])
  
  // Objectifs macros
  const proteinGoal = healthGoals.find(g => g.type === 'protein' && g.active)?.target || 150
  const carbsGoal = Math.round(targetCalories * 0.4 / 4) // 40% des calories
  const fatGoal = Math.round(targetCalories * 0.3 / 9) // 30% des calories
  
  // Handlers
  const handleDeleteWeight = (id: string) => {
    const entry = filteredWeightEntries.find(e => e.id === id)
    if (entry) {
      setUndoData({ type: 'weight', data: entry })
      deleteWeightEntry(id)
      setShowUndo(true)
      setTimeout(() => setShowUndo(false), 5000)
    }
    setConfirmDelete(null)
  }
  
  const handleDeleteMeal = (id: string) => {
    const entry = filteredMealEntries.find(e => e.id === id)
    if (entry) {
      setUndoData({ type: 'meal', data: entry })
      deleteMealEntry(id)
      setShowUndo(true)
      setTimeout(() => setShowUndo(false), 5000)
    }
    setConfirmDelete(null)
  }
  
  const handleUndo = () => {
    if (!undoData) return
    
    if (undoData.type === 'weight') {
      handleAddWeight(undoData.data)
    } else if (undoData.type === 'meal') {
      handleAddMeal(undoData.data)
    }
    
    setUndoData(null)
    setShowUndo(false)
  }
  
  // Raccourcis clavier
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl+P : Ajouter poids
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault()
        setShowWeightModal(true)
      }
      // Ctrl+M : Ajouter repas
      if (e.ctrlKey && e.key === 'm') {
        e.preventDefault()
        setShowMealModal(true)
      }
      // Ctrl+U : Ouvrir profil
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault()
        setShowProfileModal(true)
      }
      // 1-5 : Changer d'onglet
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === '1') setActiveTab('overview')
        if (e.key === '2') setActiveTab('nutrition')
        if (e.key === '3') setActiveTab('weight')
        if (e.key === '4') setActiveTab('water')
        if (e.key === '5') setActiveTab('profile')
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])
  
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Header */}
      <header className="flex-shrink-0 px-6 py-4 border-b border-zinc-800/50 backdrop-blur-xl">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('hub')}
              className="p-2 hover:bg-zinc-800/50 rounded-lg transition-colors"
              aria-label="Retour"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-zinc-200 flex items-center gap-2">
                <Activity className="w-6 h-6 text-emerald-400" />
                Santé & Nutrition
              </h1>
              <p className="text-sm text-zinc-500">Suivi complet de votre bien-être</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Tooltip content="Configurer profil (Ctrl+U)">
              <button
                onClick={() => setShowProfileModal(true)}
                className="p-2 hover:bg-zinc-800/50 rounded-lg transition-colors text-zinc-400 hover:text-indigo-400"
                aria-label="Configurer profil"
              >
                <Settings className="w-5 h-5" />
              </button>
            </Tooltip>
          </div>
        </div>
      </header>
      
      {/* Tabs */}
      <div className="flex-shrink-0 px-6 border-b border-zinc-800/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto">
          <nav className="flex gap-1 -mb-px" role="tablist">
            {([
              { id: 'overview', label: 'Vue d\'ensemble', icon: TrendingUp, shortcut: '1' },
              { id: 'nutrition', label: 'Nutrition', icon: Apple, shortcut: '2' },
              { id: 'weight', label: 'Poids', icon: Scale, shortcut: '3' },
              { id: 'water', label: 'Hydratation', icon: Droplets, shortcut: '4' },
              { id: 'profile', label: 'Profil', icon: User, shortcut: '5' }
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium transition-all rounded-t-xl flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'text-emerald-400 bg-zinc-900/50 border-b-2 border-emerald-500'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'
                }`}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-label={`${tab.label} (${tab.shortcut})`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className="text-xs text-zinc-600">{tab.shortcut}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Stats cards */}
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
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Calories tracker */}
                <div>
                  <h2 className="text-lg font-medium text-zinc-300 mb-4 flex items-center gap-2">
                    <Apple className="w-5 h-5 text-orange-400" />
                    Calories du jour
                  </h2>
                  <DailyCalorieTracker
                    todayMeals={todayMeals}
                    targetCalories={targetCalories}
                    targetProtein={proteinGoal}
                    targetCarbs={carbsGoal}
                    targetFat={fatGoal}
                  />
                </div>
                
                {/* Water tracker */}
                <div>
                  <h2 className="text-lg font-medium text-zinc-300 mb-4 flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-cyan-400" />
                    Hydratation
                  </h2>
                  <WaterTracker />
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Macros chart */}
                <div>
                  <h2 className="text-lg font-medium text-zinc-300 mb-4">
                    Macronutriments
                  </h2>
                  <MacrosCircularChart
                    protein={todayMacros.protein}
                    carbs={todayMacros.carbs}
                    fat={todayMacros.fat}
                    targetProtein={proteinGoal}
                    targetCarbs={carbsGoal}
                    targetFat={fatGoal}
                  />
                </div>
                
                {/* Weight chart mini */}
                <div>
                  <h2 className="text-lg font-medium text-zinc-300 mb-4 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-rose-400" />
                    Évolution poids
                  </h2>
                  <WeightChart entries={filteredWeightEntries.slice(-30)} height={280} />
                </div>
              </div>
            </>
          )}
          
          {/* Nutrition Tab */}
          {activeTab === 'nutrition' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-medium text-zinc-200">Journal alimentaire</h2>
                <Tooltip content="Ajouter un repas (Ctrl+M)">
                  <button
                    onClick={() => setShowMealModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-medium rounded-xl transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter un repas
                  </button>
                </Tooltip>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <DailyCalorieTracker
                  todayMeals={todayMeals}
                  targetCalories={targetCalories}
                  targetProtein={proteinGoal}
                  targetCarbs={carbsGoal}
                  targetFat={fatGoal}
                />
                
                <MacrosCircularChart
                  protein={todayMacros.protein}
                  carbs={todayMacros.carbs}
                  fat={todayMacros.fat}
                  targetProtein={proteinGoal}
                  targetCarbs={carbsGoal}
                  targetFat={fatGoal}
                />
              </div>
              
              <MealList
                entries={filteredMealEntries}
                onDelete={(id) => setConfirmDelete({ type: 'meal', id })}
              />
            </>
          )}
          
          {/* Weight Tab */}
          {activeTab === 'weight' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-medium text-zinc-200">Suivi du poids</h2>
                <Tooltip content="Ajouter pesée (Ctrl+P)">
                  <button
                    onClick={() => setShowWeightModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white font-medium rounded-xl transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter pesée
                  </button>
                </Tooltip>
              </div>
              
              <div className="mb-6">
                <WeightChart entries={filteredWeightEntries} height={320} />
              </div>
              
              <WeightList
                entries={filteredWeightEntries}
                onDelete={(id) => setConfirmDelete({ type: 'weight', id })}
              />
            </>
          )}
          
          {/* Water Tab */}
          {activeTab === 'water' && (
            <div className="max-w-2xl mx-auto">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-zinc-200 mb-2">Suivi d'hydratation</h2>
                <p className="text-zinc-500">Restez hydraté pour une santé optimale</p>
              </div>
              
              <WaterTracker />
              
              <div className="mt-8 p-6 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
                <h3 className="text-lg font-medium text-zinc-300 mb-4">💡 Conseils hydratation</h3>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li>• Buvez un verre d'eau au réveil pour réhydrater votre corps</li>
                  <li>• Gardez une bouteille à portée de main pendant la journée</li>
                  <li>• Buvez avant, pendant et après l'exercice physique</li>
                  <li>• L'eau aide à la concentration et à la performance cognitive</li>
                  <li>• Augmentez votre consommation par temps chaud</li>
                </ul>
              </div>
            </div>
          )}
          
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-zinc-200 mb-2">Configuration du profil</h2>
                <p className="text-zinc-500">Personnalisez vos objectifs nutritionnels</p>
              </div>
              
              {/* Current Profile Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="p-6 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
                  <h3 className="text-lg font-medium text-zinc-300 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-indigo-400" />
                    Informations physiques
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Taille</span>
                      <span className="text-zinc-200 font-medium">{userProfile.height} cm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Âge</span>
                      <span className="text-zinc-200 font-medium">{userProfile.age} ans</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Genre</span>
                      <span className="text-zinc-200 font-medium">
                        {userProfile.gender === 'male' ? '♂️ Homme' : userProfile.gender === 'female' ? '♀️ Femme' : '⚧️ Autre'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Poids actuel</span>
                      <span className="text-zinc-200 font-medium">{latestWeight > 0 ? `${latestWeight} kg` : 'Non renseigné'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
                  <h3 className="text-lg font-medium text-zinc-300 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    Niveau d'activité
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Activité</span>
                      <span className="text-zinc-200 font-medium capitalize">
                        {userProfile.activityLevel === 'sedentary' ? 'Sédentaire' :
                         userProfile.activityLevel === 'light' ? 'Léger' :
                         userProfile.activityLevel === 'moderate' ? 'Modéré' :
                         userProfile.activityLevel === 'active' ? 'Actif' : 'Très actif'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Current Goals */}
              <div className="p-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-500/20 mb-6">
                <h3 className="text-lg font-medium text-zinc-300 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  Objectifs nutritionnels actuels
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-zinc-500 mb-1">Calories</p>
                    <p className="text-2xl font-bold text-orange-400">{targetCalories}</p>
                    <p className="text-xs text-zinc-600">kcal/jour</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-zinc-500 mb-1">Protéines</p>
                    <p className="text-2xl font-bold text-rose-400">{proteinGoal}</p>
                    <p className="text-xs text-zinc-600">g/jour</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-zinc-500 mb-1">Glucides</p>
                    <p className="text-2xl font-bold text-amber-400">{carbsGoal}</p>
                    <p className="text-xs text-zinc-600">g/jour</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-zinc-500 mb-1">Lipides</p>
                    <p className="text-2xl font-bold text-yellow-400">{fatGoal}</p>
                    <p className="text-xs text-zinc-600">g/jour</p>
                  </div>
                </div>
              </div>
              
              {/* Action button */}
              <div className="text-center">
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-medium rounded-xl transition-all flex items-center gap-3 mx-auto shadow-lg"
                >
                  <Settings className="w-5 h-5" />
                  <span>Modifier mon profil et mes objectifs</span>
                </button>
                <p className="text-sm text-zinc-500 mt-3">
                  Raccourci clavier : <kbd className="px-2 py-1 bg-zinc-800 rounded text-zinc-400">Ctrl+U</kbd>
                </p>
              </div>
              
              {/* Info box */}
              <div className="mt-8 p-6 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
                <h3 className="text-lg font-medium text-zinc-300 mb-4">ℹ️ Comment ça marche ?</h3>
                <div className="space-y-3 text-sm text-zinc-400">
                  <p>
                    <strong className="text-zinc-300">1. Vos informations physiques</strong> (taille, âge, genre, poids) 
                    permettent de calculer votre métabolisme de base (BMR).
                  </p>
                  <p>
                    <strong className="text-zinc-300">2. Votre niveau d'activité</strong> multiplie ce BMR pour obtenir 
                    votre dépense énergétique totale (TDEE).
                  </p>
                  <p>
                    <strong className="text-zinc-300">3. Votre objectif</strong> ajuste automatiquement les calories :
                  </p>
                  <ul className="ml-4 space-y-1">
                    <li>🎯 <strong className="text-rose-400">Perdre du poids</strong> : TDEE - 500 cal (-0.5kg/semaine)</li>
                    <li>⚖️ <strong className="text-emerald-400">Maintenir</strong> : TDEE (poids stable)</li>
                    <li>💪 <strong className="text-cyan-400">Prendre du muscle</strong> : TDEE + 500 cal (+0.5kg/semaine)</li>
                  </ul>
                  <p>
                    <strong className="text-zinc-300">4. Les macronutriments</strong> sont répartis selon votre objectif 
                    pour optimiser vos résultats.
                  </p>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </div>
      
      {/* Modals */}
      <WeightModal
        isOpen={showWeightModal}
        onClose={() => setShowWeightModal(false)}
        onSubmit={(data) => {
          handleAddWeight(data)
          return { success: true }
        }}
      />
      
      <MealModal
        isOpen={showMealModal}
        onClose={() => setShowMealModal(false)}
        onSubmit={(data) => {
          handleAddMeal(data)
          return { success: true }
        }}
      />
      
      <ProfileSetupModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
      
      {/* Confirm dialogs */}
      {confirmDelete?.type === 'weight' && (
        <ConfirmDialog
          isOpen={true}
          title="Supprimer cette pesée ?"
          message="Cette action peut être annulée avec Ctrl+Z"
          confirmLabel="Supprimer"
          confirmVariant="danger"
          onConfirm={() => handleDeleteWeight(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      
      {confirmDelete?.type === 'meal' && (
        <ConfirmDialog
          isOpen={true}
          title="Supprimer ce repas ?"
          message="Cette action peut être annulée avec Ctrl+Z"
          confirmLabel="Supprimer"
          confirmVariant="danger"
          onConfirm={() => handleDeleteMeal(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      
      {/* Undo toast */}
      {showUndo && (
        <UndoToast
          message={`${undoData?.type === 'weight' ? 'Pesée' : 'Repas'} supprimé(e)`}
          onUndo={handleUndo}
          onClose={() => setShowUndo(false)}
        />
      )}
    </div>
  )
}

