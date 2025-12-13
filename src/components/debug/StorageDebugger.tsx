import { useEffect, useState } from 'react'
import { useStore } from '../../store/useStore'

/**
 * Composant de débogage pour vérifier la persistance des citations
 * À utiliser uniquement en développement
 */
export function StorageDebugger() {
  const [localStorageData, setLocalStorageData] = useState<any>(null)
  const books = useStore((state) => state.books)

  useEffect(() => {
    // Lire le Local Storage
    const data = localStorage.getItem('newmars-storage')
    if (data) {
      try {
        const parsed = JSON.parse(data)
        setLocalStorageData(parsed)
      } catch (error) {
        console.error('Erreur de parsing du Local Storage:', error)
      }
    }
  }, [books]) // Se met à jour quand les livres changent

  const totalQuotes = books.reduce((acc, book) => acc + (book.quotes?.length || 0), 0)
  const totalBooks = books.length

  return (
    <div className="fixed bottom-4 right-4 bg-zinc-900 border border-zinc-700 rounded-lg p-4 max-w-sm shadow-2xl z-50">
      <h3 className="text-sm font-bold text-amber-400 mb-2">📊 Storage Debugger</h3>
      
      <div className="space-y-2 text-xs text-zinc-300">
        <div className="flex justify-between">
          <span className="text-zinc-500">Livres:</span>
          <span className="font-mono text-emerald-400">{totalBooks}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-zinc-500">Citations:</span>
          <span className="font-mono text-violet-400">{totalQuotes}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-zinc-500">Local Storage:</span>
          <span className={`font-mono ${localStorageData ? 'text-emerald-400' : 'text-rose-400'}`}>
            {localStorageData ? '✓ OK' : '✗ Vide'}
          </span>
        </div>
        
        <div className="border-t border-zinc-800 pt-2 mt-2">
          <p className="text-zinc-500 mb-1">Clé de stockage:</p>
          <code className="text-[10px] text-amber-400 break-all">newmars-storage</code>
        </div>
        
        {localStorageData?.state?.books && (
          <div className="border-t border-zinc-800 pt-2 mt-2">
            <p className="text-zinc-500 mb-1">Dernière sauvegarde:</p>
            <p className="text-[10px] text-emerald-400">
              {localStorageData.state.books.length} livre(s) persisté(s)
            </p>
          </div>
        )}
      </div>
      
      <button
        onClick={() => {
          console.log('=== LOCAL STORAGE DEBUG ===')
          console.log('Books in memory:', books)
          console.log('Local Storage raw:', localStorage.getItem('newmars-storage'))
          console.log('Local Storage parsed:', localStorageData)
          console.log('Total quotes:', totalQuotes)
        }}
        className="mt-3 w-full px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs transition-colors"
      >
        🔍 Log to Console
      </button>
    </div>
  )
}


