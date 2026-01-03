/**
 * useGlobalStats - La "Maison Mère" de tous les calculs de statistiques
 * 
 * Ce hook centralise TOUS les calculs de stats pour :
 * - Éviter la duplication de code
 * - Optimiser les performances avec useMemo
 * - Garantir la cohérence des données
 * - Faciliter la maintenance
 * 
 * Usage:
 * const { tasks, habits, journal, pomodoro, health, library, learning, correlations } = useGlobalStats()
 */

import { useMemo } from 'react'
import { useStore, Task, TaskCategory, TaskPriority } from '../store/useStore'
import { JournalEntry } from '../types/journal'
import { Habit } from '../types/widgets'
import { Book, ReadingGoal } from '../types/library'
import { PomodoroSession } from '../store/useStore'
import { WeightEntry, MealEntry } from '../types/health'
import { Course } from '../types/learning'

// ============================================
// TYPES
// ============================================

export interface TasksStats {
  total: number
  completed: number
  pending: number
  todayCompleted: number
  todayCreated: number
  overdue: number
  completionRate: number
  averageCompletionTime: number
  byCategory: Record<TaskCategory, number>
  byPriority: Record<TaskPriority, number>
  byStatus: Record<string, number>
  last7Days: { date: string; total: number; completed: number }[]
  streak: number
  tasksPerDay: number
  mostProductiveCategory: TaskCategory
}

export interface HabitsStats {
  total: number
  todayCompleted: number
  todayRate: number
  globalStreak: number
  longestStreak: number
  avgLast30Days: number
  totalCompletions: number
  mostConsistentHabit: Habit | null
  last7Days: { date: string; completed: number; total: number }[]
}

export interface JournalStats {
  totalEntries: number
  currentStreak: number
  longestStreak: number
  averageMood: number
  entriesThisMonth: number
  entriesThisYear: number
  favoriteCount: number
  hasTodayEntry: boolean
  moodTrend: number[] // 14 derniers jours
  topTags: { tag: string; count: number }[]
}

export interface PomodoroStats {
  totalSessions: number
  totalMinutes: number
  todaySessions: number
  todayMinutes: number
  averageSessionLength: number
  currentStreak: number
  longestStreak: number
  last7Days: { date: string; sessions: number; minutes: number }[]
  byProject: Record<string, number>
}

export interface HealthStats {
  latestWeight: number
  targetWeight: number
  bmi: number
  bmiCategory: 'underweight' | 'normal' | 'overweight' | 'obese' | null
  weightTrend: 'increasing' | 'decreasing' | 'stable'
  weeklyWeightChange: number
  todayCalories: number
  targetCalories: number
  caloriesRate: number
  streak: number
  last7DaysWeight: number[]
  last7DaysCalories: number[]
}

export interface LibraryStats {
  totalBooks: number
  completedBooks: number
  completedThisYear: number
  currentlyReading: number
  totalPagesRead: number
  totalReadingTime: number
  averageRating: number
  goalProgress: number
  currentStreak: number
  longestStreak: number
  favoriteGenre: string | null
  booksPerMonth: number[]
}

export interface LearningStats {
  totalCourses: number
  activeCourses: number
  completedCourses: number
  totalNotes: number
  averageProgress: number
  totalStudyTime: number
}

export interface Correlations {
  moodVsHabitsRate: number | null // -1 à 1
  productivityVsPomodoro: number | null
}

export interface GlobalStats {
  tasks: TasksStats
  habits: HabitsStats
  journal: JournalStats
  pomodoro: PomodoroStats
  health: HealthStats
  library: LibraryStats
  learning: LearningStats
  correlations: Correlations
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const getToday = () => new Date().toISOString().split('T')[0]

const getLast7Days = (): string[] => {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    days.push(date.toISOString().split('T')[0])
  }
  return days
}

const getLast14Days = (): string[] => {
  const days: string[] = []
  for (let i = 13; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    days.push(date.toISOString().split('T')[0])
  }
  return days
}

// ============================================
// TASKS STATS CALCULATOR
// ============================================

