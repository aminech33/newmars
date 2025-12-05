/**
 * useTaskStats - Hook legacy pour compatibilité
 * 
 * @deprecated Utiliser useTasksStats() de useGlobalStats à la place
 * Ce hook est conservé pour la rétrocompatibilité mais utilise maintenant
 * le hook centralisé en interne.
 */
import { Task } from '../store/useStore'
import { useTasksStats } from './useGlobalStats'

export function useTaskStats(_tasks: Task[]) {
  // Utilise le hook centralisé - le paramètre tasks est ignoré car
  // useTasksStats récupère les tasks directement depuis le store
  const stats = useTasksStats()
  
  // Convertir le format pour la compatibilité
  const last7DaysStats = stats.last7Days.map(day => ({
    date: day.date,
    tasksCompleted: day.completed,
    focusMinutes: 0 // Les focusMinutes viennent maintenant de usePomodoroStats
  }))

  return {
    last7DaysStats,
    completedToday: stats.todayCompleted
  }
}

