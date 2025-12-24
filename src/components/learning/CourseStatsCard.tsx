import { memo } from 'react'
import { TrendingUp, Flame, Target, Clock } from 'lucide-react'
import { Course } from '../../types/learning'

interface CourseStatsCardProps {
  course: Course
}

export const CourseStatsCard = memo(function CourseStatsCard({ course }: CourseStatsCardProps) {
  const masteryTrend = course.masteryHistory?.slice(-7) || []
  const hasTrend = masteryTrend.length >= 2
  
  // Calcul de la tendance (delta sur 7 jours)
  const trendDelta = hasTrend 
    ? masteryTrend[masteryTrend.length - 1].masteryLevel - masteryTrend[0].masteryLevel
    : 0
  
  const isPositiveTrend = trendDelta > 0
  const isNegativeTrend = trendDelta < 0
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {/* Card Maîtrise */}
      <div className="relative group bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50 hover:border-zinc-700 transition-all">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-zinc-500 mb-1">Maîtrise</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-white">
                {course.currentMastery}%
              </p>
              {hasTrend && trendDelta !== 0 && (
                <span className={`text-xs ${
                  isPositiveTrend ? 'text-green-400' : 'text-red-400'
                }`}>
                  {isPositiveTrend ? '+' : ''}{trendDelta.toFixed(0)}%
                </span>
              )}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-indigo-400" />
          </div>
        </div>
        
        {/* Sparkline mini graphique */}
        {masteryTrend.length > 0 && (
          <div className="h-8 flex items-end gap-0.5">
            {masteryTrend.map((point, idx) => {
              const height = Math.max(4, (point.masteryLevel / 100) * 32) // px
              const isLast = idx === masteryTrend.length - 1
              
              return (
                <div
                  key={point.date}
                  className={`flex-1 rounded-sm transition-all ${
                    isLast 
                      ? 'bg-indigo-500' 
                      : 'bg-zinc-700 group-hover:bg-zinc-600'
                  }`}
                  style={{ height: `${height}px` }}
                  title={`${point.date}: ${point.masteryLevel}%`}
                />
              )
            })}
          </div>
        )}
      </div>
      
      {/* Card Streak */}
      <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50 hover:border-zinc-700 transition-all">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-zinc-500 mb-1">Série active</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-white">
                {course.streak}
              </p>
              <span className="text-xs text-zinc-400">jours</span>
            </div>
            {course.longestStreak > course.streak && (
              <p className="text-xs text-zinc-600 mt-1">
                Record: {course.longestStreak} jours
              </p>
            )}
          </div>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            course.streak >= 7 
              ? 'bg-orange-500/10' 
              : 'bg-zinc-800'
          }`}>
            <Flame className={`w-4 h-4 ${
              course.streak >= 7 
                ? 'text-orange-400' 
                : 'text-zinc-600'
            }`} />
          </div>
        </div>
        
        {/* Barre de progression vers le prochain palier */}
        {course.streak < 30 && (
          <div className="space-y-1">
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-500"
                style={{ 
                  width: `${(course.streak % 7) * 100 / 7}%` 
                }}
              />
            </div>
            <p className="text-[10px] text-zinc-600">
              {7 - (course.streak % 7)} jours avant palier
            </p>
          </div>
        )}
      </div>
      
      {/* Card Révisions */}
      <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50 hover:border-zinc-700 transition-all">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-zinc-500 mb-1">Révisions</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-white">
                {course.totalReviews}
              </p>
              <span className="text-xs text-zinc-400">total</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
        
        {/* Stats flashcards */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500">{course.flashcards.length} cartes</span>
          {course.flashcards.length > 0 && (
            <>
              <span className="text-zinc-700">•</span>
              <span className="text-zinc-500">
                {course.flashcards.filter(f => 
                  new Date(f.nextReview).getTime() <= Date.now()
                ).length} à réviser
              </span>
            </>
          )}
        </div>
      </div>
      
      {/* Card Temps */}
      <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50 hover:border-zinc-700 transition-all">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-zinc-500 mb-1">Temps total</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-white">
                {Math.floor(course.totalTimeSpent / 60)}
              </p>
              <span className="text-xs text-zinc-400">heures</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
        </div>
        
        {/* Moyenne par session */}
        {course.sessionsCount > 0 && (
          <div className="text-xs text-zinc-500">
            ~{Math.round(course.totalTimeSpent / course.sessionsCount)} min/session
          </div>
        )}
      </div>
    </div>
  )
})