function calculateTasksStats(tasks: Task[]): TasksStats {
  const today = getToday()
  const last7Days = getLast7Days()
  
  const completed = tasks.filter(t => t.completed)
  const pending = tasks.filter(t => !t.completed)
  
  const todayCompleted = completed.filter(t => {
    const taskDate = new Date(t.createdAt).toISOString().split('T')[0]
    return taskDate === today
  }).length
  
  const todayCreated = tasks.filter(t => {
    const taskDate = new Date(t.createdAt).toISOString().split('T')[0]
    return taskDate === today
  }).length
  
  const overdue = pending.filter(t => {
    if (!t.dueDate) return false
    return new Date(t.dueDate).getTime() < Date.now()
  }).length
  
  // By category
  const byCategory: Record<TaskCategory, number> = {
    dev: 0, design: 0, personal: 0, work: 0, urgent: 0
  }
  tasks.forEach(t => byCategory[t.category]++)
  
  // By priority
  const byPriority: Record<TaskPriority, number> = {
    low: 0, medium: 0, high: 0, urgent: 0
  }
  tasks.forEach(t => byPriority[t.priority]++)
  
  // By status
  const byStatus: Record<string, number> = {
    todo: 0, 'in-progress': 0, done: 0
  }
  tasks.forEach(t => byStatus[t.status]++)
  
  // Last 7 days stats
  const last7DaysStats = last7Days.map(date => {
    const dayTasks = tasks.filter(t => {
      const taskDate = new Date(t.createdAt).toISOString().split('T')[0]
      return taskDate <= date
    })
    const dayCompleted = dayTasks.filter(t => t.completed).length
    return { date, total: dayTasks.length, completed: dayCompleted }
  })
  
  // Completion rate
  const completionRate = tasks.length > 0 
    ? Math.round((completed.length / tasks.length) * 100) 
    : 0
  
  // Average completion time
  const tasksWithTime = completed.filter(t => t.actualTime)
  const averageCompletionTime = tasksWithTime.length > 0
    ? Math.round(tasksWithTime.reduce((sum, t) => sum + (t.actualTime || 0), 0) / tasksWithTime.length)
    : 0
  
  // Tasks per day (30 days)
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
  const recentTasks = tasks.filter(t => t.createdAt >= thirtyDaysAgo)
  const tasksPerDay = Math.round((recentTasks.length / 30) * 10) / 10
  
  // Most productive category
  const completedByCategory: Record<TaskCategory, number> = {
    dev: 0, design: 0, personal: 0, work: 0, urgent: 0
  }
  completed.forEach(t => completedByCategory[t.category]++)
  const mostProductiveCategory = Object.entries(completedByCategory)
    .sort(([, a], [, b]) => b - a)[0]?.[0] as TaskCategory || 'work'
  
  // Streak (consecutive days with completed tasks)
  let streak = 0
  let checkDate = new Date()
  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split('T')[0]
    const hasCompletedTask = completed.some(t => {
      const taskDate = new Date(t.createdAt).toISOString().split('T')[0]
      return taskDate === dateStr
    })
    if (hasCompletedTask) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else if (i > 0) {
      break
    } else {
      checkDate.setDate(checkDate.getDate() - 1)
    }
  }
  
  return {
    total: tasks.length,
    completed: completed.length,
    pending: pending.length,
    todayCompleted,
    todayCreated,
    overdue,
    completionRate,
    averageCompletionTime,
    byCategory,
    byPriority,
    byStatus,
    last7Days: last7DaysStats,
    streak,
    tasksPerDay,
    mostProductiveCategory
  }
}

// ============================================
// HABITS STATS CALCULATOR
// ============================================

