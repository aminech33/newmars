import { Task, TaskCategory, TaskPriority } from '../store/useStore'

// Mots-clés pour la détection automatique (simplifiée et transparente)
const URGENT_KEYWORDS = ['urgent', 'asap', 'critique', 'important', 'aujourd\'hui', 'maintenant', 'vite']
const DEV_KEYWORDS = ['bug', 'fix', 'code', 'api', 'debug', 'deploy', 'commit', 'merge', 'test']
const DESIGN_KEYWORDS = ['design', 'maquette', 'figma', 'ui', 'ux', 'mockup', 'prototype', 'wireframe']
const WORK_KEYWORDS = ['réunion', 'meeting', 'client', 'présentation', 'rapport', 'email', 'call']
const PERSONAL_KEYWORDS = ['acheter', 'courses', 'rdv', 'médecin', 'famille', 'perso', 'personnel']

// Estimation de durée basée sur des mots-clés
const QUICK_KEYWORDS = ['quick', 'rapide', 'simple', 'petit', 'fix']
const MEDIUM_KEYWORDS = ['créer', 'ajouter', 'modifier', 'update']
const LONG_KEYWORDS = ['refactor', 'refonte', 'complet', 'projet', 'développer']

/**
 * Calcule le Focus Score d'une tâche (0-100)
 * Score transparent basé uniquement sur : priorité + deadline
 */
export function calculateFocusScore(task: Task): number {
  let score = 0
  
  // Priorité (50 points max)
  const priorityScores = { low: 10, medium: 25, high: 40, urgent: 50 }
  score += priorityScores[task.priority]
  
  // Deadline (50 points max) - plus c'est proche, plus le score est élevé
  if (task.dueDate) {
    const daysUntilDue = Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (daysUntilDue < 0) score += 50 // En retard = priorité maximale
    else if (daysUntilDue === 0) score += 40 // Aujourd'hui
    else if (daysUntilDue === 1) score += 30 // Demain
    else if (daysUntilDue <= 3) score += 20 // Cette semaine
    else if (daysUntilDue <= 7) score += 10 // Semaine prochaine
  }
  
  return Math.min(score, 100)
}

/**
 * Auto-catégorise une tâche basée sur son titre
 */
export function autoCategorizeTasks(title: string): TaskCategory {
  const lowerTitle = title.toLowerCase()
  
  if (URGENT_KEYWORDS.some(kw => lowerTitle.includes(kw))) return 'urgent'
  if (DEV_KEYWORDS.some(kw => lowerTitle.includes(kw))) return 'dev'
  if (DESIGN_KEYWORDS.some(kw => lowerTitle.includes(kw))) return 'design'
  if (WORK_KEYWORDS.some(kw => lowerTitle.includes(kw))) return 'work'
  if (PERSONAL_KEYWORDS.some(kw => lowerTitle.includes(kw))) return 'personal'
  
  return 'work' // Par défaut
}

/**
 * Estime la durée d'une tâche basée sur son titre (en minutes)
 */
export function estimateTaskDuration(title: string): number {
  const lowerTitle = title.toLowerCase()
  
  if (QUICK_KEYWORDS.some(kw => lowerTitle.includes(kw))) return 15
  if (LONG_KEYWORDS.some(kw => lowerTitle.includes(kw))) return 120
  if (MEDIUM_KEYWORDS.some(kw => lowerTitle.includes(kw))) return 45
  
  return 30 // Par défaut : 30 minutes
}

/**
 * Détecte la priorité basée sur le titre
 */
export function detectPriority(title: string): TaskPriority {
  const lowerTitle = title.toLowerCase()
  
  if (URGENT_KEYWORDS.some(kw => lowerTitle.includes(kw))) return 'urgent'
  if (lowerTitle.includes('important')) return 'high'
  if (lowerTitle.includes('plus tard') || lowerTitle.includes('maybe')) return 'low'
  
  return 'medium' // Par défaut
}

/**
 * Analyse les patterns de productivité
 */
export function analyzeProductivityPatterns(tasks: Task[]) {
  const completed = tasks.filter(t => t.status === 'done')
  const total = tasks.length
  
  return {
    completionRate: total > 0 ? Math.round((completed.length / total) * 100) : 0,
    totalTasks: total,
    completedTasks: completed.length,
    pendingTasks: tasks.filter(t => t.status !== 'done').length
  }
}
