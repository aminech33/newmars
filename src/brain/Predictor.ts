/**
 * 🧠 BRAIN - Predictor
 * 
 * Fait des prédictions simples et transparentes.
 * Chaque prédiction est explicable : "basé sur X, je pense que Y"
 */

import { BrainMemory, UserPatterns, CurrentPredictions, Prediction, DEFAULT_BRAIN_CONFIG } from './types'
import { quickAnalyze } from './Analyzer'
import { getTodayEvents } from './Memory'

/**
 * Génère les prédictions actuelles
 */
export function predict(memory: BrainMemory, patterns: UserPatterns): CurrentPredictions {
  const now = new Date()
  const currentHour = now.getHours()
  const currentDay = now.getDay()
  
  const quick = quickAnalyze(memory)
  const todayEvents = getTodayEvents(memory)
  
  return {
    // Productivité
    isGoodTimeForWork: isGoodTimeForWork(currentHour, patterns),
    expectedTasksToday: predictTasksToday(patterns, quick.todayTaskCount),
    procrastinationRisk: calculateProcrastinationRisk(memory, patterns),
    suggestedBreakIn: suggestBreak(todayEvents),
    
    // Santé
    expectedMoodTonight: predictMoodTonight(patterns, quick.lastMood),
    shouldEatSoon: quick.hoursSinceLastMeal !== null && quick.hoursSinceLastMeal > 4,
    hydrationReminder: shouldRemindHydration(todayEvents),
    
    // Énergie
    energyLevel: predictEnergyLevel(currentHour, patterns, quick.lastMood),
    optimalTaskType: suggestTaskType(currentHour, patterns, quick),
  }
}

// ═══════════════════════════════════════════════════════════════
// PRÉDICTIONS PRODUCTIVITÉ
// ═══════════════════════════════════════════════════════════════

/**
 * Est-ce un bon moment pour travailler ?
 */
function isGoodTimeForWork(currentHour: number, patterns: UserPatterns): boolean {
  // Vérifier si l'heure actuelle est dans les heures productives
  if (patterns.peakHours.includes(currentHour)) {
    return true
  }
  
  // Éviter les heures de fatigue
  if (patterns.lowHours.includes(currentHour)) {
    return false
  }
  
  // Heures de travail normales (9h-18h)
  return currentHour >= 9 && currentHour <= 18
}

/**
 * Combien de tâches l'utilisateur va probablement faire aujourd'hui ?
 */
function predictTasksToday(patterns: UserPatterns, alreadyDone: number): number {
  const expected = patterns.avgTasksPerDay
  const remaining = Math.max(0, expected - alreadyDone)
  
  // Arrondir à l'entier
  return Math.round(alreadyDone + remaining)
}

/**
 * Risque de procrastination (0-1)
 */
function calculateProcrastinationRisk(memory: BrainMemory, patterns: UserPatterns): number {
  let risk = 0
  
  // Facteur 1: Catégories évitées en attente
  // (Si on a des tâches créées dans des catégories qu'on évite)
  if (patterns.avoidedCategories.length > 0) {
    risk += 0.2
  }
  
  // Facteur 2: Faible taux de complétion récent
  if (patterns.taskCompletionRate < 0.5) {
    risk += 0.2
  }
  
  // Facteur 3: Délai moyen élevé
  if (patterns.avgTaskDelay > 3) {
    risk += 0.2
  }
  
  // Facteur 4: Heure de fatigue
  const currentHour = new Date().getHours()
  if (patterns.lowHours.includes(currentHour)) {
    risk += 0.2
  }
  
  // Facteur 5: Pas de tâches faites aujourd'hui et il est tard
  const todayTasks = getTodayEvents(memory).filter(e => e.type === 'task:completed').length
  if (todayTasks === 0 && currentHour >= 14) {
    risk += 0.2
  }
  
  return Math.min(1, risk)
}

/**
 * Suggérer une pause (retourne minutes avant pause, ou null)
 */
function suggestBreak(todayEvents: import('./types').BrainEvent[]): number | null {
  const focusEvents = todayEvents.filter(e => 
    e.type === 'pomodoro:completed' || e.type === 'task:completed'
  )
  
  if (focusEvents.length === 0) return null
  
  // Trouver le dernier événement de focus
  const lastFocus = focusEvents.sort((a, b) => b.timestamp - a.timestamp)[0]
  const minutesSinceLastFocus = (Date.now() - lastFocus.timestamp) / (1000 * 60)
  
  // Si on a travaillé récemment et longtemps, suggérer une pause
  const totalFocusToday = todayEvents
    .filter(e => e.type === 'pomodoro:completed')
    .reduce((sum, e) => sum + (e.data.actualDuration || e.data.duration || 25), 0)
  
  if (totalFocusToday >= DEFAULT_BRAIN_CONFIG.thresholds.breakAfterMinutes && minutesSinceLastFocus < 30) {
    return Math.round(30 - minutesSinceLastFocus)
  }
  
  return null
}

// ═══════════════════════════════════════════════════════════════
// PRÉDICTIONS SANTÉ & MENTAL
// ═══════════════════════════════════════════════════════════════

/**
 * Prédire le mood de ce soir
 */
