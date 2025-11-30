# 📁 Système de Projets - Documentation Complète

## 🎯 Vue d'ensemble

Le **système de Projets** permet d'organiser les tâches par projets, offrant une vue d'ensemble claire et une gestion professionnelle de multiples initiatives simultanées. Chaque projet peut avoir ses propres objectifs, deadlines, et statistiques de progression.

---

## ✨ Fonctionnalités

### 1. **Gestion de Projets**
- ✅ **Création illimitée** : Créer autant de projets que nécessaire
- ✅ **Templates prédéfinis** : 5 templates pour démarrer rapidement
- ✅ **Personnalisation** : Nom, description, couleur, icône
- ✅ **Statuts** : Active, Paused, Completed, Archived
- ✅ **Deadlines** : Date limite avec alertes
- ✅ **Objectifs** : Définir un objectif clair
- ⭐ **Favoris** : Marquer les projets importants

### 2. **Templates de Projets**
- 🚀 **Lancement de Produit** : 7 tâches prédéfinies (étude marché, MVP, design, dev, tests, marketing, lancement)
- 🏠 **Rénovation Maison** : 7 tâches (budget, artisans, matériaux, peinture, électricité, plomberie, décoration)
- 📚 **Apprentissage** : 7 tâches (objectifs, ressources, planning, étude, pratique, projet, certification)
- 🎉 **Organisation Événement** : 7 tâches (budget/date, invités, lieu, traiteur, décoration, invitations, jour J)
- 📋 **Projet Vide** : Commencer de zéro

### 3. **Statistiques par Projet**
- 📊 **Progression** : Pourcentage de tâches complétées
- ✅ **Tâches** : X/Y complétées
- ⏱️ **Temps** : Estimé vs Réel (en heures)
- 📅 **Deadline** : Jours restants avec alertes
- 🎯 **Objectif** : Affichage de l'objectif défini

### 4. **Analytics Globales**
- 📁 **Total Projets** : Nombre total
- 🟢 **Projets Actifs** : En cours
- ✅ **Projets Complétés** : Terminés
- 📊 **Progression Moyenne** : Moyenne de tous les projets
- ✅ **On Track** : Projets dans les temps
- ⚠️ **At Risk** : Projets en retard ou risque

### 5. **Intégration Tâches**
- 🔗 **Lien automatique** : Tâches assignées à un projet
- 📋 **Vue Kanban par projet** : Filtrer les tâches
- 🗑️ **Suppression intelligente** : Retirer projectId des tâches
- 📊 **Calculs automatiques** : Stats mises à jour en temps réel

### 6. **Vue Détaillée**
- 📈 **Dashboard projet** : Vue complète d'un projet
- 📋 **Tâches récentes** : 5 dernières tâches
- 📊 **Graphiques** : Progression visuelle
- 🔗 **Actions rapides** : Accès aux tâches

---

## 🏗️ Architecture Technique

### Types (`src/types/project.ts`)

```typescript
export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived'

export interface Project {
  id: string
  name: string
  description?: string
  color: string // Hex color
  icon?: string // Emoji
  status: ProjectStatus
  goal?: string
  deadline?: string // YYYY-MM-DD
  createdAt: number
  updatedAt: number
  isFavorite?: boolean
  
  // Stats (computed)
  tasksCount?: number
  completedTasksCount?: number
  progress?: number // 0-100
  estimatedHours?: number
  actualHours?: number
}

export interface ProjectTemplate {
  id: string
  name: string
  description: string
  icon: string
  color: string
  defaultTasks: Array<{
    title: string
    description?: string
    category?: string
    priority?: string
    estimatedMinutes?: number
  }>
}

export interface ProjectStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalTasks: number
  completedTasks: number
  averageProgress: number
  projectsOnTrack: number
  projectsAtRisk: number
}
```

### Store Zustand

**État :**
```typescript
projects: Project[]
```

**Actions :**
```typescript
addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): void
updateProject(id: string, updates: Partial<Project>): void
deleteProject(id: string): void
toggleProjectFavorite(id: string): void
```

**Modification Task :**
```typescript
export interface Task {
  // ... existing fields
  projectId?: string // NEW: Link to project
}
```

### Utilitaires (`src/utils/projectUtils.ts`)

