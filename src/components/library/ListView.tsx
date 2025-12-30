import { memo } from 'react'
import { Book } from '../../types/library'

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
      className="w-full text-left px-4 md:px-8 py-4 md:py-5 hover:bg-zinc-950/50 transition-colors group flex items-center gap-4 md:gap-8"
    >
      {/* Titre et auteur */}
      <div className="flex-1 min-w-0">
        <div className="text-sm md:text-base text-white group-hover:text-zinc-300 transition-colors line-clamp-1">
          {book.title}
        </div>
        <div className="text-xs md:text-sm text-zinc-600 line-clamp-1 mt-0.5 md:mt-1">
          {book.author}
        </div>
      </div>

      {/* Métadonnées compactes */}
      <div className="flex items-center gap-4 md:gap-8 text-xs md:text-sm text-zinc-700">
        {/* Genre */}
        {book.genre && (
          <span className="hidden md:block">{book.genre}</span>
        )}
        
        {/* Pages */}
        {book.pages && (
          <span>{book.pages}p</span>
        )}
        
        {/* Progress si en cours */}
        {book.status === 'reading' && progress > 0 && (
          <span className="text-zinc-600">{progress}%</span>
        )}
        
        {/* Indicateur discret statut */}
        {book.status === 'reading' && (
          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
        )}
      </div>
    </button>
  )
}

