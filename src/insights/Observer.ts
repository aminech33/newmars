/**
 * 📊 INSIGHTS - Observer
 * 
 * Observe silencieusement les actions utilisées dans le Wellbeing Score.
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
    console.log('[Insights] 📊 Observer initialisé avec', memory.recentEvents.length, 'événements en mémoire')
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
// HELPERS — Seulement ceux utilisés dans le Wellbeing Score
// ═══════════════════════════════════════════════════════════════

// Tâches (utilisé dans Productivité)
export const observeTaskCreated = (task: { id: string; title: string; category: string; priority: string }) => 
  observe('task:created', task)

export const observeTaskCompleted = (task: { id: string; title: string; duration?: number }) => 
  observe('task:completed', task)

// Pomodoro (utilisé dans Productivité)
export const observePomodoroCompleted = (data: { taskId?: string; duration: number; actualDuration: number }) => 
  observe('pomodoro:completed', data)

// Journal & Mood (utilisé dans Mental)
export const observeJournalWritten = (data: { mood?: number; hasContent: boolean }) => 
  observe('journal:written', data)

export const observeMoodSet = (mood: number) => 
  observe('mood:set', { mood })

// Habitudes (utilisé dans Constance)
export const observeHabitChecked = (habitId: string, habitName: string) => 
  observe('habit:checked', { habitId, habitName })

export const observeHabitUnchecked = (habitId: string) => 
  observe('habit:unchecked', { habitId })

// App lifecycle (utilisé pour tracking)
export const observeAppOpened = () => 
  observe('app:opened', {})

export const observeAppClosed = () => 
  observe('app:closed', {})











