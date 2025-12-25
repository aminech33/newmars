import { useState, useEffect } from 'react'
import { User, Scale, Activity, Calendar } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { calculateBMR, calculateTDEE, calculateMacros } from '../../utils/healthIntelligence'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface ProfileSetupModalProps {
  isOpen: boolean
  onClose: () => void
}

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sédentaire', description: 'Peu ou pas d\'exercice' },
  { value: 'light', label: 'Léger', description: '1-3 jours/semaine' },
  { value: 'moderate', label: 'Modéré', description: '3-5 jours/semaine' },
  { value: 'active', label: 'Actif', description: '6-7 jours/semaine' },
  { value: 'very_active', label: 'Très actif', description: 'Exercice intense quotidien' }
] as const

const GOALS = [
  { value: 'lose', label: '🎯 Perdre du poids', description: '-500 cal/jour (-0.5kg/sem)' },
  { value: 'maintain', label: '⚖️ Maintenir', description: 'Maintenir le poids actuel' },
  { value: 'gain', label: '💪 Prendre du muscle', description: '+500 cal/jour (+0.5kg/sem)' }
] as const

export function ProfileSetupModal({ isOpen, onClose }: ProfileSetupModalProps) {
  const { userProfile, setUserProfile, healthGoals, addHealthGoal, updateHealthGoal, weightEntries } = useStore()
  
  // État du formulaire
  const [height, setHeight] = useState(userProfile.height)
  const [age, setAge] = useState(userProfile.age)
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(userProfile.gender)
  const [activityLevel, setActivityLevel] = useState(userProfile.activityLevel)
  const [currentWeight, setCurrentWeight] = useState(0)
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain')
  const [error, setError] = useState('')
  
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
        const bmr = calculateBMR(currentWeight, height, age, gender)
        const tdee = calculateTDEE(bmr, activityLevel)
        
        // Déterminer l'objectif selon la différence
        if (caloriesGoal.target < tdee - 200) setGoal('lose')
        else if (caloriesGoal.target > tdee + 200) setGoal('gain')
        else setGoal('maintain')
      }
    }
  }, [isOpen, healthGoals, currentWeight, height, age, gender, activityLevel])
  
  // Calculer les recommandations en temps réel
  const recommendations = (() => {
    if (currentWeight === 0) return null
    
    const bmr = calculateBMR(currentWeight, height, age, gender)
    const tdee = calculateTDEE(bmr, activityLevel)
    
    let targetCalories = tdee
    if (goal === 'lose') targetCalories = tdee - 500
    else if (goal === 'gain') targetCalories = tdee + 500
    
    const macros = calculateMacros(targetCalories, goal)
    
    return {
      bmr,
      tdee,
      targetCalories,
      macros
    }
  })()
  
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    setError('')
    
    // Validations
    if (height < 100 || height > 250) {
      setError('Taille invalide (100-250 cm)')
      return
    }
    if (age < 10 || age > 120) {
      setError('Âge invalide (10-120 ans)')
      return
    }
    if (currentWeight === 0) {
      setError('Veuillez enregistrer votre poids d\'abord')
      return
    }
    
    // Sauvegarder le profil
    setUserProfile({
      height,
      age,
      gender,
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
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            variant="primary"
            onClick={() => handleSubmit()}
            disabled={currentWeight === 0}
          >
            Sauvegarder et calculer
          </Button>
        </>
      }
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 -mt-2">
        <div className="p-2 bg-indigo-500/20 rounded-xl">
          <User className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-lg font-medium text-zinc-200">
            Configuration du profil
          </h2>
          <p className="text-xs text-zinc-500">
            Pour calculer vos besoins caloriques personnalisés
          </p>
        </div>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-sm text-rose-400" role="alert">
            {error}
          </div>
        )}
        
        {/* Infos physiques */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <Scale className="w-4 h-4" />
            Informations physiques
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Taille (cm)"
              type="number"
              value={height}
              onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
              min={100}
              max={250}
              required
              hint="Entre 100 et 250 cm"
            />
            
            <Input
              label="Âge (ans)"
              type="number"
              value={age}
              onChange={(e) => setAge(parseInt(e.target.value) || 0)}
              min={10}
              max={120}
              required
              hint="Entre 10 et 120 ans"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Genre
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['male', 'female', 'other'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                    gender === g
                      ? 'bg-indigo-500/20 border-2 border-indigo-500 text-indigo-400'
                      : 'bg-zinc-800/50 border-2 border-zinc-800/50 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {g === 'male' ? '♂️ Homme' : g === 'female' ? '♀️ Femme' : '⚧️ Autre'}
                </button>
              ))}
            </div>
          </div>
          
          {currentWeight > 0 && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <p className="text-sm text-emerald-400">
                ✅ Poids actuel : <span className="font-bold">{currentWeight} kg</span>
              </p>
            </div>
          )}
          
          {currentWeight === 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <p className="text-sm text-amber-400">
                ⚠️ Veuillez enregistrer votre poids d'abord dans l'onglet "Poids"
              </p>
            </div>
          )}
        </div>
        
        {/* Niveau d'activité */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Niveau d'activité physique
          </h3>
          
          <div className="space-y-2">
            {ACTIVITY_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setActivityLevel(level.value)}
                className={`w-full p-3 rounded-xl text-left transition-all ${
                  activityLevel === level.value
                    ? 'bg-indigo-500/20 border-2 border-indigo-500'
                    : 'bg-zinc-800/50 border-2 border-zinc-800/50 hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${
                      activityLevel === level.value ? 'text-indigo-400' : 'text-zinc-300'
                    }`}>
                      {level.label}
                    </p>
                    <p className="text-xs text-zinc-500">{level.description}</p>
                  </div>
                  {activityLevel === level.value && (
                    <div className="w-4 h-4 rounded-full bg-indigo-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Objectif */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Votre objectif
          </h3>
          
          <div className="space-y-2">
            {GOALS.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGoal(g.value)}
                className={`w-full p-3 rounded-xl text-left transition-all ${
                  goal === g.value
                    ? 'bg-emerald-500/20 border-2 border-emerald-500'
                    : 'bg-zinc-800/50 border-2 border-zinc-800/50 hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${
                      goal === g.value ? 'text-emerald-400' : 'text-zinc-300'
                    }`}>
                      {g.label}
                    </p>
                    <p className="text-xs text-zinc-500">{g.description}</p>
                  </div>
                  {goal === g.value && (
                    <div className="w-4 h-4 rounded-full bg-emerald-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Recommandations calculées */}
        {recommendations && currentWeight > 0 && (
          <div className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/20">
            <h4 className="text-sm font-medium text-zinc-300 mb-3">📊 Vos besoins calculés</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-zinc-500">Métabolisme de base (BMR)</p>
                <p className="text-lg font-bold text-zinc-200">{recommendations.bmr} kcal</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Dépense totale (TDEE)</p>
                <p className="text-lg font-bold text-zinc-200">{recommendations.tdee} kcal</p>
              </div>
              <div className="col-span-2 pt-3 border-t border-zinc-800/50">
                <p className="text-xs text-zinc-500 mb-2">Objectif calorique journalier</p>
                <p className="text-2xl font-bold text-emerald-400">{recommendations.targetCalories} kcal</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Protéines</p>
                <p className="text-sm font-bold text-rose-400">{recommendations.macros.protein}g</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Glucides</p>
                <p className="text-sm font-bold text-amber-400">{recommendations.macros.carbs}g</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Lipides</p>
                <p className="text-sm font-bold text-yellow-400">{recommendations.macros.fat}g</p>
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}

