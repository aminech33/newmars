import { memo, useMemo } from 'react'
import { Book } from '../../types/library'

interface LibraryHeroStatsProps {
  books: Book[]
  readingGoal?: number
}

export const LibraryHeroStats = memo(function LibraryHeroStats({ 
  books, 
  readingGoal 
}: LibraryHeroStatsProps) {
  const stats = useMemo(() => {
    const currentYear = new Date().getFullYear()
    
    // Total de livres
    const totalBooks = books.length
    
    // Livres terminés cette année
    const completedThisYear = books.filter(book => {
      if (book.status !== 'completed' || !book.completedAt) return false
      const completedDate = new Date(book.completedAt)
      return completedDate.getFullYear() === currentYear
    }).length
    
    // Pages lues cette année
    const pagesThisYear = books.reduce((sum, book) => {
      if (book.status !== 'completed' || !book.completedAt || !book.pages) return sum
      const completedDate = new Date(book.completedAt)
      if (completedDate.getFullYear() === currentYear) {
        return sum + book.pages
      }
      return sum
    }, 0)
    
    // Streak de lecture (jours consécutifs)
    const streak = calculateReadingStreak(books)
    
    // Progression vers l'objectif
    const goalProgress = readingGoal && readingGoal > 0
      ? Math.min(Math.round((completedThisYear / readingGoal) * 100), 100)
      : null
    
    return {
      totalBooks,
      completedThisYear,
      pagesThisYear,
      streak,
      goalProgress,
      currentYear
    }
  }, [books, readingGoal])

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
      {/* Total de livres */}
      <div className="space-y-1">
        <div className="text-4xl font-light text-zinc-100">{stats.totalBooks}</div>
        <div className="text-xs text-zinc-500">Livres</div>
      </div>
      
      {/* Pages lues cette année */}
      <div className="space-y-1">
        <div className="text-4xl font-light text-zinc-100">
          {stats.pagesThisYear.toLocaleString('fr-FR')}
        </div>
        <div className="text-xs text-zinc-500">Pages en {stats.currentYear}</div>
      </div>
      
      {/* Streak */}
      {stats.streak > 0 && (
        <div className="space-y-1">
          <div className="text-4xl font-light text-zinc-100">{stats.streak}</div>
          <div className="text-xs text-zinc-500">Jours consécutifs</div>
        </div>
      )}
      
      {/* Objectif annuel */}
      {stats.goalProgress !== null && (
        <div className="space-y-1">
          <div className="text-4xl font-light text-zinc-100">{stats.goalProgress}%</div>
          <div className="text-xs text-zinc-500">
            Objectif {stats.currentYear}
          </div>
        </div>
      )}
    </div>
  )
})

// Fonction pour calculer le streak de lecture
function calculateReadingStreak(books: Book[]): number {
  // Récupérer toutes les dates de complétion
  const completionDates = books
    .filter(book => book.status === 'completed' && book.completedAt)
    .map(book => {
      const date = new Date(book.completedAt!)
      // Normaliser à minuit pour comparer les jours
      return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
    })
    .sort((a, b) => b - a) // Trier du plus récent au plus ancien

  if (completionDates.length === 0) return 0

  const today = new Date()
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const oneDayMs = 24 * 60 * 60 * 1000

  // Vérifier si le streak est actif (livre terminé aujourd'hui ou hier)
  const mostRecentDate = completionDates[0]
  const daysSinceLastBook = Math.floor((todayMidnight - mostRecentDate) / oneDayMs)
  
  if (daysSinceLastBook > 1) {
    // Pas de livre depuis plus d'un jour, streak cassé
    return 0
  }

  // Compter les jours consécutifs
  let streak = 1
  let currentDate = mostRecentDate

  for (let i = 1; i < completionDates.length; i++) {
    const nextDate = completionDates[i]
    const daysDiff = Math.floor((currentDate - nextDate) / oneDayMs)

    if (daysDiff === 1) {
      // Jour consécutif
      streak++
      currentDate = nextDate
    } else if (daysDiff === 0) {
      // Même jour, continuer
      continue
    } else {
      // Trou dans le streak
      break
    }
  }

  return streak
}

