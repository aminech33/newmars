/**
 * Service pour récupérer automatiquement les couvertures de livres
 * via Google Books API et Open Library API
 */

export interface BookCoverResult {
  url: string
  source: 'google' | 'openlibrary'
  quality: 'high' | 'medium' | 'low'
}

interface GoogleBooksResponse {
  items?: Array<{
    volumeInfo: {
      imageLinks?: {
        thumbnail?: string
        smallThumbnail?: string
      }
    }
  }>
}

interface OpenLibraryResponse {
  docs?: Array<{
    cover_i?: number
  }>
}

/**
 * Récupère l'URL de la couverture d'un livre via Google Books API
 */
async function fetchFromGoogleBooks(title: string, author: string): Promise<BookCoverResult | null> {
  try {
    const query = encodeURIComponent(`${title} ${author}`)
    const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=3`
    
    const response = await fetch(url)
    if (!response.ok) return null
    
    const data: GoogleBooksResponse = await response.json()
    
    if (data.items && data.items.length > 0) {
      const imageLinks = data.items[0].volumeInfo.imageLinks
      if (imageLinks) {
        // Préférer thumbnail, sinon smallThumbnail
        const coverUrl = imageLinks.thumbnail || imageLinks.smallThumbnail
        if (coverUrl) {
          // Remplacer http par https et augmenter la qualité
          const highQualityUrl = coverUrl
            .replace('http://', 'https://')
            .replace('&zoom=1', '&zoom=2') // Meilleure qualité
          
          return {
            url: highQualityUrl,
            source: 'google',
            quality: imageLinks.thumbnail ? 'high' : 'medium'
          }
        }
      }
    }
    
    return null
  } catch (error) {
    console.error('Error fetching from Google Books:', error)
    return null
  }
}

/**
 * Récupère l'URL de la couverture d'un livre via Open Library API
 */
async function fetchFromOpenLibrary(title: string, author: string): Promise<BookCoverResult | null> {
  try {
    const query = encodeURIComponent(`${title} ${author}`)
    const url = `https://openlibrary.org/search.json?q=${query}&limit=3`
    
    const response = await fetch(url)
    if (!response.ok) return null
    
    const data: OpenLibraryResponse = await response.json()
    
    if (data.docs && data.docs.length > 0 && data.docs[0].cover_i) {
      const coverId = data.docs[0].cover_i
      // Format: https://covers.openlibrary.org/b/id/{cover_id}-L.jpg
      return {
        url: `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`,
        source: 'openlibrary',
        quality: 'medium'
      }
    }
    
    return null
  } catch (error) {
    console.error('Error fetching from Open Library:', error)
    return null
  }
}

/**
 * Récupère l'URL de la couverture d'un livre en essayant plusieurs sources
 * @param title - Titre du livre
 * @param author - Auteur du livre
 * @returns URL de la couverture ou null si non trouvée
 */
export async function fetchBookCover(title: string, author: string): Promise<string | null> {
  const result = await fetchBookCoverWithDetails(title, author)
  return result ? result.url : null
}

/**
 * Récupère les détails de la couverture d'un livre
 * @param title - Titre du livre
 * @param author - Auteur du livre
 * @returns Détails de la couverture ou null si non trouvée
 */
export async function fetchBookCoverWithDetails(title: string, author: string): Promise<BookCoverResult | null> {
  if (!title || !author) return null
  
  try {
    // Essayer Google Books d'abord (meilleure qualité généralement)
    console.log(`🔍 Recherche de couverture pour "${title}" par ${author}...`)
    
    const googleResult = await fetchFromGoogleBooks(title, author)
    if (googleResult) {
      console.log('✅ Couverture trouvée via Google Books')
      return googleResult
    }
    
    // Fallback sur Open Library
    console.log('⚠️ Pas de couverture sur Google Books, essai avec Open Library...')
    const openLibResult = await fetchFromOpenLibrary(title, author)
    if (openLibResult) {
      console.log('✅ Couverture trouvée via Open Library')
      return openLibResult
    }
    
    console.log('❌ Aucune couverture trouvée')
    return null
  } catch (error) {
    console.error('Error fetching book cover:', error)
    return null
  }
}

/**
 * Récupère les couvertures pour plusieurs livres en parallèle
 * @param books - Liste de livres avec titre et auteur
 * @returns Array avec les résultats de couvertures trouvées
 */
export async function fetchMultipleBookCovers(
  books: Array<{ title: string; author: string }>
): Promise<BookCoverResult[]> {
  const results: BookCoverResult[] = []
  
  // Limiter à 3 requêtes en parallèle pour éviter le rate limiting
  const batchSize = 3
  
  for (let i = 0; i < books.length; i += batchSize) {
    const batch = books.slice(i, i + batchSize)
    const promises = batch.map(book => 
      fetchBookCoverWithDetails(book.title, book.author)
    )
    
    const batchResults = await Promise.all(promises)
    
    batchResults.forEach(result => {
      if (result) {
        results.push(result)
      }
    })
    
    // Petite pause entre les batches pour éviter le rate limiting
    if (i + batchSize < books.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  return results
}
