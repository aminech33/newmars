import { Play } from 'lucide-react'
import { Book } from '../../../types/library'
import { getBookProgress, truncateText } from '../../../utils/libraryFormatters'

interface BookshelfProps {
  books: Book[]
  onSelectBook: (book: Book) => void
  onStartReading: (bookId: string) => void
  isReadingSession: boolean
  currentReadingBookId: string | null
}

export function Bookshelf({ 
  books, 
  onSelectBook,
  onStartReading,
  isReadingSession,
  currentReadingBookId
}: BookshelfProps) {
  return (
    <div 
      className="relative rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #3d2817 0%, #2a1a0f 50%, #1a0f08 100%)',
        boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.05)'
      }}
      role="list"
      aria-label="Étagère de livres"
    >
      {/* Texture grain de bois */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)`
        }}
        aria-hidden="true"
      />
      
      {/* Livres */}
      <div className="relative flex flex-wrap items-end gap-2 p-4 pt-6 min-h-[180px]">
        {books.map((book, index) => (
          <BookSpine
            key={book.id}
            book={book}
            index={index}
            onSelect={() => onSelectBook(book)}
            onStartReading={() => onStartReading(book.id)}
            isReadingSession={isReadingSession}
            isCurrentReading={currentReadingBookId === book.id}
          />
        ))}
        
        {books.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-8 opacity-50">
            <span className="text-sm text-zinc-500">Étagère vide</span>
          </div>
        )}
      </div>
      
      {/* Planche de l'étagère */}
      <div 
        className="h-4 rounded-b-xl"
        style={{
          background: 'linear-gradient(180deg, #4a3020 0%, #2d1c12 100%)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
        }}
        aria-hidden="true"
      />
    </div>
  )
}

// Composant individuel pour un livre
interface BookSpineProps {
  book: Book
  index: number
  onSelect: () => void
  onStartReading: () => void
  isReadingSession: boolean
  isCurrentReading: boolean
}

function BookSpine({ book, index, onSelect, onStartReading, isReadingSession, isCurrentReading }: BookSpineProps) {
  const progress = getBookProgress(book.currentPage, book.pages)
  
  return (
    <div 
      className="group relative flex-shrink-0" 
      style={{ animationDelay: `${index * 30}ms` }}
      role="listitem"
    >
      <button
        onClick={onSelect}
        className="relative transition-all duration-300 hover:-translate-y-3 hover:z-10 animate-fade-in focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-[#2a1a0f] rounded-sm"
        aria-label={`${book.title} par ${book.author}${book.status === 'reading' ? `, ${progress}% lu` : book.status === 'completed' ? ', terminé' : ', à lire'}`}
      >
        <div 
          className={`
            relative rounded-sm cursor-pointer overflow-hidden transition-all duration-300
            group-hover:shadow-xl group-hover:shadow-black/60
            ${book.status === 'reading' ? 'ring-2 ring-amber-500/60' : ''}
            ${isCurrentReading ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#2a1a0f]' : ''}
          `}
          style={{
            width: '48px',
            height: `${Math.max(100, Math.min(150, (book.pages || 200) / 3))}px`,
          }}
        >
          {/* Couverture */}
          <div className={`absolute inset-0 bg-gradient-to-br ${book.coverColor}`} />
          
          {/* Reliure */}
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-black/30" aria-hidden="true" />
          
          {/* Titre vertical */}
          <div className="absolute inset-0 flex items-center justify-center px-1">
            <span 
              className="text-[9px] font-medium text-white/90 whitespace-nowrap text-center leading-tight"
              style={{
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                transform: 'rotate(180deg)',
                maxHeight: '85%',
                overflow: 'hidden'
              }}
              aria-hidden="true"
            >
              {truncateText(book.title, 20)}
            </span>
          </div>
          
          {/* Barre de progression */}
          {book.status === 'reading' && book.pages && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50" aria-hidden="true">
              <div 
                className="h-full bg-amber-400" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          )}
          
          {/* Badge terminé */}
          {book.status === 'completed' && (
            <div 
              className="absolute top-1 right-1 w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center"
              aria-hidden="true"
            >
              <span className="text-[8px]">✓</span>
            </div>
          )}
          
          {/* Badge citations */}
          {book.quotes && book.quotes.length > 0 && (
            <div 
              className="absolute bottom-1 right-1 w-3 h-3 bg-violet-500 rounded-full flex items-center justify-center"
              aria-label={`${book.quotes.length} citations`}
            >
              <span className="text-[7px] text-white">{book.quotes.length}</span>
            </div>
          )}
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" aria-hidden="true" />
        </div>
      </button>
      
      {/* Bouton lecture rapide */}
      {book.status === 'reading' && !isReadingSession && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onStartReading()
          }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-amber-400 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-amber-300"
          aria-label={`Démarrer la lecture de ${book.title}`}
        >
          <Play className="w-3 h-3 text-black fill-black" aria-hidden="true" />
        </button>
      )}
      
      {/* Ombre portée */}
      <div 
        className="absolute -bottom-2 left-1 right-1 h-3 bg-black/40 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" 
        aria-hidden="true"
      />
      
      {/* Tooltip */}
      <div 
        className="absolute -top-12 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-900 text-xs text-zinc-300 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20"
        role="tooltip"
        aria-hidden="true"
      >
        {book.title}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
      </div>
    </div>
  )
}

