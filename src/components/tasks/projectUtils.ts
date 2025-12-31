/**
 * 📁 Utilitaires pour la gestion des projets en colonnes
 */

import { Project, Task, ProjectStatus } from '../../store/useStore'
import { Rocket, TrendingUp, CheckCircle2, Archive } from 'lucide-react'

// Styles visuels par colonne (comme TaskRow et TemporalColumn)
export const projectColumnStyles = {
  todo: {
    row: 'bg-zinc-800/45 hover:bg-zinc-800/65',
    rowHover: 'hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5',
    text: 'text-zinc-50',
    textSecondary: 'text-zinc-400',
    badge: 'bg-blue-500/20 text-blue-400',
    opacity: '',
    header: 'text-zinc-50', // Comme "Today"
    count: 'text-zinc-400',
  },
  inProgress: {
    row: 'bg-zinc-800/30 hover:bg-zinc-800/50',
    rowHover: 'hover:shadow-md hover:shadow-black/15 hover:-translate-y-px',
    text: 'text-zinc-200',
    textSecondary: 'text-zinc-500',
    badge: 'bg-violet-500/20 text-violet-400',
    opacity: '',
    header: 'text-zinc-300', // Comme "In Progress"
    count: 'text-zinc-400',
  },
  completed: {
    row: 'bg-zinc-800/20 hover:bg-zinc-800/35',
    rowHover: 'hover:shadow-sm hover:shadow-black/10',
    text: 'text-zinc-400',
    textSecondary: 'text-zinc-600',
    badge: 'bg-emerald-500/20 text-emerald-400',
    opacity: 'opacity-85',
    header: 'text-zinc-500', // Comme "Upcoming"
    count: 'text-zinc-600',
  },
  archived: {
    row: 'bg-zinc-900/25 hover:bg-zinc-800/30',
    rowHover: '',
    text: 'text-zinc-500',
    textSecondary: 'text-zinc-700',
    badge: 'bg-zinc-700/30 text-zinc-500',
    opacity: 'opacity-60 hover:opacity-80',
    header: 'text-zinc-600', // Comme "Distant"
    count: 'text-zinc-700',
  },
}

export interface ProjectColumnConfig {
  id: ProjectStatus
  label: string
  icon: any
  color: string
  description: string
}

// Configuration des colonnes de projets (3 colonnes principales)
export const PROJECT_COLUMNS: ProjectColumnConfig[] = [
  {
    id: 'todo',
    label: 'À faire',
    icon: Rocket,
    color: '#6366f1', // indigo-500
    description: 'Projets pas encore commencés'
  },
  {
    id: 'inProgress',
    label: 'En cours',
    icon: TrendingUp,
    color: '#8b5cf6', // violet-500
    description: 'Projets en progression'
  },
  {
    id: 'completed',
    label: 'Terminés',
    icon: CheckCircle2,
    color: '#10b981', // emerald-500
    description: 'Projets complétés'
  }
]

// Colonne archivés (affichée conditionnellement)
export const ARCHIVED_COLUMN: ProjectColumnConfig = {
  id: 'archived',
  label: 'Archivés',
  icon: Archive,
  color: '#71717a', // zinc-500
  description: 'Projets archivés'
}

/**
 * Catégorise automatiquement un projet selon son état
 * Logique simplifiée : À faire (0%) | En cours (1-99%) | Terminés (100%)
 */
export function categorizeProject(project: Project, tasks: Task[]): ProjectStatus {
  // Si le projet a un statut défini, l'utiliser
  if (project.status) {
    return project.status
  }
  
  // Projets archivés
  if (project.archived) {
    return 'archived'
  }
  
  const projectTasks = tasks.filter(t => t.projectId === project.id)
  
  // Pas de tâches = à faire
  if (projectTasks.length === 0) {
    return 'todo'
  }
  
  const completedTasks = projectTasks.filter(t => t.completed).length
  const totalTasks = projectTasks.length
  const progressPercent = (completedTasks / totalTasks) * 100
  
  // 100% = terminé
  if (progressPercent === 100) {
    return 'completed'
  }
  
  // 1-99% = en cours
  if (progressPercent > 0) {
    return 'inProgress'
  }
  
  // 0% = à faire
  return 'todo'
}

/**
 * Calcule les statistiques d'un projet
 */
export function calculateProjectStats(project: Project, tasks: Task[]) {
  const projectTasks = tasks.filter(t => t.projectId === project.id)
  const completed = projectTasks.filter(t => t.completed).length
  const total = projectTasks.length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0
  
  return {
    completed,
    total,
    progress
  }
}

/**
 * Trie les projets dans une colonne
 */
export function sortProjectsInColumn(projects: Project[], tasks: Task[]): Project[] {
  return projects.sort((a, b) => {
    // D'abord par progression (plus avancé en premier)
    const statsA = calculateProjectStats(a, tasks)
    const statsB = calculateProjectStats(b, tasks)
    
    if (statsA.progress !== statsB.progress) {
      return statsB.progress - statsA.progress
    }
    
    // Puis par date de création (plus récent en premier)
    return b.createdAt - a.createdAt
  })
}

/**
 * Calcule le nombre de tâches en retard pour un projet
 */
export function getOverdueTasks(project: Project, tasks: Task[]): number {
  const now = Date.now()
  return tasks.filter(t => 
    t.projectId === project.id && 
    !t.completed && 
    t.dueDate && 
    new Date(t.dueDate).getTime() < now
  ).length
}

/**
 * Formate une date relative (ex: "il y a 2h", "hier")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (seconds < 60) return 'à l\'instant'
  if (minutes < 60) return `il y a ${minutes}min`
  if (hours < 24) return `il y a ${hours}h`
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days}j`
  if (days < 30) return `il y a ${Math.floor(days / 7)}sem`
  if (days < 365) return `il y a ${Math.floor(days / 30)}mois`
  return `il y a ${Math.floor(days / 365)}an`
}

