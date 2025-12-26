// Intelligence IA pour le système de santé
// Inclut des algorithmes avancés de calcul calorique avec données Withings

import { WeightEntry, MealEntry, UserProfile, HealthStats } from '../types/health'

// --- Calculs de base ---

export const calculateBMI = (weight: number, height: number): number => {
  // BMI = poids (kg) / (taille (m))²
  const heightInMeters = height / 100
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1))
}

export const getBMICategory = (bmi: number): 'underweight' | 'normal' | 'overweight' | 'obese' => {
  if (bmi < 18.5) return 'underweight'
  if (bmi < 25) return 'normal'
  if (bmi < 30) return 'overweight'
  return 'obese'
}

export const getBMICategoryLabel = (category: string): string => {
  const labels = {
    underweight: 'Sous-poids',
    normal: 'Normal',
    overweight: 'Surpoids',
    obese: 'Obésité'
  }
  return labels[category as keyof typeof labels] || 'Inconnu'
}

export const getBMICategoryColor = (category: string): string => {
  const colors = {
    underweight: 'text-amber-400',
    normal: 'text-emerald-400',
    overweight: 'text-orange-400',
    obese: 'text-rose-400'
  }
  return colors[category as keyof typeof colors] || 'text-zinc-400'
}

// --- Calcul calories recommandées (Formule de Mifflin-St Jeor) ---

export const calculateBMR = (weight: number, height: number, age: number, gender: 'male' | 'female' | 'other'): number => {
  // BMR = Basal Metabolic Rate (métabolisme de base)
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161
  }
}

export const calculateTDEE = (bmr: number, activityLevel: string): number => {
  // TDEE = Total Daily Energy Expenditure
  const multipliers = {
    sedentary: 1.2,      // Peu ou pas d'exercice
    light: 1.375,        // Exercice léger 1-3 jours/semaine
    moderate: 1.55,      // Exercice modéré 3-5 jours/semaine
    active: 1.725,       // Exercice intense 6-7 jours/semaine
    very_active: 1.9     // Exercice très intense, travail physique
  }
  return Math.round(bmr * (multipliers[activityLevel as keyof typeof multipliers] || 1.2))
}

export const calculateRecommendedCalories = (profile: UserProfile, currentWeight: number, goal: 'lose' | 'maintain' | 'gain'): number => {
  const bmr = calculateBMR(currentWeight, profile.height, profile.age, profile.gender)
  const tdee = calculateTDEE(bmr, profile.activityLevel)
  
  if (goal === 'lose') return tdee - 500 // Déficit de 500 cal pour perdre ~0.5kg/semaine
  if (goal === 'gain') return tdee + 500 // Surplus de 500 cal pour gagner ~0.5kg/semaine
  return tdee
}

// --- Calcul macros recommandées ---

export const calculateMacros = (calories: number, goal: 'lose' | 'maintain' | 'gain') => {
  let proteinPercent = 0.30
  let carbsPercent = 0.40
  let fatPercent = 0.30

  if (goal === 'lose') {
    proteinPercent = 0.35 // Plus de protéines pour préserver la masse musculaire
    carbsPercent = 0.35
    fatPercent = 0.30
  } else if (goal === 'gain') {
    proteinPercent = 0.25
    carbsPercent = 0.50 // Plus de glucides pour l'énergie
    fatPercent = 0.25
  }

  return {
    protein: Math.round((calories * proteinPercent) / 4), // 4 cal/g
    carbs: Math.round((calories * carbsPercent) / 4),     // 4 cal/g
    fat: Math.round((calories * fatPercent) / 9)          // 9 cal/g
  }
}

// --- Analyse des tendances ---

export const analyzeWeightTrend = (entries: WeightEntry[]): {
  trend: 'increasing' | 'decreasing' | 'stable'
  avgChange: number
  weeklyChange: number
} => {
  if (entries.length < 2) {
    return { trend: 'stable', avgChange: 0, weeklyChange: 0 }
  }

  const sortedEntries = [...entries].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Use last 14 entries or all if less
  const recentEntries = sortedEntries.slice(-14)
  
  const firstWeight = recentEntries[0].weight
  const lastWeight = recentEntries[recentEntries.length - 1].weight
  const totalChange = lastWeight - firstWeight

  const firstDate = new Date(recentEntries[0].date)
  const lastDate = new Date(recentEntries[recentEntries.length - 1].date)
  const daysDiff = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24))
  
  // Calculate weekly change
  const weeklyChange = daysDiff >= 7 
    ? (totalChange / daysDiff) * 7 
    : totalChange // If less than a week, show total change

  // Determine trend (threshold: 0.1 kg/week)
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
  if (Math.abs(weeklyChange) > 0.1) {
    trend = weeklyChange > 0 ? 'increasing' : 'decreasing'
  }

  return {
    trend,
    avgChange: totalChange / daysDiff,
    weeklyChange: Number(weeklyChange.toFixed(1))
  }
}

