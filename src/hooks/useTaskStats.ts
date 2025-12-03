import { useMemo } from 'react'
import { Task, useStore } from '../store/useStore'

export function useTaskStats(tasks: Task[]) {
  const pomodoroSessions = useStore(state => state.pomodoroSessions)
  
  const last7DaysStats = useMemo(() => {
    const stats = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      const dateStr = date.toISOString().split('T')[0]
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
      
      const dayTasks = tasks.filter(t => {
        const taskDate = new Date(t.createdAt)
        return taskDate >= date && taskDate < nextDay
      })
      
      // Calculer le temps de focus depuis les sessions Pomodoro
      const focusMinutes = pomodoroSessions
        .filter(s => s.date === dateStr && s.type === 'focus')
        .reduce((sum, s) => sum + s.duration, 0)
      
      stats.push({
        date: dateStr,
        tasksCompleted: dayTasks.filter(t => t.completed).length,
        focusMinutes
      })
    }
    return stats
  }, [tasks, pomodoroSessions])

  const completedToday = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0)
    return tasks.filter(t => {
      if (!t.completed) return false
      const completedDate = new Date(t.createdAt).setHours(0, 0, 0, 0)
      return completedDate === today
    }).length
  }, [tasks])

  return {
    last7DaysStats,
    completedToday
  }
}