- `calculateProjectStats(project: Project, tasks: Task[])` - Stats d'un projet
- `calculateGlobalProjectStats(projects: Project[], tasks: Task[]): ProjectStats` - Stats globales
- `isProjectOverdue(project: Project): boolean` - Vérifier si en retard
- `getDaysUntilDeadline(project: Project): number | null` - Jours restants
- `getTemplateById(id: string): ProjectTemplate | undefined` - Obtenir un template
- `projectTemplates: ProjectTemplate[]` - Liste des templates

### Composants

**`ProjectsPage.tsx`** - Page principale
- Liste de tous les projets
- Filtres (Actifs, Tous, Complétés)
- Stats globales
- Bouton création

**`ProjectCard.tsx`** - Carte projet
- Affichage compact
- Menu actions (favoris, statuts, suppression)
- Progression visuelle
- Stats clés
- Deadline avec alertes

**`ProjectModal.tsx`** - Modal création/édition
- Étape 1 : Sélection template
- Étape 2 : Détails projet
- Personnalisation complète
- Création tâches automatique

**`ProjectDetailModal.tsx`** - Modal détails
- Vue complète du projet
- Stats détaillées
- Tâches récentes
- Actions rapides

---

## 🎨 Design

### Palette de Couleurs Projets
- **Indigo** (`#6366f1`) : Tech/Dev
- **Emerald** (`#10b981`) : Maison/Personnel
- **Amber** (`#f59e0b`) : Apprentissage
- **Pink** (`#ec4899`) : Événements
- **Violet** (`#8b5cf6`) : Créatif
- **Cyan** (`#06b6d4`) : Business
- **Red** (`#ef4444`) : Urgent
- **Gray** (`#6b7280`) : Autre

### Icônes Projets
- 📁 Défaut
- 🚀 Lancement
- 💼 Business
- 🏠 Maison
- 📚 Apprentissage
- 🎯 Objectifs
- 💡 Idées
- 🎨 Créatif
- 🔧 Technique
- 🌟 Important

### Statuts
- 🟢 **Active** : Emerald
- 🟡 **Paused** : Amber
- 🔵 **Completed** : Indigo
- ⚫ **Archived** : Gray

---

## 📊 Algorithmes Clés

### Calcul des Stats Projet

```typescript
export const calculateProjectStats = (project: Project, tasks: Task[]) => {
  const projectTasks = tasks.filter(t => t.projectId === project.id)
  const completedTasks = projectTasks.filter(t => t.completed)
  
  const tasksCount = projectTasks.length
  const completedTasksCount = completedTasks.length
  const progress = tasksCount > 0 ? Math.round((completedTasksCount / tasksCount) * 100) : 0
  
  const estimatedHours = projectTasks.reduce((sum, t) => sum + (t.estimatedTime || 0), 0) / 60
  const actualHours = projectTasks.reduce((sum, t) => sum + (t.actualTime || 0), 0) / 60
  
  return {
    ...project,
    tasksCount,
    completedTasksCount,
    progress,
    estimatedHours: Math.round(estimatedHours * 10) / 10,
    actualHours: Math.round(actualHours * 10) / 10
  }
}
```

### Détection Projets à Risque

```typescript
// Simple heuristic: if progress < 50% and deadline < 7 days, at risk
if (stats.progress < 50 && daysUntilDeadline < 7 && daysUntilDeadline >= 0) {
  projectsAtRisk++
} else if (daysUntilDeadline < 0) {
  projectsAtRisk++ // Overdue
} else {
  projectsOnTrack++
}
```

**Logique :**
- Progression < 50% ET deadline < 7 jours = À risque
- Deadline dépassée = À risque
- Sinon = On track

---

## 🚀 Utilisation

### Créer un Projet

```typescript
const { addProject } = useStore()

addProject({
  name: 'Lancement App newmars',
  description: 'Lancer la version 1.0 de newmars',
  color: '#6366f1',
  icon: '🚀',
  status: 'active',
  goal: 'Atteindre 1000 utilisateurs',
  deadline: '2024-12-31'
})
```

### Utiliser un Template

```typescript
import { getTemplateById } from '../utils/projectUtils'

const template = getTemplateById('product-launch')
if (template) {
  addProject({
    name: template.name,
    color: template.color,
    icon: template.icon,
    status: 'active'
  })
  
  // Add default tasks
  template.defaultTasks.forEach(task => {
    addTask({
      title: task.title,
      category: task.category,
      priority: task.priority,
      estimatedTime: task.estimatedMinutes
    })
  })
}
```

