/**
 * 🧠 BRAIN - Observer
 * 
 * Observe silencieusement chaque action de l'utilisateur.
 * Ne juge pas, ne bloque pas, enregistre simplement.
 */

import { BrainEvent, BrainEventType, BrainMemory } from './types'
import { addEvent, saveMemory, loadMemory } from './Memory'

// Singleton pour l'observer
let memory: BrainMemory | null = null
let saveTimeout: ReturnType<typeof setTimeout> | null = null

/**
 * Initialise l'observer
 */
export function initObserver(): void {
  if (memory === null) {
    memory = loadMemory()
    console.log('[Brain] 🧠 Observer initialisé avec', memory.recentEvents.length, 'événements en mémoire')
  }
}

/**
 * Observe un événement
 */
export function observe(type: BrainEventType, data: Record<string, any> = {}): void {
  if (memory === null) {
    initObserver()
  }
  
  const event: BrainEvent = {
    type,
    timestamp: Date.now(),
    data,
  }
  
  memory = addEvent(memory!, event)
  
  // Debounce la sauvegarde (évite trop d'écritures)
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  saveTimeout = setTimeout(() => {
    saveMemory(memory!)
  }, 1000)
}

/**
 * Obtient la mémoire courante
 */
export function getMemory(): BrainMemory {
  if (memory === null) {
    initObserver()
  }
  return memory!
}

/**
 * Force la sauvegarde immédiate
 */
export function flushMemory(): void {
  if (memory) {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
    saveMemory(memory)
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPERS POUR OBSERVER FACILEMENT
// ═══════════════════════════════════════════════════════════════

// Tâches
export const observeTaskCreated = (task: { id: string; title: string; category: string; priority: string }) => 
  observe('task:created', task)

export const observeTaskCompleted = (task: { id: string; title: string; duration?: number }) => 
  observe('task:completed', task)

export const observeTaskDeleted = (taskId: string) => 
  observe('task:deleted', { taskId })

export const observeTaskMoved = (taskId: string, from: string, to: string) => 
  observe('task:moved', { taskId, from, to })

// Pomodoro
export const observePomodoroStarted = (data: { taskId?: string; duration: number }) => 
  observe('pomodoro:started', data)

export const observePomodoroCompleted = (data: { taskId?: string; duration: number; actualDuration: number }) => 
  observe('pomodoro:completed', data)

export const observePomodoroInterrupted = (data: { taskId?: string; afterMinutes: number }) => 
  observe('pomodoro:interrupted', data)

// Santé
export const observeWeightAdded = (weight: number) => 
  observe('weight:added', { weight })

export const observeMealAdded = (data: { calories: number; type: string }) => 
  observe('meal:added', data)

export const observeWaterAdded = (ml: number) => 
  observe('water:added', { ml })

// Journal & Mood
export const observeJournalWritten = (data: { mood?: number; hasContent: boolean }) => 
  observe('journal:written', data)

export const observeMoodSet = (mood: number) => 
  observe('mood:set', { mood })

// Habitudes
export const observeHabitChecked = (habitId: string, habitName: string) => 
  observe('habit:checked', { habitId, habitName })

export const observeHabitUnchecked = (habitId: string) => 
  observe('habit:unchecked', { habitId })

// Lecture
export const observeBookStarted = (bookId: string, bookTitle: string) => 
  observe('book:started', { bookId, bookTitle })

export const observeBookFinished = (bookId: string, bookTitle: string) => 
  observe('book:finished', { bookId, bookTitle })

export const observeReadingSession = (data: { bookId: string; minutes: number }) => 
  observe('reading:session', data)

// Apprentissage
export const observeCourseStarted = (courseId: string, courseName: string) => 
  observe('course:started', { courseId, courseName })

export const observeCourseMessage = (courseId: string, isUser: boolean) => 
  observe('course:message', { courseId, isUser })

export const observeFlashcardReviewed = (data: { courseId: string; correct: boolean }) => 
  observe('flashcard:reviewed', data)

// Navigation
export const observeViewChanged = (from: string, to: string) => 
  observe('view:changed', { from, to })

export const observeAppOpened = () => 
  observe('app:opened', {})

export const observeAppClosed = () => 
  observe('app:closed', {})

