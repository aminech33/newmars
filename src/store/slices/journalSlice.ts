/**
 * 📝 Journal Slice - Journal et habitudes
 */

import { StateCreator } from 'zustand'
import { JournalEntry } from '../../types/journal'
import { Habit } from '../../types/widgets'
import { generateId } from './types'
import {
  observeJournalWritten,
  observeMoodSet,
  observeHabitChecked,
  observeHabitUnchecked,
} from '../../insights'

export interface JournalSlice {
  // Journal
  journalEntries: JournalEntry[]
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void
  deleteJournalEntry: (id: string) => void
  toggleJournalFavorite: (id: string) => void

  // Habits
  habits: Habit[]
  addHabit: (name: string) => void
  toggleHabitToday: (id: string) => void
  deleteHabit: (id: string) => void
}

export const createJournalSlice: StateCreator<
  JournalSlice & { addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void },
  [['zustand/persist', unknown]],
  [],
  JournalSlice
> = (set, get) => ({
  // Journal Entries
  journalEntries: [],

  addJournalEntry: (entry) => {
    const now = Date.now()
    const newEntry = { ...entry, id: generateId(), createdAt: now, updatedAt: now }
    set((s) => ({ journalEntries: [...s.journalEntries, newEntry] }))
    get().addToast('Entrée journal créée', 'success')

    // Brain: Observer journal writing
    observeJournalWritten({
      mood: entry.mood,
      hasContent: !!(entry.content && entry.content.trim().length > 0)
    })

    if (entry.mood !== undefined && entry.mood !== null) {
      observeMoodSet(entry.mood)
    }
  },

  updateJournalEntry: (id, updates) => {
    set((s) => ({
      journalEntries: s.journalEntries.map((e) =>
        e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e
      )
    }))
    get().addToast('Entrée mise à jour', 'success')

    if (updates.mood !== undefined && updates.mood !== null) {
      observeMoodSet(updates.mood)
    }
  },

  deleteJournalEntry: (id) => {
    set((s) => ({ journalEntries: s.journalEntries.filter((e) => e.id !== id) }))
    get().addToast('Entrée supprimée', 'info')
  },

  toggleJournalFavorite: (id) => {
    set((s) => ({
      journalEntries: s.journalEntries.map((e) =>
        e.id === id ? { ...e, isFavorite: !e.isFavorite } : e
      )
    }))
  },

  // Habits
  habits: [
    { id: '1', name: 'Méditation', streak: 7, completedDates: [], createdAt: Date.now() },
    { id: '2', name: 'Sport', streak: 3, completedDates: [], createdAt: Date.now() },
    { id: '3', name: 'Lecture', streak: 12, completedDates: [], createdAt: Date.now() },
  ],

  addHabit: (name) => {
    set((s) => ({
      habits: [...s.habits, { id: generateId(), name, streak: 0, completedDates: [], createdAt: Date.now() }]
    }))
  },

  toggleHabitToday: (id) => {
    const today = new Date().toISOString().split('T')[0]
    const habit = get().habits.find(h => h.id === id)
    const wasCompleted = habit?.completedDates.includes(today)

    set((s) => ({
      habits: s.habits.map(h => {
        if (h.id === id) {
          const isCompleted = h.completedDates.includes(today)
          return {
            ...h,
            completedDates: isCompleted
              ? h.completedDates.filter(d => d !== today)
              : [...h.completedDates, today],
            streak: isCompleted ? Math.max(0, h.streak - 1) : h.streak + 1
          }
        }
        return h
      })
    }))

    // Brain: Observer habit toggle
    if (habit) {
      if (!wasCompleted) {
        observeHabitChecked(habit.id, habit.name)
      } else {
        observeHabitUnchecked(habit.id)
      }
    }
  },

  deleteHabit: (id) => {
    set((s) => ({
      habits: s.habits.filter(h => h.id !== id)
    }))
  },
})