function calculateHabitsStats(habits: Habit[]): HabitsStats {
  const today = getToday()
  const last7Days = getLast7Days()
  
  const todayCompleted = habits.filter(h => h.completedDates.includes(today)).length
  const todayRate = habits.length > 0 
    ? Math.round((todayCompleted / habits.length) * 100) 
    : 0
  
  // Global streak (at least one habit completed per day)
  let globalStreak = 0
  let checkDate = new Date()
  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split('T')[0]
    const hasActivity = habits.some(h => h.completedDates.includes(dateStr))
    if (hasActivity) {
      globalStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else if (i > 0) {
      break
    } else {
      checkDate.setDate(checkDate.getDate() - 1)
    }
  }
  
  // Longest streak per habit
  let longestStreak = 0
  habits.forEach(habit => {
    let maxStreak = 0
    let currentStreak = 0
    const sortedDates = [...habit.completedDates].sort()
    
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        currentStreak = 1
      } else {
        const prevDate = new Date(sortedDates[i - 1])
        const currDate = new Date(sortedDates[i])
        const dayDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (dayDiff === 1) {
          currentStreak++
        } else {
          currentStreak = 1
        }
      }
      maxStreak = Math.max(maxStreak, currentStreak)
    }
    longestStreak = Math.max(longestStreak, maxStreak)
  })
  
  // Average last 30 days
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return date.toISOString().split('T')[0]
  })
  
  const last30DaysCompletions = last30Days.map(date => 
    habits.filter(h => h.completedDates.includes(date)).length
  )
  
  const avgLast30Days = habits.length > 0
    ? Math.round((last30DaysCompletions.reduce((a, b) => a + b, 0) / (30 * habits.length)) * 100)
    : 0
  
  // Total completions
  const totalCompletions = habits.reduce((sum, h) => sum + h.completedDates.length, 0)
  
  // Most consistent habit
  const mostConsistentHabit = habits.reduce<Habit | null>((best, h) => {
    if (!best || h.completedDates.length > best.completedDates.length) {
      return h
    }
    return best
  }, null)
  
  // Last 7 days
  const last7DaysStats = last7Days.map(date => ({
    date,
    completed: habits.filter(h => h.completedDates.includes(date)).length,
    total: habits.length
  }))
  
  return {
    total: habits.length,
    todayCompleted,
    todayRate,
    globalStreak,
    longestStreak,
    avgLast30Days,
    totalCompletions,
    mostConsistentHabit,
    last7Days: last7DaysStats
  }
}

// ============================================
// JOURNAL STATS CALCULATOR
// ============================================

function calculateJournalStats(entries: JournalEntry[]): JournalStats {
  const today = getToday()
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  // Current streak
  const sortedDates = [...new Set(entries.map(e => e.date))].sort().reverse()
  let currentStreak = 0
  let checkDate = new Date(today)
  
  for (const date of sortedDates) {
    const entryDate = new Date(date)
    const diffDays = Math.floor((checkDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === currentStreak) {
      currentStreak++
    } else if (diffDays > currentStreak) {
      break
    }
  }
  
  // Longest streak
  const sortedDatesAsc = [...new Set(entries.map(e => e.date))].sort()
  let longestStreak = sortedDatesAsc.length > 0 ? 1 : 0
  let tempStreak = 1
  
  for (let i = 1; i < sortedDatesAsc.length; i++) {
    const prevDate = new Date(sortedDatesAsc[i - 1])
    const currDate = new Date(sortedDatesAsc[i])
    const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) {
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      tempStreak = 1
    }
  }
  
  // Average mood
  const entriesWithMood = entries.filter(e => e.mood !== undefined)
  const averageMood = entriesWithMood.length > 0
    ? Math.round((entriesWithMood.reduce((acc, e) => acc + (e.mood || 0), 0) / entriesWithMood.length) * 10) / 10
    : 0
  
  // Entries this month/year
  const entriesThisMonth = entries.filter(e => {
    const date = new Date(e.date)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  }).length
  
  const entriesThisYear = entries.filter(e => {
    const date = new Date(e.date)
    return date.getFullYear() === currentYear
  }).length
  
  // Favorites
  const favoriteCount = entries.filter(e => e.isFavorite).length
  
  // Has today entry
  const hasTodayEntry = entries.some(e => e.date === today)
  
  // Mood trend (last 14 days)
  const last14Days = getLast14Days()
  const moodTrend = last14Days.map(date => {
    const entry = entries.find(e => e.date === date)
    return entry?.mood || 0
  })
  
  // Top tags
  const tagCounts: Record<string, number> = {}
  entries.forEach(entry => {
    entry.tags?.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })
  })
  const topTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }))
  
  return {
    totalEntries: entries.length,
    currentStreak,
    longestStreak,
    averageMood,
    entriesThisMonth,
    entriesThisYear,
    favoriteCount,
    hasTodayEntry,
    moodTrend,
    topTags
  }
}

