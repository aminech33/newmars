// Utilitaires pour le système de journal

import { JournalEntry, MoodEmoji, JournalStats } from '../types/journal'

// Convertir mood level en emoji
export const moodLevelToEmoji = (level: number): MoodEmoji => {
  if (level <= 2) return '😢'
  if (level <= 4) return '😐'
  if (level <= 6) return '🙂'
  if (level <= 8) return '😊'
  return '🤩'
}

// Convertir emoji en mood level
export const moodEmojiToLevel = (emoji: MoodEmoji): number => {
  const map: Record<MoodEmoji, number> = {
    '😢': 2,
    '😐': 4,
    '🙂': 6,
    '😊': 8,
    '🤩': 10
  }
  return map[emoji] || 6
}

// Calculer le streak (jours consécutifs)
export const calculateJournalStreak = (entries: JournalEntry[]): number => {
  if (entries.length === 0) return 0

  const sortedDates = [...new Set(entries.map(e => e.date))].sort().reverse()
  const today = new Date().toISOString().split('T')[0]

  let streak = 0
  let currentDate = new Date(today)

  for (const date of sortedDates) {
    const entryDate = new Date(date)
    const diffDays = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === streak) {
      streak++
    } else if (diffDays > streak) {
      break
    }
  }

  return streak
}

// Calculer le plus long streak
export const calculateLongestStreak = (entries: JournalEntry[]): number => {
  if (entries.length === 0) return 0

  const sortedDates = [...new Set(entries.map(e => e.date))].sort()
  let longestStreak = 1
  let currentStreak = 1

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1])
    const currDate = new Date(sortedDates[i])
    const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      currentStreak++
      longestStreak = Math.max(longestStreak, currentStreak)
    } else {
      currentStreak = 1
    }
  }

  return longestStreak
}

// Calculer mood moyen
export const calculateAverageMood = (entries: JournalEntry[]): number => {
  const entriesWithMood = entries.filter(e => e.mood !== undefined)
  if (entriesWithMood.length === 0) return 0

  const sum = entriesWithMood.reduce((acc, e) => acc + (e.mood || 0), 0)
  return Math.round((sum / entriesWithMood.length) * 10) / 10
}

// Calculer statistiques complètes
export const calculateJournalStats = (entries: JournalEntry[]): JournalStats => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const entriesThisMonth = entries.filter(e => {
    const date = new Date(e.date)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  }).length

  const entriesThisYear = entries.filter(e => {
    const date = new Date(e.date)
    return date.getFullYear() === currentYear
  }).length

  return {
    totalEntries: entries.length,
    currentStreak: calculateJournalStreak(entries),
    longestStreak: calculateLongestStreak(entries),
    averageMood: calculateAverageMood(entries),
    entriesThisMonth,
    entriesThisYear
  }
}

// Obtenir l'entrée du jour
export const getTodayEntry = (entries: JournalEntry[]): JournalEntry | undefined => {
  const today = new Date().toISOString().split('T')[0]
  return entries.find(e => e.date === today)
}

// Obtenir entrées par mois
export const getEntriesByMonth = (entries: JournalEntry[], year: number, month: number): JournalEntry[] => {
  return entries.filter(e => {
    const date = new Date(e.date)
    return date.getFullYear() === year && date.getMonth() === month
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// Obtenir "Il y a X an(s) aujourd'hui"
export const getMemoryFromYearsAgo = (entries: JournalEntry[], yearsAgo: number): JournalEntry | undefined => {
  const today = new Date()
  const targetDate = new Date(today.getFullYear() - yearsAgo, today.getMonth(), today.getDate())
  const targetDateStr = targetDate.toISOString().split('T')[0]
  
  return entries.find(e => e.date === targetDateStr)
}

// Formater date relative
export const formatRelativeDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const today = new Date()
  const diffTime = today.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return "Hier"
  if (diffDays < 7) return `Il y a ${diffDays} jours`
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`
  if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`
  return `Il y a ${Math.floor(diffDays / 365)} ans`
}

