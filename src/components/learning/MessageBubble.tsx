import { memo, useState } from 'react'
import { Copy, Check, ThumbsUp, Bookmark, Sparkles, User, Trash2 } from 'lucide-react'
import { Message } from '../../types/learning'
import { Tooltip } from '../ui/Tooltip'

interface MessageBubbleProps {
  message: Message
  onCopy: () => void
  onLike: () => void
  onSaveAsNote: () => void
  onCreateFlashcard: () => void
  onDelete: () => void
}

export const MessageBubble = memo(function MessageBubble({
  message,
  onCopy,
  onLike,
  onSaveAsNote,
  onCreateFlashcard,
  onDelete
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    onCopy()
  }

  // Simple markdown-like formatting
  const formatContent = (content: string) => {
    // Code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    let formatted = content.replace(codeBlockRegex, (_, _lang, code) => {
      return `<pre class="bg-zinc-900 rounded-xl p-4 my-3 overflow-x-auto"><code class="text-sm text-emerald-400">${escapeHtml(code.trim())}</code></pre>`
    })

    // Inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-zinc-800 px-1.5 py-0.5 rounded text-sm text-cyan-400">$1</code>')

    // Bold
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-zinc-100">$1</strong>')

    // Italic
    formatted = formatted.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')

    // Line breaks
    formatted = formatted.replace(/\n/g, '<br />')

    return formatted
  }

  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  const formattedTime = new Date(message.timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div 
      className={`group flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser 
          ? 'bg-indigo-500/20 text-indigo-400' 
          : 'bg-emerald-500/20 text-emerald-400'
      }`}>
        {isUser ? (
          <User className="w-4 h-4" aria-hidden="true" />
        ) : (
          <Sparkles className="w-4 h-4" aria-hidden="true" />
        )}
      </div>

      {/* Message */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div 
          className={`inline-block p-4 rounded-2xl ${
            isUser 
              ? 'bg-indigo-500/20 text-zinc-200 rounded-tr-sm' 
              : 'bg-zinc-800/50 text-zinc-300 rounded-tl-sm'
          } ${message.isStreaming ? 'animate-pulse' : ''}`}
        >
          {message.isError ? (
            <p className="text-rose-400 text-sm">{message.errorMessage || 'Une erreur est survenue'}</p>
          ) : (
            <div 
              className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
            />
          )}
        </div>

        {/* Timestamp & Actions */}
        <div className={`flex items-center gap-2 mt-1.5 ${isUser ? 'justify-end' : ''}`}>
          <span className="text-xs text-zinc-600">{formattedTime}</span>
          
          {/* Actions for assistant messages */}
          {isAssistant && !message.isError && (
            <div className={`flex items-center gap-1 transition-opacity ${showActions ? 'opacity-100' : 'opacity-0'}`}>
              <Tooltip content={copied ? 'Copié !' : 'Copier'}>
                <button
                  onClick={handleCopy}
                  className="p-1 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-[background-color,color] duration-200"
                  aria-label="Copier le message"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                </button>
              </Tooltip>

              <Tooltip content={message.liked ? 'Retirer le like' : 'Aimer'}>
                <button
                  onClick={onLike}
                  className={`p-1 rounded transition-[background-color,color] duration-200 ${
                    message.liked 
                      ? 'text-rose-400 bg-rose-500/10' 
                      : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800'
                  }`}
                  aria-label={message.liked ? 'Retirer le like' : 'Aimer'}
                  aria-pressed={message.liked}
                >
                  <ThumbsUp className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </Tooltip>

              <Tooltip content="Sauvegarder en note">
                <button
                  onClick={onSaveAsNote}
                  className={`p-1 rounded transition-[background-color,color] duration-200 ${
                    message.savedAsNote 
                      ? 'text-amber-400 bg-amber-500/10' 
                      : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800'
                  }`}
                  aria-label="Sauvegarder en note"
                >
                  <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </Tooltip>

              <Tooltip content="Créer une flashcard">
                <button
                  onClick={onCreateFlashcard}
                  className={`p-1 rounded transition-[background-color,color] duration-200 ${
                    message.flashcardCreated 
                      ? 'text-cyan-400 bg-cyan-500/10' 
                      : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800'
                  }`}
                  aria-label="Créer une flashcard"
                >
                  <span className="text-xs">📇</span>
                </button>
              </Tooltip>
            </div>
          )}

          {/* Delete for user messages */}
          {isUser && (
            <div className={`transition-opacity ${showActions ? 'opacity-100' : 'opacity-0'}`}>
              <Tooltip content="Supprimer">
                <button
                  onClick={onDelete}
                  className="p-1 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-[background-color,color] duration-200"
                  aria-label="Supprimer le message"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

