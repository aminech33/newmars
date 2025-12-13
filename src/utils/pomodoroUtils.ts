// Utilitaires pour le système Pomodoro

import { PomodoroSession, PomodoroStats, ProjectTimeStats, TaskTimeStats, DaySchedule } from '../types/pomodoro'
import { Task, Project } from '../store/useStore'

// Calculer les stats globales Pomodoro
export const calculatePomodoroStats = (sessions: PomodoroSession[]): PomodoroStats => {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const focusSessions = sessions.filter(s => s.type === 'focus')
  const todaySessions = focusSessions.filter(s => s.date === today)
  const weekSessions = focusSessions.filter(s => new Date(s.date) >= weekAgo)
  const monthSessions = focusSessions.filter(s => new Date(s.date) >= monthAgo)

  const completedSessions = focusSessions.filter(s => !s.interrupted)
  const completionRate = focusSessions.length > 0 
    ? (completedSessions.length / focusSessions.length) * 100 
    : 0

  const avgSessionDuration = focusSessions.length > 0
    ? focusSessions.reduce((sum, s) => sum + (s.actualDuration || s.duration), 0) / focusSessions.length
    : 0

  // Calculate streaks
  const { currentStreak, longestStreak } = calculateStreaks(sessions)

  return {
    totalSessions: focusSessions.length,
    totalMinutes: focusSessions.reduce((sum, s) => sum + (s.actualDuration || s.duration), 0),
    todaySessions: todaySessions.length,
    todayMinutes: todaySessions.reduce((sum, s) => sum + (s.actualDuration || s.duration), 0),
    weekSessions: weekSessions.length,
    weekMinutes: weekSessions.reduce((sum, s) => sum + (s.actualDuration || s.duration), 0),
    monthSessions: monthSessions.length,
    monthMinutes: monthSessions.reduce((sum, s) => sum + (s.actualDuration || s.duration), 0),
    completionRate: Math.round(completionRate),
    avgSessionDuration: Math.round(avgSessionDuration),
    currentStreak,
    longestStreak
  }
}

// Calculer les streaks (jours consécutifs avec au moins 1 session)
const calculateStreaks = (sessions: PomodoroSession[]): { currentStreak: number, longestStreak: number } => {
  const focusSessions = sessions.filter(s => s.type === 'focus')
  if (focusSessions.length === 0) return { currentStreak: 0, longestStreak: 0 }

  const uniqueDates = [...new Set(focusSessions.map(s => s.date))].sort()
  
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 1

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Current streak
  if (uniqueDates.includes(today) || uniqueDates.includes(yesterday)) {
    let checkDate = uniqueDates.includes(today) ? new Date() : new Date(Date.now() - 24 * 60 * 60 * 1000)
    currentStreak = 1

    for (let i = 1; i < 365; i++) {
      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000)
      const dateStr = checkDate.toISOString().split('T')[0]
      if (uniqueDates.includes(dateStr)) {
        currentStreak++
      } else {
        break
      }
    }
  }

  // Longest streak
  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i - 1])
    const currDate = new Date(uniqueDates[i])
    const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000))

    if (diffDays === 1) {
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      tempStreak = 1
    }
  }

  longestStreak = Math.max(longestStreak, tempStreak)

  return { currentStreak, longestStreak }
}

// Stats par projet
export const calculateProjectStats = (
  sessions: PomodoroSession[], 
  projects: Project[]
): ProjectTimeStats[] => {
  const projectMap = new Map<string, ProjectTimeStats>()
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  sessions.filter(s => s.type === 'focus' && s.projectId).forEach(session => {
    const projectId = session.projectId!
    const project = projects.find(p => p.id === projectId)

    if (!projectMap.has(projectId)) {
      projectMap.set(projectId, {
        projectId,
        projectName: session.projectName || project?.name || 'Unknown',
        projectIcon: project?.icon,
        projectColor: project?.color,
        totalSessions: 0,
        totalMinutes: 0,
        todaySessions: 0,
        todayMinutes: 0,
        weekSessions: 0,
        weekMinutes: 0,
        avgSessionDuration: 0,
        completionRate: 0,
      })
    }

    const stats = projectMap.get(projectId)!
    const duration = session.actualDuration || session.duration

    stats.totalSessions++
    stats.totalMinutes += duration
    stats.lastSessionDate = session.date

    if (session.date === today) {
      stats.todaySessions++
      stats.todayMinutes += duration
    }

    if (new Date(session.date) >= weekAgo) {
      stats.weekSessions++
      stats.weekMinutes += duration
    }
  })

  // Calculate averages and completion rates
  projectMap.forEach(stats => {
    const projectSessions = sessions.filter(s => s.projectId === stats.projectId && s.type === 'focus')
    stats.avgSessionDuration = projectSessions.length > 0
      ? Math.round(stats.totalMinutes / stats.totalSessions)
      : 0
    
    const completedSessions = projectSessions.filter(s => !s.interrupted)
    stats.completionRate = projectSessions.length > 0
      ? Math.round((completedSessions.length / projectSessions.length) * 100)
      : 100
  })

  return Array.from(projectMap.values()).sort((a, b) => b.totalMinutes - a.totalMinutes)
}

