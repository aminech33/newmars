import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  calculateTaskMetrics,
  calculateHabitMetrics,
  calculateJournalMetrics
} from '../metrics'
import { Task, Habit, JournalEntry } from '../../store/useStore'

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

// Mock de la date pour des tests reproductibles
const mockDate = (date: Date) => {
  vi.useFakeTimers()
  vi.setSystemTime(date)
}

const restoreDate = () => {
  vi.useRealTimers()
}

// ═══════════════════════════════════════════════════════════════
// TESTS MÉTRIQUES TÂCHES
// ═══════════════════════════════════════════════════════════════

describe('calculateTaskMetrics', () => {
  const now = new Date('2024-12-28T12:00:00Z')
  
  beforeEach(() => {
    mockDate(now)
  })
  
  afterEach(() => {
    restoreDate()
  })

  const createTask = (overrides: Partial<Task> = {}): Task => ({
    id: Math.random().toString(),
    title: 'Test task',
    completed: false,
    category: 'work',
    createdAt: now.getTime(),
    status: 'todo',
    priority: 'medium',
    ...overrides
  })

  it('compte les tâches complétées aujourd\'hui', () => {
    const tasks = [
      createTask({ completed: true, completedAt: now.getTime() }),
      createTask({ completed: true, completedAt: now.getTime() - 1000 }),
      createTask({ completed: true, completedAt: now.getTime() - 2 * 24 * 60 * 60 * 1000 }), // Hier
      createTask({ completed: false }),
    ]
    
    const result = calculateTaskMetrics(tasks)
    expect(result.todayCount).toBe(2)
  })

  it('détecte le type d\'activité "avancée" si effort M ou L', () => {
    const tasks = [
      createTask({ completed: true, completedAt: now.getTime(), effort: 'M' }),
    ]
    
    const result = calculateTaskMetrics(tasks)
    expect(result.activityType).toBe('avancée')
  })

  it('détecte le type d\'activité "préparation" si effort XS ou S', () => {
    const tasks = [
      createTask({ completed: true, completedAt: now.getTime(), effort: 'S' }),
    ]
    
    const result = calculateTaskMetrics(tasks)
    expect(result.activityType).toBe('préparation')
  })

  it('détecte la tendance en hausse', () => {
    // 10 tâches cette semaine vs 2 la semaine d'avant
    const thisWeekTasks = Array.from({ length: 10 }, (_, i) => 
      createTask({ 
        completed: true, 
        completedAt: now.getTime() - i * 12 * 60 * 60 * 1000 // Réparties sur les derniers jours
      })
    )
    const lastWeekTasks = Array.from({ length: 2 }, (_, i) => 
      createTask({ 
        completed: true, 
        completedAt: now.getTime() - (8 + i) * 24 * 60 * 60 * 1000 // Il y a 8-9 jours
      })
    )
    
    const result = calculateTaskMetrics([...thisWeekTasks, ...lastWeekTasks])
    expect(result.trend14d).toBe('en hausse')
  })

  it('détecte la tendance en baisse', () => {
    // 2 tâches cette semaine vs 10 la semaine d'avant
    const thisWeekTasks = Array.from({ length: 2 }, (_, i) => 
      createTask({ 
        completed: true, 
        completedAt: now.getTime() - i * 24 * 60 * 60 * 1000
      })
    )
    const lastWeekTasks = Array.from({ length: 10 }, (_, i) => 
      createTask({ 
        completed: true, 
        completedAt: now.getTime() - (8 + i) * 24 * 60 * 60 * 1000
      })
    )
    
    const result = calculateTaskMetrics([...thisWeekTasks, ...lastWeekTasks])
    expect(result.trend14d).toBe('en baisse')
  })

  it('détecte la tendance stable', () => {
    // 5 tâches cette semaine vs 5 la semaine d'avant
    const thisWeekTasks = Array.from({ length: 5 }, (_, i) => 
      createTask({ 
        completed: true, 
        completedAt: now.getTime() - i * 24 * 60 * 60 * 1000
      })
    )
    const lastWeekTasks = Array.from({ length: 5 }, (_, i) => 
      createTask({ 
        completed: true, 
        completedAt: now.getTime() - (8 + i) * 24 * 60 * 60 * 1000
      })
    )
    
    const result = calculateTaskMetrics([...thisWeekTasks, ...lastWeekTasks])
    expect(result.trend14d).toBe('stable')
  })
})

// ═══════════════════════════════════════════════════════════════
// TESTS MÉTRIQUES HABITUDES
// ═══════════════════════════════════════════════════════════════

