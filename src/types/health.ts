// Types pour le système de santé

export interface WeightEntry {
  id: string
  date: string // YYYY-MM-DD
  weight: number // kg
  note?: string
  createdAt: number
}

export interface MealEntry {
  id: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  name: string
  calories: number
  protein?: number // g
  carbs?: number // g
  fat?: number // g
  note?: string
  createdAt: number
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

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
}

