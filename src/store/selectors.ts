import { useMemo } from 'react'
import { useStore } from './useStore'
import type { DailyStats } from './useStore'

/**
 * Sélecteurs mémorisés pour optimiser les performances du Dashboard
 */

// Sélecteur pour les stats hebdomadaires (mémorisé)
export function useWeekStats() {
  const tasks = useStore((state) => state.tasks)
  const dailyStats = useStore((state) => state.dailyStats)
  
  return useMemo(() => {
    const stats: DailyStats[] = []
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const existing = dailyStats.find(s => s.date === dateStr)
      if (existing) {
        stats.push(existing)
      } else {
        // Count tasks completed on this day
        const dayTasks = tasks.filter(t => {
          if (!t.completed) return false
          const taskDate = new Date(t.createdAt).toISOString().split('T')[0]
          return taskDate === dateStr
        }).length
        
        stats.push({
          date: dateStr,
          tasksCompleted: dayTasks,
          focusMinutes: 0,
          pomodoroSessions: 0
        })
      }
    }
    return stats
  }, [tasks, dailyStats])
}

// Sélecteur pour le streak actuel (mémorisé)
export function useCurrentStreak() {
  const tasks = useStore((state) => state.tasks)
  const dailyStats = useStore((state) => state.dailyStats)
  
  return useMemo(() => {
    let streak = 0
    const today = new Date()
    
    for (let i = 0; i < 365; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayStats = dailyStats.find(s => s.date === dateStr)
      const hasActivity = dayStats && (dayStats.tasksCompleted > 0 || dayStats.pomodoroSessions > 0)
      
      // For today, also check if there are incomplete tasks being worked on
      if (i === 0) {
        const todayTasks = tasks.filter(t => 
          new Date(t.createdAt).toISOString().split('T')[0] === dateStr
        )
        if (hasActivity || todayTasks.length > 0) {
          streak++
          continue
        }
      }
      
      if (hasActivity) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  }, [tasks, dailyStats])
}

// Sélecteur pour les tâches complétées (mémorisé)
export function useCompletedTasks() {
  const tasks = useStore((state) => state.tasks)
  return useMemo(() => tasks.filter(t => t.completed), [tasks])
}

// Sélecteur pour les tâches en attente (mémorisé)
export function usePendingTasks() {
  const tasks = useStore((state) => state.tasks)
  return useMemo(() => tasks.filter(t => !t.completed), [tasks])
}

// Sélecteur pour les tâches par catégorie (mémorisé)
export function useTasksByCategory() {
  const pendingTasks = usePendingTasks()
  return useMemo(() => {
    return pendingTasks.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [pendingTasks])
}

