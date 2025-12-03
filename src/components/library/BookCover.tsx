import { memo } from 'react'
import { Book } from '../../types/library'
import { BookOpen, Star } from 'lucide-react'

interface BookCoverProps {
  book: Book
  onClick: () => void
}

export const BookCover = memo(function BookCover({ book, onClick }: BookCoverProps) {
  const progress = book.pages && book.currentPage 
    ? Math.round((book.currentPage / book.pages) * 100) 
    : 0

  const rating = book.rating || 0

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer animate-fade-in"
    >
      {/* Couverture */}
      <div 
        className={`
          relative w-full aspect-[2/3] rounded-lg overflow-hidden
          bg-gradient-to-br ${book.coverColor}
          shadow-lg shadow-black/20
          transition-all duration-300
          group-hover:shadow-2xl group-hover:shadow-black/40
          group-hover:scale-105 group-hover:-translate-y-2
          border border-white/10
        `}
      >
        {/* Effet brillance */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20"
        />
        
        {/* Titre & Auteur */}
        <div className="absolute inset-0 p-4 flex flex-col justify-between">
          <div className="text-center">
            <h3 className="text-sm md:text-base font-bold text-white leading-tight line-clamp-3 drop-shadow-lg">
              {book.title}
            </h3>
            <p className="text-xs text-white/80 mt-2 line-clamp-2 drop-shadow">
              {book.author}
            </p>
          </div>

          {/* Bottom info */}
          <div className="flex items-center justify-between">
            {book.pages && (
              <span className="text-xs text-white/70 bg-black/20 backdrop-blur-sm px-2 py-1 rounded">
                {book.pages}p
              </span>
            )}
            {book.status === 'reading' && (
              <div className="w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center animate-pulse">
                <BookOpen className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Progress bar si en cours */}
        {book.status === 'reading' && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
            <div 
              className="h-full bg-amber-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Badge completed */}
        {book.status === 'completed' && (
          <div className="absolute top-2 right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-xs font-bold">✓</span>
          </div>
        )}
      </div>

      {/* Info sous la couverture */}
      <div className="mt-3 px-1">
        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center gap-1 mb-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star 
                key={i}
                className={`w-3 h-3 ${
                  i < rating 
                    ? 'text-amber-400 fill-amber-400' 
                    : 'text-zinc-700'
                }`}
              />
            ))}
          </div>
        )}

        {/* Titre (au cas où tronqué sur couverture) */}
        <p className="text-xs text-zinc-400 line-clamp-1 group-hover:text-zinc-300 transition-colors">
          {book.title}
        </p>
        
        {/* Progress text si en cours */}
        {book.status === 'reading' && book.currentPage && book.pages && (
          <p className="text-xs text-amber-400 mt-1">
            Page {book.currentPage}/{book.pages}
          </p>
        )}
      </div>
    </div>
  )
})