export const calculateStreak = (entries: (WeightEntry | MealEntry)[]): number => {
  if (entries.length === 0) return 0

  const today = new Date().toISOString().split('T')[0]
  const sortedDates = [...new Set(entries.map(e => e.date))].sort().reverse()

  let streak = 0
  let currentDate = new Date(today)

  for (const date of sortedDates) {
    const entryDate = new Date(date)
    const diffDays = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === streak) {
      streak++
    } else if (diffDays > streak) {
      break
    }
  }

  return streak
}

// --- Suggestions intelligentes ---

export interface HealthSuggestion {
  type: 'weight' | 'nutrition' | 'hydration' | 'exercise' | 'sleep'
  priority: 'low' | 'medium' | 'high'
  message: string
  action?: string
}

export const generateHealthSuggestions = (
  stats: HealthStats,
  weightEntries: WeightEntry[],
  mealEntries: MealEntry[]
): HealthSuggestion[] => {
  const suggestions: HealthSuggestion[] = []
  const today = new Date().toISOString().split('T')[0]
  const todayMeals = mealEntries.filter(m => m.date === today)

  // Suggestion calories
  const caloriesPercent = (stats.todayCalories / stats.targetCalories) * 100
  if (caloriesPercent > 120) {
    suggestions.push({
      type: 'nutrition',
      priority: 'high',
      message: `🔥 Vous avez dépassé votre objectif calorique de ${Math.round(caloriesPercent - 100)}%`,
      action: 'Réduire les portions ou faire de l\'exercice'
    })
  } else if (caloriesPercent < 80) {
    suggestions.push({
      type: 'nutrition',
      priority: 'medium',
      message: `🍽️ Vous êtes en-dessous de votre objectif (${Math.round(caloriesPercent)}%)`,
      action: 'Ajouter une collation saine'
    })
  }

  // Suggestion poids
  const trend = analyzeWeightTrend(weightEntries)
  if (trend.trend === 'increasing' && stats.targetWeight < stats.currentWeight) {
    suggestions.push({
      type: 'weight',
      priority: 'high',
      message: `📈 Votre poids augmente (${trend.weeklyChange > 0 ? '+' : ''}${trend.weeklyChange}kg/semaine)`,
      action: 'Réduire les calories ou augmenter l\'activité'
    })
  } else if (trend.trend === 'decreasing' && stats.targetWeight > stats.currentWeight) {
    suggestions.push({
      type: 'weight',
      priority: 'high',
      message: `📉 Votre poids diminue alors que vous voulez prendre du poids`,
      action: 'Augmenter les calories et les protéines'
    })
  }

  // Suggestion BMI
  if (stats.bmiCategory === 'obese') {
    suggestions.push({
      type: 'weight',
      priority: 'high',
      message: `⚠️ Votre IMC indique une obésité (${stats.bmi})`,
      action: 'Consulter un professionnel de santé'
    })
  } else if (stats.bmiCategory === 'underweight') {
    suggestions.push({
      type: 'weight',
      priority: 'high',
      message: `⚠️ Votre IMC indique un sous-poids (${stats.bmi})`,
      action: 'Augmenter l\'apport calorique progressivement'
    })
  }

  // Suggestion repas
  if (todayMeals.length === 0) {
    suggestions.push({
      type: 'nutrition',
      priority: 'medium',
      message: '📝 Vous n\'avez pas encore enregistré de repas aujourd\'hui',
      action: 'Commencer à tracker votre alimentation'
    })
  }

  // Suggestion streak
  if (stats.streak >= 7) {
    suggestions.push({
      type: 'nutrition',
      priority: 'low',
      message: `🔥 Incroyable ! ${stats.streak} jours de suivi consécutifs !`,
      action: 'Continuez comme ça !'
    })
  }

  // Suggestion hydratation
  suggestions.push({
    type: 'hydration',
    priority: 'medium',
    message: '💧 N\'oubliez pas de boire 2L d\'eau par jour',
    action: 'Boire un verre d\'eau maintenant'
  })

  return suggestions
}

