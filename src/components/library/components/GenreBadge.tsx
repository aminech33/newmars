import { getGenreById, getGenreColor, getGenreEmoji } from '../../../constants/bookGenres'

interface GenreBadgeProps {
  genreId: string
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg'
}

export function GenreBadge({ genreId, onClick, size = 'md' }: GenreBadgeProps) {
  const genre = getGenreById(genreId)
  
  if (!genre) {
    // Fallback pour les anciens genres (texte libre)
    return (
      <span
        onClick={onClick}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border bg-zinc-500/20 text-zinc-400 border-zinc-500/30 ${
          onClick ? 'cursor-pointer hover:bg-zinc-500/30 transition-colors' : ''
        } ${
          size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs'
        }`}
      >
        📚 {genreId}
      </span>
    )
  }
  
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border ${genre.color} ${
        onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''
      } ${
        size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs'
      }`}
      title={genre.label}
    >
      <span>{genre.emoji}</span>
      <span className="font-medium">{genre.label}</span>
    </span>
  )
}

