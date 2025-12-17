import { memo, useRef, useEffect, useState } from 'react'
import { Course } from '../../types/learning'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { CodeEditor } from './CodeEditor'
import { Sparkles } from 'lucide-react'

interface CourseChatProps {
  course: Course
  isTyping: boolean
  onSendMessage: (content: string) => void
  onCopyMessage: (messageId: string) => void
  onLikeMessage: (messageId: string) => void
  onSaveAsNote: (messageId: string) => void
  onCreateFlashcard: (messageId: string) => void
  onDeleteMessage: (messageId: string) => void
}

export const CourseChat = memo(function CourseChat({
  course,
  isTyping,
  onSendMessage,
  onCopyMessage,
  onLikeMessage,
  onSaveAsNote,
  onCreateFlashcard,
  onDeleteMessage
}: CourseChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [editorCode, setEditorCode] = useState(`# ${course.name}\n# Écris ton code ici\n\n`)
  const [includeCode, setIncludeCode] = useState(true)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [course.messages.length, isTyping])

  const hasMessages = course.messages.length > 0
  const showSplitView = course.isProgramming === true

  // Gestion de l'envoi avec le code
  const handleSendWithCode = (message: string) => {
    if (showSplitView && includeCode && editorCode.trim()) {
      const fullMessage = `${message}\n\n📎 Mon code actuel:\n\`\`\`${course.programmingLanguage || 'python'}\n${editorCode}\n\`\`\``
      onSendMessage(fullMessage)
    } else {
      onSendMessage(message)
    }
  }

  const handleRunCode = () => {
    onSendMessage(`Exécute et explique ce code:\n\`\`\`${course.programmingLanguage || 'python'}\n${editorCode}\n\`\`\``)
  }

  const handleAskHelp = () => {
    onSendMessage(`J'ai besoin d'aide avec ce code:\n\`\`\`${course.programmingLanguage || 'python'}\n${editorCode}\n\`\`\``)
  }

  return (
    <div className="flex h-full overflow-hidden bg-black">
      {/* Chat Area */}
      <div className={`flex flex-col ${showSplitView ? 'w-1/2 border-r border-zinc-800/50' : 'w-full'} h-full`}>
        {/* Messages */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-y-auto min-h-0"
          role="log"
          aria-label="Conversation"
          aria-live="polite"
        >
          <div className="max-w-3xl mx-auto px-6">
            {!hasMessages ? (
              // Empty State - Premium
              <div className="h-[70vh] flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center mx-auto mb-6 ring-1 ring-white/5 shadow-2xl">
                    <Sparkles className="w-7 h-7 text-zinc-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    {course.name}
                  </h2>
                  <p className="text-zinc-500 text-sm leading-relaxed">
                    Posez une question pour démarrer la conversation. Je suis là pour vous aider à apprendre.
                  </p>
                </div>
              </div>
            ) : (
              // Messages
              <div className="py-8 space-y-2">
                {course.messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    onCopy={() => onCopyMessage(message.id)}
                    onLike={() => onLikeMessage(message.id)}
                    onSaveAsNote={() => onSaveAsNote(message.id)}
                    onCreateFlashcard={() => onCreateFlashcard(message.id)}
                    onDelete={() => onDeleteMessage(message.id)}
                  />
                ))}
                
                {/* Typing - Premium */}
                {isTyping && (
                  <div className="flex gap-4 items-start -mx-4 px-4 py-4">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center flex-shrink-0 ring-1 ring-white/5">
                      <Sparkles className="w-4 h-4 text-zinc-300" />
                    </div>
                    <div className="pt-2">
                      <p className="text-xs font-medium text-zinc-500 mb-2">Assistant</p>
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:0ms]" />
                        <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:150ms]" />
                        <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-zinc-800/50 bg-black/50 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto px-6 py-4">
            {showSplitView && (
              <label className="flex items-center gap-2 text-xs text-zinc-500 mb-3 cursor-pointer hover:text-zinc-400">
                <input
                  type="checkbox"
                  checked={includeCode}
                  onChange={(e) => setIncludeCode(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-indigo-500"
                />
                Inclure le code
              </label>
            )}
            <ChatInput
              onSend={handleSendWithCode}
              isTyping={isTyping}
              disabled={false}
              placeholder={hasMessages ? "Continuez la conversation..." : `Posez une question sur ${course.name}...`}
              hasMessages={hasMessages}
            />
          </div>
        </div>
      </div>

      {/* Code Editor (right side) - Only for programming courses */}
      {showSplitView && (
        <div className="w-1/2 flex flex-col h-full overflow-hidden">
          <CodeEditor
            language={course.programmingLanguage || 'python'}
            value={editorCode}
            onChange={setEditorCode}
            readOnly={false}
            showHeader={true}
            courseName={course.name}
            onRun={handleRunCode}
            onAskHelp={handleAskHelp}
            includeAI={includeCode}
            isTyping={isTyping}
          />
        </div>
      )}
    </div>
  )
})

