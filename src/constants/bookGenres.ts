/**
 * Genres de livres prédéfinis avec leurs couleurs
 */

export interface BookGenre {
  id: string
  label: string
  color: string // Classe Tailwind pour le badge
  emoji: string
  description?: string
}

export const BOOK_GENRES: BookGenre[] = [
  // Fiction
  { id: 'science-fiction', label: 'Science-Fiction', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', emoji: '🚀' },
  { id: 'fantasy', label: 'Fantasy', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', emoji: '🐉' },
  { id: 'thriller', label: 'Thriller', color: 'bg-red-500/20 text-red-400 border-red-500/30', emoji: '🔪' },
  { id: 'policier', label: 'Policier', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', emoji: '🔍' },
  { id: 'romance', label: 'Romance', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', emoji: '💕' },
  { id: 'horreur', label: 'Horreur', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', emoji: '👻' },
  { id: 'aventure', label: 'Aventure', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', emoji: '⛰️' },
  { id: 'classique', label: 'Classique', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', emoji: '📜' },
  { id: 'fiction-litteraire', label: 'Fiction littéraire', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', emoji: '✍️' },
  { id: 'contemporain', label: 'Contemporain', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30', emoji: '📖' },
  
  // Non-Fiction
  { id: 'biographie', label: 'Biographie', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', emoji: '👤' },
  { id: 'histoire', label: 'Histoire', color: 'bg-stone-500/20 text-stone-400 border-stone-500/30', emoji: '🏛️' },
  { id: 'philosophie', label: 'Philosophie', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30', emoji: '🤔' },
  { id: 'developpement-personnel', label: 'Développement personnel', color: 'bg-lime-500/20 text-lime-400 border-lime-500/30', emoji: '🌱' },
  { id: 'business', label: 'Business / Économie', color: 'bg-green-500/20 text-green-400 border-green-500/30', emoji: '💼' },
  { id: 'sciences', label: 'Sciences', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', emoji: '🔬' },
  { id: 'psychologie', label: 'Psychologie', color: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30', emoji: '🧠' },
  { id: 'politique', label: 'Politique', color: 'bg-red-600/20 text-red-300 border-red-600/30', emoji: '🏛️' },
  { id: 'spiritualite', label: 'Spiritualité', color: 'bg-purple-600/20 text-purple-300 border-purple-600/30', emoji: '🕉️' },
  { id: 'cuisine', label: 'Cuisine', color: 'bg-orange-600/20 text-orange-300 border-orange-600/30', emoji: '👨‍🍳' },
  { id: 'art', label: 'Art', color: 'bg-pink-600/20 text-pink-300 border-pink-600/30', emoji: '🎨' },
  { id: 'voyage', label: 'Voyage', color: 'bg-sky-500/20 text-sky-400 border-sky-500/30', emoji: '✈️' },
  { id: 'essai', label: 'Essai', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', emoji: '📝' },
  
  // Jeunesse
  { id: 'jeunesse', label: 'Jeunesse', color: 'bg-yellow-600/20 text-yellow-300 border-yellow-600/30', emoji: '👶' },
  { id: 'young-adult', label: 'Young Adult', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', emoji: '🎓' },
  
  // Autres formats
  { id: 'bd-comics', label: 'BD / Comics', color: 'bg-blue-600/20 text-blue-300 border-blue-600/30', emoji: '💥' },
  { id: 'manga', label: 'Manga', color: 'bg-red-700/20 text-red-300 border-red-700/30', emoji: '🎌' },
  { id: 'poesie', label: 'Poésie', color: 'bg-pink-700/20 text-pink-300 border-pink-700/30', emoji: '🌸' },
  { id: 'theatre', label: 'Théâtre', color: 'bg-purple-700/20 text-purple-300 border-purple-700/30', emoji: '🎭' },
]

/**
 * Obtenir un genre par son ID
 */
export function getGenreById(id: string): BookGenre | undefined {
  return BOOK_GENRES.find(g => g.id === id)
}

/**
 * Obtenir un genre par son label (pour la compatibilité avec les anciens livres)
 */
export function getGenreByLabel(label: string): BookGenre | undefined {
  const normalized = label.toLowerCase().trim()
  return BOOK_GENRES.find(g => 
    g.label.toLowerCase() === normalized || 
    g.id === normalized
  )
}

/**
 * Obtenir la couleur d'un genre (avec fallback)
 */
export function getGenreColor(genreIdOrLabel: string): string {
  const genre = getGenreById(genreIdOrLabel) || getGenreByLabel(genreIdOrLabel)
  return genre?.color || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
}

/**
 * Obtenir l'emoji d'un genre (avec fallback)
 */
export function getGenreEmoji(genreIdOrLabel: string): string {
  const genre = getGenreById(genreIdOrLabel) || getGenreByLabel(genreIdOrLabel)
  return genre?.emoji || '📚'
}

