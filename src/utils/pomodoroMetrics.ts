import { PomodoroSession } from '../types/pomodoro'
import { Task } from '../store/useStore'

export interface PomodoroMetrics {
  todayVolume: number // Nombre de tâches terminées aujourd'hui
  hasQualityFocus: boolean // Au moins une tâche avec ≥30min de focus continu ET clôturée
  trend14d: 'stable' | 'en baisse' // Tendance sur 14 jours
}

/**
 * Calcule les métriques Pomodoro pour MyDay
 * 
 * 1️⃣ Volume : Nombre de tâches terminées aujourd'hui
 * 2️⃣ Qualité du focus : Au moins une tâche avec ≥30min de focus continu ET clôturée
 * 3️⃣ Tendance : Évolution du rythme de clôture sur 14 jours
 */
export function calculatePomodoroMetrics(
  pomodoroSessions: PomodoroSession[],
  tasks: Task[]
): PomodoroMetrics {
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  
  // Date d'il y a 14 jours
  const fourteenDaysAgo = new Date(now)
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
  const fourteenDaysAgoStr = fourteenDaysAgo.toISOString().split('T')[0]
  
  // Date d'il y a 7 jours (pour calculer la tendance)
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

  // 1️⃣ VOLUME : Tâches terminées aujourd'hui
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayVolume = tasks.filter(t => 
    t.completed && 
    t.completedAt && 
    new Date(t.completedAt) >= todayStart
  ).length

  // 2️⃣ QUALITÉ DU FOCUS
  // Pour chaque tâche clôturée aujourd'hui, vérifier si elle a au moins une session ≥30min
  const tasksCompletedToday = tasks.filter(t => 
    t.completed && 
    t.completedAt && 
    new Date(t.completedAt) >= todayStart
  )
  
  let hasQualityFocus = false
  for (const task of tasksCompletedToday) {
    // Récupérer toutes les sessions de cette tâche aujourd'hui
    const taskSessions = pomodoroSessions.filter(s => 
      s.taskId === task.id && 
      s.date === todayStr && 
      s.type === 'focus' &&
      !s.interrupted
    )
    
    // Vérifier si au moins une session dure ≥30 min
    const hasLongSession = taskSessions.some(s => {
      const duration = s.actualDuration || s.duration
      return duration >= 30
    })
    
    if (hasLongSession) {
      hasQualityFocus = true
      break
    }
  }

  // 3️⃣ TENDANCE SUR 14 JOURS
  // Comparer le nombre de tâches terminées semaine dernière vs cette semaine
  const tasksLastWeek = tasks.filter(t => {
    if (!t.completed || !t.completedAt) return false
    const completedDate = new Date(t.completedAt).toISOString().split('T')[0]
    return completedDate >= fourteenDaysAgoStr && completedDate < sevenDaysAgoStr
  }).length
  
  const tasksThisWeek = tasks.filter(t => {
    if (!t.completed || !t.completedAt) return false
    const completedDate = new Date(t.completedAt).toISOString().split('T')[0]
    return completedDate >= sevenDaysAgoStr && completedDate <= todayStr
  }).length
  
  // Si cette semaine a moins de tâches que la semaine dernière, tendance en baisse
  // Tolérance de 10% pour considérer comme stable
  const trend14d = tasksThisWeek < tasksLastWeek * 0.9 ? 'en baisse' : 'stable'

  return {
    todayVolume,
    hasQualityFocus,
    trend14d
  }
}

