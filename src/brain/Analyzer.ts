/**
 * 🧠 BRAIN - Analyzer
 * 
 * Analyse les événements pour détecter les patterns.
 * Transparent : chaque pattern est explicable.
 */

import { BrainMemory, UserPatterns, BrainEvent } from './types'
import { getEventsByType, getTodayEvents } from './Memory'

/**
 * Analyse complète des patterns utilisateur
 */
export function analyzePatterns(memory: BrainMemory): UserPatterns {
  const events = memory.recentEvents
  
  if (events.length < 10) {
    // Pas assez de données, retourner les patterns actuels
    return memory.patterns
  }
  
  return {
    // Temporels
    ...analyzeTemporalPatterns(events),
    
    // Productivité
    ...analyzeProductivityPatterns(events),
    
    // Santé
    ...analyzeHealthPatterns(events),
    
    // Mental
    ...analyzeMentalPatterns(events),
    
    // Habitudes
    ...analyzeHabitPatterns(events),
    
    // Apprentissage
    ...analyzeLearningPatterns(events),
    
    // Corrélations
    correlations: analyzeCorrelations(events),
  }
}

// ═══════════════════════════════════════════════════════════════
// ANALYSE TEMPORELLE
// ═══════════════════════════════════════════════════════════════

function analyzeTemporalPatterns(events: BrainEvent[]): Partial<UserPatterns> {
  const taskCompletions = events.filter(e => e.type === 'task:completed')
  const pomodoroCompletions = events.filter(e => e.type === 'pomodoro:completed')
  
  // Compter les événements par heure
  const byHour: Record<number, number> = {}
  for (let h = 0; h < 24; h++) byHour[h] = 0
  
  ;[...taskCompletions, ...pomodoroCompletions].forEach(e => {
    const hour = e.context?.hour ?? new Date(e.timestamp).getHours()
    byHour[hour]++
  })
  
  // Top 3 heures productives
  const peakHours = Object.entries(byHour)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([h]) => parseInt(h))
    .filter(h => byHour[h] > 0)
  
  // Heures de fatigue (moins d'activité)
  const lowHours = Object.entries(byHour)
    .filter(([h]) => parseInt(h) >= 6 && parseInt(h) <= 23) // Heures éveillées
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([h]) => parseInt(h))
  
  // Meilleurs jours de la semaine
  const byDay: Record<number, number> = {}
  for (let d = 0; d < 7; d++) byDay[d] = 0
  
  taskCompletions.forEach(e => {
    const day = e.context?.dayOfWeek ?? new Date(e.timestamp).getDay()
    byDay[day]++
  })
  
  const bestDays = Object.entries(byDay)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([d]) => parseInt(d))
    .filter(d => byDay[d] > 0)
  
  // Heure moyenne de début/fin
  const appOpens = events.filter(e => e.type === 'app:opened')
  const avgStart = appOpens.length > 0
    ? Math.round(appOpens.reduce((sum, e) => sum + (e.context?.hour ?? 9), 0) / appOpens.length)
    : 9
  
  return {
    peakHours: peakHours.length > 0 ? peakHours : [10, 14, 16],
    lowHours: lowHours.length > 0 ? lowHours : [13, 22, 23],
    bestDays: bestDays.length > 0 ? bestDays : [1, 2, 3],
    averageSessionStart: avgStart,
    averageSessionEnd: avgStart + 9, // Approximation
  }
}

// ═══════════════════════════════════════════════════════════════
// ANALYSE PRODUCTIVITÉ
// ═══════════════════════════════════════════════════════════════