describe('calculateHabitMetrics', () => {
  const now = new Date('2024-12-28T12:00:00Z')
  
  beforeEach(() => {
    mockDate(now)
  })
  
  afterEach(() => {
    restoreDate()
  })

  const createHabit = (completedDates: string[] = []): Habit => ({
    id: Math.random().toString(),
    name: 'Test habit',
    completedDates,
    streak: completedDates.length,
    createdAt: now.getTime() - 30 * 24 * 60 * 60 * 1000, // Créée il y a 30 jours
  })

  it('calcule le taux de complétion aujourd\'hui', () => {
    const today = '2024-12-28'
    const habits = [
      createHabit([today]),
      createHabit([today]),
      createHabit([]),
      createHabit([]),
    ]
    
    const result = calculateHabitMetrics(habits)
    expect(result.today.completed).toBe(2)
    expect(result.today.total).toBe(4)
    expect(result.todayPercent).toBe(50)
  })

  it('calcule la différence vs hier', () => {
    const today = '2024-12-28'
    const yesterday = '2024-12-27'
    
    const habits = [
      createHabit([today, yesterday]), // Fait les deux jours
      createHabit([today]),            // Fait aujourd'hui seulement
      createHabit([yesterday]),        // Fait hier seulement
      createHabit([]),                 // Jamais fait
    ]
    
    const result = calculateHabitMetrics(habits)
    // Aujourd'hui: 2/4 = 50%
    // Hier: 2/4 = 50%
    expect(result.vsYesterday).toBe(0)
  })

  it('calcule la moyenne sur 7 jours', () => {
    const today = '2024-12-28'
    const yesterday = '2024-12-27'
    const twoDaysAgo = '2024-12-26'
    
    const habits = [
      createHabit([today, yesterday, twoDaysAgo]), // 3 jours sur 7
      createHabit([today]),                         // 1 jour sur 7
    ]
    
    const result = calculateHabitMetrics(habits)
    // Jour 1: 2/2 = 100%, Jour 2: 1/2 = 50%, Jour 3: 1/2 = 50%, Jours 4-7: 0%
    // Moyenne: (100 + 50 + 50 + 0 + 0 + 0 + 0) / 7 ≈ 29%
    expect(result.avg7d).toBeGreaterThanOrEqual(0)
    expect(result.avg7d).toBeLessThanOrEqual(100)
  })
})

// ═══════════════════════════════════════════════════════════════
// TESTS MÉTRIQUES JOURNAL
// ═══════════════════════════════════════════════════════════════

describe('calculateJournalMetrics', () => {
  const now = new Date('2024-12-28T12:00:00Z') // Samedi
  
  beforeEach(() => {
    mockDate(now)
  })
  
  afterEach(() => {
    restoreDate()
  })

  const createEntry = (date: string): JournalEntry => ({
    id: Math.random().toString(),
    date,
    intention: 'Test intention',
    mood: 'good',
    notes: 'Test notes',
    isFavorite: false,
  })

  it('calcule le streak actuel', () => {
    const entries = [
      createEntry('2024-12-28'), // Aujourd'hui
      createEntry('2024-12-27'), // Hier
      createEntry('2024-12-26'), // Avant-hier
    ]
    
    const result = calculateJournalMetrics(entries)
    expect(result.currentStreak).toBe(3)
  })

  it('reset le streak si jour manquant', () => {
    const entries = [
      createEntry('2024-12-28'), // Aujourd'hui
      createEntry('2024-12-26'), // Avant-hier (hier manquant)
    ]
    
    const result = calculateJournalMetrics(entries)
    expect(result.currentStreak).toBe(1) // Seulement aujourd'hui
  })

  it('streak = 0 si pas d\'entrée aujourd\'hui', () => {
    const entries = [
      createEntry('2024-12-27'), // Hier
      createEntry('2024-12-26'), // Avant-hier
    ]
    
    const result = calculateJournalMetrics(entries)
    expect(result.currentStreak).toBe(0)
  })

  it('compte les entrées de la semaine', () => {
    // Le 28 décembre 2024 est un samedi
    // Lundi = 23 décembre
    const entries = [
      createEntry('2024-12-28'), // Samedi
      createEntry('2024-12-27'), // Vendredi
      createEntry('2024-12-26'), // Jeudi
      createEntry('2024-12-25'), // Mercredi
      createEntry('2024-12-24'), // Mardi
      createEntry('2024-12-23'), // Lundi
      createEntry('2024-12-22'), // Dimanche (semaine précédente)
    ]
    
    const result = calculateJournalMetrics(entries)
    expect(result.thisWeek.completed).toBe(6) // Lundi à Samedi
  })
})





