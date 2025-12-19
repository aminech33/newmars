import { StateCreator } from 'zustand'
import { Book, Quote, ReadingNote, ReadingSession, ReadingGoal, DEMO_BOOKS } from '../../types/library'

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

  addQuote: (bookId: string, quote: Omit<Quote, 'id' | 'addedAt'>) => void
  updateQuote: (bookId: string, quoteId: string, updates: Partial<Quote>) => void
  deleteQuote: (bookId: string, quoteId: string) => void
  addBookNote: (bookId: string, note: Omit<ReadingNote, 'id' | 'addedAt'>) => void
  deleteBookNote: (bookId: string, noteId: string) => void

  startReadingSession: (bookId: string) => void
  endReadingSession: (pagesRead?: number) => void
  cancelReadingSession: () => void

  setReadingGoal: (goal: ReadingGoal) => void

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

const generateId = () => Math.random().toString(36).substring(2, 9)

export const createLibrarySlice: StateCreator<LibrarySlice> = (set, get) => ({
  books: DEMO_BOOKS as Book[],
  readingSessions: [],
  readingGoal: null,
  isReadingSession: false,
  currentReadingBookId: null,
  readingSessionStart: null,

  addBook: (book) => set((state) => ({
    books: [...state.books, {
      ...book,
      id: generateId(),
      addedAt: Date.now(),
      updatedAt: Date.now(),
      quotes: [],
      notes: [],
      totalReadingTime: 0,
      sessionsCount: 0
    }]
  })),

  updateBook: (id, updates) => set((state) => ({
    books: state.books.map(b =>
      b.id === id ? { ...b, ...updates, updatedAt: Date.now() } : b
    )
  })),

  deleteBook: (id) => set((state) => ({
    books: state.books.filter(b => b.id !== id)
  })),

  addQuote: (bookId, quote) => set((state) => ({
    books: state.books.map(book => {
      if (book.id !== bookId) return book
      return {
        ...book,
        quotes: [...book.quotes, { ...quote, id: generateId(), addedAt: Date.now() }],
        updatedAt: Date.now()
      }
    })
  })),

  updateQuote: (bookId, quoteId, updates) => set((state) => ({
    books: state.books.map(book => {
      if (book.id !== bookId) return book
      return {
        ...book,
        quotes: book.quotes.map(q => q.id === quoteId ? { ...q, ...updates } : q),
        updatedAt: Date.now()
      }
    })
  })),

  deleteQuote: (bookId, quoteId) => set((state) => ({
    books: state.books.map(book => {
      if (book.id !== bookId) return book
      return {
        ...book,
        quotes: book.quotes.filter(q => q.id !== quoteId),
        updatedAt: Date.now()
      }
    })
  })),

  addBookNote: (bookId, note) => set((state) => ({
    books: state.books.map(book => {
      if (book.id !== bookId) return book
      return {
        ...book,
        notes: [...book.notes, { ...note, id: generateId(), addedAt: Date.now() }],
        updatedAt: Date.now()
      }
    })
  })),

  deleteBookNote: (bookId, noteId) => set((state) => ({
    books: state.books.map(book => {
      if (book.id !== bookId) return book
      return {
        ...book,
        notes: book.notes.filter(n => n.id !== noteId),
        updatedAt: Date.now()
      }
    })
  })),

  startReadingSession: (bookId) => set({
    isReadingSession: true,
    currentReadingBookId: bookId,
    readingSessionStart: Date.now()
  }),

  endReadingSession: (pagesRead) => {
    const state = get()
    if (!state.isReadingSession || !state.currentReadingBookId || !state.readingSessionStart) return

    const duration = Math.round((Date.now() - state.readingSessionStart) / 60000)
    const book = state.books.find(b => b.id === state.currentReadingBookId)
    const session: ReadingSession = {
      id: generateId(),
      bookId: state.currentReadingBookId,
      bookTitle: book?.title || '',
      duration,
      pagesRead,
      date: new Date().toISOString().split('T')[0],
      completedAt: Date.now()
    }

    set((s) => ({
      readingSessions: [...s.readingSessions, session],
      books: s.books.map(b => {
        if (b.id !== state.currentReadingBookId) return b
        return {
          ...b,
          totalReadingTime: (b.totalReadingTime || 0) + duration,
          sessionsCount: (b.sessionsCount || 0) + 1,
          currentPage: pagesRead ? (b.currentPage || 0) + pagesRead : b.currentPage,
          updatedAt: Date.now()
        }
      }),
      isReadingSession: false,
      currentReadingBookId: null,
      readingSessionStart: null
    }))
  },

  cancelReadingSession: () => set({
    isReadingSession: false,
    currentReadingBookId: null,
    readingSessionStart: null
  }),

  setReadingGoal: (goal) => set({ readingGoal: goal }),

  getReadingStats: () => {
    const state = get()
    const currentYear = new Date().getFullYear()
    const completedBooks = state.books.filter(b => b.status === 'completed')
    const completedThisYear = completedBooks.filter(b =>
      b.finishedAt && new Date(b.finishedAt).getFullYear() === currentYear
    )

    const totalReadingTime = state.books.reduce((sum, b) => sum + (b.totalReadingTime || 0), 0)
    const totalPagesRead = state.books.reduce((sum, b) => sum + (b.currentPage || 0), 0)
    const ratedBooks = state.books.filter(b => b.rating && b.rating > 0)
    const averageRating = ratedBooks.length > 0
      ? ratedBooks.reduce((sum, b) => sum + (b.rating || 0), 0) / ratedBooks.length
      : 0

    const goalProgress = state.readingGoal
      ? (completedThisYear.length / state.readingGoal.targetBooks) * 100
      : 0

    return {
      totalBooks: state.books.length,
      completedBooks: completedBooks.length,
      completedThisYear: completedThisYear.length,
      totalPagesRead,
      totalReadingTime,
      averageRating,
      goalProgress: Math.min(goalProgress, 100)
    }
  }
})
