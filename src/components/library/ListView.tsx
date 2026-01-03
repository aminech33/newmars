import { memo } from 'react'
import { Book } from '../../types/library'
import { Star } from 'lucide-react'
import { GenreBadge } from './components/GenreBadge'

interface ListViewProps {
  books: Book[]
  onSelectBook: (book: Book) => void
}

export const ListView = memo(function ListView({ books, onSelectBook }: ListViewProps) {
  if (books.length === 0) {
    return (
      <div className="flex items-center justify-center p-24 text-zinc-600 text-sm">
        <p>Aucun livre</p>
      </div>
    )
  }

  return (
    <div className="space-y-px">
      {books.map((book) => (
        <BookListItem key={book.id} book={book} onClick={() => onSelectBook(book)} />
      ))}
    </div>
  )
})

interface BookListItemProps {
  book: Book
  onClick: () => void
}

function BookListItem({ book, onClick }: BookListItemProps) {
  const progress = book.pages && book.currentPage 
    ? Math.round((book.currentPage / book.pages) * 100) 
    : 0

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 md:px-8 py-4 md:py-5 hover:bg-zinc-950/50 transition-colors group flex items-center gap-4 md:gap-8 border-b border-zinc-900/50"
    >
      {/* Titre et auteur */}
      <div className="flex-1 min-w-0">
        <div className="text-sm md:text-base text-white group-hover:text-amber-400 transition-colors line-clamp-1 font-medium">
          {book.title}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs md:text-sm text-zinc-600 line-clamp-1">
            {book.author}
          </span>
          {book.genre && (
            <>
              <span className="text-zinc-800 hidden sm:inline">•</span>
              <div className="hidden sm:block">
                <GenreBadge genreId={book.genre} size="sm" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Métadonnées */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Rating */}
        {book.rating && book.rating > 0 && (
          <div className="hidden md:flex items-center gap-0.5">
            {Array.from({ length: book.rating }).map((_, i) => (
              <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
            ))}
          </div>
        )}
        
        {/* Pages */}
        {book.pages && (
          <span className="text-xs text-zinc-600 min-w-[3rem] text-right">{book.pages}p</span>
        )}
        
        {/* Progress si en cours */}
        {book.status === 'reading' && progress > 0 && (
          <div className="flex items-center gap-2 min-w-[4rem]">
            <div className="hidden md:block flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden w-16">
              <div 
                className="h-full bg-amber-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-amber-400 font-medium">{progress}%</span>
          </div>
        )}
        
        {/* Badge statut */}
        {book.status === 'completed' && (
          <div className="flex items-center justify-center w-6 h-6 bg-emerald-500/20 rounded-full">
            <span className="text-emerald-400 text-xs font-bold">✓</span>
          </div>
        )}
        
        {book.status === 'reading' && !progress && (
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
        )}
      </div>
    </button>
  )
}

