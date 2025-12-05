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
    <div className="flex h-full overflow-hidden">
      {/* Chat Area (left side or full width) */}
      <div className={`flex flex-col ${showSplitView ? 'w-1/2 border-r border-zinc-800/50' : 'w-full'} h-full`}>
        {/* Messages Area */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 min-h-0"
          role="log"
          aria-label="Conversation"
          aria-live="polite"
        >
        {!hasMessages ? (
          // Empty State
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="p-4 bg-indigo-500/10 rounded-2xl mb-4">
              <Sparkles className="w-10 h-10 text-indigo-400" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-200 mb-2">
              Bienvenue dans {course.name}
            </h3>
            <p className="text-zinc-500 max-w-md mb-6">
              Je suis ton assistant IA personnel. Pose-moi n'importe quelle question sur ce sujet, 
              demande des explications, des exemples ou des exercices.
            </p>
            
            {/* Starter Prompts */}
            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
              {[
                `Explique-moi les bases de ${course.name}`,
                'Par où commencer ?',
                'Fais-moi un plan d\'apprentissage',
                'Quiz-moi sur les fondamentaux'
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => onSendMessage(prompt)}
                  className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl text-sm transition-[background-color,border-color] duration-200 border border-zinc-800/50 hover:border-zinc-600"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Messages
          <>
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
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                </div>
                <div className="bg-zinc-800/50 rounded-2xl rounded-tl-sm p-4">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

        {/* Input */}
        <div className="border-t border-zinc-800/50 bg-zinc-900/50">
          {showSplitView && (
            <div className="px-4 pt-2 pb-1 flex items-center gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-400 hover:text-zinc-300 transition-[color] duration-200">
                <input
                  type="checkbox"
                  checked={includeCode}
                  onChange={(e) => setIncludeCode(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-zinc-800/50 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                />
                📎 Inclure mon code dans les messages
              </label>
            </div>
          )}
          <ChatInput
            onSend={handleSendWithCode}
            isTyping={isTyping}
            disabled={false}
            placeholder={`Demande quelque chose sur ${course.name}...`}
          />
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

