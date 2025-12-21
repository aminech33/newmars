/**
 * 🧠 BRAIN - Wellbeing Score
 * 
 * Score global de bien-être qui combine :
 * - Productivité
 * - Santé
 * - Mental
 * - Constance
 * 
 * Transparent et explicable.
 */

import { BrainMemory, UserPatterns, WellbeingScore } from './types'
import { getTodayEvents } from './Memory'

/**
 * Calcule le score de bien-être global (0-100)
 */
export function calculateWellbeingScore(
  memory: BrainMemory,
  patterns: UserPatterns
): WellbeingScore {
  const productivity = calculateProductivityScore(memory, patterns)
  const health = calculateHealthScore(memory, patterns)
  const mental = calculateMentalScore(memory, patterns)
  const consistency = calculateConsistencyScore(memory, patterns)
  
  const overall = productivity + health + mental + consistency
  
  // Calculer la tendance
  const trend = calculateTrend(memory, overall)
  
  return {
    overall,
    breakdown: {
      productivity,
      health,
      mental,
      consistency,
    },
    trend: trend.direction,
    trendPercent: trend.percent,
  }
}

// ═══════════════════════════════════════════════════════════════
// SCORE PRODUCTIVITÉ (0-25)
// ═══════════════════════════════════════════════════════════════

function calculateProductivityScore(memory: BrainMemory, patterns: UserPatterns): number {
  let score = 0
  const todayEvents = getTodayEvents(memory)
  const todayTasks = todayEvents.filter(e => e.type === 'task:completed').length
  
  // Tâches complétées vs objectif (0-10)
  if (patterns.avgTasksPerDay > 0) {
    const ratio = Math.min(1, todayTasks / patterns.avgTasksPerDay)
    score += ratio * 10
  } else {
    score += todayTasks > 0 ? 5 : 0
  }
  
  // Temps de focus (0-10)
  const focusMinutes = todayEvents
    .filter(e => e.type === 'pomodoro:completed')
    .reduce((sum, e) => sum + (e.data.actualDuration || e.data.duration || 25), 0)
  
  // Objectif: 2h de focus par jour
  const focusRatio = Math.min(1, focusMinutes / 120)
  score += focusRatio * 10
  
  // Taux de complétion global (0-5)
  score += patterns.taskCompletionRate * 5
  
  return Math.round(score)
}

// ═══════════════════════════════════════════════════════════════
// SCORE SANTÉ (0-25)
// ═══════════════════════════════════════════════════════════════

function calculateHealthScore(memory: BrainMemory, patterns: UserPatterns): number {
  let score = 0
  const todayEvents = getTodayEvents(memory)
  
  // Repas enregistrés (0-10)
  const meals = todayEvents.filter(e => e.type === 'meal:added').length
  if (meals >= 3) score += 10
  else if (meals >= 2) score += 7
  else if (meals >= 1) score += 4
  
  // Tendance poids positive (0-5)
  if (patterns.weightTrend === 'stable') score += 5
  else if (patterns.weightTrend === 'losing') score += 5 // Selon objectif
  else score += 2 // Gaining peut être bien aussi
  
  // Hydratation (0-5)
  const water = todayEvents.filter(e => e.type === 'water:added').length
  if (water >= 4) score += 5
  else if (water >= 2) score += 3
  else if (water >= 1) score += 1
  
  // Calories dans la cible (0-5)
  if (patterns.avgCaloriesPerDay > 0) {
    // Approximation : si on a des repas, on est dans la cible
    if (meals >= 2) score += 5
  }
  
  return Math.round(Math.min(25, score))
}

// ═══════════════════════════════════════════════════════════════
// SCORE MENTAL (0-25)
// ═══════════════════════════════════════════════════════════════

