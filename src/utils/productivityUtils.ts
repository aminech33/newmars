import { Task } from '../store/useStore'

export interface ProductivityScore {
  score: number // 0-100
  breakdown: {
    tasksCompleted: number // 0-25
    focusTime: number // 0-25
    consistency: number // 0-25
    efficiency: number // 0-25
  }
  trend: 'up' | 'down' | 'stable'
  trendPercent: number
}

export interface HourlyProductivity {
  hour: number
  tasksCompleted: number
  focusMinutes: number
  label: string
}

export interface DayComparison {
  today: { tasks: number; focus: number }
  yesterday: { tasks: number; focus: number }
  tasksDiff: number
  focusDiff: number
  tasksPercent: number
  focusPercent: number
}

export interface WeekComparison {
  thisWeek: { tasks: number; focus: number }
  lastWeek: { tasks: number; focus: number }
  tasksDiff: number
  focusDiff: number
  tasksPercent: number
  focusPercent: number
}

export interface WeeklyGoals {
  tasks: { target: number; current: number; percent: number }
  focus: { target: number; current: number; percent: number }
  streak: { target: number; current: number; percent: number }
}

export interface ProductivityInsight {
  type: 'positive' | 'warning' | 'tip'
  icon: string
  message: string
}

// Calculer le score de productivité (0-100)
export function calculateProductivityScore(
  tasksCompletedToday: number,
  focusMinutesToday: number,
  streak: number,
  avgTaskTime: number, // temps moyen réel vs estimé
  dailyGoal: number
): ProductivityScore {
  // Tâches complétées (0-25 points)
  const tasksScore = Math.min(25, (tasksCompletedToday / Math.max(dailyGoal, 1)) * 25)
  
  // Temps de focus (0-25 points) - objectif: 4h/jour
  const focusScore = Math.min(25, (focusMinutesToday / 240) * 25)
  
  // Consistance/Streak (0-25 points) - objectif: 7 jours
  const consistencyScore = Math.min(25, (streak / 7) * 25)
  
  // Efficacité (0-25 points) - basé sur estimation vs réel
  const efficiencyScore = avgTaskTime > 0 
    ? Math.min(25, Math.max(0, 25 - Math.abs(avgTaskTime - 1) * 10))
    : 12.5 // Score neutre si pas de données

  const totalScore = Math.round(tasksScore + focusScore + consistencyScore + efficiencyScore)

  return {
    score: totalScore,
    breakdown: {
      tasksCompleted: Math.round(tasksScore),
      focusTime: Math.round(focusScore),
      consistency: Math.round(consistencyScore),
      efficiency: Math.round(efficiencyScore)
    },
    trend: 'stable',
    trendPercent: 0
  }
}

// Analyser les heures les plus productives
export function analyzeProductiveHours(tasks: Task[]): HourlyProductivity[] {
  const hourlyData: Record<number, { tasks: number; focus: number }> = {}
  
  // Initialiser toutes les heures
  for (let h = 6; h <= 23; h++) {
    hourlyData[h] = { tasks: 0, focus: 0 }
  }
  
  // Compter les tâches par heure de complétion
  tasks.filter(t => t.completed).forEach(task => {
    const hour = new Date(task.createdAt).getHours()
    if (hour >= 6 && hour <= 23) {
      hourlyData[hour].tasks++
      hourlyData[hour].focus += task.actualTime || task.estimatedTime || 30
    }
  })
  
  return Object.entries(hourlyData).map(([hour, data]) => ({
    hour: parseInt(hour),
    tasksCompleted: data.tasks,
    focusMinutes: data.focus,
    label: `${hour}h`
  }))
}

// Trouver les heures peak
export function getPeakHours(hourlyData: HourlyProductivity[]): { peak: number; label: string }[] {
  const sorted = [...hourlyData].sort((a, b) => b.tasksCompleted - a.tasksCompleted)
  return sorted.slice(0, 3).map(h => ({
    peak: h.tasksCompleted,
    label: h.label
  }))
}

// Comparaison jour vs hier
export function compareDays(
  todayTasks: number,
  todayFocus: number,
  yesterdayTasks: number,
  yesterdayFocus: number
): DayComparison {
  const tasksDiff = todayTasks - yesterdayTasks
  const focusDiff = todayFocus - yesterdayFocus
  
  return {
    today: { tasks: todayTasks, focus: todayFocus },
    yesterday: { tasks: yesterdayTasks, focus: yesterdayFocus },
    tasksDiff,
    focusDiff,
    tasksPercent: yesterdayTasks > 0 ? Math.round((tasksDiff / yesterdayTasks) * 100) : 0,
    focusPercent: yesterdayFocus > 0 ? Math.round((focusDiff / yesterdayFocus) * 100) : 0
  }
}

// Comparaison semaine vs semaine précédente
export function compareWeeks(
  thisWeekTasks: number,
  thisWeekFocus: number,
  lastWeekTasks: number,
  lastWeekFocus: number
): WeekComparison {
  const tasksDiff = thisWeekTasks - lastWeekTasks
  const focusDiff = thisWeekFocus - lastWeekFocus
  
  return {
    thisWeek: { tasks: thisWeekTasks, focus: thisWeekFocus },
    lastWeek: { tasks: lastWeekTasks, focus: lastWeekFocus },
    tasksDiff,
    focusDiff,
    tasksPercent: lastWeekTasks > 0 ? Math.round((tasksDiff / lastWeekTasks) * 100) : 0,
    focusPercent: lastWeekFocus > 0 ? Math.round((focusDiff / lastWeekFocus) * 100) : 0
  }
}