// --- Détection automatique d'aliments ---

export const detectFoodCalories = (foodName: string): number => {
  const lowerName = foodName.toLowerCase()
  
  // Base de données simple (à enrichir)
  const foodDatabase: Record<string, number> = {
    // Fruits
    'pomme': 52,
    'banane': 89,
    'orange': 47,
    'fraise': 32,
    
    // Légumes
    'salade': 15,
    'tomate': 18,
    'carotte': 41,
    'brocoli': 34,
    
    // Protéines
    'poulet': 165,
    'boeuf': 250,
    'poisson': 120,
    'oeuf': 155,
    'thon': 130,
    
    // Féculents
    'riz': 130,
    'pâtes': 131,
    'pain': 265,
    'pomme de terre': 77,
    
    // Produits laitiers
    'lait': 42,
    'yaourt': 59,
    'fromage': 402,
    
    // Snacks
    'chips': 536,
    'chocolat': 546,
    'biscuit': 502,
    'gâteau': 257,
    
    // Boissons
    'coca': 42,
    'jus': 45,
    'café': 2,
    'thé': 1,
  }
  
  // Chercher une correspondance
  for (const [food, calories] of Object.entries(foodDatabase)) {
    if (lowerName.includes(food)) {
      return calories
    }
  }
  
  // Valeur par défaut
  return 200
}

export const detectMealType = (time: string): 'breakfast' | 'lunch' | 'dinner' | 'snack' => {
  const hour = parseInt(time.split(':')[0])
  
  if (hour >= 6 && hour < 11) return 'breakfast'
  if (hour >= 11 && hour < 15) return 'lunch'
  if (hour >= 18 && hour < 22) return 'dinner'
  return 'snack'
}

// ============================================
// CALCULS AVANCÉS - TDEE RÉEL (SOLUTION 3)
// ============================================

/**
 * Calculer le BMR avec composition corporelle (Formule Katch-McArdle)
 * Plus précis que Mifflin-St Jeor car basé sur la masse maigre
 * 
 * @param weight - Poids en kg
 * @param fatMassPercent - Pourcentage de masse grasse (ex: 20 pour 20%)
 * @returns BMR en kcal/jour
 */
export const calculateBMRWithBodyComposition = (
  weight: number,
  fatMassPercent: number
): number => {
  // Masse maigre = Poids total - Masse grasse
  const fatMass = weight * (fatMassPercent / 100)
  const leanBodyMass = weight - fatMass
  
  // Formule Katch-McArdle
  // BMR = 370 + (21.6 × masse maigre en kg)
  const bmr = 370 + (21.6 * leanBodyMass)
  
  return Math.round(bmr)
}

/**
 * Calculer le TDEE réel basé sur l'historique de poids et calories
 * Méthode la plus précise car basée sur VOS résultats réels
 * 
 * Principe : Si vous perdez 0.5kg/semaine en mangeant 2000 kcal,
 * alors votre TDEE réel est 2000 + (0.5 × 7700 / 7) = 2550 kcal
 * 
 * @param weightEntries - Historique des pesées
 * @param mealEntries - Historique des repas
 * @param daysToAnalyze - Nombre de jours à analyser (défaut: 30)
 * @returns TDEE réel en kcal/jour ou null si pas assez de données
 */