// ============================================
// POMODORO STATS CALCULATOR
// ============================================

function calculatePomodoroStats(sessions: PomodoroSession[]): PomodoroStats {
  const today = getToday()
  const last7Days = getLast7Days()
  
  const todaySessions = sessions.filter(s => s.date === today)
  const todayMinutes = todaySessions.reduce((sum, s) => sum + (s.actualDuration || s.duration), 0)
  
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.actualDuration || s.duration), 0)
  
  const averageSessionLength = sessions.length > 0
    ? Math.round(totalMinutes / sessions.length)
    : 0
  
  // Streak
  let currentStreak = 0
  let checkDate = new Date()
  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split('T')[0]
    const hasSession = sessions.some(s => s.date === dateStr)
    if (hasSession) {
      currentStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else if (i > 0) {
      break
    } else {
      checkDate.setDate(checkDate.getDate() - 1)
    }
  }
  
  // Longest streak
  const sortedDates = [...new Set(sessions.map(s => s.date))].sort()
  let longestStreak = sortedDates.length > 0 ? 1 : 0
  let tempStreak = 1
  
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1])
    const currDate = new Date(sortedDates[i])
    const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) {
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      tempStreak = 1
    }
  }
  
  // Last 7 days
  const last7DaysStats = last7Days.map(date => {
    const daySessions = sessions.filter(s => s.date === date)
    return {
      date,
      sessions: daySessions.length,
      minutes: daySessions.reduce((sum, s) => sum + (s.actualDuration || s.duration), 0)
    }
  })
  
  // By project
  const byProject: Record<string, number> = {}
  sessions.forEach(s => {
    if (s.projectName) {
      byProject[s.projectName] = (byProject[s.projectName] || 0) + 1
    }
  })
  
  return {
    totalSessions: sessions.length,
    totalMinutes,
    todaySessions: todaySessions.length,
    todayMinutes,
    averageSessionLength,
    currentStreak,
    longestStreak,
    last7Days: last7DaysStats,
    byProject
  }
}

// ============================================
// HEALTH STATS CALCULATOR
// ============================================

function calculateHealthStats(
  weightEntries: WeightEntry[],
  mealEntries: MealEntry[],
  userProfile: { height?: number; targetWeight?: number; dailyCalorieGoal?: number }
): HealthStats {
  const today = getToday()
  const last7Days = getLast7Days()
  
  // Sort weight entries by date
  const sortedWeights = [...weightEntries].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  
  const latestWeight = sortedWeights[0]?.weight || 0
  const targetWeight = userProfile.targetWeight || 0
  
  // BMI
  const heightInMeters = (userProfile.height || 170) / 100
  const bmi = latestWeight > 0 
    ? Math.round((latestWeight / (heightInMeters * heightInMeters)) * 10) / 10
    : 0
  
  let bmiCategory: HealthStats['bmiCategory'] = null
  if (bmi > 0) {
    if (bmi < 18.5) bmiCategory = 'underweight'
    else if (bmi < 25) bmiCategory = 'normal'
    else if (bmi < 30) bmiCategory = 'overweight'
    else bmiCategory = 'obese'
  }
  
  // Weight trend
  const weekAgoWeight = sortedWeights.find(w => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return new Date(w.date) <= weekAgo
  })?.weight || latestWeight
  
  const weeklyWeightChange = Math.round((latestWeight - weekAgoWeight) * 10) / 10
  
  let weightTrend: HealthStats['weightTrend'] = 'stable'
  if (weeklyWeightChange > 0.5) weightTrend = 'increasing'
  else if (weeklyWeightChange < -0.5) weightTrend = 'decreasing'
  
  // Today calories
  const todayMeals = mealEntries.filter(m => m.date === today)
  const todayCalories = todayMeals.reduce((sum, m) => sum + (m.calories || 0), 0)
  const targetCalories = userProfile.dailyCalorieGoal || 2000
  const caloriesRate = Math.round((todayCalories / targetCalories) * 100)
  
  // Streak (days with weight or meal logged)
  let streak = 0
  let checkDate = new Date()
  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split('T')[0]
    const hasEntry = weightEntries.some(w => w.date === dateStr) || 
                     mealEntries.some(m => m.date === dateStr)
    if (hasEntry) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else if (i > 0) {
      break
    } else {
      checkDate.setDate(checkDate.getDate() - 1)
    }
  }
  
  // Last 7 days weight
  const last7DaysWeight = last7Days.map(date => {
    const entry = weightEntries.find(w => w.date === date)
    return entry?.weight || 0
  })
  
  // Last 7 days calories
  const last7DaysCalories = last7Days.map(date => {
    const dayMeals = mealEntries.filter(m => m.date === date)
    return dayMeals.reduce((sum, m) => sum + (m.calories || 0), 0)
  })
  
  return {
    latestWeight,
    targetWeight,
    bmi,
    bmiCategory,
    weightTrend,
    weeklyWeightChange,
    todayCalories,
    targetCalories,
    caloriesRate,
    streak,
    last7DaysWeight,
    last7DaysCalories
  }
}

