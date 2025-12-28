/**
 * 📚 Library Slice - Livres et sessions de lecture
 */

import { StateCreator } from 'zustand'
import { Book, DEMO_BOOKS, Quote, ReadingNote, ReadingSession, ReadingGoal } from '../../types/library'
import { generateId } from './types'

export interface LibrarySlice {
  books: Book[]
  readingSessions: ReadingSession[]
  readingGoal: ReadingGoal | null
  isReadingSession: boolean
  currentReadingBookId: string | null
  readingSessionStart: number | null

  addBook: (book: Omit<Book, 'id' | 'addedAt' | 'updatedAt' | 'quotes' | 'notes' | 'totalReadingTime' | 'sessionsCount'>) => void
  updateBook: (id: string, updates: Partial<Book>) => void
  deleteBook: (id: string) => void

  // Quotes & Notes
  addQuote: (bookId: string, quote: Omit<Quote, 'id' | 'addedAt'>) => void
  updateQuote: (bookId: string, quoteId: string, updates: Partial<Quote>) => void
  deleteQuote: (bookId: string, quoteId: string) => void
  addBookNote: (bookId: string, note: Omit<ReadingNote, 'id' | 'addedAt'>) => void
  deleteBookNote: (bookId: string, noteId: string) => void

  // Reading Sessions
  startReadingSession: (bookId: string) => void
  endReadingSession: (pagesRead?: number) => void
  cancelReadingSession: () => void

  // Goal
  setReadingGoal: (goal: ReadingGoal) => void

  // Stats
  getReadingStats: () => {
    totalBooks: number
    completedBooks: number
    completedThisYear: number
    totalPagesRead: number
    totalReadingTime: number
    averageRating: number
    goalProgress: number
  }
}

export const createLibrarySlice: StateCreator<
  LibrarySlice,
  [['zustand/persist', unknown]],
  [],
  LibrarySlice
> = (set, get) => ({
  books: DEMO_BOOKS.map((book, i) => ({
    ...book,
    id: generateId(),
    addedAt: Date.now() - (i * 86400000),
    updatedAt: Date.now() - (i * 86400000),
  })),
  readingSessions: [],
  readingGoal: { year: new Date().getFullYear(), targetBooks: 12 },
  isReadingSession: false,
  currentReadingBookId: null,
  readingSessionStart: null,

  addBook: (book) => {
    const now = Date.now()
    set((s) => ({
      books: [...s.books, {
        ...book,
        id: generateId(),
        addedAt: now,
        updatedAt: now,
        quotes: [],
        notes: [],
        totalReadingTime: 0,
        sessionsCount: 0
      }]
    }))
  },

  updateBook: (id, updates) => {
    set((s) => ({
      books: s.books.map((b) =>
        b.id === id ? { ...b, ...updates, updatedAt: Date.now() } : b
      )
    }))
  },

  deleteBook: (id) => {
    set((s) => ({
      books: s.books.filter((b) => b.id !== id),
      readingSessions: s.readingSessions.filter((rs) => rs.bookId !== id)
    }))
  },

  // Quotes
  addQuote: (bookId, quote) => {
    set((s) => ({
      books: s.books.map((b) =>
        b.id === bookId
          ? { ...b, quotes: [...b.quotes, { ...quote, id: generateId(), addedAt: Date.now() }], updatedAt: Date.now() }
          : b
      )
    }))
  },

  updateQuote: (bookId, quoteId, updates) => {
    set((s) => ({
      books: s.books.map((b) =>
        b.id === bookId
          ? { ...b, quotes: b.quotes.map(q => q.id === quoteId ? { ...q, ...updates } : q), updatedAt: Date.now() }
          : b
      )
    }))
  },

  deleteQuote: (bookId, quoteId) => {
    set((s) => ({
      books: s.books.map((b) =>
        b.id === bookId
          ? { ...b, quotes: b.quotes.filter(q => q.id !== quoteId), updatedAt: Date.now() }
          : b
      )
    }))
  },

  // Book Notes
  addBookNote: (bookId, note) => {
    set((s) => ({
      books: s.books.map((b) =>
        b.id === bookId
          ? { ...b, notes: [...b.notes, { ...note, id: generateId(), addedAt: Date.now() }], updatedAt: Date.now() }
          : b
      )
    }))
  },

  deleteBookNote: (bookId, noteId) => {
    set((s) => ({
      books: s.books.map((b) =>
        b.id === bookId
          ? { ...b, notes: b.notes.filter(n => n.id !== noteId), updatedAt: Date.now() }
          : b
      )
    }))
  },

  // Reading Sessions
  startReadingSession: (bookId) => {
    set({
      isReadingSession: true,
      currentReadingBookId: bookId,
      readingSessionStart: Date.now()
    })
  },

  endReadingSession: (pagesRead) => {
    const state = get()
    if (!state.isReadingSession || !state.currentReadingBookId || !state.readingSessionStart) return

    const duration = Math.round((Date.now() - state.readingSessionStart) / 60000)
    const book = state.books.find(b => b.id === state.currentReadingBookId)
    if (!book || duration < 1) {
      set({ isReadingSession: false, currentReadingBookId: null, readingSessionStart: null })
      return
    }

    const session: ReadingSession = {
      id: generateId(),
      bookId: state.currentReadingBookId,
      bookTitle: book.title,
      duration,
      pagesRead,
      date: new Date().toISOString().split('T')[0],
      completedAt: Date.now()
    }

    set((s) => ({
      readingSessions: [...s.readingSessions, session],
      books: s.books.map((b) =>
        b.id === state.currentReadingBookId
          ? {
            ...b,
            totalReadingTime: b.totalReadingTime + duration,
            sessionsCount: b.sessionsCount + 1,
            currentPage: pagesRead ? (b.currentPage || 0) + pagesRead : b.currentPage,
            updatedAt: Date.now()
          }
          : b
      ),
      isReadingSession: false,
      currentReadingBookId: null,
      readingSessionStart: null
    }))
  },

  cancelReadingSession: () => {
    set({ isReadingSession: false, currentReadingBookId: null, readingSessionStart: null })
  },

  // Goal
  setReadingGoal: (goal) => {
    set({ readingGoal: goal })
  },

  // Stats
  getReadingStats: () => {
    const state = get()
    const currentYear = new Date().getFullYear()
    const completedBooks = state.books.filter(b => b.status === 'completed')
    const completedThisYear = completedBooks.filter(b =>
      b.finishedAt && new Date(b.finishedAt).getFullYear() === currentYear
    ).length

    const totalPagesRead = state.books.reduce((acc, b) => acc + (b.currentPage || 0), 0)
    const totalReadingTime = state.books.reduce((acc, b) => acc + b.totalReadingTime, 0)
    const ratings = completedBooks.filter(b => b.rating).map(b => b.rating!)
    const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0

    const goalProgress = state.readingGoal
      ? Math.round((completedThisYear / state.readingGoal.targetBooks) * 100)
      : 0

    return {
      totalBooks: state.books.length,
      completedBooks: completedBooks.length,
      completedThisYear,
      totalPagesRead,
      totalReadingTime,
      averageRating: Math.round(averageRating * 10) / 10,
      goalProgress
    }
  },
})
