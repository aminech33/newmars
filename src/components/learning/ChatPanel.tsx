import { memo, useRef, useEffect, ReactNode } from 'react'
import { Course } from '../../types/learning'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'

interface ChatPanelProps {
  course: Course
  isTyping: boolean
  includeCode: boolean
  showSuggestions: boolean
  onSendMessage: (content: string, codeContext?: { code: string; language: string }) => void
  onCopyMessage: (messageId: string) => void
  onIncludeCodeChange: (value: boolean) => void
  onShowSuggestionsChange: (value: boolean) => void
  codeContext?: { code: string; language: string }
  headerActions?: ReactNode
}

export const ChatPanel = memo(function ChatPanel({
  course,
  isTyping,
  includeCode,
  showSuggestions,
  onSendMessage,
  onCopyMessage,
  onIncludeCodeChange,
  onShowSuggestionsChange,
  codeContext,
  headerActions
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [course.messages, isTyping])

  const handleSend = (content: string) => {
    if (includeCode && codeContext) {
      onSendMessage(content, codeContext)
    } else {
      onSendMessage(content)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-zinc-900">
      {/* Header actions (optionnel) */}
      {headerActions && (
        <div className="flex-shrink-0 px-3 py-2 border-b border-zinc-800 bg-zinc-900/50">
          {headerActions}
        </div>
      )}

      {/* Messages */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-3"
      >
        {course.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
            Commence la conversation...
          </div>
        ) : (
          <>
            {course.messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onCopy={() => onCopyMessage(message.id)}
              />
            ))}
            {isTyping && (
              <div className="flex items-center gap-2 text-zinc-500 text-sm px-3 py-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>L'IA réfléchit...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={isTyping}
        includeCode={includeCode}
        showSuggestions={showSuggestions}
        onIncludeCodeChange={onIncludeCodeChange}
        onShowSuggestionsChange={onShowSuggestionsChange}
      />
    </div>
  )
})

