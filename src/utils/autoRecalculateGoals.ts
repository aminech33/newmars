// Fonction utilitaire pour recalculer automatiquement les objectifs nutritionnels
// basés sur le nouveau poids

import { calculateBMR, calculateTDEE, calculateMacros } from './healthIntelligence'
import { UserProfile, HealthGoal, WeightEntry } from '../types/health'

interface RecalculateObjectivesParams {
  newWeight: number
  profile: UserProfile
  currentGoals: HealthGoal[]
  updateHealthGoal: (id: string, updates: Partial<HealthGoal>) => void
}

/**
 * Recalcule automatiquement les objectifs nutritionnels basés sur le nouveau poids
 * Appelé automatiquement quand un nouveau poids est enregistré
 */
export function recalculateNutritionObjectives({
  newWeight,
  profile,
  currentGoals,
  updateHealthGoal
}: RecalculateObjectivesParams): void {
  
  // Vérifier qu'on a les infos nécessaires
  if (!newWeight || newWeight <= 0) return
  if (!profile.height || profile.height <= 0) return
  
  // Trouver l'objectif calories actif
  const caloriesGoal = currentGoals.find(g => g.type === 'calories' && g.active)
  if (!caloriesGoal) return // Pas d'objectif à recalculer
  
  // Calculer le nouveau BMR avec le nouveau poids
  const bmr = calculateBMR(newWeight, profile.height, profile.age, profile.gender)
  const tdee = calculateTDEE(bmr, profile.activityLevel)
  
  // Déterminer l'objectif actuel (lose/maintain/gain) basé sur la différence
  let goal: 'lose' | 'maintain' | 'gain' = 'maintain'
  if (caloriesGoal.target < tdee - 200) {
    goal = 'lose'
  } else if (caloriesGoal.target > tdee + 200) {
    goal = 'gain'
  }
  
  // Calculer les nouveaux objectifs
  let newTargetCalories = tdee
  if (goal === 'lose') newTargetCalories = tdee - 500
  else if (goal === 'gain') newTargetCalories = tdee + 500
  
  const newMacros = calculateMacros(newTargetCalories, goal)
  
  // Mettre à jour l'objectif calories
  updateHealthGoal(caloriesGoal.id, {
    target: newTargetCalories
  })
  
  // Mettre à jour l'objectif protéines si existant
  const proteinGoal = currentGoals.find(g => g.type === 'protein' && g.active)
  if (proteinGoal) {
    updateHealthGoal(proteinGoal.id, {
      target: newMacros.protein
    })
  }
}

/**
 * Vérifie si le poids a suffisamment changé pour justifier un recalcul
 * Évite les recalculs inutiles pour des variations minimes
 */
export function shouldRecalculateObjectives(
  newWeight: number,
  weightEntries: WeightEntry[],
  thresholdKg: number = 2 // Seuil par défaut: 2kg de différence
): boolean {
  if (weightEntries.length === 0) return true // Premier poids, toujours recalculer
  
  // Trouver le dernier poids qui a déclenché un recalcul
  // Pour simplifier, on compare avec le poids précédent
  const sortedEntries = [...weightEntries].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  
  const previousWeight = sortedEntries[0]?.weight || 0
  const difference = Math.abs(newWeight - previousWeight)
  
  return difference >= thresholdKg
}

/**
 * Affiche une notification explicative quand les objectifs sont recalculés
 */
export function getRecalculationMessage(
  oldWeight: number,
  newWeight: number,
  oldCalories: number,
  newCalories: number
): string {
  const weightChange = newWeight - oldWeight
  const caloriesChange = newCalories - oldCalories
  
  const weightText = weightChange > 0 
    ? `+${weightChange.toFixed(1)}kg` 
    : `${weightChange.toFixed(1)}kg`
  
  const caloriesText = caloriesChange > 0
    ? `+${caloriesChange} kcal`
    : `${caloriesChange} kcal`
  
  return `Poids: ${weightText} → Objectif recalculé: ${caloriesText}`
}








