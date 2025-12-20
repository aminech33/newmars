/**
 * 🧠 BRAIN - Intégration avec useStore
 * 
 * Ce fichier contient les fonctions pour intégrer le Brain
 * dans les actions du store sans modifier le store directement.
 * 
 * Usage: Importer et appeler ces fonctions après les actions du store
 */

import {
  observeTaskCreated,
  observeTaskCompleted,
  observeTaskDeleted,
  observeTaskMoved,
  observePomodoroCompleted,
  observePomodoroInterrupted,
  observeWeightAdded,
  observeMealAdded,
  observeWaterAdded,
  observeJournalWritten,
  observeMoodSet,
  observeHabitChecked,
  observeHabitUnchecked,
  observeBookStarted,
  observeBookFinished,
  observeReadingSession,
  observeCourseMessage,
  observeViewChanged,
} from './Observer'

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE PATTERN
// Wrapper pour les actions du store qui notifie le Brain
// ═══════════════════════════════════════════════════════════════

/**
 * Wrapper pour observer les changements de vue
 */
export function withViewObserver(setView: (view: string) => void, getCurrentView: () => string) {
  return (view: string) => {
    const from = getCurrentView()
    setView(view)
    observeViewChanged(from, view)
  }
}

/**
 * Notifie le Brain après création de tâche
 */
export function notifyTaskCreated(task: {
  id: string
  title: string
  category: string
  priority: string
}) {
  observeTaskCreated(task)
}

/**
 * Notifie le Brain après complétion de tâche
 */
export function notifyTaskCompleted(task: {
  id: string
  title: string
  duration?: number
}) {
  observeTaskCompleted(task)
}

/**
 * Notifie le Brain après suppression de tâche
 */
export function notifyTaskDeleted(taskId: string) {
  observeTaskDeleted(taskId)
}

/**
 * Notifie le Brain après déplacement de tâche (Kanban)
 */
export function notifyTaskMoved(taskId: string, from: string, to: string) {
  observeTaskMoved(taskId, from, to)
  
  // Si déplacé vers "done", c'est aussi une complétion
  if (to === 'done') {
    observeTaskCompleted({ id: taskId, title: '' })
  }
}

/**
 * Notifie le Brain après session Pomodoro
 */
export function notifyPomodoroCompleted(data: {
  taskId?: string
  duration: number
  actualDuration: number
}) {
  observePomodoroCompleted(data)
}

/**
 * Notifie le Brain après interruption Pomodoro
 */
export function notifyPomodoroInterrupted(data: {
  taskId?: string
  afterMinutes: number
}) {
  observePomodoroInterrupted(data)
}

/**
 * Notifie le Brain après ajout de poids
 */
export function notifyWeightAdded(weight: number) {
  observeWeightAdded(weight)
}

/**
 * Notifie le Brain après ajout de repas
 */
export function notifyMealAdded(data: { calories: number; type: string }) {
  observeMealAdded(data)
}

/**
 * Notifie le Brain après ajout d'eau
 */
export function notifyWaterAdded(ml: number) {
  observeWaterAdded(ml)
}

/**
 * Notifie le Brain après écriture journal
 */
export function notifyJournalWritten(data: { mood?: number; hasContent: boolean }) {
  observeJournalWritten(data)
  
  if (data.mood !== undefined) {
    observeMoodSet(data.mood)
  }
}

/**
 * Notifie le Brain après check/uncheck habitude
 */
export function notifyHabitToggled(habitId: string, habitName: string, checked: boolean) {
  if (checked) {
    observeHabitChecked(habitId, habitName)
  } else {
    observeHabitUnchecked(habitId)
  }
}

/**
 * Notifie le Brain après démarrage livre
 */
export function notifyBookStarted(bookId: string, bookTitle: string) {
  observeBookStarted(bookId, bookTitle)
}

/**
 * Notifie le Brain après fin de livre
 */
export function notifyBookFinished(bookId: string, bookTitle: string) {
  observeBookFinished(bookId, bookTitle)
}

/**
 * Notifie le Brain après session de lecture
 */
export function notifyReadingSession(data: { bookId: string; minutes: number }) {
  observeReadingSession(data)
}

/**
 * Notifie le Brain après message dans un cours
 */
export function notifyCourseMessage(courseId: string, isUser: boolean) {
  observeCourseMessage(courseId, isUser)
}

// ═══════════════════════════════════════════════════════════════
// HOOK D'INTÉGRATION AUTOMATIQUE
// ═══════════════════════════════════════════════════════════════

/**
 * Hook pour intégrer le Brain dans un composant qui utilise le store
 * 
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const store = useStore()
 *   const brain = useBrainIntegration(store)
 *   
 *   const handleAddTask = (task) => {
 *     store.addTask(task)
 *     brain.notifyTaskCreated(task)
 *   }
 * }
 * ```
 */
export function createBrainIntegration() {
  return {
    notifyTaskCreated,
    notifyTaskCompleted,
    notifyTaskDeleted,
    notifyTaskMoved,
    notifyPomodoroCompleted,
    notifyPomodoroInterrupted,
    notifyWeightAdded,
    notifyMealAdded,
    notifyWaterAdded,
    notifyJournalWritten,
    notifyHabitToggled,
    notifyBookStarted,
    notifyBookFinished,
    notifyReadingSession,
    notifyCourseMessage,
  }
}

// Export singleton
export const brainIntegration = createBrainIntegration()

