// Types pour la bibliothèque littéraire

export type BookStatus = 'to-read' | 'reading' | 'completed' | 'abandoned'

// Citation d'un livre
export interface Quote {
  id: string
  text: string
  page?: number
  chapter?: string
  addedAt: number
  isFavorite?: boolean
}

// Note de lecture
export interface ReadingNote {
  id: string
  content: string
  page?: number
  chapter?: string
  addedAt: number
}

// Session de lecture
export interface ReadingSession {
  id: string
  bookId: string
  bookTitle: string
  duration: number // en minutes
  pagesRead?: number // pages lues pendant cette session
  startPage?: number
  endPage?: number
  date: string // YYYY-MM-DD
  completedAt: number // timestamp
}

// Objectif de lecture annuel
export interface ReadingGoal {
  year: number
  targetBooks: number
  targetPages?: number
}

export interface Book {
  id: string
  title: string
  author: string
  coverColor: string // Couleur de la couverture (gradient ou solid)
  coverUrl?: string // URL optionnelle de la couverture
  
  // Métadonnées
  status: BookStatus
  pages?: number
  currentPage?: number
  genre?: string
  
  // Contenu capturé
  quotes: Quote[]
  notes: ReadingNote[]
  
  // Stats de lecture
  rating?: number // 1-5
  startedAt?: number
  finishedAt?: number
  totalReadingTime: number // minutes totales de lecture
  sessionsCount: number
  
  // Méta
  addedAt: number
  updatedAt: number
  isFavorite?: boolean
}

// Stats de lecture calculées
export interface ReadingStats {
  totalBooks: number
  completedBooks: number
  completedThisYear: number
  totalPagesRead: number
  totalReadingTime: number // minutes
  averageRating: number
  currentStreak: number // jours consécutifs de lecture
  longestStreak: number
  favoriteGenre?: string
  booksPerMonth: number[]
}

// Couleurs par défaut pour les livres
export const BOOK_COLORS = [
  'from-rose-600 to-rose-800',
  'from-amber-600 to-amber-800', 
  'from-emerald-600 to-emerald-800',
  'from-blue-600 to-blue-800',
  'from-violet-600 to-violet-800',
  'from-cyan-600 to-cyan-800',
  'from-orange-600 to-orange-800',
  'from-pink-600 to-pink-800',
  'from-indigo-600 to-indigo-800',
  'from-teal-600 to-teal-800',
]

// Livres de démo
export const DEMO_BOOKS: Omit<Book, 'id' | 'addedAt' | 'updatedAt'>[] = [
  {
    title: 'Dune',
    author: 'Frank Herbert',
    coverColor: 'from-amber-600 to-amber-800',
    status: 'reading',
    pages: 412,
    currentPage: 156,
    genre: 'Science-Fiction',
    quotes: [
      { id: 'q1', text: "La peur est le tueur de l'esprit.", page: 45, addedAt: Date.now() - 86400000, isFavorite: true }
    ],
    notes: [],
    totalReadingTime: 180,
    sessionsCount: 4
  },
  {
    title: '1984',
    author: 'George Orwell',
    coverColor: 'from-rose-600 to-rose-800',
    status: 'completed',
    pages: 328,
    currentPage: 328,
    rating: 5,
    genre: 'Dystopie',
    quotes: [
      { id: 'q2', text: "Big Brother vous regarde.", page: 1, addedAt: Date.now() - 172800000, isFavorite: true },
      { id: 'q3', text: "La guerre, c'est la paix. La liberté, c'est l'esclavage.", page: 17, addedAt: Date.now() - 172800000 }
    ],
    notes: [
      { id: 'n1', content: "Parallèles troublants avec notre société actuelle.", addedAt: Date.now() - 172800000 }
    ],
    totalReadingTime: 420,
    sessionsCount: 12,
    finishedAt: Date.now() - 86400000 * 30
  },
  {
    title: 'Sapiens',
    author: 'Y.N. Harari',
    coverColor: 'from-emerald-600 to-emerald-800',
    status: 'to-read',
    pages: 512,
    genre: 'Histoire',
    quotes: [],
    notes: [],
    totalReadingTime: 0,
    sessionsCount: 0
  },
  {
    title: 'Atomic Habits',
    author: 'James Clear',
    coverColor: 'from-blue-600 to-blue-800',
    status: 'completed',
    pages: 320,
    currentPage: 320,
    rating: 4,
    genre: 'Développement',
    quotes: [
      { id: 'q4', text: "Vous ne montez pas au niveau de vos objectifs, vous descendez au niveau de vos systèmes.", page: 27, addedAt: Date.now() - 259200000, isFavorite: true }
    ],
    notes: [],
    totalReadingTime: 280,
    sessionsCount: 8,
    finishedAt: Date.now() - 86400000 * 60
  },
  {
    title: 'Le Petit Prince',
    author: 'Saint-Exupéry',
    coverColor: 'from-violet-600 to-violet-800',
    status: 'completed',
    pages: 96,
    currentPage: 96,
    rating: 5,
    genre: 'Conte',
    quotes: [
      { id: 'q5', text: "On ne voit bien qu'avec le cœur. L'essentiel est invisible pour les yeux.", page: 72, addedAt: Date.now() - 345600000, isFavorite: true }
    ],
    notes: [],
    totalReadingTime: 90,
    sessionsCount: 2,
    finishedAt: Date.now() - 86400000 * 90
  }
]
