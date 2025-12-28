/**
 * 🏥 Health Slice - Santé, nutrition, poids, hydratation
 */

import { StateCreator } from 'zustand'
import { WeightEntry, MealEntry, HealthGoal, UserProfile, ExerciseEntry, HydrationEntry } from '../../types/health'
import { recalculateNutritionObjectives, shouldRecalculateObjectives, getRecalculationMessage } from '../../utils/autoRecalculateGoals'
import { generateId } from './types'

export interface HealthSlice {
  // User Profile
  userProfile: UserProfile
  setUserProfile: (profile: Partial<UserProfile>) => void

  // Weight
  weightEntries: WeightEntry[]
  addWeightEntry: (entry: Omit<WeightEntry, 'id' | 'createdAt'>) => void
  updateWeightEntry: (id: string, updates: Partial<WeightEntry>) => void
  deleteWeightEntry: (id: string) => void

  // Meals
  mealEntries: MealEntry[]
  addMealEntry: (entry: Omit<MealEntry, 'id' | 'createdAt'>) => void
  updateMealEntry: (id: string, updates: Partial<MealEntry>) => void
  deleteMealEntry: (id: string) => void

  // Exercise
  exerciseEntries: ExerciseEntry[]
  addExerciseEntry: (entry: Omit<ExerciseEntry, 'id' | 'createdAt'>) => void
  updateExerciseEntry: (id: string, updates: Partial<ExerciseEntry>) => void
  deleteExerciseEntry: (id: string) => void

  // Hydration
  hydrationEntries: HydrationEntry[]
  addHydrationEntry: (entry: Omit<HydrationEntry, 'id' | 'createdAt'>) => void
  deleteHydrationEntry: (id: string) => void

  // Goals
  healthGoals: HealthGoal[]
  addHealthGoal: (goal: Omit<HealthGoal, 'id'>) => void
  updateHealthGoal: (id: string, updates: Partial<HealthGoal>) => void
  deleteHealthGoal: (id: string) => void
}

export const createHealthSlice: StateCreator<
  HealthSlice & { addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void },
  [['zustand/persist', unknown]],
  [],
  HealthSlice
> = (set, get) => ({
  // User Profile
  userProfile: {
    height: 175,
    age: 30,
    gender: 'male',
    activityLevel: 'moderate'
  },

  setUserProfile: (profile) => {
    set((s) => ({ userProfile: { ...s.userProfile, ...profile } }))
    get().addToast('Profil mis à jour', 'success')
  },

  // Weight Entries
  weightEntries: [],

  addWeightEntry: (entry) => {
    const newEntry = { ...entry, id: generateId(), createdAt: Date.now() }
    const state = get()

    const oldWeight = state.weightEntries.length > 0
      ? [...state.weightEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].weight
      : 0
    const oldCaloriesGoal = state.healthGoals.find(g => g.type === 'calories' && g.active)
    const oldCalories = oldCaloriesGoal?.target || 0

    set((s) => ({ weightEntries: [...s.weightEntries, newEntry] }))

    // Auto-recalculate goals if significant weight change
    if (shouldRecalculateObjectives(entry.weight, state.weightEntries, 2)) {
      recalculateNutritionObjectives({
        newWeight: entry.weight,
        profile: state.userProfile,
        currentGoals: state.healthGoals,
        updateHealthGoal: (id, updates) => {
          set((s) => ({
            healthGoals: s.healthGoals.map((g) => g.id === id ? { ...g, ...updates } : g)
          }))
        }
      })

      const newState = get()
      const newCaloriesGoal = newState.healthGoals.find(g => g.type === 'calories' && g.active)
      const newCalories = newCaloriesGoal?.target || 0

      if (oldCalories > 0 && newCalories !== oldCalories) {
        const message = getRecalculationMessage(oldWeight, entry.weight, oldCalories, newCalories)
        get().addToast(`✨ Objectifs recalculés ! ${message}`, 'success')
      }
    } else {
      get().addToast('Poids enregistré', 'success')
    }
  },

  updateWeightEntry: (id, updates) => {
    set((s) => ({
      weightEntries: s.weightEntries.map((e) => e.id === id ? { ...e, ...updates } : e)
    }))
    get().addToast('Entrée mise à jour', 'success')
  },

  deleteWeightEntry: (id) => {
    set((s) => ({ weightEntries: s.weightEntries.filter((e) => e.id !== id) }))
    get().addToast('Entrée supprimée', 'info')
  },

  // Meal Entries
  mealEntries: [],

  addMealEntry: (entry) => {
    const newEntry = { ...entry, id: generateId(), createdAt: Date.now() }
    set((s) => ({ mealEntries: [...s.mealEntries, newEntry] }))
    get().addToast('Repas enregistré', 'success')
  },

  updateMealEntry: (id, updates) => {
    set((s) => ({
      mealEntries: s.mealEntries.map((e) => e.id === id ? { ...e, ...updates } : e)
    }))
    get().addToast('Repas mis à jour', 'success')
  },

  deleteMealEntry: (id) => {
    set((s) => ({ mealEntries: s.mealEntries.filter((e) => e.id !== id) }))
    get().addToast('Repas supprimé', 'info')
  },

  // Exercise Entries
  exerciseEntries: [],

  addExerciseEntry: (entry) => {
    const newEntry = { ...entry, id: generateId(), createdAt: Date.now() }
    set((s) => ({ exerciseEntries: [...s.exerciseEntries, newEntry] }))
    get().addToast('Exercice enregistré', 'success')
  },

  updateExerciseEntry: (id, updates) => {
    set((s) => ({
      exerciseEntries: s.exerciseEntries.map((e) => e.id === id ? { ...e, ...updates } : e)
    }))
    get().addToast('Exercice mis à jour', 'success')
  },

  deleteExerciseEntry: (id) => {
    set((s) => ({ exerciseEntries: s.exerciseEntries.filter((e) => e.id !== id) }))
    get().addToast('Exercice supprimé', 'info')
  },

  // Hydration Entries
  hydrationEntries: [],

  addHydrationEntry: (entry) => {
    const newEntry = { ...entry, id: generateId(), createdAt: Date.now() }
    set((s) => ({ hydrationEntries: [...s.hydrationEntries, newEntry] }))
    get().addToast('Hydratation enregistrée', 'success')
  },

  deleteHydrationEntry: (id) => {
    set((s) => ({ hydrationEntries: s.hydrationEntries.filter((e) => e.id !== id) }))
    get().addToast('Entrée supprimée', 'info')
  },

  // Health Goals
  healthGoals: [
    {
      id: '1',
      type: 'weight',
      target: 75,
      current: 80,
      unit: 'kg',
      startDate: new Date().toISOString().split('T')[0],
      active: true
    },
    {
      id: '2',
      type: 'calories',
      target: 2000,
      current: 0,
      unit: 'kcal',
      startDate: new Date().toISOString().split('T')[0],
      active: true
    }
  ],

  addHealthGoal: (goal) => {
    const newGoal = { ...goal, id: generateId() }
    set((s) => ({ healthGoals: [...s.healthGoals, newGoal] }))
    get().addToast('Objectif créé', 'success')
  },

  updateHealthGoal: (id, updates) => {
    set((s) => ({
      healthGoals: s.healthGoals.map((g) => g.id === id ? { ...g, ...updates } : g)
    }))
    get().addToast('Objectif mis à jour', 'success')
  },

  deleteHealthGoal: (id) => {
    set((s) => ({ healthGoals: s.healthGoals.filter((g) => g.id !== id) }))
    get().addToast('Objectif supprimé', 'info')
  },
})