// Calculer les objectifs hebdomadaires
export function calculateWeeklyGoals(
  currentTasks: number,
  currentFocus: number,
  currentStreak: number,
  weeklyTasksGoal: number = 20,
  weeklyFocusGoal: number = 600, // 10h en minutes
  streakGoal: number = 7
): WeeklyGoals {
  return {
    tasks: {
      target: weeklyTasksGoal,
      current: currentTasks,
      percent: Math.min(100, Math.round((currentTasks / weeklyTasksGoal) * 100))
    },
    focus: {
      target: weeklyFocusGoal,
      current: currentFocus,
      percent: Math.min(100, Math.round((currentFocus / weeklyFocusGoal) * 100))
    },
    streak: {
      target: streakGoal,
      current: currentStreak,
      percent: Math.min(100, Math.round((currentStreak / streakGoal) * 100))
    }
  }
}

// Générer les insights intelligents
export function generateInsights(
  tasks: Task[],
  weekComparison: WeekComparison,
  peakHours: { peak: number; label: string }[],
  streak: number,
  weeklyGoals: WeeklyGoals
): ProductivityInsight[] {
  const insights: ProductivityInsight[] = []
  
  // Insight sur la tendance
  if (weekComparison.tasksPercent > 10) {
    insights.push({
      type: 'positive',
      icon: '📈',
      message: `Tu as été ${weekComparison.tasksPercent}% plus productif que la semaine dernière !`
    })
  } else if (weekComparison.tasksPercent < -10) {
    insights.push({
      type: 'warning',
      icon: '📉',
      message: `Ta productivité a baissé de ${Math.abs(weekComparison.tasksPercent)}% cette semaine.`
    })
  }
  
  // Insight sur les heures productives
  if (peakHours.length > 0 && peakHours[0].peak > 0) {
    const morningPeak = peakHours.some(h => parseInt(h.label) < 12)
    insights.push({
      type: 'tip',
      icon: '⏰',
      message: morningPeak 
        ? `Tu es plus productif le matin (pic à ${peakHours[0].label}). Planifie tes tâches importantes tôt !`
        : `Tu es plus productif l'après-midi (pic à ${peakHours[0].label}).`
    })
  }
  
  // Insight sur les tâches urgentes
  const urgentTasks = tasks.filter(t => !t.completed && t.priority === 'urgent')
  if (urgentTasks.length > 3) {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      message: `${urgentTasks.length} tâches urgentes en attente. Priorise-les !`
    })
  }
  
  // Insight sur le streak
  if (streak >= 7) {
    insights.push({
      type: 'positive',
      icon: '🔥',
      message: `Incroyable ! ${streak} jours de streak ! Continue comme ça !`
    })
  } else if (streak === 0) {
    insights.push({
      type: 'tip',
      icon: '🚀',
      message: `Commence un nouveau streak aujourd'hui ! Chaque jour compte.`
    })
  }
  
  // Insight sur l'objectif
  if (weeklyGoals.tasks.percent >= 80 && weeklyGoals.tasks.percent < 100) {
    const remaining = weeklyGoals.tasks.target - weeklyGoals.tasks.current
    insights.push({
      type: 'positive',
      icon: '🎯',
      message: `Plus que ${remaining} tâches pour atteindre ton objectif hebdo !`
    })
  }
  
  // Insight sur les tâches anciennes
  const oldTasks = tasks.filter(t => {
    if (t.completed) return false
    const daysSinceCreation = (Date.now() - t.createdAt) / (1000 * 60 * 60 * 24)
    return daysSinceCreation > 7
  })
  if (oldTasks.length > 0) {
    insights.push({
      type: 'warning',
      icon: '📋',
      message: `${oldTasks.length} tâche(s) en attente depuis plus d'une semaine.`
    })
  }
  
  return insights.slice(0, 4) // Max 4 insights
}

// Générer les données pour le heatmap annuel
export function generateYearHeatmap(tasks: Task[]): { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[] {
  const today = new Date()
  const oneYearAgo = new Date(today)
  oneYearAgo.setFullYear(today.getFullYear() - 1)
  
  const heatmapData: Record<string, number> = {}
  
  // Initialiser tous les jours de l'année
  const currentDate = new Date(oneYearAgo)
  while (currentDate <= today) {
    const dateStr = currentDate.toISOString().split('T')[0]
    heatmapData[dateStr] = 0
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  // Compter les tâches complétées par jour
  tasks.filter(t => t.completed).forEach(task => {
    const dateStr = new Date(task.createdAt).toISOString().split('T')[0]
    if (heatmapData[dateStr] !== undefined) {
      heatmapData[dateStr]++
    }
  })
  
  // Convertir en array avec niveaux
  const maxCount = Math.max(...Object.values(heatmapData), 1)
  
  return Object.entries(heatmapData).map(([date, count]) => {
    let level: 0 | 1 | 2 | 3 | 4 = 0
    if (count > 0) {
      const ratio = count / maxCount
      if (ratio <= 0.25) level = 1
      else if (ratio <= 0.5) level = 2
      else if (ratio <= 0.75) level = 3
      else level = 4
    }
    return { date, count, level }
  })
}

// Formater les minutes en heures/minutes
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

