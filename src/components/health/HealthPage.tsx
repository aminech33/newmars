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
import { getOptimalCalorieTarget, getCalorieInsights, calculateBMRWithBodyComposition } from '../../utils/healthIntelligence'
import { WithingsConnect } from './WithingsConnect'

type HealthTab = 'overview' | 'nutrition' | 'weight' | 'water' | 'profile'

export function HealthPage() {
  const { setView, userProfile, healthGoals, weightEntries, mealEntries } = useStore()
  
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
              {/* Connexion Withings */}
              <WithingsConnect />
              
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
                <p className="text-zinc-500">Personnalisez vos informations et objectifs nutritionnels</p>
              </div>
              
              {/* Connexion Withings */}
              <WithingsConnect />
              
              {/* Formulaire éditable */}
              <div className="p-6 bg-zinc-900/30 rounded-2xl border border-zinc-800/50 mb-6">
                <h3 className="text-lg font-medium text-zinc-300 mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-400" />
                  Informations physiques
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Taille */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      Taille (cm)
                    </label>
                    <input
                      type="number"
                      value={userProfile.height}
                      onChange={(e) => useStore.getState().setUserProfile({ height: parseInt(e.target.value) || 0 })}
                      min="100"
                      max="250"
                      className="w-full px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  
                  {/* Âge */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      Âge (ans)
                    </label>
                    <input
                      type="number"
                      value={userProfile.age}
                      onChange={(e) => useStore.getState().setUserProfile({ age: parseInt(e.target.value) || 0 })}
                      min="10"
                      max="120"
                      className="w-full px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  
                  {/* Genre */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      Genre
                    </label>
                    <select
                      value={userProfile.gender}
                      onChange={(e) => useStore.getState().setUserProfile({ gender: e.target.value as 'male' | 'female' | 'other' })}
                      className="w-full px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="male">♂️ Homme</option>
                      <option value="female">♀️ Femme</option>
                      <option value="other">⚧️ Autre</option>
                    </select>
                  </div>
                  
                  {/* Poids actuel (lecture seule) */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      Poids actuel (kg)
                    </label>
                    <div className="px-4 py-2 bg-zinc-800/30 border border-zinc-700/50 rounded-lg text-zinc-400 flex items-center justify-between">
                      <span>{latestWeight > 0 ? `${latestWeight} kg` : 'Non renseigné'}</span>
                      <button
                        onClick={() => setShowWeightModal(true)}
                        className="text-xs text-indigo-400 hover:text-indigo-300"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Niveau d'activité */}
              <div className="p-6 bg-zinc-900/30 rounded-2xl border border-zinc-800/50 mb-6">
                <h3 className="text-lg font-medium text-zinc-300 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  Niveau d'activité
                </h3>
                
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { value: 'sedentary', label: 'Sédentaire', description: 'Peu ou pas d\'exercice' },
                    { value: 'light', label: 'Léger', description: '1-3 jours/semaine' },
                    { value: 'moderate', label: 'Modéré', description: '3-5 jours/semaine' },
                    { value: 'active', label: 'Actif', description: '6-7 jours/semaine' },
                    { value: 'very_active', label: 'Très actif', description: 'Exercice intense quotidien' }
                  ].map((level) => (
                    <button
                      key={level.value}
                      onClick={() => useStore.getState().setUserProfile({ activityLevel: level.value as any })}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        userProfile.activityLevel === level.value
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                          : 'bg-zinc-800/30 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800/50 hover:border-zinc-600'
                      }`}
                    >
                      <div className="font-medium">{level.label}</div>
                      <div className="text-sm opacity-70 mt-1">{level.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Current Goals */}
              <div className="p-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-500/20 mb-6">
                <h3 className="text-lg font-medium text-zinc-300 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  Objectifs nutritionnels calculés
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
                <p className="text-xs text-zinc-500 text-center mt-4">
                  💡 Les objectifs se recalculent automatiquement quand tu modifies tes informations
                </p>
              </div>
              
              {/* Analyse avancée TDEE */}
              {(() => {
                const advancedCalories = getOptimalCalorieTarget(
                  userProfile,
                  latestWeight,
                  'maintain',
                  undefined,
                  { weightEntries, mealEntries }
                )
                
                const insights = getCalorieInsights(
                  userProfile,
                  latestWeight,
                  'maintain',
                  undefined,
                  { weightEntries, mealEntries }
                )
                
                return (
                  <div className="p-6 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-2xl border border-emerald-500/20 mb-6">
                    <h3 className="text-lg font-medium text-zinc-300 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      Analyse avancée de vos besoins
                    </h3>
                    
                    {/* Méthode de calcul et confiance */}
                    <div className="flex items-center justify-between mb-4 p-3 bg-zinc-900/30 rounded-lg">
                      <div>
                        <p className="text-sm text-zinc-400">{advancedCalories.methodLabel}</p>
                        <p className="text-xs text-zinc-600 mt-1">{advancedCalories.explanation}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-zinc-500">Confiance</p>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all ${
                                advancedCalories.confidence >= 75 ? 'bg-emerald-500' :
                                advancedCalories.confidence >= 50 ? 'bg-amber-500' : 'bg-orange-500'
                              }`}
                              style={{ width: `${advancedCalories.confidence}%` }}
                            />
                          </div>
                          <span className={`text-sm font-bold ${
                            advancedCalories.confidence >= 75 ? 'text-emerald-400' :
                            advancedCalories.confidence >= 50 ? 'text-amber-400' : 'text-orange-400'
                          }`}>
                            {advancedCalories.confidence}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* TDEE */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="p-4 bg-zinc-900/30 rounded-lg text-center">
                        <p className="text-xs text-zinc-500 mb-1">Votre TDEE</p>
                        <p className="text-3xl font-bold text-emerald-400">{advancedCalories.tdee}</p>
                        <p className="text-xs text-zinc-600">kcal/jour</p>
                      </div>
                      <div className="p-4 bg-zinc-900/30 rounded-lg text-center">
                        <p className="text-xs text-zinc-500 mb-1">Pour perdre (- 0.5kg/sem)</p>
                        <p className="text-2xl font-bold text-rose-400">{advancedCalories.tdee - 500}</p>
                        <p className="text-xs text-zinc-600">kcal/jour</p>
                      </div>
                      <div className="p-4 bg-zinc-900/30 rounded-lg text-center">
                        <p className="text-xs text-zinc-500 mb-1">Pour gagner (+ 0.5kg/sem)</p>
                        <p className="text-2xl font-bold text-cyan-400">{advancedCalories.tdee + 500}</p>
                        <p className="text-xs text-zinc-600">kcal/jour</p>
                      </div>
                    </div>
                    
                    {/* Insights */}
                    {insights.insights.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {insights.insights.map((insight, i) => (
                          <div key={i} className="flex items-start gap-2 p-2 bg-zinc-900/30 rounded-lg">
                            <span className="text-emerald-400 text-sm">✓</span>
                            <p className="text-xs text-zinc-400">{insight}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Recommendations */}
                    {insights.recommendations.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {insights.recommendations.map((rec, i) => (
                          <div key={i} className="flex items-start gap-2 p-2 bg-cyan-500/10 rounded-lg">
                            <span className="text-xs">{rec.split(' ')[0]}</span>
                            <p className="text-xs text-cyan-300">{rec.substring(rec.indexOf(' ') + 1)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Warnings */}
                    {insights.warnings.length > 0 && (
                      <div className="space-y-2">
                        {insights.warnings.map((warning, i) => (
                          <div key={i} className="flex items-start gap-2 p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg">
                            <span className="text-rose-400 text-sm">⚠️</span>
                            <p className="text-xs text-rose-300">{warning}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}
              
              {/* Info box */}
              <div className="p-6 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
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
                    <strong className="text-zinc-300">3. Les macronutriments</strong> sont répartis automatiquement 
                    pour optimiser vos résultats selon votre profil.
                  </p>
                  <p className="text-emerald-400 font-medium">
                    ✨ Toutes les modifications sont sauvegardées automatiquement !
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

