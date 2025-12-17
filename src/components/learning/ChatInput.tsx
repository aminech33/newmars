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
    <div className="relative group">
      {/* Glow effect on focus */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm" />
      
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="w-full resize-none bg-zinc-900/80 backdrop-blur-sm text-white placeholder:text-zinc-500 rounded-2xl px-5 py-4 pr-14 border border-zinc-800/80 focus:border-zinc-700 focus:outline-none transition-all disabled:opacity-50 text-[15px] leading-relaxed"
          style={{ minHeight: '56px', maxHeight: '200px' }}
        />
        
        <button
          onClick={handleSend}
          disabled={!message.trim() || isTyping || disabled}
          className={`absolute right-3 bottom-3 p-2 rounded-xl transition-all duration-200 ${
            message.trim() && !isTyping && !disabled
              ? 'bg-white text-black hover:bg-zinc-100 hover:scale-105 shadow-lg shadow-white/10'
              : 'text-zinc-600 cursor-not-allowed'
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

