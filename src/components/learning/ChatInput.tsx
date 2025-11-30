import { memo, useState, useRef, useEffect, useCallback } from 'react'
import { Send, Sparkles, Loader2 } from 'lucide-react'
import { QUICK_PROMPTS } from '../../types/learning'

interface ChatInputProps {
  onSend: (message: string) => void
  isTyping: boolean
  disabled: boolean
  placeholder?: string
}

export const ChatInput = memo(function ChatInput({
  onSend,
  isTyping,
  disabled,
  placeholder = 'Pose ta question...'
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
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
    setShowSuggestions(false)
    
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
      setShowSuggestions(false)
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    setMessage(prompt)
    setShowSuggestions(false)
    textareaRef.current?.focus()
  }

  return (
    <div className="border-t border-zinc-800/50 p-4 bg-zinc-900/30">
      {/* Quick Prompts */}
      {showSuggestions && !message && (
        <div className="mb-3 flex flex-wrap gap-2 animate-fade-in">
          {QUICK_PROMPTS.map((item) => (
            <button
              key={item.label}
              onClick={() => handleQuickPrompt(item.prompt)}
              className="px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg text-xs transition-all"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="relative flex items-end gap-3">
        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full resize-none bg-zinc-800/50 text-zinc-200 placeholder:text-zinc-600 rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '48px', maxHeight: '200px' }}
            aria-label="Message"
          />
          
          {/* Character count (optional, for long messages) */}
          {message.length > 500 && (
            <span className="absolute bottom-2 right-14 text-xs text-zinc-600">
              {message.length}
            </span>
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!message.trim() || isTyping || disabled}
          className={`p-3 rounded-xl transition-all ${
            message.trim() && !isTyping && !disabled
              ? 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20'
              : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
          }`}
          aria-label={isTyping ? 'En cours...' : 'Envoyer'}
        >
          {isTyping ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Hints */}
      <div className="flex items-center justify-between mt-2 text-xs text-zinc-600">
        <div className="flex items-center gap-4">
          <span>
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-[10px]">Enter</kbd> envoyer
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-[10px]">Shift+Enter</kbd> nouvelle ligne
          </span>
        </div>
        
        {isTyping && (
          <div className="flex items-center gap-1.5 text-indigo-400">
            <Sparkles className="w-3 h-3 animate-pulse" />
            <span>L'IA réfléchit...</span>
          </div>
        )}
      </div>
    </div>
  )
})

