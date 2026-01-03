import { useState, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '../../ui/Button'
import { fetchMultipleBookCovers, BookCoverResult } from '../../../utils/bookCoverAPI'

interface CoverSearchWidgetProps {
  bookTitle: string
  bookAuthor: string
  currentPages?: number
  onApplyCover: (coverUrl: string) => void
}

export function CoverSearchWidget({ bookTitle, bookAuthor, onApplyCover }: CoverSearchWidgetProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [coverOptions, setCoverOptions] = useState<BookCoverResult[]>([])
  const [selectedCoverUrl, setSelectedCoverUrl] = useState<string>()

  const handleSearch = useCallback(async () => {
    setIsLoading(true)
    try {
      const results = await fetchMultipleBookCovers([{ title: bookTitle, author: bookAuthor }])
      if (results.length > 0) {
        setCoverOptions(results)
        setSelectedCoverUrl(results[0].url)
      }
    } catch (error) {
      console.error('Erreur recherche couverture:', error)
    } finally {
      setIsLoading(false)
    }
  }, [bookTitle, bookAuthor])

  const handleApply = useCallback(() => {
    if (selectedCoverUrl) {
      onApplyCover(selectedCoverUrl)
      setCoverOptions([])
      setSelectedCoverUrl(undefined)
    }
  }, [selectedCoverUrl, onApplyCover])

  const handleCancel = useCallback(() => {
    setCoverOptions([])
    setSelectedCoverUrl(undefined)
  }, [])

  if (coverOptions.length === 0) {
    return (
      <Button
        variant="ghost"
        size="sm"
        icon={Search}
        onClick={handleSearch}
        disabled={isLoading}
      >
        {isLoading ? 'Recherche...' : 'Chercher couverture'}
      </Button>
    )
  }

  return (
    <div className="space-y-3 p-4 bg-zinc-800/30 rounded-xl border border-zinc-800">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-300">Choisir une couverture</p>
        <button
          onClick={handleCancel}
          className="p-1 text-zinc-500 hover:text-zinc-300 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {coverOptions.map((option, index) => (
          <button
            key={index}
            onClick={() => setSelectedCoverUrl(option.url)}
            className={`relative aspect-[2/3] rounded-lg overflow-hidden border-2 transition-all ${
              selectedCoverUrl === option.url
                ? 'border-amber-500 scale-105'
                : 'border-zinc-700 hover:border-zinc-600'
            }`}
          >
            <img
              src={option.url}
              alt={`Option ${index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = ''
                e.currentTarget.style.display = 'none'
              }}
            />
            {selectedCoverUrl === option.url && (
              <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={handleCancel} className="flex-1">
          Annuler
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleApply}
          disabled={!selectedCoverUrl}
          className="flex-1"
        >
          Appliquer
        </Button>
      </div>
    </div>
  )
}

