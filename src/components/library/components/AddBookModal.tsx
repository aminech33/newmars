import { useRef, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Book, BOOK_COLORS } from '../../../types/library'

type NewBookData = Omit<Book, 'id' | 'addedAt' | 'updatedAt' | 'quotes' | 'notes' | 'totalReadingTime' | 'sessionsCount'>

interface AddBookModalProps {
  onClose: () => void
  onAdd: (book: NewBookData) => void
}

export function AddBookModal({ onClose, onAdd }: AddBookModalProps) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [pages, setPages] = useState('')
  const [genre, setGenre] = useState('')
  const [selectedColor, setSelectedColor] = useState(BOOK_COLORS[0])
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Focus et fermeture avec Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    document.addEventListener('keydown', handleKeyDown)
    titleInputRef.current?.focus()
    
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !author.trim()) return
    
    const pagesNum = pages ? parseInt(pages, 10) : undefined
    if (pagesNum !== undefined && (isNaN(pagesNum) || pagesNum < 1)) return
    
    onAdd({
      title: title.trim(),
      author: author.trim(),
      coverColor: selectedColor,
      status: 'to-read',
      pages: pagesNum,
      genre: genre.trim() || undefined
    })
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-book-title"
    >
      <div 
        className="relative w-full max-w-md bg-mars-surface border border-zinc-800 rounded-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 id="add-book-title" className="text-lg font-semibold text-zinc-200">
              Ajouter un livre
            </h2>
            <button 
              type="button"
              onClick={onClose} 
              className="text-zinc-500 hover:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-500 rounded p-1"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="book-title" className="block text-sm text-zinc-500 mb-1">
                Titre <span className="text-rose-400">*</span>
              </label>
              <input
                ref={titleInputRef}
                id="book-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-900 text-zinc-200 rounded-lg border border-zinc-800 focus:outline-none focus:border-zinc-600 focus:ring-2 focus:ring-zinc-600/20"
                placeholder="Ex: Dune"
                required
                maxLength={200}
              />
            </div>
            
            <div>
              <label htmlFor="book-author" className="block text-sm text-zinc-500 mb-1">
                Auteur <span className="text-rose-400">*</span>
              </label>
              <input
                id="book-author"
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-900 text-zinc-200 rounded-lg border border-zinc-800 focus:outline-none focus:border-zinc-600 focus:ring-2 focus:ring-zinc-600/20"
                placeholder="Ex: Frank Herbert"
                required
                maxLength={100}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="book-pages" className="block text-sm text-zinc-500 mb-1">
                  Pages
                </label>
                <input
                  id="book-pages"
                  type="number"
                  value={pages}
                  onChange={(e) => setPages(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-900 text-zinc-200 rounded-lg border border-zinc-800 focus:outline-none focus:border-zinc-600 focus:ring-2 focus:ring-zinc-600/20"
                  placeholder="350"
                  min={1}
                  max={10000}
                />
              </div>
              
              <div>
                <label htmlFor="book-genre" className="block text-sm text-zinc-500 mb-1">
                  Genre
                </label>
                <input
                  id="book-genre"
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-900 text-zinc-200 rounded-lg border border-zinc-800 focus:outline-none focus:border-zinc-600 focus:ring-2 focus:ring-zinc-600/20"
                  placeholder="Science-Fiction"
                  maxLength={50}
                />
              </div>
            </div>
            
            {/* Couleur */}
            <fieldset>
              <legend className="block text-sm text-zinc-500 mb-2">
                Couleur de couverture
              </legend>
              <div className="flex flex-wrap gap-2" role="radiogroup">
                {BOOK_COLORS.map((color, index) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-10 rounded bg-gradient-to-br ${color} transition-all focus:outline-none focus:ring-2 focus:ring-white ${
                      selectedColor === color 
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-mars-surface scale-110' 
                        : 'hover:scale-105'
                    }`}
                    role="radio"
                    aria-checked={selectedColor === color}
                    aria-label={`Couleur ${index + 1}`}
                  />
                ))}
              </div>
            </fieldset>
          </div>
          
          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-500 rounded"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

