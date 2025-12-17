import { memo, useState } from 'react'
import { Copy, Check, Sparkles, User } from 'lucide-react'
import { Message } from '../../types/learning'

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
      className="group flex gap-4 items-start hover:bg-zinc-900/30 -mx-4 px-4 py-4 rounded-xl transition-colors"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar - Premium */}
      <div className="flex-shrink-0">
        {isAssistant ? (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center ring-1 ring-white/5">
            <Sparkles className="w-4 h-4 text-zinc-300" />
          </div>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center ring-1 ring-white/5">
            <User className="w-4 h-4 text-zinc-300" />
          </div>
        )}
      </div>

      {/* Message */}
      <div className="flex-1 min-w-0 pt-0.5">
        {/* Label */}
        <p className="text-xs font-medium text-zinc-500 mb-1.5">
          {isAssistant ? 'Assistant' : 'Vous'}
        </p>
        
        {message.isError ? (
          <p className="text-red-400 text-sm">{message.errorMessage || 'Une erreur est survenue'}</p>
        ) : (
          <div 
            className="text-[15px] leading-[1.7] text-zinc-100 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:text-white [&_strong]:font-semibold [&_em]:text-zinc-300 [&_code]:bg-zinc-800/80 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-indigo-300 [&_code]:text-[13px] [&_code]:font-mono [&_pre]:bg-zinc-900/80 [&_pre]:border [&_pre]:border-zinc-800 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-zinc-300 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:mb-1"
            dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
          />
        )}
        
        {/* Actions */}
        {isAssistant && !message.isError && (
          <div className={`mt-3 flex items-center gap-1 transition-opacity duration-200 ${showActions ? 'opacity-100' : 'opacity-0'}`}>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-400" />
                  <span>Copié</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
})

