import { useRef, useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
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
      
      if (result) {
        setCoverUrl(result)
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
      <h2 className="text-xl font-semibold text-zinc-200 mb-6 -mt-2">
        Ajouter un livre
      </h2>
      
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
        
        <Button 
          type="button"
          variant="ghost"
          size="sm"
          icon={Search}
          onClick={searchCover}
          disabled={isLoadingCover || !title.trim() || !author.trim()}
        >
          {isLoadingCover ? 'Recherche...' : 'Chercher couverture'}
        </Button>
        
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
        
        <div className="flex flex-wrap gap-2">
          {BOOK_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setSelectedColor(color)}
              className={`w-7 h-9 rounded bg-gradient-to-br ${color} transition-transform ${
                selectedColor === color ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
              }`}
            />
          ))}
        </div>
      </form>
    </Modal>
  )
}
