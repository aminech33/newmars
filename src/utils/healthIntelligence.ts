// Intelligence IA pour le système de santé

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

  const firstWeight = sortedEntries[0].weight
  const lastWeight = sortedEntries[sortedEntries.length - 1].weight
  const totalChange = lastWeight - firstWeight

  const firstDate = new Date(sortedEntries[0].date)
  const lastDate = new Date(sortedEntries[sortedEntries.length - 1].date)
  const daysDiff = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24))
  
  const avgChange = totalChange / daysDiff
  const weeklyChange = avgChange * 7

  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
  if (Math.abs(weeklyChange) > 0.2) {
    trend = weeklyChange > 0 ? 'increasing' : 'decreasing'
  }

  return {
    trend,
    avgChange: Number(avgChange.toFixed(2)),
    weeklyChange: Number(weeklyChange.toFixed(2))
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

  const firstWeight = sortedEntries[0].weight
  const lastWeight = sortedEntries[sortedEntries.length - 1].weight
  const totalChange = lastWeight - firstWeight

  const firstDate = new Date(sortedEntries[0].date)
  const lastDate = new Date(sortedEntries[sortedEntries.length - 1].date)
  const daysDiff = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24))
  
  const avgChange = totalChange / daysDiff
  const weeklyChange = avgChange * 7

  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
  if (Math.abs(weeklyChange) > 0.2) {
    trend = weeklyChange > 0 ? 'increasing' : 'decreasing'
  }

  return {
    trend,
    avgChange: Number(avgChange.toFixed(2)),
    weeklyChange: Number(weeklyChange.toFixed(2))
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