// ============================================
// LIBRARY STATS CALCULATOR
// ============================================

function calculateLibraryStats(books: Book[], readingGoal: ReadingGoal | null): LibraryStats {
  const currentYear = new Date().getFullYear()
  const completedBooks = books.filter(b => b.status === 'completed')
  const currentlyReading = books.filter(b => b.status === 'reading').length
  
  // Completed this year
  const completedThisYear = completedBooks.filter(b => 
    b.finishedAt && new Date(b.finishedAt).getFullYear() === currentYear
  ).length
  
  // Pages and time
  const totalPagesRead = books.reduce((acc, b) => acc + (b.currentPage || 0), 0)
  const totalReadingTime = books.reduce((acc, b) => acc + b.totalReadingTime, 0)
  
  // Average rating
  const ratings = completedBooks.filter(b => b.rating).map(b => b.rating!)
  const averageRating = ratings.length > 0 
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
    : 0
  
  // Goal progress
  const goalProgress = readingGoal 
    ? Math.round((completedThisYear / readingGoal.targetBooks) * 100)
    : 0
  
  // Streaks
  const readingDates = new Set<string>()
  books.forEach(book => {
    if (book.finishedAt) {
      readingDates.add(new Date(book.finishedAt).toISOString().split('T')[0])
    }
    if (book.startedAt) {
      readingDates.add(new Date(book.startedAt).toISOString().split('T')[0])
    }
  })
  
  const sortedDates = Array.from(readingDates).sort()
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  
  let currentStreak = 0
  if (sortedDates.includes(today) || sortedDates.includes(yesterday)) {
    currentStreak = 1
    let checkDate = sortedDates.includes(today) ? new Date(today) : new Date(yesterday)
    
    for (let i = 1; i < 365; i++) {
      checkDate.setDate(checkDate.getDate() - 1)
      const prevDate = checkDate.toISOString().split('T')[0]
      if (sortedDates.includes(prevDate)) {
        currentStreak++
      } else {
        break
      }
    }
  }
  
  let longestStreak = sortedDates.length > 0 ? 1 : 0
  let tempStreak = 1
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1])
    const currDate = new Date(sortedDates[i])
    const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / 86400000)
    
    if (diffDays === 1) {
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      tempStreak = 1
    }
  }
  longestStreak = Math.max(longestStreak, currentStreak)
  
  // Favorite genre
  const genreCounts: Record<string, number> = {}
  books.forEach(book => {
    if (book.genre) {
      genreCounts[book.genre] = (genreCounts[book.genre] || 0) + 1
    }
  })
  const favoriteGenre = Object.keys(genreCounts).length > 0
    ? Object.entries(genreCounts).sort(([, a], [, b]) => b - a)[0][0]
    : null
  
  // Books per month (12 months)
  const booksPerMonth: number[] = new Array(12).fill(0)
  const now = new Date()
  completedBooks.forEach(book => {
    if (book.finishedAt) {
      const finishedDate = new Date(book.finishedAt)
      const monthsDiff = (now.getFullYear() - finishedDate.getFullYear()) * 12 
        + (now.getMonth() - finishedDate.getMonth())
      
      if (monthsDiff >= 0 && monthsDiff < 12) {
        booksPerMonth[11 - monthsDiff]++
      }
    }
  })
  
  return {
    totalBooks: books.length,
    completedBooks: completedBooks.length,
    completedThisYear,
    currentlyReading,
    totalPagesRead,
    totalReadingTime,
    averageRating,
    goalProgress,
    currentStreak,
    longestStreak,
    favoriteGenre,
    booksPerMonth
  }
}

