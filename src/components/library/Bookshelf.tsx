import { memo } from 'react'
import { Book } from '../../types/library'
import { BookCover } from './BookCover'

interface BookshelfProps {
  books: Book[]
  onSelectBook: (book: Book) => void
  onStartReading?: (bookId: string) => void
  isReadingSession?: boolean
  currentReadingBookId?: string | null
}

export const Bookshelf = memo(function Bookshelf({ 
  books, 
  onSelectBook,
}: BookshelfProps) {
  if (books.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 text-zinc-600">
        <p>Aucun livre dans cette section</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
      {books.map((book) => (
        <BookCover
          key={book.id}
          book={book}
          onClick={() => onSelectBook(book)}
        />
      ))}
    </div>
  )
})

