import { useState, useEffect } from 'react'
import { User, Target, Activity, Check, X, Zap, Settings, TrendingUp, AlertTriangle } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { calculateBMR, calculateTDEE, calculateMacros, getOptimalCalorieTarget } from '../../utils/healthIntelligence'
import { useHealthIntelligence } from '../../hooks/useHealthIntelligence'

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
  const { userProfile, setUserProfile, healthGoals, addHealthGoal, updateHealthGoal, weightEntries, mealEntries } = useStore()
  
  // Hook intelligent
  const intelligence = useHealthIntelligence()
  
  // Calculer l'âge automatiquement
  const age = calculateAge(BIRTH_DATE)
  
  // État du formulaire (ultra-simplifié : juste activité + objectif)
  const [activityLevel, setActivityLevel] = useState(userProfile.activityLevel || 'moderate')
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain')
  const [weightChangeRate, setWeightChangeRate] = useState<'moderate' | 'normal' | 'fast'>('moderate') // Simplifié : 3 options
  const [currentWeight, setCurrentWeight] = useState(0)
  const [useIntelligentMode, setUseIntelligentMode] = useState(true) // Mode intelligent par défaut
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false) // Masquer détails par défaut
  
  // Récupérer le poids actuel
  useEffect(() => {
    if (isOpen && weightEntries.length > 0) {
      const latest = [...weightEntries]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      setCurrentWeight(latest.weight)
    }
  }, [isOpen, weightEntries])
  
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-200">⚙️ Configuration</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 rounded-lg transition-all"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Profil (simplifié : juste poids actuel) */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Profil
            </h3>
            <div className="px-3 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-zinc-500 mb-0.5">Poids actuel</div>
                  <div className="text-lg font-semibold text-zinc-200">
                    {currentWeight > 0 ? `${currentWeight.toFixed(1)} kg` : '—'}
                  </div>
                </div>
                {currentWeight > 0 && weightEntries.length > 0 && (
                  <div className="text-[10px] text-zinc-600">
                    {new Date(weightEntries[weightEntries.length - 1].date).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </div>
                )}
              </div>
              <div className="text-[10px] text-zinc-600 mt-2 flex items-center gap-3">
                <span>Taille : {HEIGHT} cm</span>
                <span>·</span>
                <span>Âge : {age} ans</span>
                <span>·</span>
                <span>Genre : {GENDER === 'male' ? 'Homme' : 'Femme'}</span>
              </div>
            </div>
          </div>

          {/* Objectif */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Objectif
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {GOALS.map(({ value, icon, label }) => (
                <button
                  key={value}
                  onClick={() => setGoal(value)}
                  className={`px-3 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                    goal === value
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                      : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  <div className="text-xl mb-1">{icon}</div>
                  {label}
                </button>
              ))}
            </div>
            
            {/* Rythme simplifié (3 options) */}
            {goal !== 'maintain' && (
              <div className="mt-3 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                <span className="text-xs text-zinc-500 block mb-2">
                  Rythme de {goal === 'lose' ? 'perte' : 'gain'}
                </span>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setWeightChangeRate('moderate')}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      weightChangeRate === 'moderate'
                        ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/50'
                        : 'bg-zinc-800/50 text-zinc-500 border border-zinc-700/50 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="font-semibold">Modéré</div>
                    <div className="text-[10px] opacity-70">0.5 kg/sem</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeightChangeRate('normal')}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      weightChangeRate === 'normal'
                        ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/50'
                        : 'bg-zinc-800/50 text-zinc-500 border border-zinc-700/50 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="font-semibold">Normal</div>
                    <div className="text-[10px] opacity-70">0.7 kg/sem</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeightChangeRate('fast')}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      weightChangeRate === 'fast'
                        ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50'
                        : 'bg-zinc-800/50 text-zinc-500 border border-zinc-700/50 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="font-semibold">Rapide</div>
                    <div className="text-[10px] opacity-70">1.0 kg/sem</div>
                  </button>
                </div>
                
                {/* Info déficit/surplus */}
                {recommendations && (
                  <p className="text-[10px] text-zinc-500 mt-2">
                    {goal === 'lose' ? 'Déficit' : 'Surplus'} : {recommendations.dailyCalorieAdjustment} kcal/jour
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Activité physique (inline) */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Activité physique
            </h3>
            
            {/* Icônes + Radio dots */}
            <div className="flex items-center justify-center gap-8 mb-3">
              {ACTIVITY_LEVELS.map(({ value, icon }) => (
                <button
                  key={value}
                  onClick={() => setActivityLevel(value)}
                  className="flex flex-col items-center gap-2 transition-transform hover:scale-110"
                >
                  <span className={`text-3xl transition-opacity ${
                    activityLevel === value ? 'opacity-100' : 'opacity-40 hover:opacity-70'
                  }`}>
                    {icon}
                  </span>
                  <div className={`w-2 h-2 rounded-full transition-all ${
                    activityLevel === value 
                      ? 'bg-indigo-500 scale-100' 
                      : 'bg-zinc-700 scale-75'
                  }`} />
                </button>
              ))}
            </div>
            
            {/* Description dynamique */}
            <p className="text-center text-sm text-zinc-400">
              {ACTIVITY_LEVELS.find(a => a.value === activityLevel)?.label}
              {' · '}
              {ACTIVITY_LEVELS.find(a => a.value === activityLevel)?.description}
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
              
              {/* Anomalies (si détectées) */}
              {intelligence.anomaly && (
                <div className={`mb-3 p-3 rounded-lg border ${
                  intelligence.anomaly.type === 'danger'
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : 'bg-amber-500/10 border-amber-500/30'
                }`}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      intelligence.anomaly.type === 'danger' ? 'text-rose-400' : 'text-amber-400'
                    }`} />
                    <div className="flex-1">
                      <p className={`text-xs font-medium ${
                        intelligence.anomaly.type === 'danger' ? 'text-rose-400' : 'text-amber-400'
                      }`}>
                        {intelligence.anomaly.message}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        {intelligence.anomaly.suggestion}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Méthode et confiance (label qualitatif) */}
              <div className="mb-3 p-2.5 bg-zinc-900/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {useIntelligentMode && recommendations.confidence >= 75 ? '✅' :
                     useIntelligentMode && recommendations.confidence >= 50 ? '⚠️' :
                     useIntelligentMode && recommendations.method.includes('composition') ? '💪' : '🔄'}
                  </span>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-zinc-300">
                      {useIntelligentMode && recommendations.confidence >= 75 ? 'Calcul fiable' :
                       useIntelligentMode && recommendations.confidence >= 50 ? 'Calcul estimé' :
                       useIntelligentMode && recommendations.method.includes('composition') ? 'Calcul avec composition corporelle' :
                       'Calcul standard'}
                    </div>
                    <div className="text-[10px] text-zinc-600 mt-0.5">
                      {recommendations.method}
                    </div>
                  </div>
                  {useIntelligentMode && (
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      recommendations.confidence >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                      recommendations.confidence >= 60 ? 'bg-indigo-500/20 text-indigo-400' :
                      'bg-zinc-700/50 text-zinc-500'
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
              
              {/* Calories (gros chiffre centré) */}
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-indigo-400">
                  {recommendations.targetCalories} <span className="text-lg text-zinc-500">kcal/jour</span>
                </p>
                <p className="text-xs text-zinc-600 mt-1">
                  TDEE: {recommendations.tdee} kcal · BMR: {recommendations.bmr} kcal
                </p>
              </div>
              
              {/* Macros (3 colonnes) */}
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <p className="text-xl font-semibold text-rose-400">
                    {recommendations.macros.protein}g
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">Protéines</p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-amber-400">
                    {recommendations.macros.carbs}g
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">Glucides</p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-yellow-400">
                    {recommendations.macros.fat}g
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">Lipides</p>
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

        {/* Footer */}
        <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 px-5 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 rounded-lg transition-all text-sm font-medium"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={currentWeight === 0}
            className="flex-1 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  )
}