// ============================================
// LEARNING STATS CALCULATOR
// ============================================

function calculateLearningStats(courses: Course[]): LearningStats {
  const activeCourses = courses.filter(c => c.status === 'active').length
  const completedCourses = courses.filter(c => c.status === 'completed').length
  
  const totalNotes = courses.reduce((sum, c) => sum + (c.notes?.length || 0), 0)
  
  const coursesWithProgress = courses.filter(c => c.progress !== undefined)
  const averageProgress = coursesWithProgress.length > 0
    ? Math.round(coursesWithProgress.reduce((sum, c) => sum + (c.progress || 0), 0) / coursesWithProgress.length)
    : 0
  
  // Total study time (from messages count as proxy)
  const totalStudyTime = courses.reduce((sum, c) => sum + (c.messages?.length || 0) * 5, 0) // 5 min per message
  
  return {
    totalCourses: courses.length,
    activeCourses,
    completedCourses,
    totalNotes,
    averageProgress,
    totalStudyTime
  }
}

// ============================================
// CORRELATIONS CALCULATOR
// ============================================

function calculateCorrelations(
  journalEntries: JournalEntry[],
  habits: Habit[],
  pomodoroSessions: PomodoroSession[],
  tasks: Task[]
): Correlations {
  // Mood vs Habits Rate correlation
  // Simple: compare days with high habit completion to mood
  let moodVsHabitsRate: number | null = null
  
  if (journalEntries.length >= 7 && habits.length > 0) {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    })
    
    const dataPoints: { habitRate: number; mood: number }[] = []
    
    last30Days.forEach(date => {
      const entry = journalEntries.find(e => e.date === date)
      if (entry?.mood) {
        const habitRate = habits.filter(h => h.completedDates.includes(date)).length / habits.length
        dataPoints.push({ habitRate, mood: entry.mood })
      }
    })
    
    if (dataPoints.length >= 5) {
      // Simple correlation coefficient
      const n = dataPoints.length
      const sumX = dataPoints.reduce((s, p) => s + p.habitRate, 0)
      const sumY = dataPoints.reduce((s, p) => s + p.mood, 0)
      const sumXY = dataPoints.reduce((s, p) => s + p.habitRate * p.mood, 0)
      const sumX2 = dataPoints.reduce((s, p) => s + p.habitRate * p.habitRate, 0)
      const sumY2 = dataPoints.reduce((s, p) => s + p.mood * p.mood, 0)
      
      const numerator = n * sumXY - sumX * sumY
      const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
      
      if (denominator !== 0) {
        moodVsHabitsRate = Math.round((numerator / denominator) * 100) / 100
      }
    }
  }
  
  // Productivity vs Pomodoro correlation
  let productivityVsPomodoro: number | null = null
  
  if (pomodoroSessions.length >= 7 && tasks.length >= 7) {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    })
    
    const dataPoints: { pomodoroMinutes: number; tasksCompleted: number }[] = []
    
    last30Days.forEach(date => {
      const daySessions = pomodoroSessions.filter(s => s.date === date)
      const pomodoroMinutes = daySessions.reduce((sum, s) => sum + (s.actualDuration || s.duration), 0)
      
      const tasksCompleted = tasks.filter(t => {
        if (!t.completed) return false
        const taskDate = new Date(t.createdAt).toISOString().split('T')[0]
        return taskDate === date
      }).length
      
      if (pomodoroMinutes > 0 || tasksCompleted > 0) {
        dataPoints.push({ pomodoroMinutes, tasksCompleted })
      }
    })
    
    if (dataPoints.length >= 5) {
      const n = dataPoints.length
      const sumX = dataPoints.reduce((s, p) => s + p.pomodoroMinutes, 0)
      const sumY = dataPoints.reduce((s, p) => s + p.tasksCompleted, 0)
      const sumXY = dataPoints.reduce((s, p) => s + p.pomodoroMinutes * p.tasksCompleted, 0)
      const sumX2 = dataPoints.reduce((s, p) => s + p.pomodoroMinutes * p.pomodoroMinutes, 0)
      const sumY2 = dataPoints.reduce((s, p) => s + p.tasksCompleted * p.tasksCompleted, 0)
      
      const numerator = n * sumXY - sumX * sumY
      const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
      
      if (denominator !== 0) {
        productivityVsPomodoro = Math.round((numerator / denominator) * 100) / 100
      }
    }
  }
  
  return {
    moodVsHabitsRate,
    productivityVsPomodoro
  }
}

