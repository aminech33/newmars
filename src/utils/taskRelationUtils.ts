import { TaskRelation, RelationType } from '../types/taskRelation'

export function getRelationLabel(type: RelationType): string {
  const labels: Record<RelationType, string> = {
    'blocks': 'Bloque',
    'blocked-by': 'Bloqué par',
    'relates-to': 'Lié à',
    'duplicates': 'Duplique',
    'parent-of': 'Parent de',
    'child-of': 'Enfant de'
  }
  return labels[type] || type
}

export function getRelationIcon(type: RelationType): string {
  const icons: Record<RelationType, string> = {
    'blocks': '🚫',
    'blocked-by': '⛔',
    'relates-to': '🔗',
    'duplicates': '📋',
    'parent-of': '📁',
    'child-of': '📄'
  }
  return icons[type] || '🔗'
}

export function getInverseRelation(type: RelationType): RelationType {
  const inverses: Record<RelationType, RelationType> = {
    'blocks': 'blocked-by',
    'blocked-by': 'blocks',
    'relates-to': 'relates-to',
    'duplicates': 'duplicates',
    'parent-of': 'child-of',
    'child-of': 'parent-of'
  }
  return inverses[type] || type
}

export function canCompleteTask(taskId: string, relations: TaskRelation[], completedTaskIds: string[]): boolean {
  // Check if all blocking tasks are completed
  const blockingRelations = relations.filter(r => 
    r.targetTaskId === taskId && r.type === 'blocks'
  )
  
  return blockingRelations.every(r => completedTaskIds.includes(r.sourceTaskId))
}

export function getBlockingTasks(taskId: string, relations: TaskRelation[]): string[] {
  return relations
    .filter(r => r.targetTaskId === taskId && r.type === 'blocks')
    .map(r => r.sourceTaskId)
}

export function getBlockedTasks(taskId: string, relations: TaskRelation[]): string[] {
  return relations
    .filter(r => r.sourceTaskId === taskId && r.type === 'blocks')
    .map(r => r.targetTaskId)
}

