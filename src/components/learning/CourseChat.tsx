import { memo, useRef, useEffect, useState, useMemo } from 'react'
import { Course } from '../../types/learning'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { CodeEditor } from './CodeEditor'
import { Sparkles } from 'lucide-react'

interface CourseChatProps {
  course: Course
  isTyping: boolean
  onSendMessage: (content: string, codeContext?: { code: string; language: string }) => void
  onCopyMessage: (messageId: string) => void
  onLikeMessage: (messageId: string) => void
  onSaveAsNote: (messageId: string) => void
  onCreateFlashcard: (messageId: string) => void
  onDeleteMessage: (messageId: string) => void
}

// Code de démarrage selon le langage
const getStarterCode = (language: string, courseName: string): string => {
  const starters: Record<string, string> = {
    python: `# ${courseName}\n\n# Écris ton code Python ici\nprint("Hello, World!")\n`,
    javascript: `// ${courseName}\n\n// Écris ton code JavaScript ici\nconsole.log("Hello, World!");\n`,
    typescript: `// ${courseName}\n\n// Écris ton code TypeScript ici\nconst message: string = "Hello, World!";\nconsole.log(message);\n`,
    java: `// ${courseName}\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n`,
    cpp: `// ${courseName}\n\n#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}\n`,
    csharp: `// ${courseName}\n\nusing System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}\n`,
    rust: `// ${courseName}\n\nfn main() {\n    println!("Hello, World!");\n}\n`,
    go: `// ${courseName}\n\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}\n`,
    php: `<?php\n// ${courseName}\n\n// Écris ton code PHP ici\necho "Hello, World!";\n`,
    ruby: `# ${courseName}\n\n# Écris ton code Ruby ici\nputs "Hello, World!"\n`
  }
  return starters[language] || `// ${courseName}\n\n// Écris ton code ici\n`
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
  const language = course.programmingLanguage || 'python'
  const [editorCode, setEditorCode] = useState(() => getStarterCode(language, course.name))
  const [includeCode, setIncludeCode] = useState(true)
  const [showSuggestions, setShowSuggestions] = useState(true)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [course.messages.length, isTyping])

  // Masquer les suggestions après la première interaction
  useEffect(() => {
    if (course.messages.length > 0) {
      setShowSuggestions(false)
    }
  }, [course.messages.length])

  const hasMessages = course.messages.length > 0
  const showSplitView = course.isProgramming === true

  // Gestion de l'envoi - le code est passé en contexte, jamais affiché dans le chat
  const handleSendWithCode = (message: string) => {
    if (showSplitView && includeCode && editorCode.trim()) {
      // Le message visible reste simple, le code est passé en contexte
      onSendMessage(message, { code: editorCode, language })
    } else {
      onSendMessage(message)
    }
  }

  // Exécuter : message court visible, code en contexte
  const handleRunCode = () => {
    onSendMessage('▶ Exécuter', { code: editorCode, language })
  }


  // En mode programmation : éditeur à gauche (60%), chat à droite (40%)
  if (showSplitView) {
    return (
      <div className="flex h-full overflow-hidden bg-black">
        {/* Code Editor (left side - principal) */}
        <div className="w-[60%] flex flex-col h-full overflow-hidden">
          <CodeEditor
            language={language}
            value={editorCode}
            onChange={setEditorCode}
            readOnly={false}
            showHeader={true}
            courseName={course.name}
            onRun={handleRunCode}
            isTyping={isTyping}
          />
        </div>

        {/* Chat Area (right side - assistant) */}
        <div className="w-[40%] flex flex-col h-full border-l border-zinc-800/50">
          {/* Messages */}
          <div 
            ref={containerRef}
            className="flex-1 overflow-y-auto min-h-0"
            role="log"
            aria-label="Conversation"
            aria-live="polite"
          >
            <div className="px-4">
              {!hasMessages ? (
                // État vide discret
                <div className="py-8">
                  <p className="text-zinc-500 text-sm text-center mb-4">
                    Écris du code et clique sur <span className="text-green-400 font-medium">Analyser</span> pour commencer.
                  </p>
                  
                  {/* Suggestions discrètes */}
                  {showSuggestions && (
                    <div className="flex flex-wrap justify-center gap-2">
                      <button 
                        onClick={() => onSendMessage(`Montre-moi un exemple simple en ${language}`)}
                        className="px-3 py-1.5 text-xs bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        Exemple
                      </button>
                      <button 
                        onClick={() => onSendMessage(`Explique la syntaxe de base de ${language}`)}
                        className="px-3 py-1.5 text-xs bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        Syntaxe
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // Messages
                <div className="py-4 space-y-2">
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
                  
                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex gap-3 items-start py-2">
                      <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                      </div>
                      <div className="pt-2">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0ms]" />
                          <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:150ms]" />
                          <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Input compact */}
          <div className="border-t border-zinc-800/50 bg-zinc-900/30 p-3">
            <div className="flex items-center gap-2 mb-2">
              <label className="flex items-center gap-1.5 text-[10px] text-zinc-500 cursor-pointer hover:text-zinc-400">
                <input
                  type="checkbox"
                  checked={includeCode}
                  onChange={(e) => setIncludeCode(e.target.checked)}
                  className="w-3 h-3 rounded border-zinc-700 bg-zinc-900 text-zinc-400 accent-zinc-500"
                />
                Inclure le code
              </label>
            </div>
            <ChatInput
              onSend={handleSendWithCode}
              isTyping={isTyping}
              disabled={false}
              placeholder="Pose une question sur ton code..."
              hasMessages={hasMessages}
            />
          </div>
        </div>
      </div>
    )
  }

  // Mode normal (sans programmation) - chat classique
  return (
    <div className="flex h-full overflow-hidden bg-black">
      <div className="flex flex-col w-full h-full">
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
              <div className="h-[70vh] flex items-center justify-center">
                <div className="text-center max-w-lg">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-indigo-800/20 flex items-center justify-center mx-auto mb-6 ring-1 ring-indigo-500/20 shadow-2xl">
                    <Sparkles className="w-7 h-7 text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    {course.name}
                  </h2>
                  <p className="text-zinc-500 text-sm leading-relaxed mb-8">
                    Posez une question pour commencer.
                  </p>
                  
                  {showSuggestions && (
                    <div className="flex flex-wrap justify-center gap-2">
                      <button 
                        onClick={() => onSendMessage(`Explique-moi les bases de ${course.name}`)}
                        className="px-4 py-2 text-sm bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors ring-1 ring-zinc-800 hover:ring-zinc-700"
                      >
                        Les bases
                      </button>
                      <button 
                        onClick={() => onSendMessage(`Donne-moi un exemple concret`)}
                        className="px-4 py-2 text-sm bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors ring-1 ring-zinc-800 hover:ring-zinc-700"
                      >
                        Exemple
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
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
                
                {isTyping && (
                  <div className="flex gap-4 items-start -mx-4 px-4 py-4">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600/20 to-indigo-800/20 flex items-center justify-center flex-shrink-0 ring-1 ring-indigo-500/20">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="pt-2">
                      <p className="text-xs font-medium text-indigo-400/70 mb-2">Assistant</p>
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
        <div className="bg-black/50 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto px-6 py-4">
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
    </div>
  )
})

