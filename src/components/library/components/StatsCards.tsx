import { BookOpen, Clock, TrendingUp, Star } from 'lucide-react'
import { formatReadingTime } from '../../../utils/libraryFormatters'

interface StatsCardsProps {
  totalBooks: number
  totalReadingTime: number
  totalPagesRead: number
  averageRating: number
}

export function StatsCards({ totalBooks, totalReadingTime, totalPagesRead, averageRating }: StatsCardsProps) {
  const stats = [
    {
      icon: BookOpen,
      label: 'Total',
      value: totalBooks.toString(),
      color: 'text-zinc-500'
    },
    {
      icon: Clock,
      label: 'Temps de lecture',
      value: formatReadingTime(totalReadingTime),
      color: 'text-amber-500'
    },
    {
      icon: TrendingUp,
      label: 'Pages lues',
      value: totalPagesRead.toString(),
      color: 'text-emerald-500'
    },
    {
      icon: Star,
      label: 'Note moyenne',
      value: averageRating ? averageRating.toString() : '-',
      color: 'text-violet-500'
    }
  ]

  return (
    <div 
      className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
      role="group"
      aria-label="Statistiques de lecture"
    >
      {stats.map((stat) => (
        <div 
          key={stat.label}
          className="bg-zinc-900/30 rounded-xl p-3 md:p-4 border border-zinc-800/30"
        >
          <div className={`flex items-center gap-2 ${stat.color} mb-1`}>
            <stat.icon className="w-4 h-4" aria-hidden="true" />
            <span className="text-xs">{stat.label}</span>
          </div>
          <p className="text-xl md:text-2xl font-semibold text-zinc-200">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  )
}

