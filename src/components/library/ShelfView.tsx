import { memo } from 'react'
import { Book } from '../../types/library'

interface ShelfViewProps {
  books: Book[]
  onSelectBook: (book: Book) => void
}

export const ShelfView = memo(function ShelfView({ books, onSelectBook }: ShelfViewProps) {
  if (books.length === 0) {
    return (
      <div className="flex items-center justify-center p-24 text-zinc-600 text-sm">
        <p>Aucun livre</p>
      </div>
    )
  }

  // Grouper les livres par étagères (8 livres par étagère)
  const booksPerShelf = 8
  const shelves: Book[][] = []
  for (let i = 0; i < books.length; i += booksPerShelf) {
    shelves.push(books.slice(i, i + booksPerShelf))
  }

  return (
    <div className="space-y-12 md:space-y-16 py-4 md:py-8">
      {shelves.map((shelfBooks, shelfIndex) => (
        <div key={shelfIndex} className="relative">
          {/* Livres */}
          <div className="flex items-end gap-1.5 md:gap-2 px-4 md:px-8 pb-3">
            {shelfBooks.map((book) => (
              <ShelfBook key={book.id} book={book} onClick={() => onSelectBook(book)} />
            ))}
          </div>
          
          {/* Étagère minimaliste */}
          <div className="h-px bg-zinc-800/50" />
        </div>
      ))}
    </div>
  )
})

interface ShelfBookProps {
  book: Book
  onClick: () => void
}

function ShelfBook({ book, onClick }: ShelfBookProps) {
  return (
    <button
      onClick={onClick}
      className="group flex-shrink-0 w-24 h-36 md:w-32 md:h-48 relative transition-transform duration-200 hover:-translate-y-1 focus:outline-none focus:ring-1 focus:ring-zinc-700"
    >
      {/* Couverture simple */}
      <div 
        className={`
          w-full h-full rounded-sm
          ${book.coverUrl ? '' : `bg-gradient-to-br ${book.coverColor}`}
          relative overflow-hidden
        `}
      >
        {book.coverUrl ? (
          <img 
            src={book.coverUrl} 
            alt={book.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-2">
            <p className="text-[9px] text-white/80 text-center line-clamp-4 font-medium">
              {book.title}
            </p>
          </div>
        )}
        
        {/* Indicateur discret en cours */}
        {book.status === 'reading' && (
          <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-400 rounded-full" />
        )}
      </div>
      
      {/* Titre au survol uniquement */}
      <div className="absolute -bottom-10 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-xs text-zinc-500 text-center line-clamp-1">
          {book.title}
        </p>
      </div>
    </button>
  )
}

