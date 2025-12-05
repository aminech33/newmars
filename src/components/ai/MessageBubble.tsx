import { User, Sparkles, Copy, ThumbsUp, RefreshCw, Check } from 'lucide-react'
import { useState } from 'react'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  isLiked?: boolean
  onCopy?: () => void
  onLike?: () => void
  onRegenerate?: () => void
}

export function MessageBubble({
  role,
  content,
  timestamp,
  isLiked = false,
  onCopy,
  onLike,
  onRegenerate,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    onCopy?.()
  }

  const isAssistant = role === 'assistant'

  return (
    <div
      className={`flex gap-4 group ${isAssistant ? '' : 'flex-row-reverse'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isAssistant ? (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center shadow-lg">
            <User className="w-4 h-4 text-zinc-300" />
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 max-w-[75%]">
        {/* Bubble */}
        <div
          className={`relative px-4 py-3 rounded-2xl shadow-lg transition-colors duration-300 ${
            isAssistant
              ? 'bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 backdrop-blur-sm border border-zinc-800/50 text-zinc-100'
              : 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white'
          } ${showActions ? 'ring-2 ring-indigo-500/20' : ''}`}
        >
          {/* Content */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {content}
          </p>

          {/* Timestamp */}
          <span className="text-xs opacity-50 mt-2 block">
            {new Date(timestamp).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Actions (hover) */}
        {isAssistant && (
          <div
            className={`flex items-center gap-2 mt-2 transition-opacity duration-200 ${
              showActions ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Copy */}
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors duration-200 hover:scale-110"
              title="Copier"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Like */}
            <button
              onClick={onLike}
              className={`p-1.5 rounded-lg transition-colors duration-200 hover:scale-110 ${
                isLiked
                  ? 'bg-pink-500/20 text-pink-400'
                  : 'bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200'
              }`}
              title={isLiked ? 'Retirer le like' : 'Liker'}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
            </button>

            {/* Regenerate */}
            <button
              onClick={onRegenerate}
              className="p-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors duration-200 hover:scale-110 hover:rotate-180"
              title="Régénérer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}


