/**
 * Formulaire inline pour configurer le profil santé
 * Remplace le modal pour une meilleure UX
 */
import { useState, useEffect } from 'react'
import { User, Target, Activity, Zap, Settings, ChevronDown, ChevronUp, X } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { calculateBMR, calculateTDEE, calculateMacros, getOptimalCalorieTarget } from '../../utils/healthIntelligence'
import { WeightEntry } from '../../types/health'

interface InlineProfileFormProps {
  onClose: () => void
  currentWeight: number
  weightEntries: WeightEntry[]
}

// Données personnelles fixes (hardcodées pour usage personnel)
const BIRTH_DATE = '1997-01-23'
const GENDER = 'male'
const HEIGHT = 175 // cm

// Niveaux d'activité
const ACTIVITY_LEVELS = [
  { value: 'light', icon: '🚶', label: 'Léger', description: '1-2x/sem', multiplier: 1.375 },
  { value: 'moderate', icon: '🏃', label: 'Modéré', description: '3-4x/sem', multiplier: 1.55 },
  { value: 'active', icon: '🏋️', label: 'Actif', description: '5+/sem', multiplier: 1.725 }
] as const

const GOALS = [
  { value: 'lose', icon: '📉', label: 'Perdre' },
  { value: 'maintain', icon: '⚖️', label: 'Maintenir' },
  { value: 'gain', icon: '💪', label: 'Gagner' }
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

export function InlineProfileForm({ onClose, currentWeight, weightEntries }: InlineProfileFormProps) {
  const { userProfile, setUserProfile, healthGoals, addHealthGoal, updateHealthGoal, mealEntries, addToast } = useStore()

  // Calculer l'âge automatiquement
  const age = calculateAge(BIRTH_DATE)

  // État du formulaire
  const [activityLevel, setActivityLevel] = useState(userProfile.activityLevel || 'moderate')
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>(userProfile.goal as 'lose' | 'maintain' | 'gain' || 'maintain')
  const [weightChangeRate, setWeightChangeRate] = useState<'moderate' | 'normal' | 'fast'>('moderate')
  const [useIntelligentMode, setUseIntelligentMode] = useState(true)
  const [isExpanded, setIsExpanded] = useState(true)
  const [showDetails, setShowDetails] = useState(false)

  // Charger l'objectif actuel
  useEffect(() => {
    const caloriesGoal = healthGoals.find(g => g.type === 'calories' && g.active)
    if (caloriesGoal && currentWeight > 0) {
      const bmr = calculateBMR(currentWeight, HEIGHT, age, GENDER)
      const tdee = calculateTDEE(bmr, activityLevel)

      if (caloriesGoal.target < tdee - 200) setGoal('lose')
      else if (caloriesGoal.target > tdee + 200) setGoal('gain')
      else setGoal('maintain')
    }
  }, [healthGoals, currentWeight, activityLevel, age])

  // Calculer les recommandations en temps réel
  const recommendations = (() => {
    if (currentWeight === 0) return null

    const latestWeightEntry = weightEntries.length > 0
      ? [...weightEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      : null

    let bmr: number
    let tdee: number
    let method: string = 'standard'
    let confidence: number = 50

    if (useIntelligentMode) {
      const optimal = getOptimalCalorieTarget(
        { height: HEIGHT, age, gender: GENDER, activityLevel },
        currentWeight,
        goal,
        latestWeightEntry ? {
          fatMassPercent: latestWeightEntry.fatMassPercent,
          muscleMass: latestWeightEntry.muscleMass
        } : undefined,
        { weightEntries, mealEntries }
      )

      const activityMultiplier = ACTIVITY_LEVELS.find(a => a.value === activityLevel)?.multiplier || 1.55
      bmr = optimal.tdee / activityMultiplier
      tdee = optimal.tdee
      method = optimal.methodLabel
      confidence = optimal.confidence
    } else {
      bmr = calculateBMR(currentWeight, HEIGHT, age, GENDER)
      tdee = calculateTDEE(bmr, activityLevel)
      method = 'Mifflin-St Jeor'
      confidence = 50
    }

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
      confidence
    }
  })()

  const handleSubmit = () => {
    if (currentWeight === 0) {
      addToast('Veuillez enregistrer votre poids d\'abord', 'error')
      return
    }

    setUserProfile({
      height: HEIGHT,
      age,
      gender: GENDER,
      activityLevel,
      goal
    })

    if (recommendations) {
      const existingGoal = healthGoals.find(g => g.type === 'calories' && g.active)

      if (existingGoal) {
        updateHealthGoal(existingGoal.id, { target: recommendations.targetCalories, current: 0 })
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

      const existingProteinGoal = healthGoals.find(g => g.type === 'protein' && g.active)
      if (existingProteinGoal) {
        updateHealthGoal(existingProteinGoal.id, { target: recommendations.macros.protein, current: 0 })
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

    addToast('Profil mis à jour', 'success')
    onClose()
  }

  return (
    <div className="bg-zinc-900/80 rounded-xl border border-indigo-500/30 overflow-hidden">
      {/* Header cliquable */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-zinc-200">Configuration</h3>
            {recommendations && (
              <p className="text-xs text-indigo-400">{recommendations.targetCalories} kcal/j</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClose() }}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50 rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-zinc-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-zinc-500" />
          )}
        </div>
      </button>

      {/* Contenu */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* Profil résumé */}
          <div className="p-3 bg-zinc-800/40 border border-zinc-700/40 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium text-zinc-300">
                  {currentWeight > 0 ? `${currentWeight.toFixed(1)} kg` : 'Aucun poids'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>{HEIGHT} cm</span>
                <span>·</span>
                <span>{age} ans</span>
              </div>
            </div>
          </div>

          {/* Objectif */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-medium text-zinc-400">Objectif</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {GOALS.map(({ value, icon, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setGoal(value)}
                  className={`p-3 rounded-lg border transition-all text-center ${
                    goal === value
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                      : 'bg-zinc-800/40 border-zinc-700/40 text-zinc-500 hover:border-zinc-600'
                  }`}
                >
                  <div className="text-xl mb-1">{icon}</div>
                  <div className="text-xs font-medium">{label}</div>
                </button>
              ))}
            </div>

            {/* Rythme (si perte/gain) */}
            {goal !== 'maintain' && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { value: 'moderate', label: '0.5 kg/sem', color: 'emerald' },
                  { value: 'normal', label: '0.7 kg/sem', color: 'indigo' },
                  { value: 'fast', label: '1.0 kg/sem', color: 'amber' }
                ].map(({ value, label, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setWeightChangeRate(value as 'moderate' | 'normal' | 'fast')}
                    className={`px-2 py-2 rounded-lg text-[10px] font-medium transition-all border ${
                      weightChangeRate === value
                        ? `bg-${color}-500/20 text-${color}-300 border-${color}-500/40`
                        : 'bg-zinc-800/40 text-zinc-500 border-zinc-700/40 hover:border-zinc-600'
                    }`}
                    style={{
                      backgroundColor: weightChangeRate === value
                        ? color === 'emerald' ? 'rgba(16, 185, 129, 0.2)'
                          : color === 'indigo' ? 'rgba(99, 102, 241, 0.2)'
                            : 'rgba(245, 158, 11, 0.2)'
                        : undefined,
                      color: weightChangeRate === value
                        ? color === 'emerald' ? 'rgb(110, 231, 183)'
                          : color === 'indigo' ? 'rgb(165, 180, 252)'
                            : 'rgb(252, 211, 77)'
                        : undefined,
                      borderColor: weightChangeRate === value
                        ? color === 'emerald' ? 'rgba(16, 185, 129, 0.4)'
                          : color === 'indigo' ? 'rgba(99, 102, 241, 0.4)'
                            : 'rgba(245, 158, 11, 0.4)'
                        : undefined
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Activité */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-zinc-400">Activité</span>
            </div>
            <div className="flex items-center justify-center gap-8 p-3 bg-zinc-800/30 rounded-lg">
              {ACTIVITY_LEVELS.map(({ value, icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActivityLevel(value)}
                  className="flex flex-col items-center gap-2"
                >
                  <span className={`text-3xl transition-all ${
                    activityLevel === value ? 'opacity-100 scale-110' : 'opacity-30 hover:opacity-60'
                  }`}>
                    {icon}
                  </span>
                  <div className={`w-2 h-2 rounded-full transition-all ${
                    activityLevel === value
                      ? 'bg-indigo-500 shadow-lg shadow-indigo-500/50'
                      : 'bg-zinc-700'
                  }`} />
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-zinc-500 mt-2">
              {ACTIVITY_LEVELS.find(a => a.value === activityLevel)?.label} · {ACTIVITY_LEVELS.find(a => a.value === activityLevel)?.description}
            </p>
          </div>

          {/* Résultat */}
          {recommendations && currentWeight > 0 && (
            <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl">
              {/* Toggle intelligent/manuel */}
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => setUseIntelligentMode(!useIntelligentMode)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                    useIntelligentMode
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      : 'bg-zinc-800/60 text-zinc-500 border border-zinc-700/50'
                  }`}
                >
                  {useIntelligentMode ? <Zap className="w-3 h-3" /> : <Settings className="w-3 h-3" />}
                  {useIntelligentMode ? 'Intelligent' : 'Manuel'}
                </button>
                {useIntelligentMode && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    recommendations.confidence >= 80 ? 'bg-emerald-500/20 text-emerald-300'
                      : recommendations.confidence >= 60 ? 'bg-indigo-500/20 text-indigo-300'
                        : 'bg-zinc-700/50 text-zinc-400'
                  }`}>
                    {recommendations.confidence}%
                  </span>
                )}
              </div>

              {/* Calories */}
              <div className="text-center">
                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                  {recommendations.targetCalories}
                </p>
                <p className="text-xs text-zinc-500 mt-1">kcal/jour</p>
              </div>

              {/* Macros mini */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="text-center p-2 bg-rose-500/10 rounded-lg">
                  <p className="text-sm font-bold text-rose-400">{recommendations.macros.protein}g</p>
                  <p className="text-[9px] text-zinc-600">Prot</p>
                </div>
                <div className="text-center p-2 bg-amber-500/10 rounded-lg">
                  <p className="text-sm font-bold text-amber-400">{recommendations.macros.carbs}g</p>
                  <p className="text-[9px] text-zinc-600">Gluc</p>
                </div>
                <div className="text-center p-2 bg-yellow-500/10 rounded-lg">
                  <p className="text-sm font-bold text-yellow-400">{recommendations.macros.fat}g</p>
                  <p className="text-[9px] text-zinc-600">Lip</p>
                </div>
              </div>

              {/* Détails (optionnel) */}
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full text-[10px] text-zinc-500 hover:text-zinc-400 mt-3 pt-2 border-t border-zinc-800/50"
              >
                {showDetails ? 'Masquer détails' : 'Voir détails'}
              </button>
              {showDetails && (
                <div className="mt-2 text-[10px] text-zinc-500 space-y-1">
                  <p>Méthode: {recommendations.method}</p>
                  <p>TDEE: {recommendations.tdee} kcal · BMR: {recommendations.bmr} kcal</p>
                  {goal !== 'maintain' && (
                    <p>{goal === 'lose' ? 'Déficit' : 'Surplus'}: {recommendations.dailyCalorieAdjustment} kcal/j</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2.5 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 rounded-lg text-sm font-medium transition-all border border-zinc-700/50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={currentWeight === 0}
              className="flex-1 px-3 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              Sauvegarder
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
