/**
 * Migration des anciens genres (texte libre) vers les nouveaux genres (IDs)
 */

import { BOOK_GENRES } from '../constants/bookGenres'

/**
 * Mapper les anciens noms de genres vers les nouveaux IDs
 */
const GENRE_MIGRATION_MAP: Record<string, string> = {
  // Variantes françaises
  'science-fiction': 'science-fiction',
  'science fiction': 'science-fiction',
  'sci-fi': 'science-fiction',
  'fantasy': 'fantasy',
  'fantaisie': 'fantasy',
  'thriller': 'thriller',
  'policier': 'policier',
  'polar': 'policier',
  'roman policier': 'policier',
  'romance': 'romance',
  'horreur': 'horreur',
  'aventure': 'aventure',
  'classique': 'classique',
  'fiction': 'fiction-litteraire',
  'fiction littéraire': 'fiction-litteraire',
  'contemporain': 'contemporain',
  
  // Non-fiction
  'biographie': 'biographie',
  'autobiographie': 'biographie',
  'histoire': 'histoire',
  'historique': 'histoire',
  'philosophie': 'philosophie',
  'développement personnel': 'developpement-personnel',
  'dev perso': 'developpement-personnel',
  'self-help': 'developpement-personnel',
  'business': 'business',
  'économie': 'business',
  'business & économie': 'business',
  'sciences': 'sciences',
  'science': 'sciences',
  'psychologie': 'psychologie',
  'psycho': 'psychologie',
  'politique': 'politique',
  'spiritualité': 'spiritualite',
  'cuisine': 'cuisine',
  'art': 'art',
  'voyage': 'voyage',
  'essai': 'essai',
  
  // Jeunesse
  'jeunesse': 'jeunesse',
  'young adult': 'young-adult',
  'ya': 'young-adult',
  
  // Autres
  'bd': 'bd-comics',
  'comics': 'bd-comics',
  'bande dessinée': 'bd-comics',
  'manga': 'manga',
  'poésie': 'poesie',
  'poeme': 'poesie',
  'théâtre': 'theatre',
  'theatre': 'theatre',
}

/**
 * Migrer un ancien genre vers le nouveau système
 */
export function migrateGenre(oldGenre: string | undefined): string | undefined {
  if (!oldGenre) return undefined
  
  const normalized = oldGenre.toLowerCase().trim()
  
  // Vérifier si c'est déjà un ID valide
  if (BOOK_GENRES.find(g => g.id === normalized)) {
    return normalized
  }
  
  // Chercher dans la map de migration
  const migratedId = GENRE_MIGRATION_MAP[normalized]
  if (migratedId) {
    return migratedId
  }
  
  // Si pas de correspondance, essayer de trouver une correspondance partielle
  for (const genre of BOOK_GENRES) {
    if (genre.label.toLowerCase() === normalized) {
      return genre.id
    }
  }
  
  // Si vraiment aucune correspondance, retourner undefined
  // (le livre n'aura pas de genre)
  return undefined
}

/**
 * Migrer tous les livres du store
 */
export function migrateAllBooksGenres(books: any[]): any[] {
  return books.map(book => {
    if (!book.genre) return book
    
    const migratedGenre = migrateGenre(book.genre)
    
    // Si le genre a changé, le mettre à jour
    if (migratedGenre !== book.genre) {
      console.log(`📚 Migration: "${book.title}" - Genre "${book.genre}" → "${migratedGenre || 'aucun'}"`)
      return {
        ...book,
        genre: migratedGenre
      }
    }
    
    return book
  })
}