function analyzeProductivityPatterns(events: BrainEvent[]): Partial<UserPatterns> {
  const taskCreated = events.filter(e => e.type === 'task:created')
  const taskCompleted = events.filter(e => e.type === 'task:completed')
  const pomodoroCompleted = events.filter(e => e.type === 'pomodoro:completed')
  
  // Tâches par jour (moyenne sur 7 jours)
  const uniqueDays = new Set(events.map(e => 
    new Date(e.timestamp).toISOString().split('T')[0]
  ))
  const avgTasksPerDay = uniqueDays.size > 0 
    ? Math.round(taskCompleted.length / uniqueDays.size * 10) / 10
    : 0
  
  // Durée Pomodoro moyenne
  const avgFocusDuration = pomodoroCompleted.length > 0
    ? Math.round(pomodoroCompleted.reduce((sum, e) => 
        sum + (e.data.actualDuration || e.data.duration || 25), 0
      ) / pomodoroCompleted.length)
    : 25
  
  // Catégories préférées
  const categoryCount: Record<string, number> = {}
  taskCompleted.forEach(e => {
    const cat = e.data.category || 'work'
    categoryCount[cat] = (categoryCount[cat] || 0) + 1
  })
  
  const preferredCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat)
  
  // Catégories évitées (créées mais pas complétées)
  const createdCategories: Record<string, number> = {}
  taskCreated.forEach(e => {
    const cat = e.data.category || 'work'
    createdCategories[cat] = (createdCategories[cat] || 0) + 1
  })
  
  const avoidedCategories = Object.entries(createdCategories)
    .filter(([cat]) => {
      const completed = categoryCount[cat] || 0
      const created = createdCategories[cat] || 0
      return created > 2 && completed / created < 0.3 // Moins de 30% complétées
    })
    .map(([cat]) => cat)
  
  // Taux de complétion
  const taskCompletionRate = taskCreated.length > 0
    ? Math.round(taskCompleted.length / taskCreated.length * 100) / 100
    : 0
  
  // Délai moyen (approximation basée sur timestamps)
  const avgTaskDelay = taskCompleted.length > 0
    ? Math.round(taskCompleted.reduce((sum, e) => {
        // Trouver la création correspondante
        const created = taskCreated.find(c => c.data.id === e.data.id)
        if (created) {
          const days = (e.timestamp - created.timestamp) / (1000 * 60 * 60 * 24)
          return sum + days
        }
        return sum
      }, 0) / taskCompleted.length)
    : 0
  
  return {
    avgTasksPerDay,
    avgFocusDuration,
    preferredCategories,
    avoidedCategories,
    taskCompletionRate,
    avgTaskDelay,
  }
}

// ═══════════════════════════════════════════════════════════════
// ANALYSE SANTÉ
// ═══════════════════════════════════════════════════════════════

function analyzeHealthPatterns(events: BrainEvent[]): Partial<UserPatterns> {
  const meals = events.filter(e => e.type === 'meal:added')
  const weights = events.filter(e => e.type === 'weight:added')
  
  // Heures de repas moyennes
  const mealsByType: Record<string, number[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  }
  
  meals.forEach(e => {
    const type = e.data.type || 'snack'
    const hour = e.context?.hour ?? new Date(e.timestamp).getHours()
    if (mealsByType[type]) {
      mealsByType[type].push(hour)
    }
  })
  
  const avgMealTime = (hours: number[]): string | null => {
    if (hours.length === 0) return null
    const avg = Math.round(hours.reduce((a, b) => a + b, 0) / hours.length)
    return `${avg.toString().padStart(2, '0')}:00`
  }
  
  // Calories moyennes par jour
  const caloriesByDay: Record<string, number> = {}
  meals.forEach(e => {
    const day = new Date(e.timestamp).toISOString().split('T')[0]
    caloriesByDay[day] = (caloriesByDay[day] || 0) + (e.data.calories || 0)
  })
  
  const avgCaloriesPerDay = Object.keys(caloriesByDay).length > 0
    ? Math.round(Object.values(caloriesByDay).reduce((a, b) => a + b, 0) / Object.keys(caloriesByDay).length)
    : 0
  
  // Tendance poids
  let weightTrend: 'losing' | 'gaining' | 'stable' = 'stable'
  if (weights.length >= 2) {
    const sorted = [...weights].sort((a, b) => a.timestamp - b.timestamp)
    const first = sorted[0].data.weight
    const last = sorted[sorted.length - 1].data.weight
    const diff = last - first
    if (diff < -0.5) weightTrend = 'losing'
    else if (diff > 0.5) weightTrend = 'gaining'
  }
  
  return {
    mealTimes: {
      breakfast: avgMealTime(mealsByType.breakfast),
      lunch: avgMealTime(mealsByType.lunch),
      dinner: avgMealTime(mealsByType.dinner),
    },
    avgCaloriesPerDay,
    weightTrend,
  }
}

// ═══════════════════════════════════════════════════════════════
// ANALYSE MENTAL
// ═══════════════════════════════════════════════════════════════

