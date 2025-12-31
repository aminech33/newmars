/**
 * 🎯 NextTaskWidget — Prochaine tâche suggérée
 * 
 * Affiche LA tâche prioritaire, pas une liste
 */

import { memo } from 'react'
import { SmartWidget } from '../SmartWidget'
import { useStore } from '../../../store/useStore'
import { calculateFocusScore } from '../../../utils/taskIntelligence'

export const NextTaskWidget = memo(function NextTaskWidget() {
  const { tasks, setView } = useStore()
  
  // Trouver la tâche avec le meilleur Focus Score
  const pendingTasks = tasks.filter(t => !t.completed)
  
  if (pendingTasks.length === 0) {
    return (
      <SmartWidget
        title="Tâches"
        main="Rien en attente"
        context="profite de ta journée"
        accent="emerald"
      />
    )
  }
  
  // Trier par Focus Score et prendre la première
  const sortedTasks = [...pendingTasks].sort((a, b) => {
    // Étoile d'abord
    if (a.isPriority && !b.isPriority) return -1
    if (!a.isPriority && b.isPriority) return 1
    // Puis par score
    return calculateFocusScore(b) - calculateFocusScore(a)
  })
  
  const nextTask = sortedTasks[0]
  
  // Contexte basé sur la priorité/deadline
  const getContext = (): string | undefined => {
    if (nextTask.isPriority) return 'marquée prioritaire'
    if (nextTask.priority === 'urgent') return 'urgente'
    if (nextTask.dueDate) {
      const days = Math.ceil((new Date(nextTask.dueDate).getTime() - Date.now()) / 86400000)
      if (days < 0) return 'en retard'
      if (days === 0) return 'pour aujourd\'hui'
      if (days === 1) return 'pour demain'
    }
    return undefined
  }
  
  // Accent basé sur l'urgence
  const getAccent = (): 'emerald' | 'amber' | 'zinc' => {
    if (nextTask.priority === 'urgent') return 'amber'
    if (nextTask.isPriority) return 'emerald'
    return 'zinc'
  }
  
  return (
    <SmartWidget
      title="À faire"
      main={nextTask.title}
      context={getContext()}
      accent={getAccent()}
      onTap={() => setView('tasks')}
    />
  )
})