function predictMoodTonight(patterns: UserPatterns, currentMood: number | null): number {
  // Base : mood moyen
  let predicted = patterns.avgMood
  
  // Ajuster selon le mood actuel
  if (currentMood !== null) {
    // Le mood du soir tend vers le mood actuel
    predicted = (predicted + currentMood) / 2
  }
  
  // Ajuster selon le jour de la semaine
  const today = new Date().getDay()
  if (patterns.moodByDay[today]) {
    predicted = (predicted + patterns.moodByDay[today]) / 2
  }
  
  return Math.round(predicted * 10) / 10
}

/**
 * Faut-il rappeler de boire ?
 */
function shouldRemindHydration(todayEvents: import('./types').BrainEvent[]): boolean {
  const waterEvents = todayEvents.filter(e => e.type === 'water:added')
  const currentHour = new Date().getHours()
  
  // Si pas d'eau enregistrée et il est après 10h
  if (waterEvents.length === 0 && currentHour >= 10) {
    return true
  }
  
  // Si dernière eau il y a plus de 2h
  if (waterEvents.length > 0) {
    const lastWater = waterEvents.sort((a, b) => b.timestamp - a.timestamp)[0]
    const hoursSince = (Date.now() - lastWater.timestamp) / (1000 * 60 * 60)
    return hoursSince > 2
  }
  
  return false
}

// ═══════════════════════════════════════════════════════════════
// PRÉDICTIONS ÉNERGIE
// ═══════════════════════════════════════════════════════════════

/**
 * Niveau d'énergie estimé
 */
function predictEnergyLevel(
  currentHour: number, 
  patterns: UserPatterns, 
  currentMood: number | null
): 'low' | 'medium' | 'high' {
  let score = 50 // Base neutre
  
  // Heure productive = +20
  if (patterns.peakHours.includes(currentHour)) {
    score += 20
  }
  
  // Heure de fatigue = -20
  if (patterns.lowHours.includes(currentHour)) {
    score -= 20
  }
  
  // Mood actuel influence l'énergie
  if (currentMood !== null) {
    if (currentMood >= 7) score += 15
    else if (currentMood <= 4) score -= 15
  }
  
  // Post-déjeuner (13h-14h) = souvent fatigue
  if (currentHour >= 13 && currentHour <= 14) {
    score -= 10
  }
  
  // Fin de journée
  if (currentHour >= 18) {
    score -= 10
  }
  
  if (score >= 60) return 'high'
  if (score <= 40) return 'low'
  return 'medium'
}

/**
 * Type de tâche optimal pour le moment
 */
function suggestTaskType(
  currentHour: number, 
  patterns: UserPatterns,
  quick: ReturnType<typeof quickAnalyze>
): 'creative' | 'routine' | 'break' {
  // Si beaucoup de tâches déjà faites, suggérer une pause
  if (quick.todayTaskCount >= patterns.avgTasksPerDay * 1.5) {
    return 'break'
  }
  
  // Heures productives = tâches créatives
  if (patterns.peakHours.includes(currentHour)) {
    return 'creative'
  }
  
  // Heures de fatigue = pause ou routine légère
  if (patterns.lowHours.includes(currentHour)) {
    return quick.todayTaskCount < 2 ? 'routine' : 'break'
  }
  
  // Matin = créatif, après-midi = routine
  if (currentHour < 12) {
    return 'creative'
  }
  
  return 'routine'
}

// ═══════════════════════════════════════════════════════════════
// PRÉDICTIONS DÉTAILLÉES (pour affichage)
// ═══════════════════════════════════════════════════════════════

/**
 * Génère des prédictions explicables
 */
export function generateDetailedPredictions(
  memory: BrainMemory, 
  patterns: UserPatterns
): Prediction[] {
  const predictions: Prediction[] = []
  const now = new Date()
  const currentHour = now.getHours()
  
  // Prédiction productivité
  if (patterns.peakHours.includes(currentHour)) {
    predictions.push({
      id: 'peak-hour',
      type: 'productivity',
      confidence: 0.8,
      prediction: `C'est une de tes heures les plus productives (${currentHour}h)`,
      basedOn: `Tu as complété beaucoup de tâches à ${currentHour}h ces derniers jours`,
    })
  }
  
  // Prédiction procrastination
  const risk = calculateProcrastinationRisk(memory, patterns)
  if (risk > 0.5) {
    predictions.push({
      id: 'procrastination-risk',
      type: 'procrastination',
      confidence: risk,
      prediction: 'Tu pourrais avoir du mal à te concentrer',
      basedOn: patterns.avoidedCategories.length > 0
        ? `Tu as tendance à éviter les tâches "${patterns.avoidedCategories[0]}"`
        : 'Le taux de complétion récent est bas',
    })
  }
  
  // Prédiction mood
  const quick = quickAnalyze(memory)
  if (quick.lastMood !== null && quick.lastMood <= 4) {
    predictions.push({
      id: 'low-mood',
      type: 'mood',
      confidence: 0.7,
      prediction: 'Journée peut-être difficile',
      basedOn: `Ton mood actuel est de ${quick.lastMood}/10`,
    })
  }
  
  // Prédiction habitudes
  if (patterns.habitCompletionRate < 0.5 && patterns.strugglingHabits.length > 0) {
    predictions.push({
      id: 'habit-struggle',
      type: 'habit',
      confidence: 0.6,
      prediction: 'Certaines habitudes sont difficiles à maintenir',
      basedOn: `Taux de complétion de ${Math.round(patterns.habitCompletionRate * 100)}%`,
    })
  }
  
  return predictions
}


