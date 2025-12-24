/**
 * 🧠 BRAIN - Analyzer (SIMPLIFIÉ)
 * 
 * Analyse les événements pour calculer les patterns
 * utilisés par le Wellbeing Score.
 */

import { BrainMemory, UserPatterns, BrainEvent } from './types'
import { getTodayEvents } from './Memory'

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
    // Productivité
    ...analyzeProductivityPatterns(events),
    
    // Santé
    ...analyzeHealthPatterns(events),
    
    // Mental
    ...analyzeMentalPatterns(events),
    
    // Habitudes
    ...analyzeHabitPatterns(events),
    
    // Corrélations
    correlations: analyzeCorrelations(events),
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
  
  // Taux de complétion
  const taskCompletionRate = taskCreated.length > 0
    ? Math.round(taskCompleted.length / taskCreated.length * 100) / 100
    : 0
  
  return {
    avgTasksPerDay,
    avgFocusDuration,
    taskCompletionRate,
  }
}

// ═══════════════════════════════════════════════════════════════
// ANALYSE SANTÉ
// ═══════════════════════════════════════════════════════════════

function analyzeHealthPatterns(events: BrainEvent[]): Partial<UserPatterns> {
  const meals = events.filter(e => e.type === 'meal:added')
  const weights = events.filter(e => e.type === 'weight:added')
  
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
  
  // Fréquence journal (jours par semaine)
  const journalDays = new Set(journalEvents.map(e => 
    new Date(e.timestamp).toISOString().split('T')[0]
  ))
  const journalFrequency = Math.min(7, journalDays.size)
  
  return {
    avgMood,
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
  
  return {
    habitCompletionRate,
  }
}

// ═══════════════════════════════════════════════════════════════
// ANALYSE CORRÉLATIONS
// ═══════════════════════════════════════════════════════════════

function analyzeCorrelations(events: BrainEvent[]): UserPatterns['correlations'] {
  // Corrélation Mood ↔ Productivité
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
  }
}

/**
 * Analyse rapide pour les stats du Dashboard
 */
export function quickAnalyze(memory: BrainMemory): {
  todayTaskCount: number
  lastMood: number | null
} {
  const todayEvents = getTodayEvents(memory)
  const todayTaskCount = todayEvents.filter(e => e.type === 'task:completed').length
  
  // Dernier mood
  const moodEvents = memory.recentEvents
    .filter(e => e.type === 'mood:set' || (e.type === 'journal:written' && e.data.mood))
    .sort((a, b) => b.timestamp - a.timestamp)
  const lastMood = moodEvents[0]?.data.mood ?? null
  
  return {
    todayTaskCount,
    lastMood,
  }
}