export const calculateRealTDEE = (
  weightEntries: WeightEntry[],
  mealEntries: MealEntry[],
  daysToAnalyze: number = 30
): { tdee: number; confidence: number; dataPoints: number } | null => {
  // Filtrer les derniers X jours
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToAnalyze)
  const cutoffTime = cutoffDate.getTime()
  
  const recentWeights = weightEntries.filter(
    w => new Date(w.date).getTime() >= cutoffTime
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  const recentMeals = mealEntries.filter(
    m => new Date(m.date).getTime() >= cutoffTime
  )
  
  // Besoin d'au moins 2 semaines de données pour une estimation fiable
  const minWeights = 5
  const minMealDays = 10
  
  const uniqueMealDays = new Set(recentMeals.map(m => m.date)).size
  
  if (recentWeights.length < minWeights || uniqueMealDays < minMealDays) {
    return null // Pas assez de données
  }
  
  // 1. Calculer le changement de poids hebdomadaire moyen
  const firstWeight = recentWeights[0].weight
  const lastWeight = recentWeights[recentWeights.length - 1].weight
  const weightChange = lastWeight - firstWeight
  
  const firstDate = new Date(recentWeights[0].date)
  const lastDate = new Date(recentWeights[recentWeights.length - 1].date)
  const daysDiff = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24))
  
  // Changement de poids par semaine
  const weeklyWeightChange = (weightChange / daysDiff) * 7
  
  // 2. Calculer les calories moyennes consommées par jour
  const totalCalories = recentMeals.reduce((sum, m) => sum + m.calories, 0)
  const avgDailyCalories = totalCalories / uniqueMealDays
  
  // 3. Calculer le déficit/surplus calorique quotidien
  // 1 kg de graisse ≈ 7700 kcal (consensus scientifique)
  const dailyCalorieChange = (weeklyWeightChange * 7700) / 7
  
  // 4. TDEE réel = Calories consommées - Déficit (ou + Surplus)
  // Si vous perdez du poids, dailyCalorieChange est négatif
  // Donc TDEE = calories consommées + |déficit|
  const realTDEE = avgDailyCalories - dailyCalorieChange
  
  // 5. Calculer un score de confiance (0-100%)
  // Basé sur la quantité et la régularité des données
  const weightDataScore = Math.min(100, (recentWeights.length / 20) * 100)
  const mealDataScore = Math.min(100, (uniqueMealDays / daysToAnalyze) * 100)
  const timeRangeScore = Math.min(100, (daysDiff / 21) * 100) // 21 jours = 100%
  
  const confidence = Math.round((weightDataScore + mealDataScore + timeRangeScore) / 3)
  
  return {
    tdee: Math.round(realTDEE),
    confidence,
    dataPoints: recentWeights.length + uniqueMealDays
  }
}

/**
 * Obtenir les besoins caloriques avec le meilleur algorithme disponible
 * Priorité : TDEE réel > Katch-McArdle (Withings) > Mifflin-St Jeor (standard)
 * 
 * @returns Objet avec TDEE, target, méthode utilisée et niveau de confiance
 */
export const getOptimalCalorieTarget = (
  profile: UserProfile,
  currentWeight: number,
  goal: 'lose' | 'maintain' | 'gain',
  withingsData?: {
    fatMassPercent?: number
    muscleMass?: number
  },
  history?: {
    weightEntries: WeightEntry[]
    mealEntries: MealEntry[]
  }
): {
  tdee: number
  targetCalories: number
  method: 'real' | 'body_composition' | 'standard'
  methodLabel: string
  confidence: number
  explanation: string
} => {
  let tdee: number = 0
  let method: 'real' | 'body_composition' | 'standard' = 'standard'
  let methodLabel: string = ''
  let confidence: number = 0
  let explanation: string = ''
  
  // Méthode 1 : TDEE réel basé sur historique (le plus précis) 🎯
  if (history && history.weightEntries.length > 0 && history.mealEntries.length > 0) {
    const realTDEEResult = calculateRealTDEE(
      history.weightEntries,
      history.mealEntries,
      30 // Analyser les 30 derniers jours
    )
    
    if (realTDEEResult && realTDEEResult.confidence >= 50) {
      tdee = realTDEEResult.tdee
      method = 'real'
      methodLabel = 'Calcul basé sur vos résultats réels'
      confidence = realTDEEResult.confidence
      explanation = `Basé sur ${realTDEEResult.dataPoints} points de données (pesées + repas). C'est la méthode la plus précise car elle s'adapte à VOTRE métabolisme unique.`
    }
  }
  
  // Méthode 2 : Composition corporelle Withings (précis) 💪
  if (tdee === 0 && withingsData?.fatMassPercent && withingsData.fatMassPercent > 0) {
    const bmr = calculateBMRWithBodyComposition(
      currentWeight,
      withingsData.fatMassPercent
    )
    tdee = calculateTDEE(bmr, profile.activityLevel)
    method = 'body_composition'
    methodLabel = 'Calcul avec composition corporelle (Withings)'
    confidence = 75
    explanation = `Basé sur votre masse musculaire et masse grasse. Plus précis que le calcul standard car la masse musculaire brûle 6x plus de calories.`
  }
  
  // Méthode 3 : Standard Mifflin-St Jeor (approximatif) 📏
  if (tdee === 0) {
    const bmr = calculateBMR(
      currentWeight,
      profile.height,
      profile.age,
      profile.gender
    )
    tdee = calculateTDEE(bmr, profile.activityLevel)
    method = 'standard'
    methodLabel = 'Calcul standard (Mifflin-St Jeor)'
    confidence = 50
    explanation = `Estimation basée sur votre poids, taille, âge et sexe. Pour plus de précision, trackez vos repas pendant 2 semaines.`
  }
  
  // Ajuster selon l'objectif
  let targetCalories = tdee
  if (goal === 'lose') {
    targetCalories = tdee - 500 // Déficit de 500 kcal = -0.5 kg/semaine
  } else if (goal === 'gain') {
    targetCalories = tdee + 500 // Surplus de 500 kcal = +0.5 kg/semaine
  }
  
  return {
    tdee,
    targetCalories,
    method,
    methodLabel,
    confidence,
    explanation
  }
}