function analyzeMentalPatterns(events: BrainEvent[]): Partial<UserPatterns> {
  const moodEvents = events.filter(e => e.type === 'mood:set' || e.type === 'journal:written')
  const journalEvents = events.filter(e => e.type === 'journal:written')
  
  // Mood moyen
  const moods = moodEvents
    .map(e => e.data.mood)
    .filter((m): m is number => typeof m === 'number')
  
  const avgMood = moods.length > 0
    ? Math.round(moods.reduce((a, b) => a + b, 0) / moods.length * 10) / 10
    : 6
  
  // Mood par heure
  const moodByHour: Record<number, number[]> = {}
  moodEvents.forEach(e => {
    if (typeof e.data.mood === 'number') {
      const hour = e.context?.hour ?? new Date(e.timestamp).getHours()
      if (!moodByHour[hour]) moodByHour[hour] = []
      moodByHour[hour].push(e.data.mood)
    }
  })
  
  const avgMoodByHour: Record<number, number> = {}
  Object.entries(moodByHour).forEach(([h, moods]) => {
    avgMoodByHour[parseInt(h)] = Math.round(moods.reduce((a, b) => a + b, 0) / moods.length * 10) / 10
  })
  
  // Mood par jour
  const moodByDay: Record<number, number[]> = {}
  moodEvents.forEach(e => {
    if (typeof e.data.mood === 'number') {
      const day = e.context?.dayOfWeek ?? new Date(e.timestamp).getDay()
      if (!moodByDay[day]) moodByDay[day] = []
      moodByDay[day].push(e.data.mood)
    }
  })
  
  const avgMoodByDay: Record<number, number> = {}
  Object.entries(moodByDay).forEach(([d, moods]) => {
    avgMoodByDay[parseInt(d)] = Math.round(moods.reduce((a, b) => a + b, 0) / moods.length * 10) / 10
  })
  
  // Fréquence journal (jours par semaine)
  const journalDays = new Set(journalEvents.map(e => 
    new Date(e.timestamp).toISOString().split('T')[0]
  ))
  const journalFrequency = Math.min(7, journalDays.size)
  
  return {
    avgMood,
    moodByHour: avgMoodByHour,
    moodByDay: avgMoodByDay,
    journalFrequency,
  }
}

// ═══════════════════════════════════════════════════════════════
// ANALYSE HABITUDES
// ═══════════════════════════════════════════════════════════════

function analyzeHabitPatterns(events: BrainEvent[]): Partial<UserPatterns> {
  const checked = events.filter(e => e.type === 'habit:checked')
  const unchecked = events.filter(e => e.type === 'habit:unchecked')
  
  // Taux de complétion
  const total = checked.length + unchecked.length
  const habitCompletionRate = total > 0
    ? Math.round(checked.length / total * 100) / 100
    : 0
  
  // Habitudes les plus consistantes
  const habitCounts: Record<string, { checked: number; total: number }> = {}
  
  checked.forEach(e => {
    const id = e.data.habitId
    if (!habitCounts[id]) habitCounts[id] = { checked: 0, total: 0 }
    habitCounts[id].checked++
    habitCounts[id].total++
  })
  
  unchecked.forEach(e => {
    const id = e.data.habitId
    if (!habitCounts[id]) habitCounts[id] = { checked: 0, total: 0 }
    habitCounts[id].total++
  })
  
  const sortedHabits = Object.entries(habitCounts)
    .map(([id, { checked, total }]) => ({
      id,
      rate: total > 0 ? checked / total : 0,
      total,
    }))
    .filter(h => h.total >= 3) // Au moins 3 occurrences
  
  const mostConsistentHabits = sortedHabits
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 3)
    .map(h => h.id)
  
  const strugglingHabits = sortedHabits
    .filter(h => h.rate < 0.5)
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 3)
    .map(h => h.id)
  
  return {
    habitCompletionRate,
    mostConsistentHabits,
    strugglingHabits,
  }
}

// ═══════════════════════════════════════════════════════════════
// ANALYSE APPRENTISSAGE
// ═══════════════════════════════════════════════════════════════

function analyzeLearningPatterns(events: BrainEvent[]): Partial<UserPatterns> {
  const courseMessages = events.filter(e => e.type === 'course:message')
  const flashcards = events.filter(e => e.type === 'flashcard:reviewed')
  
  // Durée moyenne d'étude (approximation basée sur les messages)
  // On estime ~2 min par message
  const studySessions = new Map<string, number>()
  courseMessages.forEach(e => {
    const day = new Date(e.timestamp).toISOString().split('T')[0]
    studySessions.set(day, (studySessions.get(day) || 0) + 2)
  })
  
  const avgStudyDuration = studySessions.size > 0
    ? Math.round([...studySessions.values()].reduce((a, b) => a + b, 0) / studySessions.size)
    : 30
  
  // Heure préférée pour apprendre
  const studyHours: Record<number, number> = {}
  courseMessages.forEach(e => {
    const hour = e.context?.hour ?? new Date(e.timestamp).getHours()
    studyHours[hour] = (studyHours[hour] || 0) + 1
  })
  
  const preferredLearningTime = Object.entries(studyHours)
    .sort((a, b) => b[1] - a[1])[0]?.[0]
  
  return {
    avgStudyDuration,
    preferredLearningTime: preferredLearningTime ? parseInt(preferredLearningTime) : 10,
  }
}

