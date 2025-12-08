/**
 * Test rapide de l'API Google Books
 * Pour tester : importer et appeler testBookCoverAPI() dans la console
 */

import { fetchBookCover } from './bookCoverAPI'

export async function testBookCoverAPI() {
  console.group('🧪 Test Google Books API')
  
  const testBooks = [
    { title: 'Dune', author: 'Frank Herbert' },
    { title: '1984', author: 'George Orwell' },
    { title: 'Le Petit Prince', author: 'Antoine de Saint-Exupéry' },
    { title: 'Harry Potter', author: 'J.K. Rowling' },
    { title: 'Livre Inexistant XYZ', author: 'Auteur Fictif' }
  ]
  
  for (const book of testBooks) {
    console.log(`\n📖 Test: "${book.title}" par ${book.author}`)
    
    try {
      const result = await fetchBookCover(book.title, book.author)
      
      if (result?.coverUrl) {
        console.log('✅ Couverture trouvée:', result.coverUrl)
        console.log('   Pages:', result.pages || 'N/A')
        console.log('   ISBN:', result.isbn || 'N/A')
        console.log('   Éditeur:', result.publisher || 'N/A')
      } else {
        console.log('❌ Aucune couverture trouvée')
      }
    } catch (error) {
      console.error('❌ Erreur:', error)
    }
  }
  
  console.groupEnd()
}

// Pour tester dans la console du navigateur :
// import { testBookCoverAPI } from './utils/testBookCoverAPI'
// testBookCoverAPI()

if (typeof window !== 'undefined') {
  // @ts-ignore - exposer pour debug
  window.testBookCoverAPI = testBookCoverAPI
}

