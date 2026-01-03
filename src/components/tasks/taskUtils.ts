/**
 * 📋 Tasks Utils - Utilitaires et types partagés pour les tâches
 */

import { Task, type TemporalColumn } from '../../store/useStore'

// Typography: Inter / SF Pro for optimal dark mode readability
export const fontStack = 'font-[Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,SF_Pro_Display,Segoe_UI,Roboto,sans-serif]'

// Types pour la planification intégrée
export interface TaskPlan {
  title: string
  effort?: 'XS' | 'S' | 'M' | 'L'
  covers?: string[]
  isValidation?: boolean
}

export interface PhasePlan {
  name: string
  objective: string
  tasks: TaskPlan[]
}

export interface ProjectPlan {
  projectName: string
  coverageGrid?: string[]
  phases?: PhasePlan[]
  tasks: TaskPlan[]
}

export interface EditableTask {
  title: string
  effort: 'XS' | 'S' | 'M' | 'L'
  phase: string
  phaseIndex: number
  covers?: string[]
  isValidation?: boolean
}

export const EFFORT_COLORS: Record<string, string> = {
  XS: 'bg-emerald-500/20 text-emerald-400',
  S: 'bg-blue-500/20 text-blue-400',
  M: 'bg-amber-500/20 text-amber-400',
  L: 'bg-rose-500/20 text-rose-400',
}

export interface ColumnConfig {
  id: TemporalColumn
  title: string
}

export const COLUMNS: ColumnConfig[] = [
  { id: 'today', title: "En cours" },
  { id: 'upcoming', title: 'À venir' },
  { id: 'distant', title: 'Plus tard' }
]

// ═══════════════════════════════════════════════════════════════
// PROGRESSIVE UNLOCKING - Calcule la phase actuelle débloquée
// ═══════════════════════════════════════════════════════════════
export function getCurrentPhase(tasks: Task[]): number {
  const completedValidations = tasks.filter(t => 
    t.isValidation && t.completed && t.phaseIndex !== undefined
  )
  
  if (completedValidations.length === 0) {
    return 0
  }
  
  const maxPhaseValidated = Math.max(
    ...completedValidations.map(t => t.phaseIndex!)
  )
  
  return maxPhaseValidated + 1
}

export function categorizeTask(task: Task, allTasks: Task[]): TemporalColumn {
  if (task.completed) return 'today'
  if (task.temporalColumn) return task.temporalColumn
  
  // Tâches en cours → today
  if (task.status === 'in-progress') return 'today'
  
  // Phases bloquées → distant
  if (task.phaseIndex !== undefined) {
    const currentPhase = getCurrentPhase(allTasks)
    if (task.phaseIndex > currentPhase) {
      return 'distant'
    }
  }
  
  // Priorité haute/urgente → today
  if (task.isPriority || task.priority === 'urgent' || task.priority === 'high') return 'today'
  
  // Tri par deadline
  if (task.dueDate) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    const dueDate = new Date(task.dueDate)
    if (dueDate < tomorrow) return 'today'
    if (dueDate < in7Days) return 'upcoming'
    if (dueDate < in30Days) return 'upcoming'
    return 'distant'
  }
  
  return 'upcoming'
}

// Labels de niveau implicite par phase
export function getLevelLabel(phaseIndex: number, total: number): string {
  if (total <= 2) return ''
  const progress = phaseIndex / (total - 1)
  if (progress <= 0.33) return 'Fondations'
  if (progress <= 0.66) return 'Consolidation'
  return 'Maîtrise'
}

// Icônes et couleurs par niveau
export const levelStyles: Record<number, { emoji: string; borderColor: string; bgColor: string }> = {
  0: { emoji: '🎯', borderColor: 'border-emerald-500/30', bgColor: 'bg-emerald-500/5' },
  1: { emoji: '🔵', borderColor: 'border-blue-500/30', bgColor: 'bg-blue-500/5' },
  2: { emoji: '🟡', borderColor: 'border-amber-500/30', bgColor: 'bg-amber-500/5' },
  3: { emoji: '🔴', borderColor: 'border-rose-500/30', bgColor: 'bg-rose-500/5' },
}




