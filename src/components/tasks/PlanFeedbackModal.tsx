import { useState } from 'react'
import { X, ThumbsUp, ThumbsDown, Star } from 'lucide-react'
import { fontStack } from './taskUtils'

interface PlanFeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (feedback: {
    rating: number
    helpful: boolean | null
    comment: string
  }) => void
  projectName: string
}

export function PlanFeedbackModal({ isOpen, onClose, onSubmit, projectName }: PlanFeedbackModalProps) {
  const [rating, setRating] = useState<number>(0)
  const [helpful, setHelpful] = useState<boolean | null>(null)
  const [comment, setComment] = useState('')
  const [hoveredStar, setHoveredStar] = useState<number>(0)

  if (!isOpen) return null

  const handleSubmit = () => {
    onSubmit({ rating, helpful, comment })
    onClose()
  }

  const handleSkip = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className={`text-lg font-semibold text-zinc-100 ${fontStack}`}>
            Comment était ce plan ?
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-zinc-300 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-6">
          {/* Project name */}
          <div className="text-center">
            <p className={`text-sm text-zinc-400 ${fontStack}`}>
              Plan généré pour <span className="text-zinc-200 font-medium">{projectName}</span>
            </p>
          </div>

          {/* Rating stars */}
          <div className="space-y-2">
            <label className={`text-sm text-zinc-300 ${fontStack}`}>
              Note globale
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoveredStar || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-zinc-700'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Helpful thumbs */}
          <div className="space-y-2">
            <label className={`text-sm text-zinc-300 ${fontStack}`}>
              Les tâches étaient-elles pertinentes ?
            </label>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setHelpful(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  helpful === true
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
                }`}
              >
                <ThumbsUp className="w-5 h-5" />
                <span className={`text-sm font-medium ${fontStack}`}>Oui</span>
              </button>
              <button
                onClick={() => setHelpful(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  helpful === false
                    ? 'bg-red-500/20 border-red-500/40 text-red-400'
                    : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
                }`}
              >
                <ThumbsDown className="w-5 h-5" />
                <span className={`text-sm font-medium ${fontStack}`}>Non</span>
              </button>
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className={`text-sm text-zinc-300 ${fontStack}`}>
              Commentaire (optionnel)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Qu'est-ce qui pourrait être amélioré ?"
              rows={3}
              className={`w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 resize-none ${fontStack}`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between gap-3">
          <button
            onClick={handleSkip}
            className={`px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors ${fontStack}`}
          >
            Passer
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0}
            className={`px-4 py-2 bg-zinc-100 text-zinc-900 rounded-xl text-sm font-semibold hover:bg-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${fontStack}`}
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  )
}