// ============================================
// MAIN HOOK
// ============================================

export function useGlobalStats(): GlobalStats {
  const {
    tasks,
    habits,
    journalEntries,
    pomodoroSessions,
    weightEntries,
    mealEntries,
    userProfile,
    books,
    readingGoal,
    learningCourses
  } = useStore()
  
  // All stats are memoized - only recalculated when dependencies change
  
  const tasksStats = useMemo(
    () => calculateTasksStats(tasks),
    [tasks]
  )
  
  const habitsStats = useMemo(
    () => calculateHabitsStats(habits),
    [habits]
  )
  
  const journalStats = useMemo(
    () => calculateJournalStats(journalEntries),
    [journalEntries]
  )
  
  const pomodoroStats = useMemo(
    () => calculatePomodoroStats(pomodoroSessions),
    [pomodoroSessions]
  )
  
  const healthStats = useMemo(
    () => calculateHealthStats(weightEntries, mealEntries, userProfile),
    [weightEntries, mealEntries, userProfile]
  )
  
  const libraryStats = useMemo(
    () => calculateLibraryStats(books, readingGoal),
    [books, readingGoal]
  )
  
  const learningStats = useMemo(
    () => calculateLearningStats(learningCourses),
    [learningCourses]
  )
  
  const correlations = useMemo(
    () => calculateCorrelations(journalEntries, habits, pomodoroSessions, tasks),
    [journalEntries, habits, pomodoroSessions, tasks]
  )
  
  return {
    tasks: tasksStats,
    habits: habitsStats,
    journal: journalStats,
    pomodoro: pomodoroStats,
    health: healthStats,
    library: libraryStats,
    learning: learningStats,
    correlations
  }
}

// ============================================
// INDIVIDUAL HOOKS (for selective usage)
// ============================================

export function useTasksStats(): TasksStats {
  const { tasks } = useStore()
  return useMemo(() => calculateTasksStats(tasks), [tasks])
}

export function useHabitsStats(): HabitsStats {
  const { habits } = useStore()
  return useMemo(() => calculateHabitsStats(habits), [habits])
}

export function useJournalStats(): JournalStats {
  const { journalEntries } = useStore()
  return useMemo(() => calculateJournalStats(journalEntries), [journalEntries])
}

export function usePomodoroStats(): PomodoroStats {
  const { pomodoroSessions } = useStore()
  return useMemo(() => calculatePomodoroStats(pomodoroSessions), [pomodoroSessions])
}

export function useHealthStats(): HealthStats {
  const { weightEntries, mealEntries, userProfile } = useStore()
  return useMemo(
    () => calculateHealthStats(weightEntries, mealEntries, userProfile),
    [weightEntries, mealEntries, userProfile]
  )
}

export function useLibraryStatsHook(): LibraryStats {
  const { books, readingGoal } = useStore()
  return useMemo(() => calculateLibraryStats(books, readingGoal), [books, readingGoal])
}

export function useLearningStats(): LearningStats {
  const { learningCourses } = useStore()
  return useMemo(() => calculateLearningStats(learningCourses), [learningCourses])
}

