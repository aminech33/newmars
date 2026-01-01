import { useState, useEffect } from 'react'
import { User, Target, Activity, Check, X, Zap, Settings, TrendingUp, AlertTriangle } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { calculateBMR, calculateTDEE, calculateMacros, getOptimalCalorieTarget } from '../../utils/healthIntelligence'
import { useHealthIntelligence } from '../../hooks/useHealthIntelligence'
import { useLatestWeight } from '../../hooks/useLatestWeight'
import { PremiumCard } from './shared/PremiumCard'

interface ProfileSetupModalProps {
  isOpen: boolean
  onClose: () => void
}

// Données personnelles fixes (hardcodées pour usage personnel)
const BIRTH_DATE = '1997-01-23'
const GENDER = 'male'
const HEIGHT = 175 // cm (hardcodé, ne change pas)

// Niveaux d'activité simplifiés : 5 → 3 (Cognitive Load Reduction)
const ACTIVITY_LEVELS = [
  { value: 'light', icon: '🚶', label: 'Léger', description: '1-2 séances/semaine', multiplier: 1.375 },
  { value: 'moderate', icon: '🏃', label: 'Modéré', description: '3-4 séances/semaine', multiplier: 1.55 },
  { value: 'active', icon: '🏋️', label: 'Actif', description: '5+ séances/semaine', multiplier: 1.725 }
] as const

const GOALS = [
  { value: 'lose', icon: '📉', label: 'Perdre', description: '-500 cal/jour' },
  { value: 'maintain', icon: '⚖️', label: 'Maintenir', description: 'Poids stable' },
  { value: 'gain', icon: '💪', label: 'Gagner', description: '+500 cal/jour' }
] as const

