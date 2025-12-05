import { useMemo } from 'react'
import { ArrowLeft, BookOpen, Clock, Star, TrendingUp, Award, Calendar } from 'lucide-react'
import { Book } from '../../../types/library'
import { ReadingChart } from './ReadingChart'

interface LibraryStatsPageProps {
  books: Book[]
  onBack: () => void
}

export function LibraryStatsPage({ books, onBack }: LibraryStatsPageProps) {
  // Stats globales
  const stats = useMemo(() => {
    const completed = books.filter(b => b.status === 'completed')
    const totalPages = books.reduce((sum, b) => sum + (b.currentPage || 0), 0)
    const totalTime = books.reduce((sum, b) => sum + (b.totalReadingTime || 0), 0)
    const avgRating = completed.length > 0
      ? completed.reduce((sum, b) => sum + (b.rating || 0), 0) / completed.length
      : 0
    
    return {
      totalBooks: books.length,
      completedBooks: completed.length,
      totalPages,
      totalTime,
      avgRating: avgRating.toFixed(1),
      inProgress: books.filter(b => b.status === 'reading').length,
      toRead: books.filter(b => b.status === 'to-read').length
    }
  }, [books])

  // Top auteurs
  const topAuthors = useMemo(() => {
    const authorCounts = books.reduce((acc, book) => {
      acc[book.author] = (acc[book.author] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(authorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
  }, [books])

  // Top livres (par rating)
  const topBooks = useMemo(() => {
    return books
      .filter(b => b.rating && b.rating > 0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5)
  }, [books])

  // Stats par année
  const yearStats = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const lastYear = currentYear - 1
    
    const currentYearBooks = books.filter(b => {
      if (!b.finishedAt) return false
      const year = new Date(b.finishedAt).getFullYear()
      return year === currentYear
    }).length
    
    const lastYearBooks = books.filter(b => {
      if (!b.finishedAt) return false
      const year = new Date(b.finishedAt).getFullYear()
      return year === lastYear
    }).length
    
    const diff = currentYearBooks - lastYearBooks
    const percentChange = lastYearBooks > 0 ? ((diff / lastYearBooks) * 100).toFixed(0) : '0'
    
    return {
      currentYear,
      currentYearBooks,
      lastYear,
      lastYearBooks,
      diff,
      percentChange,
      isPositive: diff >= 0
    }
  }, [books])

  return (
    <div className="min-h-screen w-full bg-mars-bg overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="p-2 hover:bg-zinc-900/50 rounded-xl transition-colors"
            aria-label="Retour à la bibliothèque"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
              <TrendingUp className="w-7 h-7 text-amber-400" />
              Statistiques de lecture
            </h1>
            <p className="text-sm text-zinc-600 mt-1">
              Analyse complète de votre bibliothèque
            </p>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Books */}
          <div className="p-6 bg-zinc-900/30 backdrop-blur-xl rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <BookOpen className="w-8 h-8 text-cyan-400" />
              <span className="text-xs text-zinc-600 uppercase tracking-wide">Total</span>
            </div>
            <div className="text-4xl font-bold text-white mb-1">{stats.totalBooks}</div>
            <div className="text-sm text-zinc-500">Livres dans la bibliothèque</div>
          </div>

          {/* Completed */}
          <div className="p-6 bg-zinc-900/30 backdrop-blur-xl rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <Award className="w-8 h-8 text-emerald-400" />
              <span className="text-xs text-zinc-600 uppercase tracking-wide">Terminés</span>
            </div>
            <div className="text-4xl font-bold text-white mb-1">{stats.completedBooks}</div>
            <div className="text-sm text-zinc-500">Livres complétés</div>
          </div>

          {/* Total Pages */}
          <div className="p-6 bg-zinc-900/30 backdrop-blur-xl rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8 text-violet-400" />
              <span className="text-xs text-zinc-600 uppercase tracking-wide">Pages</span>
            </div>
            <div className="text-4xl font-bold text-white mb-1">
              {stats.totalPages.toLocaleString()}
            </div>
            <div className="text-sm text-zinc-500">Pages lues</div>
          </div>

          {/* Reading Time */}
          <div className="p-6 bg-zinc-900/30 backdrop-blur-xl rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-amber-400" />
              <span className="text-xs text-zinc-600 uppercase tracking-wide">Temps</span>
            </div>
            <div className="text-4xl font-bold text-white mb-1">
              {Math.floor(stats.totalTime / 60)}h
            </div>
            <div className="text-sm text-zinc-500">Temps de lecture</div>
          </div>
        </div>

        {/* Year Comparison + Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Year Comparison */}
          <div className="p-6 bg-zinc-900/30 backdrop-blur-xl rounded-2xl border border-white/10">
            <h3 className="text-lg font-semibold text-zinc-200 mb-4">Comparaison annuelle</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400">{yearStats.currentYear}</span>
                  <span className="text-2xl font-bold text-amber-400">{yearStats.currentYearBooks}</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-400 transition-colors"
                    style={{ width: `${Math.min(100, (yearStats.currentYearBooks / 50) * 100)}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400">{yearStats.lastYear}</span>
                  <span className="text-2xl font-bold text-zinc-600">{yearStats.lastYearBooks}</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-zinc-600 transition-colors"
                    style={{ width: `${Math.min(100, (yearStats.lastYearBooks / 50) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-white/10 text-center">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                yearStats.isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                <TrendingUp className={`w-4 h-4 ${yearStats.isPositive ? '' : 'rotate-180'}`} />
                <span className="text-sm font-semibold">
                  {yearStats.isPositive ? '+' : ''}{yearStats.percentChange}%
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                {yearStats.isPositive ? 'En progression' : 'En baisse'} par rapport à {yearStats.lastYear}
              </p>
            </div>
          </div>

          {/* Reading Chart */}
          <div className="lg:col-span-2">
            <ReadingChart books={books} />
          </div>
        </div>

        {/* Top Authors & Top Books */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Authors */}
          <div className="p-6 bg-zinc-900/30 backdrop-blur-xl rounded-2xl border border-white/10">
            <h3 className="text-lg font-semibold text-zinc-200 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-cyan-400" />
              Top 5 Auteurs
            </h3>
            {topAuthors.length === 0 ? (
              <p className="text-sm text-zinc-600 text-center py-8">Aucun auteur</p>
            ) : (
              <div className="space-y-3">
                {topAuthors.map(([author, count], index) => (
                  <div key={author} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-amber-500/20 text-amber-400' :
                      index === 1 ? 'bg-zinc-700/50 text-zinc-400' :
                      index === 2 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-zinc-800/50 text-zinc-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 truncate">{author}</p>
                    </div>
                    <div className="text-lg font-bold text-white">{count}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Books */}
          <div className="p-6 bg-zinc-900/30 backdrop-blur-xl rounded-2xl border border-white/10">
            <h3 className="text-lg font-semibold text-zinc-200 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              Top 5 Livres
            </h3>
            {topBooks.length === 0 ? (
              <p className="text-sm text-zinc-600 text-center py-8">Aucune note</p>
            ) : (
              <div className="space-y-3">
                {topBooks.map((book) => (
                  <div key={book.id} className="flex items-start gap-3">
                    <div 
                      className={`w-6 h-8 rounded-sm bg-gradient-to-br ${book.coverColor} flex-shrink-0 shadow-md`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 truncate font-medium">{book.title}</p>
                      <p className="text-xs text-zinc-600 truncate">{book.author}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-bold text-amber-400">{book.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* In Progress */}
          <div className="p-6 bg-zinc-900/30 backdrop-blur-xl rounded-2xl border border-white/10">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">{stats.inProgress}</div>
              <div className="text-sm text-zinc-600">Livres en cours</div>
            </div>
          </div>

          {/* To Read */}
          <div className="p-6 bg-zinc-900/30 backdrop-blur-xl rounded-2xl border border-white/10">
            <div className="text-center">
              <div className="text-3xl font-bold text-violet-400 mb-2">{stats.toRead}</div>
              <div className="text-sm text-zinc-600">À lire</div>
            </div>
          </div>

          {/* Average Rating */}
          <div className="p-6 bg-zinc-900/30 backdrop-blur-xl rounded-2xl border border-white/10">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                <span className="text-3xl font-bold text-amber-400">{stats.avgRating}</span>
              </div>
              <div className="text-sm text-zinc-600">Note moyenne</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


