import { useState, useMemo, useCallback } from 'react'
import { useStore } from '../store/useStore'
import { 
  calculateBMI, 
  getBMICategory, 
  getBMICategoryLabel, 
  getBMICategoryColor,
  analyzeWeightTrend,
  calculateStreak,
  generateHealthSuggestions
} from '../utils/healthIntelligence'

export type HealthTab = 'nutrition' | 'weight'

export function useHealthData() {
  const { 
    weightEntries, 
    mealEntries, 
    healthGoals,
    userProfile,
    addWeightEntry,
    addMealEntry,
    deleteWeightEntry,
    deleteMealEntry
  } = useStore()

  const [activeTab, setActiveTab] = useState<HealthTab>('nutrition')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month' | 'year'>('all')

  // Memoized calculations
  const latestWeight = useMemo(() => {
    if (weightEntries.length === 0) return 0
    return [...weightEntries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].weight
  }, [weightEntries])

  const weightGoal = useMemo(() => 
    healthGoals.find(g => g.type === 'weight' && g.active),
    [healthGoals]
  )
  const targetWeight = weightGoal?.target || 0

  const bmi = useMemo(() => 
    latestWeight > 0 ? calculateBMI(latestWeight, userProfile.height) : 0,
    [latestWeight, userProfile.height]
  )

  const bmiCategory = useMemo(() => getBMICategory(bmi), [bmi])
  const bmiLabel = useMemo(() => getBMICategoryLabel(bmiCategory), [bmiCategory])
  const bmiColor = useMemo(() => getBMICategoryColor(bmiCategory), [bmiCategory])

  const trend = useMemo(() => analyzeWeightTrend(weightEntries), [weightEntries])

  // Today's data
  const today = new Date().toISOString().split('T')[0]
  
  const todayMeals = useMemo(() => 
    mealEntries.filter(m => m.date === today),
    [mealEntries, today]
  )

  const todayCalories = useMemo(() => 
    todayMeals.reduce((sum, m) => sum + m.calories, 0),
    [todayMeals]
  )

  const caloriesGoal = useMemo(() => 
    healthGoals.find(g => g.type === 'calories' && g.active),
    [healthGoals]
  )
  const targetCalories = caloriesGoal?.target || 2000

  // Streak
  const streak = useMemo(() => {
    const allEntries = [...weightEntries, ...mealEntries]
    return calculateStreak(allEntries)
  }, [weightEntries, mealEntries])

  // Suggestions
  const suggestions = useMemo(() => {
    const healthStats = {
      currentWeight: latestWeight,
      targetWeight,
      weightChange: trend.weeklyChange,
      bmi,
      bmiCategory,
      todayCalories,
      targetCalories,
      weekAvgCalories: 0,
      streak
    }
    return generateHealthSuggestions(healthStats, weightEntries, mealEntries)
  }, [latestWeight, targetWeight, trend, bmi, bmiCategory, todayCalories, targetCalories, streak, weightEntries, mealEntries])

  // Filtered entries
  const filteredWeightEntries = useMemo(() => {
    let entries = [...weightEntries]
    
    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const cutoff = new Date()
      if (dateFilter === 'week') cutoff.setDate(now.getDate() - 7)
      else if (dateFilter === 'month') cutoff.setMonth(now.getMonth() - 1)
      else if (dateFilter === 'year') cutoff.setFullYear(now.getFullYear() - 1)
      
      entries = entries.filter(e => new Date(e.date) >= cutoff)
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      entries = entries.filter(e => 
        e.note?.toLowerCase().includes(query) ||
        e.date.includes(query)
      )
    }
    
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [weightEntries, dateFilter, searchQuery])

  const filteredMealEntries = useMemo(() => {
    let entries = [...mealEntries]
    
    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const cutoff = new Date()
      if (dateFilter === 'week') cutoff.setDate(now.getDate() - 7)
      else if (dateFilter === 'month') cutoff.setMonth(now.getMonth() - 1)
      else if (dateFilter === 'year') cutoff.setFullYear(now.getFullYear() - 1)
      
      entries = entries.filter(e => new Date(e.date) >= cutoff)
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      entries = entries.filter(e => 
        e.name.toLowerCase().includes(query) ||
        e.type.toLowerCase().includes(query) ||
        e.date.includes(query)
      )
    }
    
    return entries.sort((a, b) => 
      new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime()
    )
  }, [mealEntries, dateFilter, searchQuery])

  // Handlers with validation
  const handleAddWeight = useCallback((data: { weight: number; date: string; note?: string }) => {
    if (data.weight <= 0 || data.weight > 500) {
      return { success: false, error: 'Le poids doit être entre 0 et 500 kg' }
    }
    addWeightEntry(data)
    return { success: true }
  }, [addWeightEntry])

  const handleAddMeal = useCallback((data: { 
    name: string
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber?: number
    foods?: any[]
    date: string
    time: string
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack' 
  }) => {
    if (!data.name.trim()) {
      return { success: false, error: 'Le nom du repas est requis' }
    }
    if (data.calories < 0 || data.calories > 10000) {
      return { success: false, error: 'Les calories doivent être entre 0 et 10000' }
    }
    addMealEntry(data)
    return { success: true }
  }, [addMealEntry])

  return {
    // State
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    dateFilter,
    setDateFilter,
    
    // Computed data
    latestWeight,
    targetWeight,
    bmi,
    bmiCategory,
    bmiLabel,
    bmiColor,
    trend,
    todayMeals,
    todayCalories,
    targetCalories,
    streak,
    suggestions,
    
    // Filtered data
    filteredWeightEntries,
    filteredMealEntries,
    
    // Raw data
    weightEntries,
    mealEntries,
    userProfile,
    
    // Actions
    handleAddWeight,
    handleAddMeal,
    deleteWeightEntry,
    deleteMealEntry
  }
}