function calculateMentalScore(memory: BrainMemory, patterns: UserPatterns): number {
  let score = 0
  const todayEvents = getTodayEvents(memory)
  
  // Mood actuel (0-10)
  const moodEvents = todayEvents.filter(e => 
    e.type === 'mood:set' || (e.type === 'journal:written' && e.data.mood)
  )
  
  if (moodEvents.length > 0) {
    const lastMood = moodEvents.sort((a, b) => b.timestamp - a.timestamp)[0].data.mood
    if (typeof lastMood === 'number') {
      score += lastMood // Mood sur 10
    }
  } else {
    // Pas de mood = score neutre
    score += patterns.avgMood || 5
  }
  
  // Journal écrit (0-5)
  const hasJournal = todayEvents.some(e => e.type === 'journal:written')
  if (hasJournal) score += 5
  
  // Mood moyen récent (0-5)
  if (patterns.avgMood >= 7) score += 5
  else if (patterns.avgMood >= 5) score += 3
  else score += 1
  
  // Corrélation mood/productivité positive (0-5)
  if (patterns.correlations.moodProductivity > 0.3) score += 5
  else if (patterns.correlations.moodProductivity > 0) score += 2
  
  return Math.round(Math.min(25, score))
}

// ═══════════════════════════════════════════════════════════════
// SCORE CONSTANCE (0-25)
// ═══════════════════════════════════════════════════════════════

function calculateConsistencyScore(memory: BrainMemory, patterns: UserPatterns): number {
  let score = 0
  const todayEvents = getTodayEvents(memory)
  
  // Habitudes du jour (0-10)
  const habitsChecked = todayEvents.filter(e => e.type === 'habit:checked').length
  if (habitsChecked >= 3) score += 10
  else if (habitsChecked >= 2) score += 7
  else if (habitsChecked >= 1) score += 4
  
  // Taux de complétion habitudes global (0-10)
  score += patterns.habitCompletionRate * 10
  
  // Fréquence journal (0-5)
  if (patterns.journalFrequency >= 5) score += 5
  else if (patterns.journalFrequency >= 3) score += 3
  else if (patterns.journalFrequency >= 1) score += 1
  
  return Math.round(Math.min(25, score))
}

// ═══════════════════════════════════════════════════════════════
// TENDANCE
// ═══════════════════════════════════════════════════════════════

function calculateTrend(
  memory: BrainMemory, 
  currentScore: number
): { direction: 'improving' | 'stable' | 'declining'; percent: number } {
  const history = memory.scoreHistory
  
  if (history.length < 3) {
    return { direction: 'stable', percent: 0 }
  }
  
  // Moyenne des 7 derniers jours vs 7 jours avant
  const recent = history.slice(-7)
  const older = history.slice(-14, -7)
  
  if (recent.length === 0 || older.length === 0) {
    return { direction: 'stable', percent: 0 }
  }
  
  const recentAvg = recent.reduce((sum, s) => sum + s.score, 0) / recent.length
  const olderAvg = older.reduce((sum, s) => sum + s.score, 0) / older.length
  
  const diff = recentAvg - olderAvg
  const percent = olderAvg > 0 ? Math.round((diff / olderAvg) * 100) : 0
  
  let direction: 'improving' | 'stable' | 'declining' = 'stable'
  if (diff > 5) direction = 'improving'
  else if (diff < -5) direction = 'declining'
  
  return { direction, percent: Math.abs(percent) }
}

// ═══════════════════════════════════════════════════════════════
// HELPERS D'AFFICHAGE
// ═══════════════════════════════════════════════════════════════

/**
 * Obtient une description du score
 */
export function getScoreDescription(score: number): string {
  if (score >= 80) return 'Excellent ! Tu es au top !'
  if (score >= 60) return 'Bien ! Continue comme ça.'
  if (score >= 40) return 'Correct. Quelques ajustements possibles.'
  if (score >= 20) return 'Peut mieux faire. Prends soin de toi.'
  return 'Journée difficile. Demain sera meilleur.'
}

/**
 * Obtient la couleur du score
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return '#10b981' // Emerald
  if (score >= 60) return '#6366f1' // Indigo
  if (score >= 40) return '#f59e0b' // Amber
  if (score >= 20) return '#f97316' // Orange
  return '#ef4444' // Red
}

/**
 * Obtient l'emoji du score
 */
export function getScoreEmoji(score: number): string {
  if (score >= 80) return '🌟'
  if (score >= 60) return '😊'
  if (score >= 40) return '🙂'
  if (score >= 20) return '😐'
  return '💙' // Supportif, pas négatif
}

/**
 * Obtient l'emoji de tendance
 */
export function getTrendEmoji(trend: 'improving' | 'stable' | 'declining'): string {
  switch (trend) {
    case 'improving': return '📈'
    case 'declining': return '📉'
    default: return '➡️'
  }
}



