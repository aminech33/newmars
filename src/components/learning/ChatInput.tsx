import { memo, useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2 } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => void
  isTyping: boolean
  disabled: boolean
  placeholder?: string
  hasMessages?: boolean
}

export const ChatInput = memo(function ChatInput({
  onSend,
  isTyping,
  disabled,
  placeholder = 'Pose ta question...'
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [message])

  // Focus on mount
  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus()
    }
  }, [disabled])

  const handleSend = useCallback(() => {
    const trimmed = message.trim()
    if (!trimmed || isTyping || disabled) return
    
    onSend(trimmed)
    setMessage('')
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [message, isTyping, disabled, onSend])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter to send (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    
    // Escape to clear
    if (e.key === 'Escape') {
      setMessage('')
    }
  }

  return (
    <div className="relative">
      {/* Container avec effet de profondeur */}
      <div className="flex items-end gap-3 p-1.5 bg-zinc-800/50 rounded-2xl">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-transparent text-zinc-100 placeholder:text-zinc-500 rounded-xl px-4 py-3 outline-none focus:outline-none focus:ring-0 focus:border-none disabled:opacity-50 text-[15px]"
          style={{ minHeight: '46px', maxHeight: '200px', outline: 'none', boxShadow: 'none' }}
        />
        
        <button
          onClick={handleSend}
          disabled={!message.trim() || isTyping || disabled}
          className={`flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
            message.trim() && !isTyping && !disabled
              ? 'bg-white text-zinc-900 hover:scale-105 shadow-lg shadow-white/10'
              : 'bg-zinc-700/50 text-zinc-500'
          }`}
        >
          {isTyping ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  )
})

