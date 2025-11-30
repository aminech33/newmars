import { useMemo } from 'react'
import { Task } from '../store/useStore'

export function useTaskStats(tasks: Task[]) {
  const last7DaysStats = useMemo(() => {
    const stats = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
      
      const dayTasks = tasks.filter(t => {
        const taskDate = new Date(t.createdAt)
        return taskDate >= date && taskDate < nextDay
      })
      
      stats.push({
        total: dayTasks.length,
        completed: dayTasks.filter(t => t.completed).length
      })
    }
    return stats
  }, [tasks])

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

