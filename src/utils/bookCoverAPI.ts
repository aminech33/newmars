/**
 * API pour récupérer automatiquement les couvertures de livres
 * Utilise Google Books API (meilleure qualité d'images)
 */

// Clé API Google Books (stockée côté client pour simplifier)
const GOOGLE_BOOKS_API_KEY = 'AIzaSyAcdIeOmAVAy8FaZEc8pnPycTG6pnUdW7Y'

export interface BookCoverResult {
  coverUrl?: string
  isbn?: string
  pages?: number
  publisher?: string
  description?: string
}

/**
 * Recherche une couverture de livre via Google Books API
 * @param title - Titre du livre
 * @param author - Auteur du livre
 * @param maxResults - Nombre maximum de résultats (par défaut 1)
 * @returns Informations trouvées ou null
 */
export async function fetchBookCover(
  title: string,
  author: string,
  maxResults: number = 1
): Promise<BookCoverResult | null> {
  try {
    // Recherche dans Google Books (meilleure qualité d'images)
    const query = encodeURIComponent(`${title} inauthor:${author}`)
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${query}&key=${GOOGLE_BOOKS_API_KEY}&maxResults=${maxResults}`
    )
    
    if (!response.ok) {
      console.warn('Google Books API error:', response.status)
      return null
    }
    
    const data = await response.json()
    
    if (data.items && data.items.length > 0) {
      const book = data.items[0].volumeInfo
      
      // Récupérer l'ISBN (ISBN-13 en priorité, sinon ISBN-10)
      const isbn13 = book.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier
      const isbn10 = book.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')?.identifier
      const isbn = isbn13 || isbn10
      
      // Google Books donne parfois des URLs en HTTP, on force HTTPS
      let coverUrl = book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail
      if (coverUrl) {
        coverUrl = coverUrl.replace('http:', 'https:')
        // Obtenir une meilleure qualité en enlevant le paramètre zoom
        coverUrl = coverUrl.replace('&zoom=1', '').replace('zoom=1', '')
      }
      
      return {
        coverUrl,
        isbn,
        pages: book.pageCount,
        publisher: book.publisher,
        description: book.description
      }
    }
    
    return null
  } catch (error) {
    console.error('Erreur lors de la récupération de la couverture:', error)
    return null
  }
}

/**
 * Recherche plusieurs couvertures de livres pour permettre le choix
 * @param title - Titre du livre
 * @param author - Auteur du livre
 * @param maxResults - Nombre maximum de résultats (par défaut 20)
 * @returns Liste de résultats
 */
export async function fetchMultipleBookCovers(
  title: string,
  author: string,
  maxResults: number = 20
): Promise<BookCoverResult[]> {
  try {
    const query = encodeURIComponent(`${title} ${author}`)
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${query}&key=${GOOGLE_BOOKS_API_KEY}&maxResults=40`
    )
    
    if (!response.ok) {
      console.warn('Google Books API error:', response.status)
      return []
    }
    
    const data = await response.json()
    
    if (data.items && data.items.length > 0) {
      const results = data.items
        .map((item: any) => {
          const book = item.volumeInfo
          
          const isbn13 = book.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier
          const isbn10 = book.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')?.identifier
          const isbn = isbn13 || isbn10
          
          // Essayer d'obtenir la meilleure qualité d'image
          let coverUrl = book.imageLinks?.large || 
                        book.imageLinks?.medium || 
                        book.imageLinks?.thumbnail || 
                        book.imageLinks?.smallThumbnail
          
          if (coverUrl) {
            coverUrl = coverUrl.replace('http:', 'https:')
            // Supprimer les paramètres de zoom pour avoir la meilleure qualité
            coverUrl = coverUrl.replace(/[&?]zoom=\d+/, '')
            coverUrl = coverUrl.replace(/[&?]edge=curl/, '')
            // Essayer d'obtenir une image plus grande
            coverUrl = coverUrl.replace('&printsec=frontcover', '')
          }
          
          return {
            coverUrl,
            isbn,
            pages: book.pageCount,
            publisher: book.publisher,
            description: book.description?.substring(0, 100)
          }
        })
        .filter((result: BookCoverResult) => {
          // Filtrer les couvertures vides/invalides
          if (!result.coverUrl) return false
          
          // Filtrer les URLs qui contiennent "no-cover" ou "placeholder"
          if (result.coverUrl.includes('no-cover') || 
              result.coverUrl.includes('placeholder') ||
              result.coverUrl.includes('default')) {
            return false
          }
          
          return true
        })
      
      // Supprimer les doublons par URL
      const uniqueResults = results.filter((result: BookCoverResult, index: number, self: BookCoverResult[]) => 
        index === self.findIndex((r) => r.coverUrl === result.coverUrl)
      )
      
      return uniqueResults.slice(0, maxResults)
    }
    
    return []
  } catch (error) {
    console.error('Erreur lors de la récupération des couvertures:', error)
    return []
  }
}

