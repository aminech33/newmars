/**
 * ⚡ ProductivityWidget — Tâches du jour
 * 
 * Affiche le nombre concret + comparaison moyenne
 */

import { memo } from 'react'
import { SmartWidget } from '../SmartWidget'
import { useBrain } from '../../../insights'
import { useGlobalStats } from '../../../hooks/useGlobalStats'
import { useStore } from '../../../store/useStore'

export const ProductivityWidget = memo(function ProductivityWidget() {
  const { patterns } = useBrain()
  const stats = useGlobalStats()
  const { setView } = useStore()
  
  const todayTasks = stats.tasks.todayCompleted
  const avgTasks = patterns.avgTasksPerDay
  
  // Comparaison avec la moyenne
  const getContext = (): string => {
    if (avgTasks === 0) return 'première donnée'
    const diff = todayTasks - avgTasks
    if (diff > 0) return `+${diff.toFixed(1)} vs moyenne`
    if (diff < 0) return `${diff.toFixed(1)} vs moyenne`
    return '= moyenne'
  }
  
  // Couleur basée sur la performance
  const getAccent = (): 'emerald' | 'amber' | 'zinc' => {
    if (avgTasks === 0) return 'zinc'
    const ratio = todayTasks / avgTasks
    if (ratio >= 1.2) return 'emerald'
    if (ratio >= 0.8) return 'zinc'
    return 'amber'
  }
  
  return (
    <SmartWidget
      title="Aujourd'hui"
      main={<span className="text-2xl font-light">{todayTasks} tâche{todayTasks !== 1 ? 's' : ''}</span>}
      context={getContext()}
      accent={getAccent()}
      onTap={() => setView('tasks')}
    />
  )
})

