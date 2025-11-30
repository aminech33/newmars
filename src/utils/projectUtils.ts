import { ProjectTemplate } from '../types/project'

export const projectTemplates: ProjectTemplate[] = [
  {
    id: 'blank',
    name: 'Projet vide',
    description: 'Commencer de zéro',
    icon: '📄',
    color: '#6B7280',
    defaultTasks: []
  },
  {
    id: 'web-app',
    name: 'Application Web',
    description: 'Frontend + Backend',
    icon: '🌐',
    color: '#3B82F6',
    defaultTasks: [
      'Définir les spécifications',
      'Créer les maquettes UI/UX',
      'Setup du projet (Vite/Next.js)',
      'Développer les composants',
      'Intégrer l\'API',
      'Tests et déploiement'
    ]
  },
  {
    id: 'mobile-app',
    name: 'Application Mobile',
    description: 'iOS / Android',
    icon: '📱',
    color: '#8B5CF6',
    defaultTasks: [
      'Définir les fonctionnalités',
      'Design de l\'interface',
      'Setup React Native / Flutter',
      'Développement des écrans',
      'Tests sur devices',
      'Publication sur stores'
    ]
  },
  {
    id: 'marketing',
    name: 'Campagne Marketing',
    description: 'Lancement produit',
    icon: '📣',
    color: '#F59E0B',
    defaultTasks: [
      'Définir la cible',
      'Créer le contenu',
      'Planifier les publications',
      'Configurer les ads',
      'Analyser les résultats'
    ]
  },
  {
    id: 'event',
    name: 'Événement',
    description: 'Organisation d\'événement',
    icon: '🎉',
    color: '#EC4899',
    defaultTasks: [
      'Définir la date et le lieu',
      'Établir le budget',
      'Envoyer les invitations',
      'Organiser la logistique',
      'Préparer le programme',
      'Débriefing post-événement'
    ]
  },
  {
    id: 'content',
    name: 'Création de Contenu',
    description: 'Blog, vidéos, podcasts',
    icon: '✍️',
    color: '#10B981',
    defaultTasks: [
      'Brainstorming des idées',
      'Recherche et documentation',
      'Rédaction / Tournage',
      'Édition et montage',
      'Publication et promotion'
    ]
  },
  {
    id: 'learning',
    name: 'Apprentissage',
    description: 'Nouvelle compétence',
    icon: '📚',
    color: '#6366F1',
    defaultTasks: [
      'Définir les objectifs',
      'Trouver les ressources',
      'Planifier les sessions',
      'Pratiquer régulièrement',
      'Évaluer les progrès'
    ]
  }
]

export function getTemplateById(id: string): ProjectTemplate | undefined {
  return projectTemplates.find(t => t.id === id)
}

export function getProjectProgress(completedTasks: number, totalTasks: number): number {
  if (totalTasks === 0) return 0
  return Math.round((completedTasks / totalTasks) * 100)
}

export function getProjectStatus(progress: number): 'not-started' | 'in-progress' | 'completed' {
  if (progress === 0) return 'not-started'
  if (progress === 100) return 'completed'
  return 'in-progress'
}

export function formatProjectDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

