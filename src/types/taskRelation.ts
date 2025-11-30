// Types pour les relations entre tâches

export type TaskRelationType = 
  | 'blocks' // Cette tâche bloque une autre
  | 'blocked_by' // Cette tâche est bloquée par une autre
  | 'related' // Tâches liées (même contexte)
  | 'duplicate' // Tâche dupliquée
  | 'parent' // Tâche parente
  | 'child' // Tâche enfant

export interface TaskRelation {
  id: string
  fromTaskId: string // Source task
  toTaskId: string // Target task
  type: TaskRelationType
  createdAt: number
}

export interface TaskWithRelations {
  taskId: string
  blocks: string[] // IDs of tasks this task blocks
  blockedBy: string[] // IDs of tasks blocking this task
  related: string[] // IDs of related tasks
  parent?: string // ID of parent task
  children: string[] // IDs of child tasks
  isBlocked: boolean // Computed: true if any blockedBy task is not completed
}


export type TaskRelationType = 
  | 'blocks' // Cette tâche bloque une autre
  | 'blocked_by' // Cette tâche est bloquée par une autre
  | 'related' // Tâches liées (même contexte)
  | 'duplicate' // Tâche dupliquée
  | 'parent' // Tâche parente
  | 'child' // Tâche enfant

export interface TaskRelation {
  id: string
  fromTaskId: string // Source task
  toTaskId: string // Target task
  type: TaskRelationType
  createdAt: number
}

export interface TaskWithRelations {
  taskId: string
  blocks: string[] // IDs of tasks this task blocks
  blockedBy: string[] // IDs of tasks blocking this task
  related: string[] // IDs of related tasks
  parent?: string // ID of parent task
  children: string[] // IDs of child tasks
  isBlocked: boolean // Computed: true if any blockedBy task is not completed
}


