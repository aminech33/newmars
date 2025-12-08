import { useState, useRef, useEffect } from 'react'
import { BOOK_GENRES, getGenreById } from '../../../constants/bookGenres'
import { X } from 'lucide-react'

interface GenreSelectorProps {
  value?: string
  onChange: (genreId: string | undefined) => void
  placeholder?: string
}

export function GenreSelector({ value, onChange, placeholder = 'Sélectionner un genre...' }: GenreSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const selectedGenre = value ? getGenreById(value) : undefined
  
  // Filtrer les genres selon la recherche
  const filteredGenres = search
    ? BOOK_GENRES.filter(genre =>
        genre.label.toLowerCase().includes(search.toLowerCase()) ||
        genre.id.toLowerCase().includes(search.toLowerCase())
      )
    : BOOK_GENRES
  
  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const handleSelect = (genreId: string) => {
    onChange(genreId)
    setIsOpen(false)
    setSearch('')
  }
  
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(undefined)
  }
  
  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-zinc-300 mb-2">
        Genre
      </label>
      
      {/* Bouton de sélection */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen)
          setTimeout(() => inputRef.current?.focus(), 100)
        }}
        className="w-full px-4 py-2.5 bg-zinc-800 text-zinc-200 rounded-lg border border-zinc-700 hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors text-left flex items-center justify-between"
      >
        {selectedGenre ? (
          <div className="flex items-center gap-2">
            <span>{selectedGenre.emoji}</span>
            <span>{selectedGenre.label}</span>
          </div>
        ) : (
          <span className="text-zinc-500">{placeholder}</span>
        )}
        
        {selectedGenre ? (
          <button
            onClick={handleClear}
            className="p-1 hover:bg-zinc-700 rounded transition-colors"
            aria-label="Effacer"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>
      
      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden animate-scale-in">
          {/* Barre de recherche */}
          <div className="p-2 border-b border-zinc-700">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un genre..."
              className="w-full px-3 py-2 bg-zinc-900 text-zinc-200 text-sm rounded border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          
          {/* Liste des genres */}
          <div className="max-h-64 overflow-y-auto">
            {filteredGenres.length > 0 ? (
              filteredGenres.map((genre) => (
                <button
                  key={genre.id}
                  type="button"
                  onClick={() => handleSelect(genre.id)}
                  className={`w-full px-4 py-2.5 text-left hover:bg-zinc-700 transition-colors flex items-center gap-3 ${
                    value === genre.id ? 'bg-zinc-700' : ''
                  }`}
                >
                  <span className="text-xl">{genre.emoji}</span>
                  <div className="flex-1">
                    <div className="text-sm text-zinc-200">{genre.label}</div>
                    {genre.description && (
                      <div className="text-xs text-zinc-500">{genre.description}</div>
                    )}
                  </div>
                  {value === genre.id && (
                    <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-zinc-500 text-sm">
                Aucun genre trouvé
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