### Assigner une Tâche à un Projet

```typescript
const { updateTask } = useStore()

updateTask(taskId, {
  projectId: 'project-123'
})
```

### Obtenir les Stats

```typescript
import { calculateGlobalProjectStats } from '../utils/projectUtils'

const { projects, tasks } = useStore()
const stats = calculateGlobalProjectStats(projects, tasks)

console.log(`${stats.activeProjects} projets actifs`)
console.log(`Progression moyenne: ${stats.averageProgress}%`)
console.log(`${stats.projectsAtRisk} projets à risque`)
```

---

## 🎯 Cas d'Usage

### 1. **Lancement de Produit**
- Utiliser le template "Lancement de Produit"
- Définir une deadline
- Suivre la progression
- Ajuster les priorités

### 2. **Projets Personnels**
- Rénovation maison
- Déménagement
- Organisation événement
- Apprentissage nouvelle compétence

### 3. **Gestion Multi-Projets**
- Vue d'ensemble de tous les projets
- Identifier les projets à risque
- Prioriser les efforts
- Célébrer les complétions

### 4. **Suivi de Progression**
- Dashboard par projet
- Temps estimé vs réel
- Tâches restantes
- Ajustement planning

---

## 📈 Métriques & Analytics

### Par Projet
1. **Progression** : % tâches complétées
2. **Tâches** : X/Y complétées
3. **Temps** : Estimé vs Réel
4. **Deadline** : Jours restants
5. **Statut** : Active/Paused/Completed

### Globales
1. **Total Projets**
2. **Projets Actifs**
3. **Projets Complétés**
4. **Progression Moyenne**
5. **Projets On Track**
6. **Projets At Risk**

---

## 🔮 Améliorations Futures

### Court Terme
- [ ] **Filtres avancés** : Par statut, couleur, deadline
- [ ] **Tri** : Par progression, deadline, nom
- [ ] **Vue Kanban projets** : Drag & drop entre statuts
- [ ] **Archivage** : Archiver les projets terminés

### Moyen Terme
- [ ] **Templates custom** : Créer ses propres templates
- [ ] **Sous-projets** : Hiérarchie de projets
- [ ] **Partage** : Collaborer sur des projets
- [ ] **Gantt Chart** : Vue timeline

### Long Terme
- [ ] **Intégration calendrier** : Milestones dans le calendrier
- [ ] **Rapports** : Export PDF des projets
- [ ] **Budgets** : Suivi financier
- [ ] **Ressources** : Gestion d'équipe

---

## 🎓 Bonnes Pratiques

### Pour les Utilisateurs

1. **Clarté** : Nom et objectif clairs
2. **Réalisme** : Deadlines réalistes
3. **Découpage** : Diviser en tâches gérables
4. **Suivi** : Mettre à jour régulièrement
5. **Célébration** : Marquer les complétions

### Pour les Développeurs

1. **Performance** : Calculs de stats avec `useMemo`
2. **Cascade** : Supprimer projectId des tâches lors de suppression projet
3. **Validation** : Vérifier les deadlines
4. **UX** : Feedback visuel pour les actions
5. **Persistence** : Sauvegarder dans localStorage

---

## 🐛 Troubleshooting

### Problème : Stats ne se mettent pas à jour
**Solution** : Vérifier que les tâches ont bien un `projectId`

### Problème : Template ne crée pas les tâches
**Solution** : Délai de 100ms pour obtenir le projectId

### Problème : Projet ne s'affiche pas
**Solution** : Vérifier le filtre actif (Actifs/Tous/Complétés)

---

## 📝 Changelog

### v1.0.0 (30 Nov 2024)
- ✅ Système de projets complet
- ✅ 5 templates prédéfinis
- ✅ Statuts multiples
- ✅ Deadlines avec alertes
- ✅ Stats par projet
- ✅ Analytics globales
- ✅ Intégration tâches
- ✅ Vue détaillée
- ✅ Favoris
- ✅ Persistence localStorage

---

## 🎉 Conclusion

Le système de Projets de newmars transforme la gestion de tâches en une expérience organisée et professionnelle. Avec ses templates, ses analytics et son intégration parfaite avec les tâches, c'est l'outil idéal pour gérer plusieurs projets simultanément et atteindre vos objectifs.

**Organisez vos projets dès maintenant ! 📁🚀**


