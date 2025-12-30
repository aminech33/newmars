/**
 * 📊 Metrics - Calculs de métriques pour MyDay
 * 
 * Toutes les métriques calculées depuis useStore
 * Sans dépendance au Brain
 */

import { Task, JournalEntry, Habit } from '../store/useStore'

// ═══════════════════════════════════════════════════════════════
// HELPERS DATE
// ═══════════════════════════════════════════════════════════════

function isToday(timestamp: number): boolean {
  const today = new Date()
  const date = new Date(timestamp)
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

function isYesterday(timestamp: number): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const date = new Date(timestamp)
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  )
}

function isInLast7Days(timestamp: number): boolean {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  return timestamp >= sevenDaysAgo
}

function isInLast14Days(timestamp: number): boolean {
  const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000
  return timestamp >= fourteenDaysAgo
}

function isThisWeek(timestamp: number): boolean {
  const today = new Date()
  const date = new Date(timestamp)
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Lundi
  startOfWeek.setHours(0, 0, 0, 0)
  return date >= startOfWeek
}

function getDayName(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('fr-FR', { weekday: 'long' })
}

// ═══════════════════════════════════════════════════════════════
// MÉTRIQUES TÂCHES — Version simplifiée (3 lignes factuelles)
// ═══════════════════════════════════════════════════════════════

export interface TaskMetrics {
  // Volume : nombre de tâches terminées aujourd'hui
  todayCount: number
  
  // Moyenne sur 14 jours
  avg14d: number
  
  // Nature : type d'activité (avancée réelle ou préparation/maintenance)
  activityType: 'avancée' | 'préparation'
  
  // Tendance 14 jours : stable, en hausse, en baisse
  trend14d: 'stable' | 'en hausse' | 'en baisse'
  
  // Détails pour la tendance
  last7DaysCount: number
  days8to14Count: number
}

/**
 * Calcule les métriques tâches simplifiées
 * - Volume : combien aujourd'hui
 * - Nature : avancée réelle ou préparation/maintenance
 * - Tendance : rythme sur 14 jours
 */
export function calculateTaskMetrics(tasks: Task[]): TaskMetrics {
  const completedTasks = tasks.filter(t => t.completed && t.completedAt)
  
  // 1. VOLUME — Tâches terminées aujourd'hui
  const todayCount = completedTasks.filter(t => isToday(t.completedAt!)).length
  
  // 2. MOYENNE 14 JOURS
  const last14Days = completedTasks.filter(t => isInLast14Days(t.completedAt!)).length
  const avg14d = Math.round((last14Days / 14) * 10) / 10 // Arrondi à 1 décimale
  
  // 3. NATURE — Détermine le type d'activité
  // Une tâche est "avancée" si effort M ou L, ou si elle a des subtasks complétées
  const todayTasks = completedTasks.filter(t => isToday(t.completedAt!))
  const hasAdvancedTask = todayTasks.some(t => 
    t.effort === 'M' || 
    t.effort === 'L' || 
    (t.subtasks && t.subtasks.filter(s => s.completed).length >= 2)
  )
  const activityType: TaskMetrics['activityType'] = hasAdvancedTask ? 'avancée' : 'préparation'
  
  // 4. TENDANCE 14 JOURS — Compare les 7 derniers jours vs les 7 d'avant
  const last7DaysCount = completedTasks.filter(t => isInLast7Days(t.completedAt!)).length
  const days8to14Count = last14Days - last7DaysCount
  
  // Calcul de la tendance
  let trend14d: TaskMetrics['trend14d'] = 'stable'
  if (last7DaysCount > 0 || days8to14Count > 0) {
    const diff = last7DaysCount - days8to14Count
    const threshold = Math.max(2, Math.round((last7DaysCount + days8to14Count) / 2 * 0.2)) // 20% de variation
    
    if (diff > threshold) {
      trend14d = 'en hausse'
    } else if (diff < -threshold) {
      trend14d = 'en baisse'
    }
  }
  
  return {
    todayCount,
    avg14d,
    activityType,
    trend14d,
    last7DaysCount,
    days8to14Count
  }
}

// ═══════════════════════════════════════════════════════════════
// MÉTRIQUES HABITUDES
// ═══════════════════════════════════════════════════════════════

export interface HabitMetrics {
  today: { completed: number; total: number }
  todayPercent: number
  vsYesterday: number
  avg7d: number
  vsWeekBefore: number
}

export function calculateHabitMetrics(habits: Habit[]): HabitMetrics {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  // Aujourd'hui
  const todayCompleted = habits.filter(h => h.completedDates.includes(today)).length
  const todayTotal = habits.length
  const todayPercent = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0
  
  // Hier
  const yesterdayCompleted = habits.filter(h => h.completedDates.includes(yesterday)).length
  const yesterdayPercent = todayTotal > 0 ? Math.round((yesterdayCompleted / todayTotal) * 100) : 0
  
  // Moyenne 7 derniers jours
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    return date.toISOString().split('T')[0]
  })
  
  const completionRates7d = last7Days.map(date => {
    const completed = habits.filter(h => h.completedDates.includes(date)).length
    return todayTotal > 0 ? (completed / todayTotal) * 100 : 0
  })
  const avg7d = Math.round(completionRates7d.reduce((sum, rate) => sum + rate, 0) / 7)
  
  // Moyenne 7 jours d'avant
  const days8to14 = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.now() - (i + 7) * 24 * 60 * 60 * 1000)
    return date.toISOString().split('T')[0]
  })
  
  const completionRatesWeekBefore = days8to14.map(date => {
    const completed = habits.filter(h => h.completedDates.includes(date)).length
    return todayTotal > 0 ? (completed / todayTotal) * 100 : 0
  })
  const avgWeekBefore = Math.round(completionRatesWeekBefore.reduce((sum, rate) => sum + rate, 0) / 7)
  
  return {
    today: { completed: todayCompleted, total: todayTotal },
    todayPercent,
    vsYesterday: todayPercent - yesterdayPercent,
    avg7d,
    vsWeekBefore: avg7d - avgWeekBefore
  }
}

// ═══════════════════════════════════════════════════════════════
// MÉTRIQUES JOURNAL
// ═══════════════════════════════════════════════════════════════

export interface JournalMetrics {
  currentStreak: number
  thisWeek: { completed: number; total: number }
}

export function calculateJournalMetrics(journalEntries: JournalEntry[]): JournalMetrics {
  // Série actuelle
  let currentStreak = 0
  const sortedEntries = journalEntries
    .map(e => new Date(e.date).toDateString())
    .filter((v, i, a) => a.indexOf(v) === i) // Unique dates
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
  
  if (sortedEntries.length > 0) {
    const today = new Date().toDateString()
    if (sortedEntries[0] === today) {
      currentStreak = 1
      for (let i = 1; i < sortedEntries.length; i++) {
        const prevDate = new Date(sortedEntries[i-1])
        const currDate = new Date(sortedEntries[i])
        const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / (24 * 60 * 60 * 1000))
        if (diffDays === 1) {
          currentStreak++
        } else {
          break
        }
      }
    }
  }
  
  // Cette semaine
  const thisWeekEntries = journalEntries.filter(e => isThisWeek(new Date(e.date).getTime()))
  const uniqueDaysThisWeek = new Set(thisWeekEntries.map(e => new Date(e.date).toDateString())).size
  
  const today = new Date()
  const daysSinceMonday = today.getDay() === 0 ? 6 : today.getDay() - 1
  const expectedDays = daysSinceMonday + 1
  
  return {
    currentStreak,
    thisWeek: { completed: uniqueDaysThisWeek, total: expectedDays }
  }
}








