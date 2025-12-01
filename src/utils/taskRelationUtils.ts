import { TaskRelation, TaskRelationType } from '../types/taskRelation'

export function getRelationLabel(type: TaskRelationType): string {
  const labels: Record<TaskRelationType, string> = {
    'blocks': 'Bloque',
    'blocked_by': 'Bloqué par',
    'related': 'Lié à',
    'duplicate': 'Duplique',
    'parent': 'Parent de',
    'child': 'Enfant de'
  }
  return labels[type] || type
}

export function getRelationIcon(type: TaskRelationType): string {
  const icons: Record<TaskRelationType, string> = {
    'blocks': '🚫',
    'blocked_by': '⛔',
    'related': '🔗',
    'duplicate': '📋',
    'parent': '📁',
    'child': '📄'
  }
  return icons[type] || '🔗'
}

export function getInverseRelation(type: TaskRelationType): TaskRelationType {
  const inverses: Record<TaskRelationType, TaskRelationType> = {
    'blocks': 'blocked_by',
    'blocked_by': 'blocks',
    'related': 'related',
    'duplicate': 'duplicate',
    'parent': 'child',
    'child': 'parent'
  }
  return inverses[type] || type
}

export function canCompleteTask(taskId: string, relations: TaskRelation[], completedTaskIds: string[]): boolean {
  // Check if all blocking tasks are completed
  const blockingRelations = relations.filter(r => 
    r.toTaskId === taskId && r.type === 'blocks'
  )
  
  return blockingRelations.every(r => completedTaskIds.includes(r.fromTaskId))
}

export function getBlockingTasks(taskId: string, relations: TaskRelation[]): string[] {
  return relations
    .filter(r => r.toTaskId === taskId && r.type === 'blocks')
    .map(r => r.fromTaskId)
}

export function getBlockedTasks(taskId: string, relations: TaskRelation[]): string[] {
  return relations
    .filter(r => r.fromTaskId === taskId && r.type === 'blocks')
    .map(r => r.toTaskId)
}
