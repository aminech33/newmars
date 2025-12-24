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
// MÉTRIQUES TÂCHES
// ═══════════════════════════════════════════════════════════════

export interface TaskMetrics {
  today: number
  vsYesterday: number
  vsYesterdayPercent: number
  avg7d: number
  vsWeekBefore: number
  thisWeek: number
  bestDayThisWeek: { day: string; count: number } | null
  currentStreak: number
}

export function calculateTaskMetrics(tasks: Task[]): TaskMetrics {
  const completedTasks = tasks.filter(t => t.completed && t.completedAt)
  
  // Aujourd'hui
  const today = completedTasks.filter(t => isToday(t.completedAt!)).length
  
  // Hier
  const yesterday = completedTasks.filter(t => isYesterday(t.completedAt!)).length
  
  // 7 derniers jours
  const last7Days = completedTasks.filter(t => isInLast7Days(t.completedAt!))
  const avg7d = last7Days.length / 7
  
  // 7 jours d'avant (jour 8 à 14)
  const last14Days = completedTasks.filter(t => isInLast14Days(t.completedAt!))
  const days8to14 = last14Days.filter(t => !isInLast7Days(t.completedAt!))
  const avgWeekBefore = days8to14.length / 7
  
  // Cette semaine
  const thisWeek = completedTasks.filter(t => isThisWeek(t.completedAt!)).length
  
  // Meilleur jour cette semaine
  const thisWeekTasks = completedTasks.filter(t => isThisWeek(t.completedAt!))
  const tasksByDay = new Map<string, number>()
  thisWeekTasks.forEach(t => {
    const day = getDayName(t.completedAt!)
    tasksByDay.set(day, (tasksByDay.get(day) || 0) + 1)
  })
  let bestDayThisWeek = null
  if (tasksByDay.size > 0) {
    const bestEntry = Array.from(tasksByDay.entries()).reduce((a, b) => 
      b[1] > a[1] ? b : a
    )
    bestDayThisWeek = { day: bestEntry[0], count: bestEntry[1] }
  }
  
  // Série actuelle (jours consécutifs avec au moins 1 tâche)
  let currentStreak = 0
  const sortedDates = Array.from(new Set(
    completedTasks.map(t => new Date(t.completedAt!).toDateString())
  )).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
  
  if (sortedDates.length > 0) {
    const today = new Date().toDateString()
    if (sortedDates[0] === today) {
      currentStreak = 1
      for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i-1])
        const currDate = new Date(sortedDates[i])
        const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / (24 * 60 * 60 * 1000))
        if (diffDays === 1) {
          currentStreak++
        } else {
          break
        }
      }
    }
  }
  
  return {
    today,
    vsYesterday: today - yesterday,
    vsYesterdayPercent: yesterday > 0 ? Math.round(((today - yesterday) / yesterday) * 100) : 0,
    avg7d: Math.round(avg7d * 10) / 10,
    vsWeekBefore: Math.round((avg7d - avgWeekBefore) * 10) / 10,
    thisWeek,
    bestDayThisWeek,
    currentStreak
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



