import { memo, useState } from 'react'
import { Copy, Check, Sparkles, User } from 'lucide-react'
import { Message } from '../../types/learning'

interface MessageBubbleProps {
  message: Message
  onCopy: () => void
}

export const MessageBubble = memo(function MessageBubble({
  message,
  onCopy
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
      className={`group flex gap-3 items-end py-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isAssistant ? (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600/20 to-indigo-800/20 flex items-center justify-center ring-1 ring-indigo-500/20">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-700 flex items-center justify-center ring-1 ring-white/10">
            <User className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Message Bubble */}
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        {message.isError ? (
          <div className="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20">
            <p className="text-red-400 text-sm">{message.errorMessage || 'Une erreur est survenue'}</p>
          </div>
        ) : (
          <div 
            className={`px-4 py-3 rounded-2xl ${
              isUser 
                ? 'bg-zinc-700 text-zinc-100 rounded-br-md' 
                : 'bg-zinc-800/50 text-zinc-100 rounded-bl-md'
            }`}
          >
            <div 
              className={`text-[15px] leading-[1.6] [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_em]:italic ${
                isUser 
                  ? '[&_code]:bg-zinc-200 [&_code]:text-zinc-800' 
                  : '[&_code]:bg-zinc-700 [&_code]:text-zinc-200'
              } [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-[13px] [&_code]:font-mono [&_pre]:bg-zinc-900 [&_pre]:border [&_pre]:border-zinc-700 [&_pre]:p-3 [&_pre]:rounded-xl [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-2 [&_li]:mb-1`}
              dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
            />
          </div>
        )}
        
        {/* Time + Actions */}
        <div className={`flex items-center gap-2 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] text-zinc-600">{formattedTime}</span>
          
          {isAssistant && !message.isError && (
            <div className={`flex items-center gap-1 transition-opacity duration-200 ${showActions ? 'opacity-100' : 'opacity-0'}`}>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-colors"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-green-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

