/**
 * Hook intelligent pour la gestion automatique des besoins caloriques
 * - Recalcul automatique hebdomadaire
 * - Détection d'anomalies
 * - Suggestions actionnables
 * - Prédictions
 */

import { useEffect, useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { getOptimalCalorieTarget } from '../utils/healthIntelligence'
import { WeightEntry, MealEntry } from '../types/health'

interface HealthIntelligence {
  // Calculs
  tdee: number
  targetCalories: number
  confidence: number
  method: string
  explanation: string
  
  // Progression
  progressionData: {
    weightsPerWeek: number
    mealsPerWeek: number
    hasWithingsData: boolean
    daysTracked: number
  }
  
  // Anomalies
  anomaly: {
    type: 'warning' | 'danger' | null
    message: string
    suggestion: string
  } | null
  
  // Prédictions
  prediction: {
    weeksToGoal: number
    predictedDate: Date
    currentWeeklyChange: number
  } | null
  
  // Actions
  needsRecalculation: boolean
  lastUpdate: Date | null
}

const RECALC_INTERVAL_DAYS = 7
const STORAGE_KEY = 'health-intelligence-last-update'

export function useHealthIntelligence(): HealthIntelligence {
  const { 
    userProfile, 
    weightEntries, 
    mealEntries, 
    healthGoals,
    updateHealthGoal,
    addToast 
  } = useStore()
  
  const [lastUpdate, setLastUpdate] = useState<Date | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? new Date(stored) : null
  })

  // Calculer les données de progression
  const progressionData = useMemo(() => {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const recentWeights = weightEntries.filter(
      w => new Date(w.date).getTime() >= oneWeekAgo.getTime()
    )
    
    const recentMealDays = new Set(
      mealEntries
        .filter(m => new Date(m.date).getTime() >= oneWeekAgo.getTime())
        .map(m => m.date)
    )
    
    const hasWithingsData = weightEntries.some(
      w => w.fatMassPercent !== undefined && w.fatMassPercent > 0
    )
    
    const uniqueMealDays = new Set(mealEntries.map(m => m.date))
    
    return {
      weightsPerWeek: recentWeights.length,
      mealsPerWeek: recentMealDays.size,
      hasWithingsData,
      daysTracked: uniqueMealDays.size
    }
  }, [weightEntries, mealEntries])

  // Détecter les anomalies
  const anomaly = useMemo(() => {
    if (weightEntries.length < 8) return null
    
    const sorted = [...weightEntries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    
    // Calculer le changement hebdomadaire moyen sur les 4 dernières semaines
    const last4Weeks = sorted.slice(-28)
    if (last4Weeks.length < 14) return null
    
    const weeklyChanges: number[] = []
    for (let i = 7; i < last4Weeks.length; i += 7) {
      const change = last4Weeks[i].weight - last4Weeks[i - 7].weight
      weeklyChanges.push(change)
    }
    
    const avgWeeklyChange = weeklyChanges.reduce((a, b) => a + b, 0) / weeklyChanges.length
    
    // Dernière semaine
    const lastWeek = sorted.slice(-7)
    if (lastWeek.length < 2) return null
    
    const lastWeekChange = lastWeek[lastWeek.length - 1].weight - lastWeek[0].weight
    
    // Anomalie si changement > 2x la moyenne
    if (Math.abs(lastWeekChange) > Math.abs(avgWeeklyChange) * 2 && Math.abs(lastWeekChange) > 1) {
      const isDanger = Math.abs(lastWeekChange) > 2
      
      return {
        type: isDanger ? 'danger' as const : 'warning' as const,
        message: lastWeekChange < 0
          ? `Perte rapide : ${Math.abs(lastWeekChange).toFixed(1)}kg cette semaine (moyenne : ${Math.abs(avgWeeklyChange).toFixed(1)}kg)`
          : `Gain rapide : +${lastWeekChange.toFixed(1)}kg cette semaine (moyenne : +${Math.abs(avgWeeklyChange).toFixed(1)}kg)`,
        suggestion: isDanger
          ? '⚠️ Consultez un professionnel de santé si cela continue.'
          : 'Vérifiez vos pesées et votre alimentation.'
      }
    }
    
    return null
  }, [weightEntries])

  // Calculer les prédictions
  const prediction = useMemo(() => {
    if (weightEntries.length < 8) return null
    
    const sorted = [...weightEntries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    
    // Calculer le changement hebdomadaire moyen sur les 4 dernières semaines
    const last4Weeks = sorted.slice(-28)
    if (last4Weeks.length < 14) return null
    
    const firstWeight = last4Weeks[0].weight
    const lastWeight = last4Weeks[last4Weeks.length - 1].weight
    const totalChange = lastWeight - firstWeight
    
    const firstDate = new Date(last4Weeks[0].date)
    const lastDate = new Date(last4Weeks[last4Weeks.length - 1].date)
    const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
    
    const weeklyChange = (totalChange / daysDiff) * 7
    
    // Trouver l'objectif de poids (si défini)
    const currentWeight = sorted[sorted.length - 1].weight
    const targetWeight = userProfile.targetWeight || currentWeight - 10 // Par défaut -10kg
    const remainingKg = Math.abs(targetWeight - currentWeight)
    
    if (Math.abs(weeklyChange) < 0.1) return null // Pas assez de changement
    
    const weeksToGoal = Math.ceil(remainingKg / Math.abs(weeklyChange))
    const predictedDate = new Date()
    predictedDate.setDate(predictedDate.getDate() + weeksToGoal * 7)
    
    return {
      weeksToGoal,
      predictedDate,
      currentWeeklyChange: weeklyChange
    }
  }, [weightEntries, userProfile.targetWeight])

  // Calculer les besoins avec l'algo intelligent
  const currentWeight = weightEntries.length > 0
    ? [...weightEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].weight
    : 0

  const latestWeightEntry = weightEntries.length > 0
    ? [...weightEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null

  const optimal = useMemo(() => {
    if (currentWeight === 0) {
      return {
        tdee: 0,
        targetCalories: 0,
        method: '',
        methodLabel: '',
        confidence: 0,
        explanation: ''
      }
    }

    return getOptimalCalorieTarget(
      userProfile,
      currentWeight,
      'maintain', // Par défaut
      latestWeightEntry ? {
        fatMassPercent: latestWeightEntry.fatMassPercent,
        muscleMass: latestWeightEntry.muscleMass
      } : undefined,
      {
        weightEntries,
        mealEntries
      }
    )
  }, [userProfile, currentWeight, latestWeightEntry, weightEntries, mealEntries])

  // Vérifier si un recalcul est nécessaire
  const needsRecalculation = useMemo(() => {
    if (!lastUpdate) return true
    
    const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceUpdate >= RECALC_INTERVAL_DAYS
  }, [lastUpdate])

  // Recalcul automatique
  useEffect(() => {
    if (!needsRecalculation || currentWeight === 0) return
    
    const caloriesGoal = healthGoals.find(g => g.type === 'calories' && g.active)
    if (!caloriesGoal) return
    
    const currentTDEE = caloriesGoal.target
    const newTDEE = optimal.tdee
    
    // Si changement significatif (>5%)
    const changePercent = Math.abs((newTDEE - currentTDEE) / currentTDEE)
    
    if (changePercent > 0.05) {
      // Mettre à jour
      updateHealthGoal(caloriesGoal.id, {
        target: optimal.targetCalories
      })
      
      // Notifier
      addToast(
        `🔄 TDEE mis à jour : ${currentTDEE} → ${newTDEE} kcal (${optimal.confidence}% confiance)`,
        'info'
      )
      
      // Sauvegarder la date de mise à jour
      const now = new Date()
      localStorage.setItem(STORAGE_KEY, now.toISOString())
      setLastUpdate(now)
    }
  }, [needsRecalculation, optimal, healthGoals, updateHealthGoal, addToast, currentWeight])

  return {
    tdee: optimal.tdee,
    targetCalories: optimal.targetCalories,
    confidence: optimal.confidence,
    method: optimal.methodLabel,
    explanation: optimal.explanation,
    progressionData,
    anomaly,
    prediction,
    needsRecalculation,
    lastUpdate
  }
}

