// Types pour le système de santé

export interface WeightEntry {
  id: string
  date: string // YYYY-MM-DD
  weight: number // kg
  note?: string
  createdAt: number
  
  // Données avancées de composition corporelle (Withings)
  fatMassPercent?: number      // % de masse grasse
  muscleMass?: number          // kg de masse musculaire
  boneMass?: number            // kg de masse osseuse
  waterPercent?: number        // % d'hydratation corporelle
  heartRate?: number           // bpm - fréquence cardiaque
  
  // Métadonnées source
  source?: 'manual' | 'withings' // D'où vient cette pesée
}

// Portion d'un aliment dans un repas
export interface FoodPortion {
  foodId: string           // Référence à FoodItem dans foodDatabase
  grams: number            // Quantité en grammes
  unit?: string            // Unité lisible (ex: "2 pièces", "1 tasse")
  unitCount?: number       // Nombre d'unités (ex: 2 pour "2 bananes")
}

// Repas composé de plusieurs aliments
export interface MealEntry {
  id: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  name: string
  
  // Liste des aliments du repas
  foods?: FoodPortion[]    // Nouveau système (optionnel pour rétrocompat)
  
  // Valeurs calculées automatiquement depuis foods[]
  calories: number         // Total
  protein: number          // g (obligatoire maintenant)
  carbs: number            // g (obligatoire maintenant)
  fat: number              // g (obligatoire maintenant)
  fiber?: number           // g (optionnel)
  
  note?: string
  createdAt: number
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface ExerciseEntry {
  id: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  type: 'cardio' | 'strength' | 'flexibility' | 'sports' | 'other'
  name: string
  duration: number // minutes
  calories?: number // calories brûlées
  intensity?: 'low' | 'moderate' | 'high'
  note?: string
  createdAt: number
}

export type ExerciseType = 'cardio' | 'strength' | 'flexibility' | 'sports' | 'other'

export interface HydrationEntry {
  id: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  amount: number // ml
  createdAt: number
}

export interface HealthGoal {
  id: string
  type: 'weight' | 'calories' | 'protein' | 'exercise'
  target: number
  current: number
  unit: string
  startDate: string
  endDate?: string
  active: boolean
}

export interface HealthStats {
  currentWeight: number
  targetWeight: number
  weightChange: number // kg (+ ou -)
  bmi: number
  bmiCategory: 'underweight' | 'normal' | 'overweight' | 'obese'
  todayCalories: number
  targetCalories: number
  weekAvgCalories: number
  streak: number // jours consécutifs de tracking
}

export interface NutritionTarget {
  calories: number
  protein: number // g
  carbs: number // g
  fat: number // g
}

export interface UserProfile {
  height: number // cm
  age: number
  gender: 'male' | 'female' | 'other'
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  goal?: 'lose' | 'maintain' | 'gain'
  targetWeight?: number // kg
}