// Stats par tâche
export const calculateTaskStats = (
  sessions: PomodoroSession[],
  tasks: Task[]
): TaskTimeStats[] => {
  const taskMap = new Map<string, TaskTimeStats>()

  sessions.filter(s => s.type === 'focus' && s.taskId).forEach(session => {
    const taskId = session.taskId!
    const task = tasks.find(t => t.id === taskId)

    if (!taskMap.has(taskId)) {
      taskMap.set(taskId, {
        taskId,
        taskTitle: session.taskTitle || task?.title || 'Unknown',
        projectId: task?.projectId,
        projectName: session.projectName,
        totalSessions: 0,
        totalMinutes: 0,
        estimatedTime: task?.estimatedTime,
        progress: 0,
      })
    }

    const stats = taskMap.get(taskId)!
    const duration = session.actualDuration || session.duration

    stats.totalSessions++
    stats.totalMinutes += duration
    stats.lastSessionDate = session.date

    if (stats.estimatedTime) {
      stats.progress = Math.min(100, Math.round((stats.totalMinutes / stats.estimatedTime) * 100))
    }
  })

  return Array.from(taskMap.values()).sort((a, b) => b.totalMinutes - a.totalMinutes)
}

// Schedule du jour
export const getDaySchedule = (sessions: PomodoroSession[], date: string): DaySchedule => {
  const daySessions = sessions.filter(s => s.date === date).sort((a, b) => a.completedAt - b.completedAt)
  const focusSessions = daySessions.filter(s => s.type === 'focus')
  const breakSessions = daySessions.filter(s => s.type === 'break')

  const totalFocusMinutes = focusSessions.reduce((sum, s) => sum + (s.actualDuration || s.duration), 0)
  const totalBreakMinutes = breakSessions.reduce((sum, s) => sum + (s.actualDuration || s.duration), 0)
  const completedSessions = focusSessions.filter(s => !s.interrupted).length
  const productivityScore = focusSessions.length > 0
    ? Math.round((completedSessions / focusSessions.length) * 100)
    : 0

  return {
    date,
    sessions: daySessions,
    totalFocusMinutes,
    totalBreakMinutes,
    totalSessions: focusSessions.length,
    productivityScore
  }
}

// Format time (seconds → MM:SS)
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// Format duration (minutes → readable string)
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h${mins}min` : `${hours}h`
}

// Get time of day category
export const getTimeOfDay = (timestamp: number): 'morning' | 'afternoon' | 'evening' | 'night' => {
  const hour = new Date(timestamp).getHours()
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  if (hour >= 18 && hour < 22) return 'evening'
  return 'night'
}

// Analyze productivity patterns
export const analyzeProductivityPatterns = (sessions: PomodoroSession[]) => {
  const focusSessions = sessions.filter(s => s.type === 'focus')
  const patterns = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
    bestTime: 'morning' as 'morning' | 'afternoon' | 'evening' | 'night'
  }

  focusSessions.forEach(session => {
    const timeOfDay = getTimeOfDay(session.completedAt)
    const duration = session.actualDuration || session.duration
    patterns[timeOfDay] += duration
  })

  // Find best time
  const times = ['morning', 'afternoon', 'evening', 'night'] as const
  let maxMinutes = 0
  times.forEach(time => {
    if (patterns[time] > maxMinutes) {
      maxMinutes = patterns[time]
      patterns.bestTime = time
    }
  })

  return patterns
}






