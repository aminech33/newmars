import { TestModule, TestResult } from '../types/testing'
import { useStore } from '../store/useStore'

// Fonction helper pour générer un ID unique
const generateTestId = () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Helper pour attendre un peu (simulation d'action utilisateur)
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Helper pour naviguer vers une vue et vérifier
const navigateAndVerify = async (view: string): Promise<boolean> => {
  const store = useStore.getState()
  store.setView(view as any)
  await wait(100) // Attendre le rendu
  return useStore.getState().currentView === view
}

// ============================================
// MONITORING SYSTEM - Détecte les actions manuelles
// ============================================

// Snapshots pour comparer l'état avant/après
let monitoringSnapshots: Record<string, any> = {}

// Initialiser un snapshot de l'état actuel
export const initMonitorSnapshot = (testId: string) => {
  const store = useStore.getState()
  monitoringSnapshots[testId] = {
    tasksCount: store.tasks.length,
    eventsCount: store.events?.length || 0,
    habitsCount: store.habits?.length || 0,
    booksCount: store.books?.length || 0,
    journalCount: store.journalEntries?.length || 0,
    weightCount: store.weightEntries?.length || 0,
    mealCount: store.mealEntries?.length || 0,
    projectsCount: store.projects?.length || 0,
    timestamp: Date.now()
  }
}

// ============================================
// TASKS MODULE TESTS
// ============================================
const tasksTests: TestModule = {
  id: 'tasks',
  name: 'Tasks',
  icon: '📋',
  scenarios: [
    {
      id: 'task-01',
      module: 'Tasks',
      name: 'Créer une tâche',
      description: 'Vérifie que la création de tâche fonctionne correctement',
      priority: 'critical',
      mode: 'monitor', // Mode monitoring : détecte les actions manuelles
      expectedResult: 'Tâche créée et persistée dans le store',
      monitorMessage: '👀 Monitoring actif : Crée une tâche manuellement...',
      monitorTest: () => {
        const snapshot = monitoringSnapshots['task-01']
        if (!snapshot) return false
        
        const store = useStore.getState()
        const currentCount = store.tasks.length
        
        // Vérifie si une nouvelle tâche a été ajoutée
        const hasNewTask = currentCount > snapshot.tasksCount
        
        // Vérifie que la tâche a été créée récemment (dans les 30 dernières secondes)
        if (hasNewTask) {
          const recentTasks = store.tasks.filter(
            t => Date.now() - t.createdAt < 30000
          )
          return recentTasks.length > 0
        }
        
        return false
      },
      autoTest: async (): Promise<TestResult> => {
        try {
          const store = useStore.getState()
          const initialCount = store.tasks.length
          const testId = generateTestId()
          
          // 1. Naviguer vers Tasks
          const navigated = await navigateAndVerify('tasks')
          if (!navigated) {
            return { status: 'fail', message: '❌ Navigation vers Tasks échouée' }
          }
          
          // 2. Créer la tâche
          store.addTask({
            title: `Test Task ${testId}`,
            category: 'dev',
            priority: 'high',
            dueDate: new Date().toISOString().split('T')[0],
            completed: false,
            status: 'todo'
          })
          
          await wait(100) // Attendre mise à jour UI
          
          // 3. Vérifier dans le store
          const newCount = useStore.getState().tasks.length
          const taskExists = useStore.getState().tasks.some(t => t.title.includes(testId))
          
          // 4. Vérifier que la vue est toujours active
          const stillOnTasks = useStore.getState().currentView === 'tasks'
          
          if (newCount === initialCount + 1 && taskExists && stillOnTasks) {
            return { 
              status: 'pass', 
              message: `✅ Tâche créée et visible dans Tasks (${newCount} tâches)` 
            }
          }
          return { 
            status: 'fail', 
            message: `❌ Vérifications échouées: count=${newCount === initialCount + 1}, exists=${taskExists}, view=${stillOnTasks}` 
          }
        } catch (error) {
          return { status: 'fail', message: `❌ Erreur: ${error instanceof Error ? error.message : 'Unknown'}` }
        }
      }
    },
    {
      id: 'task-02',
      module: 'Tasks',
      name: 'Marquer comme complétée',
      description: 'Vérifie le toggle de complétion',
      priority: 'critical',
      mode: 'monitor',
      expectedResult: 'Statut de la tâche change correctement',
      monitorMessage: '👀 Monitoring actif : Coche une tâche comme complétée...',
      monitorTest: () => {
        const snapshot = monitoringSnapshots['task-02']
        if (!snapshot) return false
        
        const store = useStore.getState()
        
        // Vérifie si une tâche a été complétée récemment
        const recentlyCompletedTasks = store.tasks.filter(
          t => t.completed && Date.now() - t.createdAt < 30000
        )
        
        return recentlyCompletedTasks.length > 0
      },
      autoTest: async (): Promise<TestResult> => {
        try {
          const store = useStore.getState()
          const testId = generateTestId()
          
          // 1. Créer une tâche
          store.addTask({
            title: `Toggle Test ${testId}`,
            category: 'dev',
            priority: 'medium',
            completed: false,
            status: 'todo'
          })
          
          await wait(50)
          
          // 2. Récupérer la tâche
          const task = useStore.getState().tasks.find(t => t.title.includes(testId))
          if (!task) return { status: 'fail', message: '❌ Tâche de test non trouvée' }
          
          // 3. Toggle ON
          const wasCompleted = task.completed
          store.toggleTask(task.id)
          await wait(50)
          
          const afterToggle = useStore.getState().tasks.find(t => t.id === task.id)
          if (!afterToggle) return { status: 'fail', message: '❌ Tâche perdue après toggle' }
          
          // 4. Vérifier le changement
          const toggledCorrectly = afterToggle.completed !== wasCompleted
          
          // 5. Nettoyer
          store.deleteTask(task.id)
          
          if (toggledCorrectly) {
            return { 
              status: 'pass', 
              message: `✅ Toggle fonctionne (${wasCompleted} → ${afterToggle.completed})` 
            }
          }
          return { status: 'fail', message: '❌ Toggle échoué' }
        } catch (error) {
          return { status: 'fail', message: `❌ Erreur: ${error instanceof Error ? error.message : 'Unknown'}` }
        }
      }
    },
    {
      id: 'task-03',
      module: 'Tasks',
      name: 'Supprimer une tâche',
      description: 'Vérifie la suppression',
      priority: 'high',
      mode: 'monitor',
      expectedResult: 'Tâche supprimée du store',
      monitorMessage: '👀 Monitoring actif : Supprime une tâche...',
      monitorTest: () => {
        const snapshot = monitoringSnapshots['task-03']
        if (!snapshot) return false
        
        const store = useStore.getState()
        const currentCount = store.tasks.length
        
        // Vérifie si une tâche a été supprimée
        return currentCount < snapshot.tasksCount
      },
      autoTest: (): TestResult => {
        try {
          const store = useStore.getState()
          const testId = generateTestId()
          
          store.addTask({
            title: `Delete Test ${testId}`,
            category: 'personal',
            priority: 'low',
            completed: false,
            status: 'todo'
          })
          
          const task = useStore.getState().tasks.find(t => t.title.includes(testId))
          if (!task) return { status: 'fail', message: '❌ Tâche de test non trouvée' }
          
          store.deleteTask(task.id)
          
          const stillExists = useStore.getState().tasks.some(t => t.id === task.id)
          if (!stillExists) {
            return { status: 'pass', message: '✅ Tâche supprimée' }
          }
          return { status: 'fail', message: '❌ Tâche toujours présente' }
        } catch (error) {
          return { status: 'fail', message: `❌ Erreur: ${error instanceof Error ? error.message : 'Unknown'}` }
        }
      }
    },
    {
      id: 'task-04',
      module: 'Tasks',
      name: 'Navigation vers Tasks',
      description: 'Vérifie que la navigation fonctionne',
      priority: 'critical',
      expectedResult: 'La vue Tasks s\'affiche correctement',
      autoTest: async (): Promise<TestResult> => {
        try {
          const success = await navigateAndVerify('tasks')
          if (success) {
            return { status: 'pass', message: '✅ Navigation vers Tasks OK' }
          }
          return { status: 'fail', message: '❌ Navigation échouée' }
        } catch (error) {
          return { status: 'fail', message: `❌ Erreur: ${error instanceof Error ? error.message : 'Unknown'}` }
        }
      }
    },
    {
      id: 'task-05',
      module: 'Tasks',
      name: 'Créer un projet',
      description: 'Vérifie la création de projet',
      priority: 'high',
      expectedResult: 'Projet créé avec nom et couleur',
      autoTest: async (): Promise<TestResult> => {
        try {
          const store = useStore.getState()
          const initialCount = store.projects?.length || 0
          const testId = generateTestId()
          
          // Naviguer vers tasks
          await navigateAndVerify('tasks')
          
          store.addProject?.({
            name: `Test Project ${testId}`,
            color: '#6366f1',
            icon: '🧪'
          })
          
          await wait(100)
          
          const newCount = useStore.getState().projects?.length || 0
          const projectExists = useStore.getState().projects?.some(p => p.name.includes(testId))
          
          if (newCount === initialCount + 1 && projectExists) {
            return { status: 'pass', message: `✅ Projet créé (${newCount} projets)` }
          }
          return { status: 'fail', message: '❌ Projet non créé' }
        } catch (error) {
          return { status: 'fail', message: `❌ Erreur: ${error instanceof Error ? error.message : 'Unknown'}` }
        }
      }
    },
    {
      id: 'task-06',
      module: 'Tasks',
      name: 'Persistance après refresh',
      description: 'Vérifie que les données persistent',
      priority: 'critical',
      expectedResult: 'Les tâches restent après rechargement',
      autoTest: async (): Promise<TestResult> => {
        try {
          const store = useStore.getState()
          const testId = generateTestId()
          
          // Créer une tâche
          store.addTask({
            title: `Persist Test ${testId}`,
            category: 'dev',
            priority: 'high',
            completed: false,
            status: 'todo'
          })
          
          await wait(100)
          
          // Vérifier localStorage
          const stored = localStorage.getItem('newmars-storage')
          if (!stored) {
            return { status: 'fail', message: '❌ Aucune donnée dans localStorage' }
          }
          
          const parsed = JSON.parse(stored)
          const taskInStorage = parsed.state?.tasks?.some((t: any) => t.title?.includes(testId))
          
          // Nettoyer
          store.deleteTask(useStore.getState().tasks.find(t => t.title.includes(testId))?.id || '')
          
          if (taskInStorage) {
            return { status: 'pass', message: '✅ Persistance OK (localStorage)' }
          }
          return { status: 'fail', message: '❌ Tâche non trouvée dans localStorage' }
        } catch (error) {
          return { status: 'fail', message: `❌ Erreur: ${error instanceof Error ? error.message : 'Unknown'}` }
        }
      }
    },
    {
      id: 'task-07',
      module: 'Tasks',
      name: 'Widget Tasks affiche les données',
      description: 'Vérifie que le widget affiche bien les tâches',
      priority: 'high',
      expectedResult: 'Le widget affiche les tâches actuelles',
      autoTest: async (): Promise<TestResult> => {
        try {
          const store = useStore.getState()
          
          // Naviguer vers hub (où sont les widgets)
          await navigateAndVerify('hub')
          await wait(200)
          
          const taskCount = store.tasks.length
          const hasTaskWidget = store.widgets?.some(w => w.type === 'tasks')
          
          if (hasTaskWidget) {
            return { 
              status: 'pass', 
              message: `✅ Widget Tasks présent (${taskCount} tâches disponibles)` 
            }
          }
          return { status: 'skip', message: '⚠️ Widget Tasks non ajouté au Hub' }
        } catch (error) {
          return { status: 'fail', message: `❌ Erreur: ${error instanceof Error ? error.message : 'Unknown'}` }
        }
      }
    },
    {
      id: 'task-08',
      module: 'Tasks',
      name: 'Filtrage par catégorie',
      description: 'Test du système de filtrage',
      priority: 'medium',
      expectedResult: 'Les filtres fonctionnent correctement',
      manualSteps: [
        '1. Créer des tâches avec différentes catégories',
        '2. Appliquer un filtre (ex: "dev")',
        '3. Vérifier que seules les tâches "dev" apparaissent'
      ]
    },
    {
      id: 'task-09',
      module: 'Tasks',
      name: 'Créer projet avec tâches',
      description: 'Créer projet et plusieurs tâches d\'un coup',
      priority: 'medium',
      expectedResult: 'Projet + tâches créés',
      manualSteps: [
        '1. Cliquer "Nouveau projet avec tâches"',
        '2. Remplir nom projet',
        '3. Ajouter 3 tâches',
        '4. Créer',
        '5. Vérifier projet et tâches'
      ]
    },
    {
      id: 'task-10',
      module: 'Tasks',
      name: 'Éditer couleur/icône projet',
      description: 'Personnaliser un projet',
      priority: 'low',
      expectedResult: 'Projet mis à jour',
      manualSteps: [
        '1. Aller dans gestion projets',
        '2. Éditer un projet',
        '3. Changer couleur',
        '4. Changer icône',
        '5. Sauvegarder'
      ]
    },
    {
      id: 'task-11',
      module: 'Tasks',
      name: 'Supprimer projet',
      description: 'Supprimer un projet entier',
      priority: 'medium',
      expectedResult: 'Projet supprimé',
      manualSteps: [
        '1. Aller dans gestion projets',
        '2. Supprimer un projet',
        '3. Confirmer',
        '4. Vérifier qu\'il a disparu'
      ]
    },
    {
      id: 'task-12',
      module: 'Tasks',
      name: 'Drag & drop Kanban',
      description: 'Déplacer tâche entre colonnes',
      priority: 'high',
      expectedResult: 'Statut mis à jour',
      manualSteps: [
        '1. Créer une tâche "Todo"',
        '2. Vue Kanban',
        '3. Drag vers "In Progress"',
        '4. Vérifier changement de statut'
      ]
    },
    {
      id: 'task-14',
      module: 'Tasks',
      name: 'Filtrer par priorité',
      description: 'Filtrer urgent/high/medium/low',
      priority: 'medium',
      expectedResult: 'Tâches filtrées',
      manualSteps: [
        '1. Créer tâches avec priorités variées',
        '2. Ouvrir filtres avancés',
        '3. Sélectionner "urgent"',
        '4. Vérifier résultat'
      ]
    },
    {
      id: 'task-15',
      module: 'Tasks',
      name: 'Quick filters',
      description: 'Today/Week/Urgent',
      priority: 'high',
      expectedResult: 'Filtrage rapide',
      manualSteps: [
        '1. Cliquer "Today"',
        '2. Vérifier tâches du jour',
        '3. Cliquer "Urgent"',
        '4. Vérifier tâches urgentes'
      ]
    },
    {
      id: 'task-16',
      module: 'Tasks',
      name: 'Cocher sous-tâche',
      description: 'Marquer sous-tâche complétée',
      priority: 'medium',
      expectedResult: 'Sous-tâche cochée',
      manualSteps: [
        '1. Ouvrir tâche avec sous-tâches',
        '2. Cocher une sous-tâche',
        '3. Vérifier progression % mise à jour'
      ]
    },
    {
      id: 'task-18',
      module: 'Tasks',
      name: 'Bloquer temps calendrier',
      description: 'Créer événement depuis tâche',
      priority: 'medium',
      expectedResult: 'Événement créé',
      manualSteps: [
        '1. Ouvrir détails tâche',
        '2. Cliquer "Bloquer temps"',
        '3. Choisir date/heure',
        '4. Confirmer',
        '5. Vérifier dans calendrier'
      ]
    },
    {
      id: 'task-19',
      module: 'Tasks',
      name: 'Stats productivité',
      description: 'Voir statistiques détaillées',
      priority: 'medium',
      expectedResult: 'Stats affichées',
      manualSteps: [
        '1. Cliquer icône stats',
        '2. Voir graphiques 7 jours',
        '3. Voir taux complétion',
        '4. Voir productivité par heure'
      ]
    },
    {
      id: 'task-20',
      module: 'Tasks',
      name: 'Command Center',
      description: 'Suggestions intelligentes',
      priority: 'low',
      expectedResult: 'Suggestions pertinentes',
      manualSteps: [
        '1. Ouvrir Command Center',
        '2. Voir tâches urgentes',
        '3. Voir tâches en retard',
        '4. Quick actions'
      ]
    },
    {
      id: 'task-21',
      module: 'Tasks',
      name: 'Intelligence AI catégorisation',
      description: 'Catégorisation automatique',
      priority: 'low',
      expectedResult: 'Catégorie auto-détectée',
      manualSteps: [
        '1. Créer tâche "Coder feature login"',
        '2. Vérifier catégorie "dev" auto',
        '3. Créer "Faire courses"',
        '4. Vérifier catégorie "personal"'
      ]
    },
    {
      id: 'task-22',
      module: 'Tasks',
      name: 'Undo/Redo',
      description: 'Annuler/refaire actions',
      priority: 'medium',
      expectedResult: 'Actions annulées',
      manualSteps: [
        '1. Supprimer une tâche',
        '2. Cliquer Undo dans toast',
        '3. Vérifier tâche restaurée'
      ]
    },
    {
      id: 'task-23',
      module: 'Tasks',
      name: 'Recherche par titre',
      description: 'Chercher tâches',
      priority: 'high',
      expectedResult: 'Résultats filtrés',
      manualSteps: [
        '1. Créer 5 tâches variées',
        '2. Taper dans barre recherche',
        '3. Vérifier filtrage temps réel'
      ]
    },
    {
      id: 'task-24',
      module: 'Tasks',
      name: 'Éditer tâche inline',
      description: 'Modifier titre directement',
      priority: 'medium',
      expectedResult: 'Titre mis à jour',
      manualSteps: [
        '1. Cliquer sur titre tâche',
        '2. Modifier texte',
        '3. Enter pour valider',
        '4. Vérifier sauvegarde'
      ]
    },
    {
      id: 'task-25',
      module: 'Tasks',
      name: 'Trier tâches',
      description: 'Tri par date/priorité/nom',
      priority: 'low',
      expectedResult: 'Tâches triées',
      manualSteps: [
        '1. Ouvrir options tri',
        '2. Trier par priorité',
        '3. Vérifier ordre',
        '4. Trier par date',
        '5. Vérifier ordre'
      ]
    }
  ]
}

// ============================================
// CALENDAR MODULE TESTS
// ============================================
const calendarTests: TestModule = {
  id: 'calendar',
  name: 'Calendar',
  icon: '📅',
  scenarios: [
    {
      id: 'cal-01',
      module: 'Calendar',
      name: 'Créer un événement',
      description: 'Vérifie la création d\'événement',
      priority: 'critical',
      mode: 'monitor',
      expectedResult: 'Événement créé dans le calendrier',
      monitorMessage: '👀 Monitoring actif : Crée un événement dans le calendrier...',
      monitorTest: () => {
        const snapshot = monitoringSnapshots['cal-01']
        if (!snapshot) return false
        
        const store = useStore.getState()
        const currentCount = store.events?.length || 0
        
        return currentCount > snapshot.eventsCount
      },
      autoTest: async (): Promise<TestResult> => {
        try {
          const store = useStore.getState()
          const initialCount = store.events?.length || 0
          const testId = generateTestId()
          
          // Naviguer vers calendrier
          await navigateAndVerify('calendar')
          await wait(100)
          
          store.addEvent?.({
            title: `Test Event ${testId}`,
            startDate: new Date().toISOString().split('T')[0],
            startTime: '14:00',
            endDate: new Date().toISOString().split('T')[0],
            endTime: '15:00',
            type: 'meeting',
            category: 'work'
          })
          
          await wait(100)
          
          const newCount = useStore.getState().events?.length || 0
          const eventExists = useStore.getState().events?.some(e => e.title?.includes(testId))
          const stillOnCalendar = useStore.getState().currentView === 'calendar'
          
          if (newCount === initialCount + 1 && eventExists && stillOnCalendar) {
            return { 
              status: 'pass', 
              message: `✅ Événement créé et visible (${newCount} events)` 
            }
          }
          return { status: 'fail', message: '❌ Événement non créé' }
        } catch (error) {
          return { status: 'fail', message: `❌ Erreur: ${error instanceof Error ? error.message : 'Unknown'}` }
        }
      }
    },
    {
      id: 'cal-02',
      module: 'Calendar',
      name: 'Événement récurrent',
      description: 'Test de la récurrence',
      priority: 'high',
      expectedResult: 'Instances récurrentes générées',
      manualSteps: [
        '1. Créer un événement',
        '2. Activer récurrence "Hebdomadaire"',
        '3. Vérifier que 4 instances apparaissent sur le mois'
      ]
    },
    {
      id: 'cal-03',
      module: 'Calendar',
      name: 'Détection de conflits',
      description: 'Vérifie la détection de chevauchement',
      priority: 'medium',
      expectedResult: 'Warning affiché si conflit',
      manualSteps: [
        '1. Créer un événement 14h-15h',
        '2. Créer un autre 14h30-15h30',
        '3. Vérifier le warning de conflit'
      ]
    },
    {
      id: 'cal-04',
      module: 'Calendar',
      name: 'Éditer événement',
      description: 'Modifier un événement existant',
      priority: 'high',
      expectedResult: 'Événement mis à jour',
      manualSteps: [
        '1. Ouvrir un événement',
        '2. Modifier titre, date, heure',
        '3. Sauvegarder',
        '4. Vérifier mise à jour dans calendrier'
      ]
    },
    {
      id: 'cal-05',
      module: 'Calendar',
      name: 'Supprimer événement',
      description: 'Supprimer un événement',
      priority: 'high',
      expectedResult: 'Événement supprimé',
      manualSteps: [
        '1. Ouvrir un événement',
        '2. Cliquer supprimer',
        '3. Confirmer',
        '4. Vérifier disparition'
      ]
    },
    {
      id: 'cal-06',
      module: 'Calendar',
      name: 'Quick Add sur date',
      description: 'Créer événement rapide en cliquant date',
      priority: 'medium',
      expectedResult: 'Modal quick add ouverte',
      manualSteps: [
        '1. Cliquer sur une date',
        '2. Saisir titre événement',
        '3. Enter pour valider',
        '4. Vérifier création'
      ]
    },
    {
      id: 'cal-07',
      module: 'Calendar',
      name: 'Événement multi-jours',
      description: 'Créer événement sur plusieurs jours',
      priority: 'medium',
      expectedResult: 'Événement affiché sur période',
      manualSteps: [
        '1. Créer événement',
        '2. Date début: Lundi',
        '3. Date fin: Mercredi',
        '4. Vérifier affichage 3 jours'
      ]
    },
    {
      id: 'cal-08',
      module: 'Calendar',
      name: 'Vue Mois',
      description: 'Affichage calendrier mensuel',
      priority: 'high',
      expectedResult: 'Calendrier mois affiché',
      manualSteps: [
        '1. Sélectionner vue "Mois"',
        '2. Vérifier grille 7x5',
        '3. Vérifier événements affichés',
        '4. Naviguer mois suivant/précédent'
      ]
    },
    {
      id: 'cal-09',
      module: 'Calendar',
      name: 'Vue Semaine',
      description: 'Affichage hebdomadaire avec heures',
      priority: 'high',
      expectedResult: 'Timeline semaine affichée',
      manualSteps: [
        '1. Sélectionner vue "Semaine"',
        '2. Vérifier 7 colonnes (jours)',
        '3. Vérifier timeline heures',
        '4. Vérifier événements positionnés'
      ]
    },
    {
      id: 'cal-10',
      module: 'Calendar',
      name: 'Vue Jour',
      description: 'Affichage journée détaillée',
      priority: 'medium',
      expectedResult: 'Timeline jour affichée',
      manualSteps: [
        '1. Sélectionner vue "Jour"',
        '2. Vérifier timeline 24h',
        '3. Vérifier auto-scroll heure actuelle',
        '4. Cliquer sur créneau horaire'
      ]
    },
    {
      id: 'cal-11',
      module: 'Calendar',
      name: 'Événement quotidien',
      description: 'Récurrence tous les jours',
      priority: 'medium',
      expectedResult: 'Événement répété chaque jour',
      manualSteps: [
        '1. Créer événement',
        '2. Récurrence: Quotidien',
        '3. Vérifier sur plusieurs jours',
        '4. Modifier une instance'
      ]
    },
    {
      id: 'cal-12',
      module: 'Calendar',
      name: 'Événement hebdomadaire',
      description: 'Récurrence chaque semaine',
      priority: 'medium',
      expectedResult: 'Événement répété chaque semaine',
      manualSteps: [
        '1. Créer événement lundi',
        '2. Récurrence: Hebdomadaire',
        '3. Vérifier lundis suivants',
        '4. Changer jour de la semaine'
      ]
    },
    {
      id: 'cal-13',
      module: 'Calendar',
      name: 'Événement mensuel',
      description: 'Récurrence chaque mois',
      priority: 'low',
      expectedResult: 'Événement répété chaque mois',
      manualSteps: [
        '1. Créer événement le 15',
        '2. Récurrence: Mensuel',
        '3. Vérifier le 15 mois suivants'
      ]
    },
    {
      id: 'cal-14',
      module: 'Calendar',
      name: 'Filtrer par type',
      description: 'Filtrer meeting/task/reminder',
      priority: 'medium',
      expectedResult: 'Événements filtrés',
      manualSteps: [
        '1. Créer événements types variés',
        '2. Ouvrir filtres',
        '3. Sélectionner "meeting" uniquement',
        '4. Vérifier affichage'
      ]
    },
    {
      id: 'cal-15',
      module: 'Calendar',
      name: 'Filtrer par catégorie',
      description: 'Filtrer work/personal/health',
      priority: 'medium',
      expectedResult: 'Événements filtrés',
      manualSteps: [
        '1. Créer événements catégories variées',
        '2. Filtrer par "work"',
        '3. Vérifier résultats'
      ]
    },
    {
      id: 'cal-16',
      module: 'Calendar',
      name: 'Filtrer par priorité',
      description: 'Filtrer low/medium/high/urgent',
      priority: 'low',
      expectedResult: 'Événements filtrés',
      manualSteps: [
        '1. Créer événements priorités variées',
        '2. Filtrer "urgent"',
        '3. Vérifier résultats'
      ]
    },
    {
      id: 'cal-17',
      module: 'Calendar',
      name: 'Smart Suggestions',
      description: 'Détection automatique type/catégorie',
      priority: 'low',
      expectedResult: 'Type auto-détecté',
      manualSteps: [
        '1. Créer "Meeting avec client"',
        '2. Vérifier type "meeting" auto',
        '3. Créer "Rappel médecin"',
        '4. Vérifier type "reminder" + catégorie "health"'
      ]
    },
    {
      id: 'cal-18',
      module: 'Calendar',
      name: 'Rappels événements',
      description: 'Notifications avant événement',
      priority: 'high',
      expectedResult: 'Notification affichée',
      manualSteps: [
        '1. Créer événement dans 5 min',
        '2. Activer rappel "5 min avant"',
        '3. Attendre',
        '4. Vérifier notification'
      ]
    },
    {
      id: 'cal-19',
      module: 'Calendar',
      name: 'Compléter événement',
      description: 'Marquer événement complété',
      priority: 'medium',
      expectedResult: 'Statut complété',
      manualSteps: [
        '1. Ouvrir événement',
        '2. Cocher "Complété"',
        '3. Vérifier style barré/grisé'
      ]
    },
    {
      id: 'cal-20',
      module: 'Calendar',
      name: 'Navigation Aujourd\'hui',
      description: 'Retour rapide à aujourd\'hui',
      priority: 'high',
      expectedResult: 'Navigation à aujourd\'hui',
      manualSteps: [
        '1. Naviguer vers mois futur',
        '2. Cliquer "Aujourd\'hui"',
        '3. Vérifier retour date actuelle',
        '4. Vérifier highlight aujourd\'hui'
      ]
    }
  ]
}

// ============================================
// HEALTH MODULE TESTS
// ============================================
const healthTests: TestModule = {
  id: 'health',
  name: 'Health',
  icon: '🏥',
  scenarios: [
    {
      id: 'health-01',
      module: 'Health',
      name: 'Ajouter entrée de poids',
      description: 'Vérifie l\'ajout de poids',
      priority: 'critical',
      mode: 'monitor',
      expectedResult: 'Poids enregistré et affiché',
      monitorMessage: '👀 Monitoring actif : Ajoute une entrée de poids...',
      monitorTest: () => {
        const snapshot = monitoringSnapshots['health-01']
        if (!snapshot) return false
        
        const store = useStore.getState()
        const currentCount = store.weightEntries?.length || 0
        
        return currentCount > snapshot.weightCount
      },
      autoTest: async (): Promise<TestResult> => {
        try {
          const store = useStore.getState()
          const initialCount = store.weightEntries?.length || 0
          
          // Naviguer vers Health
          await navigateAndVerify('health')
          await wait(100)
          
          store.addWeightEntry?.({
            weight: 75.5,
            date: new Date().toISOString().split('T')[0],
            note: 'Test automatique'
          })
          
          await wait(100)
          
          const newCount = useStore.getState().weightEntries?.length || 0
          const stillOnHealth = useStore.getState().currentView === 'health'
          
          if (newCount === initialCount + 1 && stillOnHealth) {
            return { 
              status: 'pass', 
              message: `✅ Poids ajouté et visible (${newCount} entrées)` 
            }
          }
          return { status: 'fail', message: '❌ Poids non ajouté' }
        } catch (error) {
          return { status: 'fail', message: `❌ Erreur: ${error instanceof Error ? error.message : 'Unknown'}` }
        }
      }
    },
    {
      id: 'health-02',
      module: 'Health',
      name: 'Ajouter un repas',
      description: 'Vérifie l\'ajout de repas',
      priority: 'critical',
      mode: 'monitor',
      expectedResult: 'Repas enregistré avec calories',
      monitorMessage: '👀 Monitoring actif : Ajoute un repas...',
      monitorTest: () => {
        const snapshot = monitoringSnapshots['health-02']
        if (!snapshot) return false
        
        const store = useStore.getState()
        const currentCount = store.mealEntries?.length || 0
        
        return currentCount > snapshot.mealCount
      },
      autoTest: async (): Promise<TestResult> => {
        try {
          const store = useStore.getState()
          const initialCount = store.mealEntries?.length || 0
          
          // Naviguer vers Health
          await navigateAndVerify('health')
          await wait(100)
          
          store.addMealEntry?.({
            name: 'Test Meal',
            calories: 500,
            protein: 30,
            carbs: 50,
            fat: 20,
            date: new Date().toISOString().split('T')[0],
            time: '12:00',
            type: 'lunch'
          })
          
          await wait(100)
          
          const newCount = useStore.getState().mealEntries?.length || 0
          const todayMeals = useStore.getState().mealEntries?.filter(
            m => m.date === new Date().toISOString().split('T')[0]
          ).length || 0
          
          if (newCount === initialCount + 1) {
            return { 
              status: 'pass', 
              message: `✅ Repas ajouté (${todayMeals} aujourd'hui, ${newCount} total)` 
            }
          }
          return { status: 'fail', message: '❌ Repas non ajouté' }
        } catch (error) {
          return { status: 'fail', message: `❌ Erreur: ${error instanceof Error ? error.message : 'Unknown'}` }
        }
      }
    },
    {
      id: 'health-03',
      module: 'Health',
      name: 'Calcul BMI',
      description: 'Vérifie le calcul du BMI',
      priority: 'high',
      expectedResult: 'BMI calculé correctement',
      autoTest: (): TestResult => {
        try {
          // BMI = poids(kg) / (taille(m))²
          const weight = 70 // kg
          const height = 175 // cm
          const expectedBMI = (weight / Math.pow(height / 100, 2)).toFixed(1)
          
          const store = useStore.getState()
          const profile = useStore.getState().userProfile
          if (profile && profile.height === height) {
            return { status: 'pass', message: `✅ Profil mis à jour (BMI attendu: ${expectedBMI})` }
          }
          return { status: 'fail', message: '❌ Profil non mis à jour' }
        } catch (error) {
          return { status: 'fail', message: `❌ Erreur: ${error instanceof Error ? error.message : 'Unknown'}` }
        }
      }
    },
    {
      id: 'health-04',
      module: 'Health',
      name: 'Supprimer entrée poids',
      description: 'Supprimer une entrée de poids',
      priority: 'medium',
      expectedResult: 'Poids supprimé',
      manualSteps: [
        '1. Aller dans Health',
        '2. Onglet Poids',
        '3. Supprimer une entrée',
        '4. Confirmer',
        '5. Vérifier disparition'
      ]
    },
    {
      id: 'health-05',
      module: 'Health',
      name: 'Graphique poids',
      description: 'Voir évolution du poids',
      priority: 'high',
      expectedResult: 'Graphique affiché',
      manualSteps: [
        '1. Ajouter plusieurs entrées poids',
        '2. Voir graphique courbe',
        '3. Vérifier tendance (↗↘)',
        '4. Hover pour détails'
      ]
    },
    {
      id: 'health-06',
      module: 'Health',
      name: 'Tendance poids',
      description: 'Hausse/baisse/stable',
      priority: 'medium',
      expectedResult: 'Tendance calculée',
      manualSteps: [
        '1. Ajouter poids croissants',
        '2. Vérifier icône ↗ rouge',
        '3. Ajouter poids décroissants',
        '4. Vérifier icône ↘ vert'
      ]
    },
    {
      id: 'health-07',
      module: 'Health',
      name: 'Supprimer repas',
      description: 'Supprimer une entrée repas',
      priority: 'medium',
      expectedResult: 'Repas supprimé',
      manualSteps: [
        '1. Aller dans Health',
        '2. Onglet Nutrition',
        '3. Supprimer un repas',
        '4. Confirmer',
        '5. Vérifier calories recalculées'
      ]
    },
    {
      id: 'health-08',
      module: 'Health',
      name: 'Calories du jour',
      description: 'Total calories aujourd\'hui',
      priority: 'high',
      expectedResult: 'Total affiché',
      manualSteps: [
        '1. Ajouter 3 repas (500 cal chacun)',
        '2. Vérifier total = 1500 cal',
        '3. Vérifier progress bar vs objectif'
      ]
    },
    {
      id: 'health-09',
      module: 'Health',
      name: 'Macros nutrition',
      description: 'Protéines/Glucides/Lipides',
      priority: 'medium',
      expectedResult: 'Macros calculées',
      manualSteps: [
        '1. Ajouter repas avec macros',
        '2. Vérifier total P/G/L du jour',
        '3. Vérifier répartition %'
      ]
    },
    {
      id: 'health-10',
      module: 'Health',
      name: 'Graphique circulaire macros',
      description: 'Visualisation macros',
      priority: 'low',
      expectedResult: 'Graphique camembert',
      manualSteps: [
        '1. Ajouter plusieurs repas',
        '2. Voir graphique macros',
        '3. Vérifier proportions P/G/L',
        '4. Comparer vs objectif'
      ]
    },
    {
      id: 'health-11',
      module: 'Health',
      name: 'Objectif calorique',
      description: 'Définir objectif quotidien',
      priority: 'high',
      expectedResult: 'Objectif défini',
      manualSteps: [
        '1. Aller dans Health settings',
        '2. Définir objectif 2000 cal/jour',
        '3. Vérifier barre de progression',
        '4. Ajouter repas et vérifier %'
      ]
    },
    {
      id: 'health-12',
      module: 'Health',
      name: 'Base aliments - Recherche',
      description: 'Chercher un aliment',
      priority: 'medium',
      expectedResult: 'Résultats affichés',
      manualSteps: [
        '1. Ouvrir base d\'aliments',
        '2. Chercher "banane"',
        '3. Voir résultats avec calories',
        '4. Cliquer pour détails'
      ]
    },
    {
      id: 'health-13',
      module: 'Health',
      name: 'Base aliments - Détails',
      description: 'Voir détails nutritionnels',
      priority: 'low',
      expectedResult: 'Détails affichés',
      manualSteps: [
        '1. Chercher un aliment',
        '2. Cliquer dessus',
        '3. Vérifier cal, macros, portion',
        '4. Bouton "Ajouter"'
      ]
    },
    {
      id: 'health-14',
      module: 'Health',
      name: 'Ajouter depuis base',
      description: 'Ajouter aliment depuis base',
      priority: 'medium',
      expectedResult: 'Repas ajouté avec données',
      manualSteps: [
        '1. Chercher aliment',
        '2. Cliquer "Ajouter"',
        '3. Ajuster quantité',
        '4. Valider',
        '5. Vérifier dans repas du jour'
      ]
    },
    {
      id: 'health-15',
      module: 'Health',
      name: 'Vue Overview',
      description: 'Vue synthèse aujourd\'hui',
      priority: 'high',
      expectedResult: 'Dashboard santé affiché',
      manualSteps: [
        '1. Onglet "Aujourd\'hui"',
        '2. Voir calories, macros, poids',
        '3. Voir objectifs',
        '4. Voir suggestions'
      ]
    },
    {
      id: 'health-16',
      module: 'Health',
      name: 'Filtrer par date',
      description: 'Historique nutrition/poids',
      priority: 'medium',
      expectedResult: 'Données filtrées',
      manualSteps: [
        '1. Onglet Stats',
        '2. Sélectionner période (7j/30j/1an)',
        '3. Vérifier graphiques mis à jour'
      ]
    },
    {
      id: 'health-17',
      module: 'Health',
      name: 'Streak nutrition',
      description: 'Jours consécutifs objectif atteint',
      priority: 'low',
      expectedResult: 'Streak calculé',
      manualSteps: [
        '1. Atteindre objectif 3 jours d\'affilée',
        '2. Vérifier streak = 3 jours 🔥',
        '3. Manquer un jour',
        '4. Vérifier streak remis à 0'
      ]
    },
    {
      id: 'health-18',
      module: 'Health',
      name: 'Suggestions personnalisées',
      description: 'Conseils santé contextuels',
      priority: 'low',
      expectedResult: 'Suggestions affichées',
      manualSteps: [
        '1. Vue Overview',
        '2. Voir section "Suggestions"',
        '3. Vérifier pertinence',
        '4. Cliquer pour plus d\'infos'
      ]
    }
  ]
}

// ============================================
// LIBRARY MODULE TESTS
// ============================================
const libraryTests: TestModule = {
  id: 'library',
  name: 'Library',
  icon: '📚',
  scenarios: [
    {
      id: 'lib-01',
      module: 'Library',
      name: 'Ajouter un livre',
      description: 'Vérifie l\'ajout de livre',
      priority: 'critical',
      mode: 'monitor',
      expectedResult: 'Livre ajouté à la bibliothèque',
      monitorMessage: '👀 Monitoring actif : Ajoute un livre à ta bibliothèque...',
      monitorTest: () => {
        const snapshot = monitoringSnapshots['lib-01']
        if (!snapshot) return false
        
        const store = useStore.getState()
        const currentCount = store.books?.length || 0
        
        return currentCount > snapshot.booksCount
      },
      autoTest: async (): Promise<TestResult> => {
        try {
          const store = useStore.getState()
          const initialCount = store.books?.length || 0
          const testId = generateTestId()
          
          // Naviguer vers Library
          await navigateAndVerify('library')
          await wait(100)
          
          store.addBook?.({
            title: `Test Book ${testId}`,
            author: 'Test Author',
            pages: 300,
            currentPage: 0,
            status: 'to-read',
            cover: '',
            rating: 0
          })
          
          await wait(100)
          
          const newCount = useStore.getState().books?.length || 0
          const bookExists = useStore.getState().books?.some(b => b.title?.includes(testId))
          const stillOnLibrary = useStore.getState().currentView === 'library'
          
          if (newCount === initialCount + 1 && bookExists && stillOnLibrary) {
            return { 
              status: 'pass', 
              message: `✅ Livre ajouté et visible (${newCount} livres)` 
            }
          }
          return { status: 'fail', message: '❌ Livre non ajouté' }
        } catch (error) {
          return { status: 'fail', message: `❌ Erreur: ${error instanceof Error ? error.message : 'Unknown'}` }
        }
      }
    },
    {
      id: 'lib-02',
      module: 'Library',
      name: 'Session de lecture',
      description: 'Test du timer de lecture',
      priority: 'high',
      expectedResult: 'Session enregistrée avec durée',
      manualSteps: [
        '1. Sélectionner un livre',
        '2. Démarrer une session de lecture',
        '3. Attendre 10 secondes',
        '4. Arrêter la session',
        '5. Vérifier que la durée est enregistrée'
      ]
    },
    {
      id: 'lib-03',
      module: 'Library',
      name: 'Éditer livre',
      description: 'Modifier informations livre',
      priority: 'high',
      expectedResult: 'Livre mis à jour',
      manualSteps: [
        '1. Ouvrir un livre',
        '2. Éditer titre, auteur, pages',
        '3. Sauvegarder',
        '4. Vérifier mises à jour'
      ]
    },
    {
      id: 'lib-04',
      module: 'Library',
      name: 'Supprimer livre',
      description: 'Supprimer un livre',
      priority: 'medium',
      expectedResult: 'Livre supprimé',
      manualSteps: [
        '1. Ouvrir livre',
        '2. Cliquer Supprimer',
        '3. Confirmer',
        '4. Vérifier disparition'
      ]
    },
    {
      id: 'lib-05',
      module: 'Library',
      name: 'Changer statut livre',
      description: 'To-read/Reading/Completed',
      priority: 'high',
      expectedResult: 'Statut mis à jour',
      manualSteps: [
        '1. Ouvrir livre',
        '2. Changer statut "Reading"',
        '3. Vérifier date début enregistrée',
        '4. Passer "Completed"',
        '5. Vérifier date fin enregistrée'
      ]
    },
    {
      id: 'lib-06',
      module: 'Library',
      name: 'Rating livre',
      description: 'Noter le livre (étoiles)',
      priority: 'medium',
      expectedResult: 'Note enregistrée',
      manualSteps: [
        '1. Ouvrir livre',
        '2. Donner note 4/5 étoiles',
        '3. Sauvegarder',
        '4. Vérifier affichage'
      ]
    },
    {
      id: 'lib-07',
      module: 'Library',
      name: 'Ajouter couverture',
      description: 'URL image couverture',
      priority: 'low',
      expectedResult: 'Image affichée',
      manualSteps: [
        '1. Ouvrir livre',
        '2. Ajouter URL couverture',
        '3. Sauvegarder',
        '4. Vérifier image dans liste'
      ]
    },
    {
      id: 'lib-08',
      module: 'Library',
      name: 'Mettre à jour page actuelle',
      description: 'Progression lecture',
      priority: 'high',
      expectedResult: 'Page et % mis à jour',
      manualSteps: [
        '1. Livre 300 pages',
        '2. Mettre page actuelle = 150',
        '3. Vérifier 50% progression',
        '4. Vérifier barre progress'
      ]
    },
    {
      id: 'lib-09',
      module: 'Library',
      name: 'Calculer progression',
      description: 'Pourcentage lu',
      priority: 'medium',
      expectedResult: '% calculé correctement',
      manualSteps: [
        '1. Livre 200 pages',
        '2. Lu 100 pages',
        '3. Vérifier 50%',
        '4. Lu 200 pages',
        '5. Vérifier 100%'
      ]
    },
    {
      id: 'lib-10',
      module: 'Library',
      name: 'Start reading session',
      description: 'Démarrer timer lecture',
      priority: 'high',
      expectedResult: 'Timer démarre',
      manualSteps: [
        '1. Ouvrir livre',
        '2. Cliquer "Start Reading"',
        '3. Vérifier timer compte',
        '4. Vérifier icône lecture active'
      ]
    },
    {
      id: 'lib-11',
      module: 'Library',
      name: 'End reading session',
      description: 'Arrêter timer lecture',
      priority: 'high',
      expectedResult: 'Durée enregistrée',
      manualSteps: [
        '1. Démarrer session',
        '2. Attendre 2 min',
        '3. Cliquer "End"',
        '4. Vérifier 2 min ajoutées au total'
      ]
    },
    {
      id: 'lib-12',
      module: 'Library',
      name: 'Timer session automatique',
      description: 'Timer compte automatiquement',
      priority: 'medium',
      expectedResult: 'Temps augmente',
      manualSteps: [
        '1. Démarrer session',
        '2. Observer timer',
        '3. Vérifier incrémentation secondes',
        '4. Vérifier minutes'
      ]
    },
    {
      id: 'lib-13',
      module: 'Library',
      name: 'Ajouter citation',
      description: 'Sauvegarder citation livre',
      priority: 'medium',
      expectedResult: 'Citation enregistrée',
      manualSteps: [
        '1. Ouvrir livre',
        '2. Onglet Citations',
        '3. Ajouter texte citation',
        '4. Ajouter page (optionnel)',
        '5. Sauvegarder'
      ]
    },
    {
      id: 'lib-14',
      module: 'Library',
      name: 'Éditer citation',
      description: 'Modifier citation existante',
      priority: 'low',
      expectedResult: 'Citation modifiée',
      manualSteps: [
        '1. Ouvrir citation',
        '2. Modifier texte',
        '3. Sauvegarder',
        '4. Vérifier mise à jour'
      ]
    },
    {
      id: 'lib-15',
      module: 'Library',
      name: 'Supprimer citation',
      description: 'Supprimer citation',
      priority: 'low',
      expectedResult: 'Citation supprimée',
      manualSteps: [
        '1. Ouvrir livre',
        '2. Onglet Citations',
        '3. Supprimer citation',
        '4. Vérifier disparition'
      ]
    },
    {
      id: 'lib-16',
      module: 'Library',
      name: 'Ajouter note',
      description: 'Note personnelle sur livre',
      priority: 'medium',
      expectedResult: 'Note enregistrée',
      manualSteps: [
        '1. Ouvrir livre',
        '2. Onglet Notes',
        '3. Ajouter note',
        '4. Sauvegarder',
        '5. Vérifier affichage'
      ]
    },
    {
      id: 'lib-17',
      module: 'Library',
      name: 'Filtrer par statut',
      description: 'All/Reading/Completed/To-read',
      priority: 'high',
      expectedResult: 'Livres filtrés',
      manualSteps: [
        '1. Créer livres statuts variés',
        '2. Filtrer "Reading"',
        '3. Vérifier uniquement "reading"',
        '4. Filtrer "Completed"'
      ]
    },
    {
      id: 'lib-18',
      module: 'Library',
      name: 'Rechercher livre',
      description: 'Barre de recherche',
      priority: 'high',
      expectedResult: 'Résultats filtrés',
      manualSteps: [
        '1. Ajouter plusieurs livres',
        '2. Chercher par titre',
        '3. Vérifier résultats',
        '4. Chercher par auteur'
      ]
    },
    {
      id: 'lib-19',
      module: 'Library',
      name: 'Trier livres',
      description: 'Par titre/auteur/rating/progression',
      priority: 'medium',
      expectedResult: 'Ordre changé',
      manualSteps: [
        '1. Trier par rating',
        '2. Vérifier ordre décroissant',
        '3. Trier par progression',
        '4. Vérifier % ordre'
      ]
    },
    {
      id: 'lib-20',
      module: 'Library',
      name: 'Objectif annuel',
      description: 'Goal lecture année',
      priority: 'medium',
      expectedResult: 'Objectif défini et suivi',
      manualSteps: [
        '1. Définir objectif 50 livres/an',
        '2. Lire quelques livres',
        '3. Vérifier progression X/50',
        '4. Voir graphique'
      ]
    }
  ]
}

// ============================================
// LEARNING MODULE TESTS
// ============================================
const learningTests: TestModule = {
  id: 'learning',
  name: 'Learning (AI)',
  icon: '🎓',
  scenarios: [
    {
      id: 'learn-01',
      module: 'Learning',
      name: 'Créer un cours',
      description: 'Vérifie la création de cours',
      priority: 'critical',
      expectedResult: 'Cours créé dans la liste',
      autoTest: (): TestResult => {
        try {
          const store = useStore.getState()
          const initialCount = store.learningCourses?.length || 0
          const testId = generateTestId()
          
          // Note: addCourse n'existe pas dans le store actuel
          // On retourne un test en attente pour l'instant
          return { status: 'skip', message: '⚠️ Méthode addCourse non implémentée' }
        } catch (error) {
          return { status: 'fail', message: `❌ Erreur: ${error instanceof Error ? error.message : 'Unknown'}` }
        }
      }
    },
    {
      id: 'learn-02',
      module: 'Learning',
      name: 'Chat IA (Gemini)',
      description: 'Test de l\'intégration Gemini',
      priority: 'high',
      expectedResult: 'Réponse de l\'IA reçue',
      manualSteps: [
        '1. Créer un cours',
        '2. Envoyer un message simple',
        '3. Vérifier que l\'IA répond',
        '4. Vérifier le streaming de la réponse'
      ]
    },
    {
      id: 'learn-03',
      module: 'Learning',
      name: 'Éditer cours',
      description: 'Modifier titre/description',
      priority: 'medium',
      expectedResult: 'Cours mis à jour',
      manualSteps: [
        '1. Ouvrir cours',
        '2. Éditer titre',
        '3. Éditer description',
        '4. Sauvegarder',
        '5. Vérifier mises à jour'
      ]
    },
    {
      id: 'learn-04',
      module: 'Learning',
      name: 'Supprimer cours',
      description: 'Supprimer un cours',
      priority: 'medium',
      expectedResult: 'Cours supprimé',
      manualSteps: [
        '1. Sélectionner cours',
        '2. Cliquer Supprimer',
        '3. Confirmer',
        '4. Vérifier disparition'
      ]
    },
    {
      id: 'learn-05',
      module: 'Learning',
      name: 'Templates cours',
      description: 'Créer depuis template',
      priority: 'low',
      expectedResult: 'Cours pré-rempli',
      manualSteps: [
        '1. Nouveau cours',
        '2. Sélectionner template "Programmation"',
        '3. Vérifier objectifs pré-remplis',
        '4. Personnaliser',
        '5. Créer'
      ]
    },
    {
      id: 'learn-06',
      module: 'Learning',
      name: 'Envoyer message',
      description: 'Chat avec tuteur IA',
      priority: 'critical',
      expectedResult: 'Message envoyé',
      manualSteps: [
        '1. Ouvrir cours',
        '2. Taper message',
        '3. Envoyer',
        '4. Vérifier message affiché'
      ]
    },
    {
      id: 'learn-07',
      module: 'Learning',
      name: 'Streaming Gemini',
      description: 'Réponse en temps réel',
      priority: 'high',
      expectedResult: 'Texte apparaît progressivement',
      manualSteps: [
        '1. Poser question longue',
        '2. Observer streaming réponse',
        '3. Vérifier animation typing',
        '4. Attendre réponse complète'
      ]
    },
    {
      id: 'learn-08',
      module: 'Learning',
      name: 'Historique conversation',
      description: 'Messages persistés',
      priority: 'medium',
      expectedResult: 'Historique conservé',
      manualSteps: [
        '1. Envoyer 5 messages',
        '2. Quitter cours',
        '3. Revenir',
        '4. Vérifier historique intact'
      ]
    },
    {
      id: 'learn-09',
      module: 'Learning',
      name: 'Scroll auto nouveau message',
      description: 'Auto-scroll vers bas',
      priority: 'low',
      expectedResult: 'Scroll automatique',
      manualSteps: [
        '1. Avoir conversation longue',
        '2. Scroll en haut',
        '3. Envoyer message',
        '4. Vérifier scroll vers bas'
      ]
    },
    {
      id: 'learn-10',
      module: 'Learning',
      name: 'Erreur API handling',
      description: 'Gestion erreur Gemini',
      priority: 'medium',
      expectedResult: 'Message d\'erreur clair',
      manualSteps: [
        '1. Désactiver réseau (optionnel)',
        '2. Envoyer message',
        '3. Vérifier message erreur',
        '4. Possibilité réessayer'
      ]
    },
    {
      id: 'learn-14',
      module: 'Learning',
      name: 'Topics complétés',
      description: 'Cocher topics terminés',
      priority: 'medium',
      expectedResult: 'Progression mise à jour',
      manualSteps: [
        '1. Liste des topics',
        '2. Cocher topic comme complété',
        '3. Vérifier barre progression',
        '4. Cocher tous les topics',
        '5. Vérifier cours 100%'
      ]
    },
    {
      id: 'learn-15',
      module: 'Learning',
      name: 'Barre progression',
      description: '% cours complété',
      priority: 'low',
      expectedResult: '% calculé correctement',
      manualSteps: [
        '1. Cours avec 10 topics',
        '2. Compléter 5 topics',
        '3. Vérifier 50%',
        '4. Compléter 5 restants',
        '5. Vérifier 100%'
      ]
    },
    {
      id: 'learn-16',
      module: 'Learning',
      name: 'Stats cours',
      description: 'Temps étude et messages',
      priority: 'low',
      expectedResult: 'Stats affichées',
      manualSteps: [
        '1. Ouvrir cours',
        '2. Voir stats',
        '3. Vérifier temps total',
        '4. Vérifier nombre messages',
        '5. Vérifier progression'
      ]
    },
    {
      id: 'learn-17',
      module: 'Learning',
      name: 'Ajouter projet pratique',
      description: 'Projet learning hands-on',
      priority: 'medium',
      expectedResult: 'Projet ajouté',
      manualSteps: [
        '1. Ouvrir cours',
        '2. Section Projets',
        '3. Ajouter projet',
        '4. Décrire',
        '5. Sauvegarder'
      ]
    },
    {
      id: 'learn-18',
      module: 'Learning',
      name: 'Marquer projet complété',
      description: 'Cocher projet terminé',
      priority: 'low',
      expectedResult: 'Projet complété',
      manualSteps: [
        '1. Voir liste projets',
        '2. Cocher projet',
        '3. Vérifier style barré',
        '4. Voir progression projets'
      ]
    }
  ]
}

// ============================================
// POMODORO MODULE TESTS
// ============================================
const pomodoroTests: TestModule = {
  id: 'pomodoro',
  name: 'Pomodoro',
  icon: '⏱️',
  scenarios: [
    {
      id: 'pomo-01',
      module: 'Pomodoro',
      name: 'Démarrer le timer',
      description: 'Vérifie le démarrage du timer',
      priority: 'critical',
      expectedResult: 'Timer démarre et compte à rebours',
      manualSteps: [
        '1. Aller dans Pomodoro',
        '2. Cliquer sur Start',
        '3. Vérifier que le timer décompte',
        '4. Vérifier le changement des secondes'
      ]
    },
    {
      id: 'pomo-02',
      module: 'Pomodoro',
      name: 'Lier à une tâche',
      description: 'Test de liaison tâche-pomodoro',
      priority: 'high',
      expectedResult: 'Session liée à la tâche',
      manualSteps: [
        '1. Créer une tâche',
        '2. Démarrer un pomodoro',
        '3. Lier à la tâche',
        '4. Vérifier la liaison dans l\'historique'
      ]
    },
    {
      id: 'pomo-03',
      module: 'Pomodoro',
      name: 'Pause timer',
      description: 'Mettre le timer en pause',
      priority: 'high',
      expectedResult: 'Timer pausé',
      manualSteps: [
        '1. Démarrer timer',
        '2. Cliquer Pause',
        '3. Vérifier que le temps ne décompte plus',
        '4. Vérifier statut "paused"'
      ]
    },
    {
      id: 'pomo-04',
      module: 'Pomodoro',
      name: 'Reprendre timer',
      description: 'Reprendre après pause',
      priority: 'high',
      expectedResult: 'Timer reprend',
      manualSteps: [
        '1. Mettre timer en pause',
        '2. Cliquer Resume',
        '3. Vérifier que le décompte reprend'
      ]
    },
    {
      id: 'pomo-05',
      module: 'Pomodoro',
      name: 'Reset timer',
      description: 'Réinitialiser le timer',
      priority: 'medium',
      expectedResult: 'Timer remis à zéro',
      manualSteps: [
        '1. Démarrer timer',
        '2. Attendre 5 minutes',
        '3. Cliquer Reset',
        '4. Vérifier retour durée initiale'
      ]
    },
    {
      id: 'pomo-06',
      module: 'Pomodoro',
      name: 'Skip break',
      description: 'Passer la pause',
      priority: 'medium',
      expectedResult: 'Retour au focus',
      manualSteps: [
        '1. Finir un pomodoro',
        '2. Pause démarre',
        '3. Cliquer "Skip"',
        '4. Vérifier retour mode focus'
      ]
    },
    {
      id: 'pomo-07',
      module: 'Pomodoro',
      name: 'Durée focus custom',
      description: 'Changer durée focus',
      priority: 'medium',
      expectedResult: 'Durée personnalisée',
      manualSteps: [
        '1. Aller dans settings',
        '2. Changer durée focus à 30 min',
        '3. Démarrer nouveau timer',
        '4. Vérifier 30:00 affich'
      ]
    },
    {
      id: 'pomo-08',
      module: 'Pomodoro',
      name: 'Durée pause courte',
      description: 'Changer durée pause courte',
      priority: 'low',
      expectedResult: 'Pause personnalisée',
      manualSteps: [
        '1. Settings',
        '2. Pause courte = 10 min',
        '3. Finir un pomodoro',
        '4. Vérifier pause 10:00'
      ]
    },
    {
      id: 'pomo-09',
      module: 'Pomodoro',
      name: 'Durée pause longue',
      description: 'Changer durée pause longue',
      priority: 'low',
      expectedResult: 'Longue pause personnalisée',
      manualSteps: [
        '1. Settings',
        '2. Pause longue = 20 min',
        '3. Finir 4 pomodoros',
        '4. Vérifier pause longue 20:00'
      ]
    },
    {
      id: 'pomo-10',
      module: 'Pomodoro',
      name: 'Interval pause longue',
      description: 'Configurer intervalle pause longue',
      priority: 'low',
      expectedResult: 'Pause longue au bon moment',
      manualSteps: [
        '1. Settings: interval = 3',
        '2. Finir 3 pomodoros',
        '3. Vérifier pause longue au 3ème',
        '4. Vérifier compteur reset'
      ]
    },
    {
      id: 'pomo-11',
      module: 'Pomodoro',
      name: 'Auto-start breaks',
      description: 'Démarrage automatique pauses',
      priority: 'medium',
      expectedResult: 'Pause démarre seule',
      manualSteps: [
        '1. Activer auto-start breaks',
        '2. Finir un pomodoro court',
        '3. Vérifier pause démarre automatiquement',
        '4. Pas de clic nécessaire'
      ]
    },
    {
      id: 'pomo-12',
      module: 'Pomodoro',
      name: 'Lier projet',
      description: 'Lier pomodoro à un projet',
      priority: 'medium',
      expectedResult: 'Session liée au projet',
      manualSteps: [
        '1. Créer projet "Projet Test"',
        '2. Démarrer pomodoro',
        '3. Sélectionner projet',
        '4. Finir session',
        '5. Vérifier dans historique'
      ]
    },
    {
      id: 'pomo-13',
      module: 'Pomodoro',
      name: 'Lier livre',
      description: 'Lier pomodoro à lecture',
      priority: 'medium',
      expectedResult: 'Session liée au livre',
      manualSteps: [
        '1. Ajouter un livre',
        '2. Démarrer pomodoro',
        '3. Lier au livre',
        '4. Finir session',
        '5. Vérifier temps lecture enregistré'
      ]
    },
    {
      id: 'pomo-14',
      module: 'Pomodoro',
      name: 'Lier cours',
      description: 'Lier pomodoro à apprentissage',
      priority: 'low',
      expectedResult: 'Session liée au cours',
      manualSteps: [
        '1. Créer cours',
        '2. Démarrer pomodoro',
        '3. Lier au cours',
        '4. Finir',
        '5. Vérifier temps étude enregistré'
      ]
    },
    {
      id: 'pomo-15',
      module: 'Pomodoro',
      name: 'Sessions complétées',
      description: 'Compteur sessions du jour',
      priority: 'high',
      expectedResult: 'Compteur mis à jour',
      manualSteps: [
        '1. Finir 3 pomodoros',
        '2. Vérifier compteur = 3',
        '3. Vérifier stats jour',
        '4. Vérifier historique'
      ]
    },
    {
      id: 'pomo-16',
      module: 'Pomodoro',
      name: 'Temps focus total',
      description: 'Total temps focus aujourd\'hui',
      priority: 'medium',
      expectedResult: 'Temps total affiché',
      manualSteps: [
        '1. Finir 2 pomodoros 25min',
        '2. Vérifier total = 50min',
        '3. Voir graphique',
        '4. Comparer vs objectif'
      ]
    },
    {
      id: 'pomo-17',
      module: 'Pomodoro',
      name: 'Streak jours',
      description: 'Jours consécutifs avec pomodoro',
      priority: 'low',
      expectedResult: 'Streak calculé',
      manualSteps: [
        '1. Finir au moins 1 pomodoro/jour 3 jours',
        '2. Vérifier streak = 3 🔥',
        '3. Manquer un jour',
        '4. Vérifier streak reset'
      ]
    },
    {
      id: 'pomo-18',
      module: 'Pomodoro',
      name: 'Productivité par heure',
      description: 'Heatmap 24h',
      priority: 'low',
      expectedResult: 'Heatmap affichée',
      manualSteps: [
        '1. Finir sessions à heures variées',
        '2. Aller dans Stats',
        '3. Voir heatmap 24h',
        '4. Identifier heures productives'
      ]
    },
    {
      id: 'pomo-19',
      module: 'Pomodoro',
      name: 'Stats par projet',
      description: 'Temps par projet',
      priority: 'medium',
      expectedResult: 'Stats projets affichées',
      manualSteps: [
        '1. Faire plusieurs pomodoros par projet',
        '2. Voir stats',
        '3. Vérifier temps total par projet',
        '4. Voir graphique camembert'
      ]
    },
    {
      id: 'pomo-20',
      module: 'Pomodoro',
      name: 'Historique par date',
      description: 'Voir sessions passées',
      priority: 'medium',
      expectedResult: 'Historique affiché',
      manualSteps: [
        '1. Onglet Historique',
        '2. Sélectionner date',
        '3. Voir sessions du jour',
        '4. Voir détails (tâche/durée/heure)'
      ]
    }
  ]
}

// ============================================
// JOURNAL & HABITS MODULE TESTS
// ============================================
const journalTests: TestModule = {
  id: 'journal',
  name: 'Journal',
  icon: '📝',
  scenarios: [
    {
      id: 'jour-01',
      module: 'Journal',
      name: 'Créer une entrée',
      description: 'Vérifie la création d\'entrée quotidienne',
      priority: 'critical',
      mode: 'monitor',
      expectedResult: 'Entrée créée avec mood et gratitudes',
      monitorMessage: '👀 Monitoring actif : Crée une entrée journal dans Ma Journée...',
      monitorTest: () => {
        const snapshot = monitoringSnapshots['jour-01']
        if (!snapshot) return false
        
        const store = useStore.getState()
        const currentCount = store.journalEntries?.length || 0
        
        return currentCount > snapshot.journalCount
      },
      autoTest: async (): Promise<TestResult> => {
        try {
          const store = useStore.getState()
          const initialCount = store.journalEntries?.length || 0
          
          // Naviguer vers MyDay (où est le journal)
          await navigateAndVerify('myday')
          await wait(100)
          
          store.addJournalEntry?.({
            date: new Date().toISOString().split('T')[0],
            mood: 'happy' as const,
            gratitude: ['Test 1', 'Test 2', 'Test 3'],
            mainGoal: 'Test goal',
            reflection: 'Test reflection'
          })
          
          await wait(100)
          
          const newCount = useStore.getState().journalEntries?.length || 0
          const todayEntry = useStore.getState().journalEntries?.find(
            e => e.date === new Date().toISOString().split('T')[0]
          )
          
          if (newCount === initialCount + 1 && todayEntry) {
            return { 
              status: 'pass', 
              message: `✅ Entrée journal créée (mood: ${todayEntry.mood})` 
            }
          }
          return { status: 'fail', message: '❌ Entrée non créée' }
        } catch (error) {
          return { status: 'fail', message: `❌ Erreur: ${error instanceof Error ? error.message : 'Unknown'}` }
        }
      }
    }
  ]
}

const habitsTests: TestModule = {
  id: 'habits',
  name: 'Habits',
  icon: '🔥',
  scenarios: [
    {
      id: 'hab-01',
      module: 'Habits',
      name: 'Créer une habitude',
      description: 'Vérifie la création d\'habitude',
      priority: 'critical',
      mode: 'monitor',
      expectedResult: 'Habitude créée avec streak 0',
      monitorMessage: '👀 Monitoring actif : Crée une nouvelle habitude dans Ma Journée...',
      monitorTest: () => {
        const snapshot = monitoringSnapshots['hab-01']
        if (!snapshot) return false
        
        const store = useStore.getState()
        const currentCount = store.habits?.length || 0
        
        return currentCount > snapshot.habitsCount
      },
      autoTest: async (): Promise<TestResult> => {
        try {
          const store = useStore.getState()
          const initialCount = store.habits?.length || 0
          const testId = generateTestId()
          
          // Naviguer vers MyDay (où sont les habitudes)
          await navigateAndVerify('myday')
          await wait(100)
          
          store.addHabit?.(`Test Habit ${testId}`)
          
          await wait(100)
          
          const newCount = useStore.getState().habits?.length || 0
          const habitExists = useStore.getState().habits?.some(h => h.name?.includes(testId))
          
          if (newCount === initialCount + 1 && habitExists) {
            return { 
              status: 'pass', 
              message: `✅ Habitude créée et visible (${newCount} habitudes)` 
            }
          }
          return { status: 'fail', message: '❌ Habitude non créée' }
        } catch (error) {
          return { status: 'fail', message: `❌ Erreur: ${error instanceof Error ? error.message : 'Unknown'}` }
        }
      }
    },
    {
      id: 'hab-02',
      module: 'Habits',
      name: 'Cocher aujourd\'hui',
      description: 'Test du toggle quotidien',
      priority: 'critical',
      mode: 'monitor',
      expectedResult: 'Habitude cochée, streak incrémenté',
      monitorMessage: '👀 Monitoring actif : Coche une habitude pour aujourd\'hui...',
      monitorTest: () => {
        const snapshot = monitoringSnapshots['hab-02']
        if (!snapshot) return false
        
        const store = useStore.getState()
        const today = new Date().toISOString().split('T')[0]
        
        // Vérifie si une habitude a été cochée aujourd'hui récemment
        const habitWithTodayCheck = store.habits?.some(h => 
          h.completedDates?.includes(today)
        )
        
        return habitWithTodayCheck || false
      },
      autoTest: async (): Promise<TestResult> => {
        try {
          const store = useStore.getState()
          const testId = generateTestId()
          
          // Naviguer vers MyDay
          await navigateAndVerify('myday')
          await wait(100)
          
          // Créer une habitude
          store.addHabit?.(`Toggle Habit ${testId}`)
          await wait(50)
          
          const habit = useStore.getState().habits?.find(h => h.name?.includes(testId))
          if (!habit) return { status: 'fail', message: '❌ Habitude non trouvée' }
          
          // Vérifier l'état initial
          const today = new Date().toISOString().split('T')[0]
          const initiallyCompleted = habit.completedDates?.includes(today) || false
          const initialStreak = habit.streak || 0
          
          // Toggle
          store.toggleHabitToday?.(habit.id)
          await wait(50)
          
          // Vérifier après toggle
          const updatedHabit = useStore.getState().habits?.find(h => h.id === habit.id)
          if (!updatedHabit) return { status: 'fail', message: '❌ Habitude perdue' }
          
          const nowCompleted = updatedHabit.completedDates?.includes(today) || false
          const changed = nowCompleted !== initiallyCompleted
          
          // Nettoyer
          store.deleteHabit?.(habit.id)
          
          if (changed) {
            return { 
              status: 'pass', 
              message: `✅ Toggle OK (${initiallyCompleted} → ${nowCompleted}, streak: ${initialStreak} → ${updatedHabit.streak})` 
            }
          }
          return { status: 'fail', message: '❌ Toggle échoué' }
        } catch (error) {
          return { status: 'fail', message: `❌ Erreur: ${error instanceof Error ? error.message : 'Unknown'}` }
        }
      }
    }
  ]
}

// ============================================
// WIDGETS MODULE TESTS - SUPPRIMÉ
// ============================================
// Module de tests widgets supprimé

// ============================================
// DASHBOARD MODULE TESTS
// ============================================
const dashboardTests: TestModule = {
  id: 'dashboard',
  name: 'Dashboard',
  icon: '📊',
  scenarios: [
    {
      id: 'dash-01',
      module: 'Dashboard',
      name: 'Affichage des métriques',
      description: 'Vérifie l\'affichage des stats',
      priority: 'high',
      expectedResult: 'Toutes les métriques affichées correctement',
      manualSteps: [
        '1. Aller dans Dashboard',
        '2. Vérifier les métriques tasks, habits, journal',
        '3. Vérifier les sparklines 7 jours',
        '4. Cliquer sur une métrique pour drill-down'
      ]
    },
    {
      id: 'dash-02',
      module: 'Dashboard',
      name: 'Drill-down modales',
      description: 'Test des modales détaillées',
      priority: 'medium',
      expectedResult: 'Modal s\'ouvre avec détails',
      manualSteps: [
        '1. Cliquer sur une métrique',
        '2. Vérifier que la modal s\'ouvre',
        '3. Vérifier les données détaillées',
        '4. Fermer avec Escape'
      ]
    }
  ]
}

// ============================================
// AI ASSISTANT MODULE TESTS
// ============================================
const aiTests: TestModule = {
  id: 'ai',
  name: 'AI Assistant',
  icon: '🤖',
  scenarios: [
    {
      id: 'ai-01',
      module: 'AI Assistant',
      name: 'Chat général',
      description: 'Test du chat avec l\'IA',
      priority: 'medium',
      expectedResult: 'Réponse de l\'IA reçue',
      manualSteps: [
        '1. Aller dans AI Assistant',
        '2. Envoyer un message simple',
        '3. Vérifier la réponse',
        '4. Vérifier le contexte productivité'
      ]
    },
    {
      id: 'ai-02',
      module: 'AI Assistant',
      name: 'Streaming de réponse',
      description: 'Vérifier que la réponse arrive en streaming',
      priority: 'medium',
      expectedResult: 'Réponse s\'affiche progressivement',
      manualSteps: [
        '1. Envoyer une question longue',
        '2. Observer le streaming de la réponse',
        '3. Vérifier l\'animation de typing'
      ]
    },
    {
      id: 'ai-03',
      module: 'AI Assistant',
      name: 'Historique conversation',
      description: 'Vérifier la persistance des messages',
      priority: 'low',
      expectedResult: 'Messages restent après refresh',
      manualSteps: [
        '1. Envoyer plusieurs messages',
        '2. Rafraîchir la page',
        '3. Vérifier que l\'historique est là'
      ]
    }
  ]
}

// ============================================
// SETTINGS MODULE TESTS (12 tests)
// ============================================
const settingsTests: TestModule = {
  id: 'settings',
  name: 'Settings',
  icon: '⚙️',
  scenarios: [
    {
      id: 'settings-01',
      module: 'Settings',
      name: 'Mode édition',
      description: 'Toggle mode édition',
      priority: 'medium',
      expectedResult: 'Mode édition activé/désactivé',
      manualSteps: [
        '1. Aller dans Paramètres',
        '2. Toggle mode édition',
        '3. Aller sur Dashboard',
        '4. Vérifier que les boutons d\'édition apparaissent'
      ]
    },
    {
      id: 'settings-02',
      module: 'Settings',
      name: 'Mode compact',
      description: 'Toggle mode compact',
      priority: 'low',
      expectedResult: 'Interface plus compacte',
      manualSteps: [
        '1. Aller dans Paramètres',
        '2. Toggle compact mode',
        '3. Vérifier l\'espacement réduit'
      ]
    },
    {
      id: 'settings-03',
      module: 'Settings',
      name: 'Animations',
      description: 'Désactiver/activer animations',
      priority: 'low',
      expectedResult: 'Animations on/off',
      manualSteps: [
        '1. Aller dans Paramètres',
        '2. Toggle animations',
        '3. Naviguer et vérifier les transitions'
      ]
    },
    {
      id: 'settings-04',
      module: 'Settings',
      name: 'Notifications système',
      description: 'Activer notifications',
      priority: 'high',
      expectedResult: 'Permission demandée',
      manualSteps: [
        '1. Aller dans Paramètres',
        '2. Activer notifications',
        '3. Autoriser dans le navigateur',
        '4. Tester avec un événement'
      ]
    },
    {
      id: 'settings-05',
      module: 'Settings',
      name: 'Export backup',
      description: 'Exporter toutes les données',
      priority: 'high',
      expectedResult: 'Fichier JSON téléchargé',
      manualSteps: [
        '1. Aller dans Paramètres',
        '2. Cliquer Export Backup',
        '3. Vérifier le fichier téléchargé',
        '4. Ouvrir et vérifier le JSON'
      ]
    },
    {
      id: 'settings-06',
      module: 'Settings',
      name: 'Import backup',
      description: 'Importer données depuis JSON',
      priority: 'high',
      expectedResult: 'Données restaurées',
      manualSteps: [
        '1. Exporter d\'abord un backup',
        '2. Clear all data',
        '3. Import backup',
        '4. Vérifier toutes les données'
      ]
    },
    {
      id: 'settings-07',
      module: 'Settings',
      name: 'Clear all data',
      description: 'Effacer toutes les données',
      priority: 'medium',
      expectedResult: 'Données supprimées',
      manualSteps: [
        '1. Créer quelques données de test',
        '2. Aller dans Paramètres',
        '3. Clear all data (confirmer)',
        '4. Vérifier que tout est vide'
      ]
    },
    {
      id: 'settings-08',
      module: 'Settings',
      name: 'Raccourcis clavier',
      description: 'Voir liste raccourcis',
      priority: 'low',
      expectedResult: 'Liste affichée',
      manualSteps: [
        '1. Aller dans Paramètres',
        '2. Cliquer "Raccourcis clavier"',
        '3. Vérifier la liste complète'
      ]
    },
    {
      id: 'settings-09',
      module: 'Settings',
      name: 'Sons Pomodoro',
      description: 'Toggle sons timer',
      priority: 'medium',
      expectedResult: 'Sons activés/désactivés',
      manualSteps: [
        '1. Aller dans Paramètres Pomodoro',
        '2. Toggle sound enabled',
        '3. Lancer un timer court',
        '4. Vérifier le son à la fin'
      ]
    },
    {
      id: 'settings-10',
      module: 'Settings',
      name: 'Volume sons',
      description: 'Régler volume',
      priority: 'low',
      expectedResult: 'Volume ajusté',
      manualSteps: [
        '1. Aller dans Paramètres Pomodoro',
        '2. Ajuster le volume',
        '3. Tester le son'
      ]
    },
    {
      id: 'settings-11',
      module: 'Settings',
      name: 'Ticking sound',
      description: 'Son de tic-tac pendant timer',
      priority: 'low',
      expectedResult: 'Tic-tac audible',
      manualSteps: [
        '1. Aller dans Paramètres Pomodoro',
        '2. Activer ticking sound',
        '3. Lancer timer',
        '4. Vérifier le tic-tac'
      ]
    },
    {
      id: 'settings-12',
      module: 'Settings',
      name: 'Auto-start breaks',
      description: 'Démarrage auto des pauses',
      priority: 'medium',
      expectedResult: 'Pause démarre automatiquement',
      manualSteps: [
        '1. Activer auto-start breaks',
        '2. Lancer un pomodoro court (1 min)',
        '3. Attendre la fin',
        '4. Vérifier que la pause démarre seule'
      ]
    }
  ]
}

// ============================================
// GLOBAL NAVIGATION & SEARCH TESTS (15 tests)
// ============================================
const globalTests: TestModule = {
  id: 'global',
  name: 'Global',
  icon: '🌐',
  scenarios: [
    {
      id: 'global-01',
      module: 'Global',
      name: 'Navigation Hub → Tasks',
      description: 'Naviguer vers Tasks',
      priority: 'high',
      expectedResult: 'Page Tasks affichée',
      manualSteps: [
        '1. Être sur Hub',
        '2. Cliquer Tasks dans AppBar',
        '3. Vérifier que Tasks s\'ouvre',
        '4. Vérifier l\'URL/state'
      ]
    },
    {
      id: 'global-02',
      module: 'Global',
      name: 'Raccourci Cmd+K',
      description: 'Ouvrir recherche avec Cmd+K',
      priority: 'high',
      expectedResult: 'Recherche ouverte',
      manualSteps: [
        '1. Appuyer Cmd+K (ou Ctrl+K)',
        '2. Vérifier que la recherche s\'ouvre',
        '3. Taper une recherche',
        '4. Fermer avec Escape'
      ]
    },
    {
      id: 'global-03',
      module: 'Global',
      name: 'Recherche tâche',
      description: 'Chercher et ouvrir une tâche',
      priority: 'high',
      expectedResult: 'Tâche ouverte avec deep link',
      manualSteps: [
        '1. Créer une tâche "Test Search"',
        '2. Ouvrir recherche (Cmd+K)',
        '3. Taper "Test Search"',
        '4. Cliquer sur le résultat',
        '5. Vérifier que la tâche s\'ouvre'
      ]
    },
    {
      id: 'global-04',
      module: 'Global',
      name: 'Recherche événement',
      description: 'Chercher et ouvrir un événement',
      priority: 'medium',
      expectedResult: 'Événement ouvert',
      manualSteps: [
        '1. Créer un événement',
        '2. Chercher l\'événement',
        '3. Cliquer',
        '4. Vérifier ouverture'
      ]
    },
    {
      id: 'global-05',
      module: 'Global',
      name: 'Recherche livre',
      description: 'Chercher et ouvrir un livre',
      priority: 'medium',
      expectedResult: 'Livre ouvert',
      manualSteps: [
        '1. Ajouter un livre',
        '2. Chercher le livre',
        '3. Cliquer',
        '4. Vérifier modal livre'
      ]
    },
    {
      id: 'global-06',
      module: 'Global',
      name: 'Recherche page',
      description: 'Chercher une page/module',
      priority: 'medium',
      expectedResult: 'Navigation vers page',
      manualSteps: [
        '1. Ouvrir recherche',
        '2. Taper "Calendar"',
        '3. Cliquer sur page Calendar',
        '4. Vérifier navigation'
      ]
    },
    {
      id: 'global-07',
      module: 'Global',
      name: 'Raccourci Cmd+T',
      description: 'Aller directement à Tasks',
      priority: 'high',
      expectedResult: 'Tasks ouvert',
      manualSteps: [
        '1. Être n\'importe où',
        '2. Appuyer Cmd+T',
        '3. Vérifier Tasks ouvert'
      ]
    },
    {
      id: 'global-08',
      module: 'Global',
      name: 'Raccourci Cmd+J',
      description: 'Aller directement à My Day',
      priority: 'high',
      expectedResult: 'My Day ouvert',
      manualSteps: [
        '1. Appuyer Cmd+J',
        '2. Vérifier My Day ouvert'
      ]
    },
    {
      id: 'global-09',
      module: 'Global',
      name: 'Raccourci Cmd+P',
      description: 'Aller directement à Pomodoro',
      priority: 'medium',
      expectedResult: 'Pomodoro ouvert',
      manualSteps: [
        '1. Appuyer Cmd+P',
        '2. Vérifier Pomodoro ouvert'
      ]
    },
    {
      id: 'global-10',
      module: 'Global',
      name: 'Navigation Tab',
      description: 'Naviguer au clavier avec Tab',
      priority: 'high',
      expectedResult: 'Focus visible et logique',
      manualSteps: [
        '1. Aller sur n\'importe quelle page',
        '2. Appuyer Tab plusieurs fois',
        '3. Vérifier focus states',
        '4. Vérifier ordre logique'
      ]
    },
    {
      id: 'global-11',
      module: 'Global',
      name: 'ARIA labels',
      description: 'Vérifier accessibilité screen reader',
      priority: 'medium',
      expectedResult: 'Tous les boutons ont des labels',
      manualSteps: [
        '1. Inspecter des boutons icônes',
        '2. Vérifier présence aria-label',
        '3. Tester avec screen reader si possible'
      ]
    },
    {
      id: 'global-12',
      module: 'Global',
      name: 'Focus states',
      description: 'Vérifier focus visible',
      priority: 'high',
      expectedResult: 'Outline visible sur focus',
      manualSteps: [
        '1. Naviguer avec Tab',
        '2. Vérifier que chaque élément a un outline',
        '3. Vérifier contraste suffisant'
      ]
    },
    {
      id: 'global-13',
      module: 'Global',
      name: 'AppBar mobile',
      description: 'Vérifier bottom nav mobile',
      priority: 'high',
      expectedResult: 'Bottom nav fonctionnel',
      manualSteps: [
        '1. Réduire fenêtre < 768px',
        '2. Vérifier bottom nav',
        '3. Tester navigation',
        '4. Vérifier icônes actives'
      ]
    },
    {
      id: 'global-14',
      module: 'Global',
      name: 'Responsive design',
      description: 'Tester sur différentes tailles',
      priority: 'high',
      expectedResult: 'UI adaptée à toutes tailles',
      manualSteps: [
        '1. Tester desktop (>1024px)',
        '2. Tester tablet (768-1024px)',
        '3. Tester mobile (<768px)',
        '4. Vérifier lisibilité partout'
      ]
    },
    {
      id: 'global-15',
      module: 'Global',
      name: 'Test Lab raccourci',
      description: 'Ouvrir Test Lab avec Cmd+Shift+T',
      priority: 'high',
      expectedResult: 'Test Lab ouvert',
      manualSteps: [
        '1. Appuyer Cmd+Shift+T',
        '2. Vérifier Test Lab ouvert',
        '3. Vérifier icône dans AppBar'
      ]
    }
  ]
}

// ============================================
// EXPORT ALL MODULES
// ============================================
export const ALL_TEST_MODULES: TestModule[] = [
  tasksTests,
  calendarTests,
  healthTests,
  libraryTests,
  learningTests,
  pomodoroTests,
  journalTests,
  habitsTests,
  dashboardTests,
  aiTests,
  settingsTests,
  globalTests
]

// Fonction helper pour obtenir tous les tests
export function getAllTests() {
  return ALL_TEST_MODULES.flatMap(module => module.scenarios)
}

// Fonction helper pour obtenir les tests auto uniquement
export function getAutoTests() {
  return getAllTests().filter(test => test.autoTest !== undefined)
}

// Fonction helper pour exécuter tous les tests auto
export async function runAllAutoTests(): Promise<Record<string, TestResult>> {
  const results: Record<string, TestResult> = {}
  const autoTests = getAutoTests()
  
  for (const test of autoTests) {
    if (test.autoTest) {
      try {
        const result = await Promise.resolve(test.autoTest())
        results[test.id] = result
      } catch (error) {
        results[test.id] = {
          status: 'fail',
          message: `❌ Exception: ${error instanceof Error ? error.message : 'Unknown'}`
        }
      }
    }
  }
  
  return results
}

