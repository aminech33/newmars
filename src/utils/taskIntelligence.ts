import { Task, TaskCategory, TaskPriority } from '../store/useStore'

// ═══════════════════════════════════════════════════════════════════════════════
// TASK INTELLIGENCE V2 LITE - Algorithme de priorisation simplifié
// ═══════════════════════════════════════════════════════════════════════════════
//
// Philosophie : Simple, transparent, prévisible
// 
// Ce qui compte vraiment :
// 1. Priorité explicite (urgent > high > medium > low)
// 2. Deadline (en retard > aujourd'hui > demain > etc.)
// 3. Stagnation (tâches anciennes perdent en visibilité)
// 4. Étoile = tri en premier (pas de bonus magique)
//
// Ce qui a été supprimé (superflu) :
// - Quick Win bonus (biais vers le facile)
// - Subtasks progress bonus (fausse priorité)
// - Priority task boost points (double emploi avec étoile)
// - Time-of-Day multiplier (paternaliste)
// - Score visible/badges (distraction)
// - Top N suggestions (trop de choix = procrastination)
//
// ═══════════════════════════════════════════════════════════════════════════════

// Mots-clés pour la détection automatique
const URGENT_KEYWORDS = ['urgent', 'asap', 'critique', 'important', 'aujourd\'hui', 'maintenant', 'vite']
const DEV_KEYWORDS = ['bug', 'fix', 'code', 'api', 'debug', 'deploy', 'commit', 'merge', 'test']
const DESIGN_KEYWORDS = ['design', 'maquette', 'figma', 'ui', 'ux', 'mockup', 'prototype', 'wireframe']
const WORK_KEYWORDS = ['réunion', 'meeting', 'client', 'présentation', 'rapport', 'email', 'call']
const PERSONAL_KEYWORDS = ['acheter', 'courses', 'rdv', 'médecin', 'famille', 'perso', 'personnel']

// Estimation de durée basée sur des mots-clés
const QUICK_KEYWORDS = ['quick', 'rapide', 'simple', 'petit', 'fix']
const MEDIUM_KEYWORDS = ['créer', 'ajouter', 'modifier', 'update']
const LONG_KEYWORDS = ['refactor', 'refonte', 'complet', 'projet', 'développer']

// ═══════════════════════════════════════════════════════════════════════════════
// FOCUS SCORE - Score de priorisation (0-100)
// ═══════════════════════════════════════════════════════════════════════════════
//
// Formule simple et transparente :
//   Score = Priorité (40pts) + Deadline (40pts) - Stagnation (10pts)
//
// Pas de magie, pas de biais cachés.
//
// ═══════════════════════════════════════════════════════════════════════════════

export function calculateFocusScore(task: Task): number {
  let score = 0
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Priorité explicite (40 points max)
  // L'utilisateur a choisi cette priorité, on la respecte.
  // ─────────────────────────────────────────────────────────────────────────────
  const priorityScores: Record<TaskPriority, number> = { 
    low: 10, 
    medium: 20, 
    high: 30, 
    urgent: 40 
  }
  score += priorityScores[task.priority]
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Deadline proximity (40 points max)
  // Plus c'est proche/en retard, plus c'est urgent.
  // ─────────────────────────────────────────────────────────────────────────────
  if (task.dueDate) {
    const daysUntilDue = Math.ceil(
      (new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysUntilDue < 0) {
      score += 40 // En retard = priorité maximale
    } else if (daysUntilDue === 0) {
      score += 35 // Aujourd'hui
    } else if (daysUntilDue === 1) {
      score += 25 // Demain
    } else if (daysUntilDue <= 3) {
      score += 15 // Cette semaine
    } else if (daysUntilDue <= 7) {
      score += 8  // Semaine prochaine
    }
    // > 7 jours = pas de bonus
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Stagnation penalty (-10 points max)
  // Les tâches qui traînent depuis longtemps perdent en visibilité.
  // Ça évite l'accumulation de "zombie tasks".
  // ─────────────────────────────────────────────────────────────────────────────
  const daysOld = (Date.now() - task.createdAt) / (1000 * 60 * 60 * 24)
  
  if (daysOld > 14) {
    score -= 10 // > 2 semaines sans action
  } else if (daysOld > 7) {
    score -= 5  // > 1 semaine sans action
  }
  
  return Math.min(Math.max(score, 0), 100)
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRI DES TÂCHES - Simple et prévisible
// ═══════════════════════════════════════════════════════════════════════════════
//
// Ordre de tri :
// 1. Tâches non-complétées d'abord
// 2. Tâche étoilée en premier (si existe)
// 3. Par Focus Score décroissant
// 4. En cas d'égalité, par date de création (récent d'abord)
//
// ═══════════════════════════════════════════════════════════════════════════════

export function sortTasksForColumn(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // 1. Tâches complétées en dernier
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1
    }
    
    // 2. Tâche étoilée en premier (pas de bonus points, juste le tri)
    if (a.isPriority && !b.isPriority) return -1
    if (!a.isPriority && b.isPriority) return 1
    
    // 3. Par Focus Score
    const scoreA = calculateFocusScore(a)
    const scoreB = calculateFocusScore(b)
    
    if (scoreA !== scoreB) {
      return scoreB - scoreA
    }
    
    // 4. En cas d'égalité, par date de création (récent d'abord)
    return b.createdAt - a.createdAt
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES - Détection automatique (optionnelle)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Auto-catégorise une tâche basée sur son titre
 * Utilisé uniquement à la création pour suggérer une catégorie.
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
 * Suggestion à la création, l'utilisateur peut modifier.
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
 * Suggestion à la création, l'utilisateur peut modifier.
 */
export function detectPriority(title: string): TaskPriority {
  const lowerTitle = title.toLowerCase()
  
  if (URGENT_KEYWORDS.some(kw => lowerTitle.includes(kw))) return 'urgent'
  if (lowerTitle.includes('important')) return 'high'
  if (lowerTitle.includes('plus tard') || lowerTitle.includes('maybe')) return 'low'
  
  return 'medium' // Par défaut
}

/**
 * Analyse les patterns de productivité (stats simples)
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

// ═══════════════════════════════════════════════════════════════════════════════
// EFFORT ESTIMATION - Conversion durée ↔ effort (manuelle)
// ═══════════════════════════════════════════════════════════════════════════════
//
// L'utilisateur définit la durée, on convertit en effort.
// Pas de prédiction IA, juste une conversion simple.
//
// ═══════════════════════════════════════════════════════════════════════════════

export type TaskEffort = 'XS' | 'S' | 'M' | 'L'

/**
 * Convertit une durée (définie par l'utilisateur) en effort
 */
export function durationToEffort(minutes: number): TaskEffort {
  if (minutes <= 15) return 'XS'
  if (minutes <= 30) return 'S'
  if (minutes <= 60) return 'M'
  return 'L'
}

/**
 * Convertit un effort en durée estimée (en minutes)
 */
export function effortToDuration(effort: TaskEffort): number {
  switch (effort) {
    case 'XS': return 15
    case 'S': return 30
    case 'M': return 60
    case 'L': return 120
  }
}