// Calculer l'âge depuis la date de naissance
const calculateAge = (birthDate: string): number => {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export function ProfileSetupModal({ isOpen, onClose }: ProfileSetupModalProps) {
  const { userProfile, setUserProfile, healthGoals, addHealthGoal, updateHealthGoal, mealEntries } = useStore()
  
  // Hook intelligent
  const intelligence = useHealthIntelligence()
  
  // Calculer l'âge automatiquement
  const age = calculateAge(BIRTH_DATE)
  
  // Hook personnalisé pour récupérer le dernier poids
  const currentWeight = useLatestWeight(isOpen)
  
  // État du formulaire (ultra-simplifié : juste activité + objectif)
  const [activityLevel, setActivityLevel] = useState(userProfile.activityLevel || 'moderate')
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain')
  const [weightChangeRate, setWeightChangeRate] = useState<'moderate' | 'normal' | 'fast'>('moderate') // Simplifié : 3 options
  const [useIntelligentMode, setUseIntelligentMode] = useState(true) // Mode intelligent par défaut
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false) // Masquer détails par défaut
  
  // Charger l'objectif actuel
  useEffect(() => {
    if (isOpen) {
      const caloriesGoal = healthGoals.find(g => g.type === 'calories' && g.active)
      if (caloriesGoal) {
        const bmr = calculateBMR(currentWeight, HEIGHT, age, GENDER)
        const tdee = calculateTDEE(bmr, activityLevel)
        
        // Déterminer l'objectif selon la différence
        if (caloriesGoal.target < tdee - 200) setGoal('lose')
        else if (caloriesGoal.target > tdee + 200) setGoal('gain')
        else setGoal('maintain')
      }
    }
  }, [isOpen, healthGoals, currentWeight, activityLevel, age])
  
  // Calculer les recommandations en temps réel
  const recommendations = (() => {
    if (currentWeight === 0) return null
    
    // Récupérer la dernière pesée avec données Withings
    const latestWeightEntry = weightEntries.length > 0 
      ? [...weightEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      : null
    
    let bmr: number
    let tdee: number
    let method: string = 'standard'
    let confidence: number = 50
    let explanation: string = ''
    
    if (useIntelligentMode) {
      // MODE INTELLIGENT : Utiliser l'algorithme avancé
      const optimal = getOptimalCalorieTarget(
        { height: HEIGHT, age, gender: GENDER, activityLevel },
        currentWeight,
        goal,
        latestWeightEntry ? {
          fatMassPercent: latestWeightEntry.fatMassPercent,
          muscleMass: latestWeightEntry.muscleMass
        } : undefined,
        {
          weightEntries,
          mealEntries
        }
      )
      
      // Récupérer le multiplier depuis ACTIVITY_LEVELS
      const activityMultiplier = ACTIVITY_LEVELS.find(a => a.value === activityLevel)?.multiplier || 1.55
      bmr = optimal.tdee / activityMultiplier
      tdee = optimal.tdee
      method = optimal.methodLabel
      confidence = optimal.confidence
      explanation = optimal.explanation
    } else {
      // MODE MANUEL : Calcul simple
      bmr = calculateBMR(currentWeight, HEIGHT, age, GENDER)
      tdee = calculateTDEE(bmr, activityLevel)
      method = 'Calcul manuel (Mifflin-St Jeor)'
      confidence = 50
      explanation = 'Calcul standard basé sur votre poids, taille, âge et niveau d\'activité.'
    }
    
    // Calculer le déficit/surplus basé sur le rythme souhaité
    // 1 kg de graisse = 7700 kcal
    // Déficit quotidien = (kg/semaine × 7700) / 7
    const weightChangeRateKg = weightChangeRate === 'moderate' ? 0.5 : weightChangeRate === 'normal' ? 0.7 : 1.0
    const dailyCalorieAdjustment = Math.round((weightChangeRateKg * 7700) / 7)
    
    let targetCalories = tdee
    if (goal === 'lose') targetCalories = tdee - dailyCalorieAdjustment
    else if (goal === 'gain') targetCalories = tdee + dailyCalorieAdjustment
    
    const macros = calculateMacros(targetCalories, goal)
    
    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      targetCalories: Math.round(targetCalories),
      macros,
      dailyCalorieAdjustment,
      method,
      confidence,
      explanation
    }
  })()
  
  const handleSubmit = () => {
    // Validation simple
    if (currentWeight === 0) {
      useStore.getState().addToast('Veuillez enregistrer votre poids d\'abord', 'error')
      return
    }
    
    // Sauvegarder le profil avec les données fixes (hardcodées)
    setUserProfile({
      height: HEIGHT,
      age,
      gender: GENDER,
      activityLevel
    })
    
    // Créer/Mettre à jour l'objectif calories
    if (recommendations) {
      const existingGoal = healthGoals.find(g => g.type === 'calories' && g.active)
      
      if (existingGoal) {
        updateHealthGoal(existingGoal.id, {
          target: recommendations.targetCalories,
          current: 0
        })
      } else {
        addHealthGoal({
          type: 'calories',
          target: recommendations.targetCalories,
          current: 0,
          unit: 'kcal',
          startDate: new Date().toISOString().split('T')[0],
          active: true
        })
      }
      
      // Créer/Mettre à jour objectif protéines
      const existingProteinGoal = healthGoals.find(g => g.type === 'protein' && g.active)
      if (existingProteinGoal) {
        updateHealthGoal(existingProteinGoal.id, {
          target: recommendations.macros.protein,
          current: 0
        })
      } else {
        addHealthGoal({
          type: 'protein',
          target: recommendations.macros.protein,
          current: 0,
          unit: 'g',
          startDate: new Date().toISOString().split('T')[0],
          active: true
        })
      }
    }
    
    useStore.getState().addToast('Profil mis à jour avec succès ! 🎉', 'success')
    onClose()
  }
  
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-700/50 rounded-2xl shadow-2xl shadow-black/40 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header - Premium */}
        <div className="sticky top-0 bg-gradient-to-b from-zinc-900 to-zinc-900/95 backdrop-blur-xl border-b border-zinc-700/50 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/20">
              <Settings className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">Configuration</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-xl transition-all"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Premium spacing */}
        <div className="p-6 space-y-6">
          {/* Profil (simplifié : juste poids actuel) - Premium card */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              Profil
            </h3>
            <div className="px-4 py-4 bg-gradient-to-br from-zinc-800/40 to-zinc-900/40 border border-zinc-700/50 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Poids actuel</div>
                  <div className="text-2xl font-bold text-zinc-100">
                    {currentWeight > 0 ? `${currentWeight.toFixed(1)} kg` : '—'}
                  </div>
                </div>
                {currentWeight > 0 && weightEntries.length > 0 && (
                  <div className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-lg">
                    {new Date(weightEntries[weightEntries.length - 1].date).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </div>
                )}
              </div>
              <div className="text-xs text-zinc-500 pt-3 border-t border-zinc-700/30 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="text-zinc-600">📏</span> {HEIGHT} cm
                </span>
                <span className="text-zinc-700">·</span>
                <span className="flex items-center gap-1">
                  <span className="text-zinc-600">🎂</span> {age} ans
                </span>
                <span className="text-zinc-700">·</span>
                <span className="flex items-center gap-1">
                  <span className="text-zinc-600">👤</span> {GENDER === 'male' ? 'Homme' : 'Femme'}
                </span>
              </div>
            </div>
          </div>

          {/* Objectif - Premium cards */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-400" />
              Objectif
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {GOALS.map(({ value, icon, label }) => (
                <button
                  key={value}
                  onClick={() => setGoal(value)}
                  className={`group px-4 py-4 rounded-xl border-2 transition-all text-sm font-semibold ${
                    goal === value
                      ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/60 text-indigo-200 shadow-lg shadow-indigo-500/10'
                      : 'bg-zinc-800/30 border-zinc-700/50 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="text-2xl mb-2">{icon}</div>
                  {label}
                </button>
              ))}
            </div>
            
            {/* Rythme simplifié (3 options) - Premium */}
            {goal !== 'maintain' && (
              <div className="mt-4 p-4 bg-gradient-to-br from-zinc-800/30 to-zinc-900/30 border border-zinc-700/40 rounded-xl">
                <span className="text-xs font-medium text-zinc-400 block mb-3 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Rythme de {goal === 'lose' ? 'perte' : 'gain'}
                </span>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setWeightChangeRate('moderate')}
                    className={`px-3 py-3 rounded-xl text-xs font-medium transition-all border ${
                      weightChangeRate === 'moderate'
                        ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-200 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                        : 'bg-zinc-800/40 text-zinc-500 border-zinc-700/50 hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="font-bold text-sm">Modéré</div>
                    <div className="text-[10px] opacity-70 mt-1">0.5 kg/sem</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeightChangeRate('normal')}
                    className={`px-3 py-3 rounded-xl text-xs font-medium transition-all border ${
                      weightChangeRate === 'normal'
                        ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-200 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                        : 'bg-zinc-800/40 text-zinc-500 border-zinc-700/50 hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="font-bold text-sm">Normal</div>
                    <div className="text-[10px] opacity-70 mt-1">0.7 kg/sem</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeightChangeRate('fast')}
                    className={`px-3 py-3 rounded-xl text-xs font-medium transition-all border ${
                      weightChangeRate === 'fast'
                        ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-200 border-amber-500/50 shadow-lg shadow-amber-500/10'
                        : 'bg-zinc-800/40 text-zinc-500 border-zinc-700/50 hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="font-bold text-sm">Rapide</div>
                    <div className="text-[10px] opacity-70 mt-1">1.0 kg/sem</div>
                  </button>
                </div>
                
                {/* Info déficit/surplus */}
                {recommendations && (
                  <p className="text-xs text-zinc-500 mt-3 text-center">
                    {goal === 'lose' ? '📉 Déficit' : '📈 Surplus'} : <span className="text-zinc-400 font-medium">{recommendations.dailyCalorieAdjustment} kcal/jour</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Activité physique (inline) - Premium */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Activité physique
            </h3>
            
            {/* Icônes + Radio dots - Plus grand et spacieux */}
            <div className="flex items-center justify-center gap-12 mb-4 p-4 bg-gradient-to-br from-zinc-800/20 to-zinc-900/20 rounded-xl border border-zinc-700/30">
              {ACTIVITY_LEVELS.map(({ value, icon }) => (
                <button
                  key={value}
                  onClick={() => setActivityLevel(value)}
                  className="flex flex-col items-center gap-3 transition-all hover:scale-110"
                >
                  <span className={`text-4xl transition-all ${
                    activityLevel === value ? 'opacity-100 scale-110' : 'opacity-30 hover:opacity-60'
                  }`}>
                    {icon}
                  </span>
                  <div className={`w-2.5 h-2.5 rounded-full transition-all ${
                    activityLevel === value 
                      ? 'bg-indigo-500 scale-100 shadow-lg shadow-indigo-500/50' 
                      : 'bg-zinc-700 scale-75'
                  }`} />
                </button>
              ))}
            </div>
            
            {/* Description dynamique - Plus visible */}
            <p className="text-center text-sm font-medium text-zinc-300">
              {ACTIVITY_LEVELS.find(a => a.value === activityLevel)?.label}
              <span className="text-zinc-600 mx-2">·</span>
              <span className="text-zinc-500">{ACTIVITY_LEVELS.find(a => a.value === activityLevel)?.description}</span>
            </p>
          </div>

          {/* Recommandations calculées (simplifié) */}
          {recommendations && currentWeight > 0 && (
            <div className="pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                  📊 Vos besoins
                </h3>
                
                {/* Toggle Mode Intelligent / Manuel */}
                <button
                  onClick={() => setUseIntelligentMode(!useIntelligentMode)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    useIntelligentMode
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      : 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/50'
                  }`}
                  title={useIntelligentMode ? 'Mode intelligent activé' : 'Mode manuel'}
                >
                  {useIntelligentMode ? (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Intelligent</span>
                    </>
                  ) : (
                    <>
                      <Settings className="w-3.5 h-3.5" />
                      <span>Manuel</span>
                    </>
                  )}
                </button>
              </div>
              
              {/* Anomalies détectées silencieusement (pas affichées - philosophie non-anxiogène) */}
              
              {/* Méthode et confiance (label qualitatif) - Premium */}
              <div className="mb-4 p-3 bg-gradient-to-br from-zinc-800/40 to-zinc-900/40 border border-zinc-700/40 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {useIntelligentMode && recommendations.confidence >= 75 ? '✅' :
                     useIntelligentMode && recommendations.confidence >= 50 ? '⚠️' :
                     useIntelligentMode && recommendations.method.includes('composition') ? '💪' : '🔄'}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-zinc-200">
                      {useIntelligentMode && recommendations.confidence >= 75 ? 'Calcul fiable' :
                       useIntelligentMode && recommendations.confidence >= 50 ? 'Calcul estimé' :
                       useIntelligentMode && recommendations.method.includes('composition') ? 'Calcul avec composition corporelle' :
                       'Calcul standard'}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {recommendations.method}
                    </div>
                  </div>
                  {useIntelligentMode && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                      recommendations.confidence >= 80 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      recommendations.confidence >= 60 ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                      'bg-zinc-700/50 text-zinc-400 border border-zinc-700/50'
                    }`}>
                      {recommendations.confidence}%
                    </span>
                  )}
                </div>
              </div>
              
              {/* Suggestions actionnables */}
              {recommendations.confidence < 80 && (
                <div className="mb-3 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                  <p className="text-xs font-medium text-indigo-400 mb-2">
                    🎯 Pour améliorer la précision :
                  </p>
                  <ul className="text-[10px] text-zinc-400 space-y-1">
                    {intelligence.progressionData.weightsPerWeek < 2 && (
                      <li>• Pesez-vous 2x/semaine (actuellement : {intelligence.progressionData.weightsPerWeek}x)</li>
                    )}
                    {intelligence.progressionData.mealsPerWeek < 5 && (
                      <li>• Trackez vos repas 5 jours/semaine (actuellement : {intelligence.progressionData.mealsPerWeek} jours)</li>
                    )}
                    {!intelligence.progressionData.hasWithingsData && (
                      <li>• Connectez Withings pour +25% de précision</li>
                    )}
                    {intelligence.progressionData.daysTracked < 14 && (
                      <li>• Continuez {14 - intelligence.progressionData.daysTracked} jours de plus pour un calcul optimal</li>
                    )}
                  </ul>
                </div>
              )}
              
              {/* Calories (ÉNORME chiffre centré) - Premium */}
              <div className="text-center mb-6 p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl">
                <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                  {recommendations.targetCalories}
                </p>
                <p className="text-sm text-zinc-400 mt-2 font-medium">
                  kcal/jour
                </p>
                <p className="text-xs text-zinc-600 mt-3 flex items-center justify-center gap-3">
                  <span>TDEE: <span className="text-zinc-500 font-medium">{recommendations.tdee}</span></span>
                  <span className="text-zinc-700">·</span>
                  <span>BMR: <span className="text-zinc-500 font-medium">{recommendations.bmr}</span></span>
                </p>
              </div>
              
              {/* Macros (3 colonnes) - Premium cards */}
              <div className="grid grid-cols-3 gap-3 text-center mb-5">
                <div className="p-4 bg-gradient-to-br from-rose-500/10 to-pink-500/10 border border-rose-500/20 rounded-xl">
                  <p className="text-2xl font-bold text-rose-400">
                    {recommendations.macros.protein}g
                  </p>
                  <p className="text-xs text-zinc-500 mt-2 font-medium">Protéines</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl">
                  <p className="text-2xl font-bold text-amber-400">
                    {recommendations.macros.carbs}g
                  </p>
                  <p className="text-xs text-zinc-500 mt-2 font-medium">Glucides</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 rounded-xl">
                  <p className="text-2xl font-bold text-yellow-400">
                    {recommendations.macros.fat}g
                  </p>
                  <p className="text-xs text-zinc-500 mt-2 font-medium">Lipides</p>
                </div>
              </div>
              
              {/* Prédictions */}
              {intelligence.prediction && goal !== 'maintain' && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-emerald-400 mb-1">
                        📈 Prédiction
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        À ce rythme ({intelligence.prediction.currentWeeklyChange > 0 ? '+' : ''}
                        {intelligence.prediction.currentWeeklyChange.toFixed(1)}kg/sem), vous atteindrez 
                        votre objectif dans{' '}
                        <span className="font-bold text-emerald-400">
                          {intelligence.prediction.weeksToGoal} semaine{intelligence.prediction.weeksToGoal > 1 ? 's' : ''}
                        </span>
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-1">
                        Date estimée : {intelligence.prediction.predictedDate.toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Premium */}
        <div className="sticky bottom-0 bg-gradient-to-t from-zinc-900 to-zinc-900/95 backdrop-blur-xl border-t border-zinc-700/50 px-6 py-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-5 py-3 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 rounded-xl transition-all text-sm font-semibold border border-zinc-700/50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={currentWeight === 0}
            className="flex-1 px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl transition-all text-sm font-semibold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  )
}






