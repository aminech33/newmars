import { Task, TaskCategory, TaskPriority } from '../store/useStore'

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

/**
 * Calcule le Focus Score d'une tâche (0-100)
 * Basé sur : urgence, priorité, deadline, temps estimé
 */
export function calculateFocusScore(task: Task): number {
  let score = 0
  
  // Priorité (40 points max)
  const priorityScores = { low: 10, medium: 20, high: 30, urgent: 40 }
  score += priorityScores[task.priority]
  
  // Deadline (30 points max)
  if (task.dueDate) {
    const daysUntilDue = Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (daysUntilDue < 0) score += 30 // En retard
    else if (daysUntilDue === 0) score += 25 // Aujourd'hui
    else if (daysUntilDue === 1) score += 20 // Demain
    else if (daysUntilDue <= 3) score += 15 // Cette semaine
    else if (daysUntilDue <= 7) score += 10 // Semaine prochaine
  }
  
  // Temps estimé (20 points max) - favorise les tâches courtes
  if (task.estimatedTime) {
    if (task.estimatedTime <= 15) score += 20 // Très court
    else if (task.estimatedTime <= 30) score += 15 // Court
    else if (task.estimatedTime <= 60) score += 10 // Moyen
    else score += 5 // Long
  }
  
  // Âge de la tâche (10 points max) - pénalise les vieilles tâches
  const daysOld = Math.floor((Date.now() - task.createdAt) / (1000 * 60 * 60 * 24))
  if (daysOld > 7) score += 10
  else if (daysOld > 3) score += 5
  
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
 * Suggère la prochaine tâche à faire
 */
export function suggestNextTask(tasks: Task[], currentHour: number = new Date().getHours()): Task | null {
  // Filtrer les tâches non terminées
  const incompleteTasks = tasks.filter(t => !t.completed && t.status !== 'done')
  
  if (incompleteTasks.length === 0) return null
  
  // Calculer le focus score pour chaque tâche
  const tasksWithScores = incompleteTasks.map(task => ({
    task,
    score: calculateFocusScore(task)
  }))
  
  // Ajustement selon l'heure de la journée
  tasksWithScores.forEach(({ task, score }) => {
    // Matin (6h-12h) : favoriser les tâches complexes
    if (currentHour >= 6 && currentHour < 12) {
      if (task.estimatedTime && task.estimatedTime > 60) {
        score += 10
      }
    }
    // Après-midi (12h-18h) : favoriser les tâches créatives
    else if (currentHour >= 12 && currentHour < 18) {
      if (task.category === 'design') {
        score += 10
      }
    }
    // Soir (18h-23h) : favoriser les tâches courtes
    else if (currentHour >= 18) {
      if (task.estimatedTime && task.estimatedTime <= 30) {
        score += 10
      }
    }
  })
  
  // Trier par score décroissant
  tasksWithScores.sort((a, b) => b.score - a.score)
  
  return tasksWithScores[0]?.task || null
}

/**
 * Génère des suggestions intelligentes
 */
export function generateSmartSuggestions(tasks: Task[]): string[] {
  const suggestions: string[] = []
  const incompleteTasks = tasks.filter(t => !t.completed && t.status !== 'done')
  const currentHour = new Date().getHours()
  
  // Suggestion basée sur l'heure
  if (currentHour >= 6 && currentHour < 12) {
    suggestions.push('🌅 Matin : Parfait pour les tâches complexes et créatives')
  } else if (currentHour >= 12 && currentHour < 14) {
    suggestions.push('🍽️ Pause déjeuner : Prenez une pause bien méritée')
  } else if (currentHour >= 14 && currentHour < 18) {
    suggestions.push('☀️ Après-midi : Idéal pour les tâches collaboratives')
  } else if (currentHour >= 18 && currentHour < 22) {
    suggestions.push('🌙 Soir : Moment pour les tâches simples et rapides')
  }
  
  // Tâches urgentes
  const urgentTasks = incompleteTasks.filter(t => t.priority === 'urgent' || t.category === 'urgent')
  if (urgentTasks.length > 0) {
    suggestions.push(`🚨 ${urgentTasks.length} tâche(s) urgente(s) - Commencer par la plus courte ?`)
  }
  
  // Tâches en retard
  const overdueTasks = incompleteTasks.filter(t => {
    if (!t.dueDate) return false
    return new Date(t.dueDate).getTime() < Date.now()
  })
  if (overdueTasks.length > 0) {
    suggestions.push(`⏰ ${overdueTasks.length} tâche(s) en retard - Prioriser aujourd'hui`)
  }
  
  // Tâches qui traînent
  const oldTasks = incompleteTasks.filter(t => {
    const daysOld = Math.floor((Date.now() - t.createdAt) / (1000 * 60 * 60 * 24))
    return daysOld > 7
  })
  if (oldTasks.length > 0) {
    suggestions.push(`📦 ${oldTasks.length} tâche(s) depuis plus d'une semaine - Les découper ?`)
  }
  
  // Suggestion de pause
  const completedToday = tasks.filter(t => {
    const today = new Date().setHours(0, 0, 0, 0)
    return t.completed && t.createdAt >= today
  })
  if (completedToday.length >= 5) {
    suggestions.push(`🎉 ${completedToday.length} tâches complétées aujourd'hui - Pause de 10min ?`)
  }
  
  // Tâches courtes disponibles
  const quickTasks = incompleteTasks.filter(t => t.estimatedTime && t.estimatedTime <= 15)
  if (quickTasks.length > 0) {
    suggestions.push(`⚡ ${quickTasks.length} tâche(s) rapide(s) (<15min) - Quick wins !`)
  }
  
  return suggestions
}

/**
 * Analyse les patterns de productivité
 */
export function analyzeProductivityPatterns(tasks: Task[]): {
  averageCompletionTime: number
  mostProductiveCategory: TaskCategory
  completionRate: number
  tasksPerDay: number
} {
  const completedTasks = tasks.filter(t => t.completed)
  
  // Temps moyen de complétion
  const tasksWithTime = completedTasks.filter(t => t.actualTime)
  const averageCompletionTime = tasksWithTime.length > 0
    ? tasksWithTime.reduce((sum, t) => sum + (t.actualTime || 0), 0) / tasksWithTime.length
    : 0
  
  // Catégorie la plus productive
  const categoryCount: Record<TaskCategory, number> = {
    dev: 0, design: 0, personal: 0, work: 0, urgent: 0
  }
  completedTasks.forEach(t => categoryCount[t.category]++)
  const mostProductiveCategory = Object.entries(categoryCount)
    .sort(([, a], [, b]) => b - a)[0]?.[0] as TaskCategory || 'work'
  
  // Taux de complétion
  const completionRate = tasks.length > 0
    ? (completedTasks.length / tasks.length) * 100
    : 0
  
  // Tâches par jour (sur les 30 derniers jours)
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
  const recentTasks = tasks.filter(t => t.createdAt >= thirtyDaysAgo)
  const tasksPerDay = recentTasks.length / 30
  
  return {
    averageCompletionTime: Math.round(averageCompletionTime),
    mostProductiveCategory,
    completionRate: Math.round(completionRate),
    tasksPerDay: Math.round(tasksPerDay * 10) / 10
  }
}


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

/**
 * Calcule le Focus Score d'une tâche (0-100)
 * Basé sur : urgence, priorité, deadline, temps estimé
 */
export function calculateFocusScore(task: Task): number {
  let score = 0
  
  // Priorité (40 points max)
  const priorityScores = { low: 10, medium: 20, high: 30, urgent: 40 }
  score += priorityScores[task.priority]
  
  // Deadline (30 points max)
  if (task.dueDate) {
    const daysUntilDue = Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (daysUntilDue < 0) score += 30 // En retard
    else if (daysUntilDue === 0) score += 25 // Aujourd'hui
    else if (daysUntilDue === 1) score += 20 // Demain
    else if (daysUntilDue <= 3) score += 15 // Cette semaine
    else if (daysUntilDue <= 7) score += 10 // Semaine prochaine
  }
  
  // Temps estimé (20 points max) - favorise les tâches courtes
  if (task.estimatedTime) {
    if (task.estimatedTime <= 15) score += 20 // Très court
    else if (task.estimatedTime <= 30) score += 15 // Court
    else if (task.estimatedTime <= 60) score += 10 // Moyen
    else score += 5 // Long
  }
  
  // Âge de la tâche (10 points max) - pénalise les vieilles tâches
  const daysOld = Math.floor((Date.now() - task.createdAt) / (1000 * 60 * 60 * 24))
  if (daysOld > 7) score += 10
  else if (daysOld > 3) score += 5
  
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
 * Suggère la prochaine tâche à faire
 */
export function suggestNextTask(tasks: Task[], currentHour: number = new Date().getHours()): Task | null {
  // Filtrer les tâches non terminées
  const incompleteTasks = tasks.filter(t => !t.completed && t.status !== 'done')
  
  if (incompleteTasks.length === 0) return null
  
  // Calculer le focus score pour chaque tâche
  const tasksWithScores = incompleteTasks.map(task => ({
    task,
    score: calculateFocusScore(task)
  }))
  
  // Ajustement selon l'heure de la journée
  tasksWithScores.forEach(({ task, score }) => {
    // Matin (6h-12h) : favoriser les tâches complexes
    if (currentHour >= 6 && currentHour < 12) {
      if (task.estimatedTime && task.estimatedTime > 60) {
        score += 10
      }
    }
    // Après-midi (12h-18h) : favoriser les tâches créatives
    else if (currentHour >= 12 && currentHour < 18) {
      if (task.category === 'design') {
        score += 10
      }
    }
    // Soir (18h-23h) : favoriser les tâches courtes
    else if (currentHour >= 18) {
      if (task.estimatedTime && task.estimatedTime <= 30) {
        score += 10
      }
    }
  })
  
  // Trier par score décroissant
  tasksWithScores.sort((a, b) => b.score - a.score)
  
  return tasksWithScores[0]?.task || null
}

/**
 * Génère des suggestions intelligentes
 */
export function generateSmartSuggestions(tasks: Task[]): string[] {
  const suggestions: string[] = []
  const incompleteTasks = tasks.filter(t => !t.completed && t.status !== 'done')
  const currentHour = new Date().getHours()
  
  // Suggestion basée sur l'heure
  if (currentHour >= 6 && currentHour < 12) {
    suggestions.push('🌅 Matin : Parfait pour les tâches complexes et créatives')
  } else if (currentHour >= 12 && currentHour < 14) {
    suggestions.push('🍽️ Pause déjeuner : Prenez une pause bien méritée')
  } else if (currentHour >= 14 && currentHour < 18) {
    suggestions.push('☀️ Après-midi : Idéal pour les tâches collaboratives')
  } else if (currentHour >= 18 && currentHour < 22) {
    suggestions.push('🌙 Soir : Moment pour les tâches simples et rapides')
  }
  
  // Tâches urgentes
  const urgentTasks = incompleteTasks.filter(t => t.priority === 'urgent' || t.category === 'urgent')
  if (urgentTasks.length > 0) {
    suggestions.push(`🚨 ${urgentTasks.length} tâche(s) urgente(s) - Commencer par la plus courte ?`)
  }
  
  // Tâches en retard
  const overdueTasks = incompleteTasks.filter(t => {
    if (!t.dueDate) return false
    return new Date(t.dueDate).getTime() < Date.now()
  })
  if (overdueTasks.length > 0) {
    suggestions.push(`⏰ ${overdueTasks.length} tâche(s) en retard - Prioriser aujourd'hui`)
  }
  
  // Tâches qui traînent
  const oldTasks = incompleteTasks.filter(t => {
    const daysOld = Math.floor((Date.now() - t.createdAt) / (1000 * 60 * 60 * 24))
    return daysOld > 7
  })
  if (oldTasks.length > 0) {
    suggestions.push(`📦 ${oldTasks.length} tâche(s) depuis plus d'une semaine - Les découper ?`)
  }
  
  // Suggestion de pause
  const completedToday = tasks.filter(t => {
    const today = new Date().setHours(0, 0, 0, 0)
    return t.completed && t.createdAt >= today
  })
  if (completedToday.length >= 5) {
    suggestions.push(`🎉 ${completedToday.length} tâches complétées aujourd'hui - Pause de 10min ?`)
  }
  
  // Tâches courtes disponibles
  const quickTasks = incompleteTasks.filter(t => t.estimatedTime && t.estimatedTime <= 15)
  if (quickTasks.length > 0) {
    suggestions.push(`⚡ ${quickTasks.length} tâche(s) rapide(s) (<15min) - Quick wins !`)
  }
  
  return suggestions
}

/**
 * Analyse les patterns de productivité
 */
export function analyzeProductivityPatterns(tasks: Task[]): {
  averageCompletionTime: number
  mostProductiveCategory: TaskCategory
  completionRate: number
  tasksPerDay: number
} {
  const completedTasks = tasks.filter(t => t.completed)
  
  // Temps moyen de complétion
  const tasksWithTime = completedTasks.filter(t => t.actualTime)
  const averageCompletionTime = tasksWithTime.length > 0
    ? tasksWithTime.reduce((sum, t) => sum + (t.actualTime || 0), 0) / tasksWithTime.length
    : 0
  
  // Catégorie la plus productive
  const categoryCount: Record<TaskCategory, number> = {
    dev: 0, design: 0, personal: 0, work: 0, urgent: 0
  }
  completedTasks.forEach(t => categoryCount[t.category]++)
  const mostProductiveCategory = Object.entries(categoryCount)
    .sort(([, a], [, b]) => b - a)[0]?.[0] as TaskCategory || 'work'
  
  // Taux de complétion
  const completionRate = tasks.length > 0
    ? (completedTasks.length / tasks.length) * 100
    : 0
  
  // Tâches par jour (sur les 30 derniers jours)
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
  const recentTasks = tasks.filter(t => t.createdAt >= thirtyDaysAgo)
  const tasksPerDay = recentTasks.length / 30
  
  return {
    averageCompletionTime: Math.round(averageCompletionTime),
    mostProductiveCategory,
    completionRate: Math.round(completionRate),
    tasksPerDay: Math.round(tasksPerDay * 10) / 10
  }
}


