/**
 * Test de persistance des citations dans Local Storage
 * Ce fichier peut être exécuté dans la console du navigateur
 */

import { useStore } from './store/useStore'

export function testQuotePersistence() {
  console.log('🧪 Début du test de persistance des citations...\n')
  
  const store = useStore.getState()
  
  // Test 1: Vérifier l'état initial
  console.log('📊 Test 1: État initial')
  console.log(`- Nombre de livres: ${store.books.length}`)
  const totalQuotes = store.books.reduce((acc, book) => acc + (book.quotes?.length || 0), 0)
  console.log(`- Nombre total de citations: ${totalQuotes}\n`)
  
  // Test 2: Ajouter un livre de test
  console.log('📚 Test 2: Création d\'un livre de test')
  store.addBook({
    title: 'Test Book - Persistence',
    author: 'Test Author',
    coverColor: '#FF6B6B',
    status: 'reading',
    pages: 300,
    currentPage: 50
  })
  
  const testBook = store.books.find(b => b.title === 'Test Book - Persistence')
  if (!testBook) {
    console.error('❌ Erreur: Le livre de test n\'a pas été créé')
    return
  }
  console.log(`✅ Livre créé avec l'ID: ${testBook.id}\n`)
  
  // Test 3: Ajouter une citation
  console.log('💬 Test 3: Ajout d\'une citation')
  store.addQuote(testBook.id, {
    text: 'Ceci est une citation de test pour vérifier la persistance.',
    page: 42,
    isFavorite: false
  })
  
  const updatedBook = useStore.getState().books.find(b => b.id === testBook.id)
  if (!updatedBook || updatedBook.quotes.length === 0) {
    console.error('❌ Erreur: La citation n\'a pas été ajoutée')
    return
  }
  console.log(`✅ Citation ajoutée: "${updatedBook.quotes[0].text}"`)
  console.log(`   Page: ${updatedBook.quotes[0].page}\n`)
  
  // Test 4: Vérifier le Local Storage
  console.log('💾 Test 4: Vérification du Local Storage')
  const storageData = localStorage.getItem('newmars-storage')
  if (!storageData) {
    console.error('❌ Erreur: Aucune donnée dans le Local Storage')
    return
  }
  
  const parsedStorage = JSON.parse(storageData)
  const storageBook = parsedStorage.state.books.find((b: any) => b.id === testBook.id)
  
  if (!storageBook) {
    console.error('❌ Erreur: Le livre n\'est pas dans le Local Storage')
    return
  }
  
  if (!storageBook.quotes || storageBook.quotes.length === 0) {
    console.error('❌ Erreur: Les citations ne sont pas dans le Local Storage')
    return
  }
  
  console.log('✅ Livre trouvé dans le Local Storage')
  console.log(`✅ Citations trouvées: ${storageBook.quotes.length}`)
  console.log(`   Texte: "${storageBook.quotes[0].text}"\n`)
  
  // Test 5: Modifier la citation
  console.log('✏️ Test 5: Modification de la citation')
  const quoteId = updatedBook.quotes[0].id
  store.updateQuote(testBook.id, quoteId, {
    text: 'Citation modifiée pour tester la persistance',
    page: 100,
    isFavorite: true
  })
  
  const modifiedBook = useStore.getState().books.find(b => b.id === testBook.id)
  const modifiedQuote = modifiedBook?.quotes.find(q => q.id === quoteId)
  
  if (!modifiedQuote || modifiedQuote.text !== 'Citation modifiée pour tester la persistance') {
    console.error('❌ Erreur: La citation n\'a pas été modifiée')
    return
  }
  console.log(`✅ Citation modifiée: "${modifiedQuote.text}"`)
  console.log(`   Nouvelle page: ${modifiedQuote.page}`)
  console.log(`   Favori: ${modifiedQuote.isFavorite}\n`)
  
  // Test 6: Vérifier la modification dans le Local Storage
  console.log('💾 Test 6: Vérification de la modification dans le Local Storage')
  const updatedStorageData = localStorage.getItem('newmars-storage')
  const updatedParsedStorage = JSON.parse(updatedStorageData!)
  const updatedStorageBook = updatedParsedStorage.state.books.find((b: any) => b.id === testBook.id)
  const updatedStorageQuote = updatedStorageBook.quotes.find((q: any) => q.id === quoteId)
  
  if (updatedStorageQuote.text !== 'Citation modifiée pour tester la persistance') {
    console.error('❌ Erreur: La modification n\'est pas dans le Local Storage')
    return
  }
  console.log('✅ Modification persistée dans le Local Storage\n')
  
  // Test 7: Supprimer la citation
  console.log('🗑️ Test 7: Suppression de la citation')
  store.deleteQuote(testBook.id, quoteId)
  
  const bookAfterDelete = useStore.getState().books.find(b => b.id === testBook.id)
  if (bookAfterDelete && bookAfterDelete.quotes.length > 0) {
    console.error('❌ Erreur: La citation n\'a pas été supprimée')
    return
  }
  console.log('✅ Citation supprimée du state\n')
  
  // Test 8: Vérifier la suppression dans le Local Storage
  console.log('💾 Test 8: Vérification de la suppression dans le Local Storage')
  const finalStorageData = localStorage.getItem('newmars-storage')
  const finalParsedStorage = JSON.parse(finalStorageData!)
  const finalStorageBook = finalParsedStorage.state.books.find((b: any) => b.id === testBook.id)
  
  if (finalStorageBook.quotes.length > 0) {
    console.error('❌ Erreur: La suppression n\'est pas dans le Local Storage')
    return
  }
  console.log('✅ Suppression persistée dans le Local Storage\n')
  
  // Nettoyage: Supprimer le livre de test
  console.log('🧹 Nettoyage: Suppression du livre de test')
  store.deleteBook(testBook.id)
  console.log('✅ Livre de test supprimé\n')
  
  // Résultat final
  console.log('🎉 TOUS LES TESTS SONT PASSÉS ! 🎉')
  console.log('✅ La persistance des citations fonctionne correctement')
  console.log('✅ Ajout → Sauvegardé')
  console.log('✅ Modification → Sauvegardée')
  console.log('✅ Suppression → Sauvegardée\n')
  
  return true
}

// Export pour utilisation dans la console
if (typeof window !== 'undefined') {
  (window as any).testQuotePersistence = testQuotePersistence
}

