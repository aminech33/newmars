import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { Book } from '../../../types/library'
import { getBookProgress } from '../../../utils/libraryFormatters'

interface ProgressEditorProps {
  book: Book
  onUpdate: (currentPage: number) => void
  onCancel: () => void
}

export function ProgressEditor({ book, onUpdate, onCancel }: ProgressEditorProps) {
  const [currentPage, setCurrentPage] = useState(book.currentPage || 0)

  const handleSave = () => {
    if (book.pages && currentPage >= 0 && currentPage <= book.pages) {
      onUpdate(currentPage)
    }
  }

  const progress = getBookProgress(currentPage, book.pages)

  return (
    <div className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-xl border border-zinc-700">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <input
            type="number"
            value={currentPage}
            onChange={(e) => setCurrentPage(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-24 px-3 py-1.5 bg-zinc-900 text-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            min={0}
            max={book.pages || 10000}
            autoFocus
          />
          <span className="text-sm text-zinc-500">/ {book.pages || '?'} pages</span>
        </div>
        
        {book.pages && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-zinc-500 font-medium">{progress}%</span>
          </div>
        )}
      </div>

      <div className="flex gap-1">
        <button
          onClick={handleSave}
          className="p-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition-colors"
          title="Sauvegarder"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={onCancel}
          className="p-2 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 rounded-lg transition-colors"
          title="Annuler"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}


