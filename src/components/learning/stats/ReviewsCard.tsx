import { TrendingUp } from 'lucide-react'

interface ReviewsCardProps {
  totalReviews: number
  messagesCount: number
  notesCount: number
}

export function ReviewsCard({ totalReviews, messagesCount, notesCount }: ReviewsCardProps) {
  return (
    <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50 hover:border-zinc-700 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-zinc-500 mb-1">Révisions</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-white">
              {totalReviews}
            </p>
            <span className="text-xs text-zinc-400">total</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
        </div>
      </div>
      
      {/* Stats messages/notes */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-zinc-500">{messagesCount} messages</span>
        {notesCount > 0 && (
          <>
            <span className="text-zinc-700">•</span>
            <span className="text-zinc-500">{notesCount} notes</span>
          </>
        )}
      </div>
    </div>
  )
}


