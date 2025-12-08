/**
 * Script de debug pour tester l'API et le stockage des couvertures
 * Ouvre la console du navigateur et exécute: window.debugBookCover()
 */

import { useStore } from '../store/useStore'
import { fetchBookCover } from './bookCoverAPI'

async function debugBookCover() {
  console.group('🔍 DEBUG - Book Cover API')
  
  // 1. Test de l'API
  console.log('\n📡 Test 1: Appel API Open Library')
  try {
    const result = await fetchBookCover('Dune', 'Frank Herbert')
    console.log('✅ Résultat:', result)
    
    if (result?.coverUrl) {
      console.log('✅ URL trouvée:', result.coverUrl)
      console.log('📄 Pages:', result.pages)
      console.log('📚 ISBN:', result.isbn)
    } else {
      console.warn('⚠️ Aucune couverture trouvée')
    }
  } catch (error) {
    console.error('❌ Erreur API:', error)
  }
  
  // 2. Test d'ajout dans le store
  console.log('\n💾 Test 2: Ajout dans le store')
  try {
    const store = useStore.getState()
    const initialCount = store.books.length
    
    console.log(`📊 Livres actuels: ${initialCount}`)
    
    // Ajouter un livre de test avec coverUrl
    const testCoverUrl = 'https://covers.openlibrary.org/b/isbn/0441172717-L.jpg'
    store.addBook({
      title: 'Test Debug',
      author: 'Test Author',
      coverColor: 'from-blue-500 to-purple-600',
      coverUrl: testCoverUrl, // ← Avec coverUrl
      status: 'to-read',
      pages: 100
    })
    
    // Vérifier
    const newBooks = useStore.getState().books
    const testBook = newBooks.find(b => b.title === 'Test Debug')
    
    if (testBook) {
      console.log('✅ Livre ajouté:', testBook.title)
      console.log('🖼️ coverUrl:', testBook.coverUrl)
      console.log('🎨 coverColor:', testBook.coverColor)
      
      if (testBook.coverUrl === testCoverUrl) {
        console.log('✅ SUCCESS: coverUrl est bien stocké!')
      } else {
        console.error('❌ PROBLÈME: coverUrl non stocké correctement')
        console.log('Attendu:', testCoverUrl)
        console.log('Reçu:', testBook.coverUrl)
      }
    } else {
      console.error('❌ Livre non trouvé dans le store')
    }
    
  } catch (error) {
    console.error('❌ Erreur store:', error)
  }
  
  // 3. Vérifier tous les livres existants
  console.log('\n📚 Test 3: Livres existants')
  const allBooks = useStore.getState().books
  console.log(`Total: ${allBooks.length} livres`)
  
  const booksWithCover = allBooks.filter(b => b.coverUrl)
  const booksWithoutCover = allBooks.filter(b => !b.coverUrl)
  
  console.log(`🖼️ Avec coverUrl: ${booksWithCover.length}`)
  console.log(`🎨 Sans coverUrl: ${booksWithoutCover.length}`)
  
  if (booksWithCover.length > 0) {
    console.log('\n📋 Livres avec couverture:')
    booksWithCover.forEach(b => {
      console.log(`  - ${b.title}: ${b.coverUrl}`)
    })
  }
  
  console.groupEnd()
  
  return {
    success: true,
    booksWithCover: booksWithCover.length,
    totalBooks: allBooks.length
  }
}

// Exposer globalement
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.debugBookCover = debugBookCover
  console.log('✅ Debug disponible: Tapez window.debugBookCover() dans la console')
}

export { debugBookCover }

