import { Book } from '../types/library'

/**
 * Exporte la bibliothèque en JSON
 */
export function exportLibrary(books: Book[]): void {
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    books: books
  }
  
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `bibliotheque-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Importe une bibliothèque depuis JSON
 */
export function importLibrary(file: File): Promise<Book[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)
        
        // Validation basique
        if (!data.books || !Array.isArray(data.books)) {
          throw new Error('Format de fichier invalide')
        }
        
        // Validation des livres
        const books: Book[] = data.books.map((book: any) => {
          if (!book.title || !book.author) {
            throw new Error('Données de livre invalides')
          }
          
          return {
            ...book,
            // S'assurer que les champs requis existent
            id: book.id || Math.random().toString(36).substring(2, 9),
            addedAt: book.addedAt || Date.now(),
            updatedAt: book.updatedAt || Date.now(),
            quotes: book.quotes || [],
            notes: book.notes || [],
            totalReadingTime: book.totalReadingTime || 0,
            sessionsCount: book.sessionsCount || 0
          }
        })
        
        resolve(books)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'))
    reader.readAsText(file)
  })
}

/**
 * Exporte les citations en Markdown
 */
export function exportQuotesAsMarkdown(books: Book[]): void {
  let markdown = '# Mes Citations\n\n'
  
  books.forEach(book => {
    if (book.quotes && book.quotes.length > 0) {
      markdown += `## ${book.title}\n`
      markdown += `*${book.author}*\n\n`
      
      book.quotes.forEach(quote => {
        markdown += `> ${quote.text}\n`
        if (quote.page) {
          markdown += `\n*Page ${quote.page}*\n`
        }
        markdown += '\n'
      })
      
      markdown += '\n---\n\n'
    }
  })
  
  const blob = new Blob([markdown], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `citations-${new Date().toISOString().split('T')[0]}.md`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

