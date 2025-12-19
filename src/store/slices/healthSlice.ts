import { StateCreator } from 'zustand'
import { WeightEntry, MealEntry, HealthGoal, UserProfile, ExerciseEntry, HydrationEntry } from '../../types/health'

export interface HealthSlice {
  userProfile: UserProfile
  setUserProfile: (profile: Partial<UserProfile>) => void
  weightEntries: WeightEntry[]
  addWeightEntry: (entry: Omit<WeightEntry, 'id' | 'createdAt'>) => void
  updateWeightEntry: (id: string, updates: Partial<WeightEntry>) => void
  deleteWeightEntry: (id: string) => void
  mealEntries: MealEntry[]
  addMealEntry: (entry: Omit<MealEntry, 'id' | 'createdAt'>) => void
  updateMealEntry: (id: string, updates: Partial<MealEntry>) => void
  deleteMealEntry: (id: string) => void
  exerciseEntries: ExerciseEntry[]
  addExerciseEntry: (entry: Omit<ExerciseEntry, 'id' | 'createdAt'>) => void
  updateExerciseEntry: (id: string, updates: Partial<ExerciseEntry>) => void
  deleteExerciseEntry: (id: string) => void
  hydrationEntries: HydrationEntry[]
  addHydrationEntry: (entry: Omit<HydrationEntry, 'id' | 'createdAt'>) => void
  deleteHydrationEntry: (id: string) => void
  healthGoals: HealthGoal[]
  addHealthGoal: (goal: Omit<HealthGoal, 'id'>) => void
  updateHealthGoal: (id: string, updates: Partial<HealthGoal>) => void
  deleteHealthGoal: (id: string) => void
}

const generateId = () => Math.random().toString(36).substring(2, 9)

export const createHealthSlice: StateCreator<HealthSlice> = (set) => ({
  userProfile: {
    height: 175,
    age: 25,
    gender: 'male',
    activityLevel: 'moderate'
  },
  weightEntries: [],
  mealEntries: [],
  exerciseEntries: [],
  hydrationEntries: [],
  healthGoals: [],

  setUserProfile: (profile) => set((state) => ({
    userProfile: { ...state.userProfile, ...profile }
  })),

  addWeightEntry: (entry) => set((state) => ({
    weightEntries: [...state.weightEntries, {
      ...entry,
      id: generateId(),
      createdAt: Date.now()
    }]
  })),

  updateWeightEntry: (id, updates) => set((state) => ({
    weightEntries: state.weightEntries.map(e =>
      e.id === id ? { ...e, ...updates } : e
    )
  })),

  deleteWeightEntry: (id) => set((state) => ({
    weightEntries: state.weightEntries.filter(e => e.id !== id)
  })),

  addMealEntry: (entry) => set((state) => ({
    mealEntries: [...state.mealEntries, {
      ...entry,
      id: generateId(),
      createdAt: Date.now()
    }]
  })),

  updateMealEntry: (id, updates) => set((state) => ({
    mealEntries: state.mealEntries.map(e =>
      e.id === id ? { ...e, ...updates } : e
    )
  })),

  deleteMealEntry: (id) => set((state) => ({
    mealEntries: state.mealEntries.filter(e => e.id !== id)
  })),

  addExerciseEntry: (entry) => set((state) => ({
    exerciseEntries: [...state.exerciseEntries, {
      ...entry,
      id: generateId(),
      createdAt: Date.now()
    }]
  })),

  updateExerciseEntry: (id, updates) => set((state) => ({
    exerciseEntries: state.exerciseEntries.map(e =>
      e.id === id ? { ...e, ...updates } : e
    )
  })),

  deleteExerciseEntry: (id) => set((state) => ({
    exerciseEntries: state.exerciseEntries.filter(e => e.id !== id)
  })),

  addHydrationEntry: (entry) => set((state) => ({
    hydrationEntries: [...state.hydrationEntries, {
      ...entry,
      id: generateId(),
      createdAt: Date.now()
    }]
  })),

  deleteHydrationEntry: (id) => set((state) => ({
    hydrationEntries: state.hydrationEntries.filter(e => e.id !== id)
  })),

  addHealthGoal: (goal) => set((state) => ({
    healthGoals: [...state.healthGoals, { ...goal, id: generateId() }]
  })),

  updateHealthGoal: (id, updates) => set((state) => ({
    healthGoals: state.healthGoals.map(g =>
      g.id === id ? { ...g, ...updates } : g
    )
  })),

  deleteHealthGoal: (id) => set((state) => ({
    healthGoals: state.healthGoals.filter(g => g.id !== id)
  }))
})
