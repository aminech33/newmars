import { useRef, useEffect, useState } from 'react'
import { BookOpen, Plus, Search, X } from 'lucide-react'
import { Book, BOOK_COLORS } from '../../../types/library'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { fetchBookCover } from '../../../utils/bookCoverAPI'
import { GenreSelector } from './GenreSelector'

type NewBookData = Omit<Book, 'id' | 'addedAt' | 'updatedAt' | 'quotes' | 'notes' | 'totalReadingTime' | 'sessionsCount'>

interface AddBookModalProps {
  onClose: () => void
  onAdd: (book: NewBookData) => void
}

export function AddBookModal({ onClose, onAdd }: AddBookModalProps) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [pages, setPages] = useState('')
  const [genre, setGenre] = useState<string>()
  const [selectedColor, setSelectedColor] = useState(BOOK_COLORS[0])
  const [coverUrl, setCoverUrl] = useState<string>()
  const [isLoadingCover, setIsLoadingCover] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Auto-focus
  useEffect(() => {
    setTimeout(() => titleInputRef.current?.focus(), 100)
  }, [])

  // Fonction pour rechercher automatiquement la couverture
  const searchCover = async () => {
    if (!title.trim() || !author.trim()) return
    
    setIsLoadingCover(true)
    try {
      const result = await fetchBookCover(title.trim(), author.trim())
      
      if (result?.coverUrl) {
        setCoverUrl(result.coverUrl)
        
        // Remplir automatiquement les pages si trouvées et non déjà renseignées
        if (result.pages && !pages) {
          setPages(result.pages.toString())
        }
      }
    } catch (error) {
      console.error('Erreur recherche couverture:', error)
    } finally {
      setIsLoadingCover(false)
    }
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!title.trim() || !author.trim()) return
    
    const pagesNum = pages ? parseInt(pages, 10) : undefined
    if (pagesNum !== undefined && (isNaN(pagesNum) || pagesNum < 1)) return
    
    onAdd({
      title: title.trim(),
      author: author.trim(),
      coverColor: selectedColor,
      coverUrl: coverUrl, // Ajouter l'URL de la couverture
      status: 'to-read',
      pages: pagesNum,
      genre: genre // Maintenant c'est un ID de genre
    })
  }

  const isValid = title.trim() && author.trim()

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            variant="warning"
            icon={Plus}
            onClick={() => handleSubmit()}
            disabled={!isValid}
          >
            Ajouter
          </Button>
        </>
      }
    >
      {/* Header with icon */}
      <div className="flex items-center gap-3 mb-6 -mt-2">
        <div className="p-2 bg-amber-500/20 rounded-xl">
          <BookOpen className="w-5 h-5 text-amber-400" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-200">
          Ajouter un livre
        </h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          ref={titleInputRef}
          label="Titre"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Dune"
          required
          maxLength={200}
        />
        
        <Input
          label="Auteur"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Ex: Frank Herbert"
          required
          maxLength={100}
        />
        
        {/* Bouton recherche couverture */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button 
              type="button"
              variant="ghost"
              icon={Search}
              onClick={searchCover}
              disabled={isLoadingCover || !title.trim() || !author.trim()}
              className="flex-1"
            >
              {isLoadingCover ? 'Recherche...' : 'Chercher la couverture'}
            </Button>
            
            {coverUrl && (
              <button
                type="button"
                onClick={() => setCoverUrl(undefined)}
                className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Supprimer la couverture"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Aperçu de la couverture */}
          {coverUrl && (
            <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <img 
                src={coverUrl} 
                alt="Aperçu de la couverture"
                className="w-12 h-16 object-cover rounded shadow-lg"
                onError={() => {
                  setCoverUrl(undefined)
                  console.warn('Image de couverture invalide')
                }}
              />
              <div className="text-xs text-zinc-400">
                <p className="text-emerald-400 font-medium mb-1">✓ Couverture trouvée</p>
                <p>Google Books</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Pages"
            type="number"
            value={pages}
            onChange={(e) => setPages(e.target.value)}
            placeholder="350"
            min={1}
            max={10000}
          />
          
          <div>
            <GenreSelector
              value={genre}
              onChange={setGenre}
            />
          </div>
        </div>
        
        {/* Couleur */}
        <fieldset>
          <legend className="block text-sm font-medium text-zinc-300 mb-2">
            Couleur de couverture
          </legend>
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {BOOK_COLORS.map((color, index) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-10 rounded bg-gradient-to-br ${color} transition-colors focus:outline-none focus:ring-2 focus:ring-white ${
                  selectedColor === color 
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110' 
                    : 'hover:scale-105'
                }`}
                role="radio"
                aria-checked={selectedColor === color}
                aria-label={`Couleur ${index + 1}`}
              />
            ))}
          </div>
        </fieldset>
      </form>
    </Modal>
  )
}