/**
 * Obtenir des insights intelligents sur les besoins caloriques
 */
export const getCalorieInsights = (
  profile: UserProfile,
  currentWeight: number,
  goal: 'lose' | 'maintain' | 'gain',
  withingsData?: {
    fatMassPercent?: number
    muscleMass?: number
  },
  history?: {
    weightEntries: WeightEntry[]
    mealEntries: MealEntry[]
  }
): {
  insights: string[]
  recommendations: string[]
  warnings: string[]
} => {
  const insights: string[] = []
  const recommendations: string[] = []
  const warnings: string[] = []
  
  // Insight sur la composition corporelle
  if (withingsData?.fatMassPercent && withingsData?.muscleMass) {
    const leanMass = currentWeight * (1 - withingsData.fatMassPercent / 100)
    const fatMass = currentWeight - leanMass
    
    insights.push(
      `Votre corps : ${leanMass.toFixed(1)}kg de masse maigre + ${fatMass.toFixed(1)}kg de masse grasse`
    )
    
    // Catégorisation de la masse grasse
    const isMale = profile.gender === 'male'
    const fatPercent = withingsData.fatMassPercent
    
    if (isMale) {
      if (fatPercent < 6) warnings.push('⚠️ Masse grasse dangereusement basse')
      else if (fatPercent < 14) insights.push('💪 Excellent niveau de masse grasse (athlète)')
      else if (fatPercent < 18) insights.push('✅ Très bon niveau de masse grasse (fitness)')
      else if (fatPercent < 25) insights.push('👍 Niveau de masse grasse acceptable')
      else warnings.push('⚠️ Masse grasse élevée - Objectif de perte recommandé')
    } else {
      if (fatPercent < 14) warnings.push('⚠️ Masse grasse dangereusement basse')
      else if (fatPercent < 21) insights.push('💪 Excellent niveau de masse grasse (athlète)')
      else if (fatPercent < 25) insights.push('✅ Très bon niveau de masse grasse (fitness)')
      else if (fatPercent < 32) insights.push('👍 Niveau de masse grasse acceptable')
      else warnings.push('⚠️ Masse grasse élevée - Objectif de perte recommandé')
    }
  }
  
  // Insight sur l'historique
  if (history?.weightEntries.length && history.weightEntries.length >= 5) {
    const realTDEE = calculateRealTDEE(
      history.weightEntries,
      history.mealEntries,
      30
    )
    
    if (realTDEE) {
      insights.push(
        `Votre TDEE réel : ${realTDEE.tdee} kcal/jour (confiance: ${realTDEE.confidence}%)`
      )
      
      if (realTDEE.confidence >= 80) {
        recommendations.push(
          '🎯 Données excellentes ! Vos objectifs caloriques sont très précis.'
        )
      } else if (realTDEE.confidence >= 60) {
        recommendations.push(
          '📊 Continuez à tracker pour améliorer la précision.'
        )
      } else {
        recommendations.push(
          '📝 Trackez vos repas plus régulièrement pour des objectifs plus précis.'
        )
      }
    }
  } else {
    recommendations.push(
      '🚀 Pesez-vous et trackez vos repas pendant 2 semaines pour un calcul ultra-précis de vos besoins!'
    )
  }
  
  // Recommandations selon l'objectif
  if (goal === 'lose') {
    recommendations.push(
      '🎯 Objectif perte : Déficit de 500 kcal/jour = -0.5 kg/semaine (recommandé)'
    )
    recommendations.push(
      '💡 Augmentez les protéines (30-35% des calories) pour préserver la masse musculaire'
    )
  } else if (goal === 'gain') {
    recommendations.push(
      '🎯 Objectif prise de masse : Surplus de 500 kcal/jour = +0.5 kg/semaine'
    )
    recommendations.push(
      '💡 Assurez-vous de consommer assez de protéines (2g/kg de poids)'
    )
  }
  
  return {
    insights,
    recommendations,
    warnings
  }
}