// ═══════════════════════════════════════════════════════════════
// ANALYSE CORRÉLATIONS
// ═══════════════════════════════════════════════════════════════

function analyzeCorrelations(events: BrainEvent[]): UserPatterns['correlations'] {
  // Corrélation Mood ↔ Productivité
  // Regrouper par jour
  const dayData: Record<string, { mood: number[]; tasks: number }> = {}
  
  events.forEach(e => {
    const day = new Date(e.timestamp).toISOString().split('T')[0]
    if (!dayData[day]) dayData[day] = { mood: [], tasks: 0 }
    
    if ((e.type === 'mood:set' || e.type === 'journal:written') && typeof e.data.mood === 'number') {
      dayData[day].mood.push(e.data.mood)
    }
    if (e.type === 'task:completed') {
      dayData[day].tasks++
    }
  })
  
  // Calculer corrélation simple
  const daysWithBoth = Object.values(dayData).filter(d => d.mood.length > 0 && d.tasks > 0)
  
  let moodProductivity = 0
  if (daysWithBoth.length >= 5) {
    const avgMoods = daysWithBoth.map(d => d.mood.reduce((a, b) => a + b, 0) / d.mood.length)
    const avgTasks = daysWithBoth.map(d => d.tasks)
    
    // Corrélation de Pearson simplifiée
    const meanMood = avgMoods.reduce((a, b) => a + b, 0) / avgMoods.length
    const meanTasks = avgTasks.reduce((a, b) => a + b, 0) / avgTasks.length
    
    let num = 0, denMood = 0, denTasks = 0
    for (let i = 0; i < avgMoods.length; i++) {
      const diffMood = avgMoods[i] - meanMood
      const diffTasks = avgTasks[i] - meanTasks
      num += diffMood * diffTasks
      denMood += diffMood * diffMood
      denTasks += diffTasks * diffTasks
    }
    
    const den = Math.sqrt(denMood * denTasks)
    moodProductivity = den > 0 ? Math.round(num / den * 100) / 100 : 0
  }
  
  return {
    moodProductivity,
    sleepProductivity: 0, // Pas de données sommeil pour l'instant
    exerciseEnergy: 0,    // Pas de données exercice pour l'instant
  }
}

/**
 * Analyse rapide pour les prédictions (moins coûteuse)
 */
export function quickAnalyze(memory: BrainMemory): {
  currentHourProductivity: number
  todayTaskCount: number
  lastMood: number | null
  hoursSinceLastMeal: number | null
} {
  const now = new Date()
  const currentHour = now.getHours()
  const today = now.toISOString().split('T')[0]
  
  // Productivité de l'heure actuelle (basée sur l'historique)
  const hourEvents = memory.recentEvents.filter(e => 
    e.context?.hour === currentHour && e.type === 'task:completed'
  )
  const currentHourProductivity = hourEvents.length
  
  // Tâches aujourd'hui
  const todayEvents = getTodayEvents(memory)
  const todayTaskCount = todayEvents.filter(e => e.type === 'task:completed').length
  
  // Dernier mood
  const moodEvents = memory.recentEvents
    .filter(e => e.type === 'mood:set' || (e.type === 'journal:written' && e.data.mood))
    .sort((a, b) => b.timestamp - a.timestamp)
  const lastMood = moodEvents[0]?.data.mood ?? null
  
  // Heures depuis dernier repas
  const mealEvents = memory.recentEvents
    .filter(e => e.type === 'meal:added')
    .sort((a, b) => b.timestamp - a.timestamp)
  const hoursSinceLastMeal = mealEvents[0]
    ? Math.round((Date.now() - mealEvents[0].timestamp) / (1000 * 60 * 60) * 10) / 10
    : null
  
  return {
    currentHourProductivity,
    todayTaskCount,
    lastMood,
    hoursSinceLastMeal,
  }
}




