import { memo, useRef, useEffect, useState, useCallback } from 'react'
import { Course } from '../../types/learning'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { CodeEditor } from './CodeEditor'
import { TerminalEmulator } from './TerminalEmulator'
import { LinkedTasks } from './LinkedTasks'
import { FlashcardModal } from './FlashcardModal'
import { CourseStatsCard } from './CourseStatsCard'
import { Sparkles, ListTodo, Brain, BarChart3 } from 'lucide-react'
import { useLearningData } from '../../hooks/useLearningData'
import { useStore } from '../../store/useStore'

interface CourseChatProps {
  course: Course
  isTyping: boolean
  onSendMessage: (content: string, codeContext?: { code: string; language: string }) => void
  onCopyMessage: (messageId: string) => void
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
  onCopyMessage
}: CourseChatProps) {
  const { createFlashcard, deleteFlashcard } = useLearningData()
  const { addToast } = useStore()
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const language = course.programmingLanguage || 'python'
  const [editorCode, setEditorCode] = useState(() => getStarterCode(language, course.name))
  const [includeCode, setIncludeCode] = useState(true)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [editorWidth, setEditorWidth] = useState(60) // pourcentage
  const [isResizing, setIsResizing] = useState(false)
  const [showTasks, setShowTasks] = useState(false)
  const [showFlashcards, setShowFlashcards] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [lastTopicSwitchNotified, setLastTopicSwitchNotified] = useState<string | null>(null)
  const splitContainerRef = useRef<HTMLDivElement>(null)
  
  // Flashcard handlers
  const handleAddFlashcard = useCallback((front: string, back: string) => {
    createFlashcard(course.id, front, back)
  }, [course.id, createFlashcard])
  
  const handleDeleteFlashcard = useCallback((flashcardId: string) => {
    deleteFlashcard(course.id, flashcardId)
  }, [course.id, deleteFlashcard])
  
  // Topic switch detection (pour interleaving feedback)
  useEffect(() => {
    if (course.messages.length >= 2) {
      const lastMessage = course.messages[course.messages.length - 1]
      const prevMessage = course.messages[course.messages.length - 2]
      
      // Si les 2 derniers messages de l'IA contiennent des indices de switch
      // (détection basique - en prod, on recevrait ça de l'API)
      if (lastMessage.role === 'assistant' && prevMessage.role === 'assistant') {
        const topicPattern = /Topic (\w+)/i
        const lastMatch = lastMessage.content.match(topicPattern)
        const prevMatch = prevMessage.content.match(topicPattern)
        
        if (lastMatch && prevMatch && lastMatch[1] !== prevMatch[1]) {
          const newTopic = lastMatch[1]
          if (lastTopicSwitchNotified !== newTopic) {
            addToast(`🔄 Switch: ${prevMatch[1]} → ${newTopic}`, 'info')
            setLastTopicSwitchNotified(newTopic)
          }
        }
      }
    }
  }, [course.messages, addToast, lastTopicSwitchNotified])

  // Gestion du redimensionnement style VSCode
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!splitContainerRef.current) return
      // Utiliser requestAnimationFrame pour un rendu smooth
      requestAnimationFrame(() => {
        const container = splitContainerRef.current
        if (!container) return
        const rect = container.getBoundingClientRect()
        const newWidth = ((e.clientX - rect.left) / rect.width) * 100
        // Limiter : éditeur entre 30% et 70%, chat entre 30% et 70%
        setEditorWidth(Math.min(70, Math.max(30, newWidth)))
      })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

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
  const showCodeEditor = course.isProgramming === true
  const showTerminal = course.isTerminal === true
  const showSplitView = showCodeEditor || showTerminal

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


  // En mode split view (code ou terminal) : panneau gauche + chat redimensionnables
  if (showSplitView) {
    return (
      <div className="h-full flex flex-col bg-black">
        {/* Stats Card (collapsible) */}
        {showStats && (
          <div className="border-b border-zinc-800/50 p-4 bg-zinc-950/50">
            <CourseStatsCard course={course} />
          </div>
        )}
        
        <div ref={splitContainerRef} className="flex-1 flex bg-black select-none min-h-0">
        {/* Left Panel: Code Editor OR Terminal */}
        <div style={{ width: `${editorWidth}%` }} className="flex flex-col h-full overflow-hidden">
          {showCodeEditor ? (
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
          ) : showTerminal ? (
            <TerminalEmulator sessionId={course.id} />
          ) : null}
        </div>

        {/* Resize Handle - invisible par défaut, visible au survol */}
        <div
          onMouseDown={handleMouseDown}
          className="w-[4px] bg-transparent hover:bg-zinc-600 cursor-col-resize flex-shrink-0 transition-colors"
        />

        {/* Chat Area (right panel) */}
        <div style={{ width: `${100 - editorWidth}%` }} className="flex flex-col h-full">
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
                    {showTerminal 
                      ? "Utilise le terminal et pose des questions à l'IA."
                      : <>Écris du code et clique sur <span className="text-green-400 font-medium">Analyser</span> pour commencer.</>
                    }
                  </p>
                  
                  {/* Suggestions discrètes */}
                  {showSuggestions && (
                    <div className="flex flex-wrap justify-center gap-2">
                      {showTerminal ? (
                        <>
                          <button 
                            onClick={() => onSendMessage("Quelles sont les commandes shell essentielles ?")}
                            className="px-3 py-1.5 text-xs bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                          >
                            Commandes de base
                          </button>
                          <button 
                            onClick={() => onSendMessage("Comment naviguer dans les dossiers ?")}
                            className="px-3 py-1.5 text-xs bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                          >
                            Navigation
                          </button>
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
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
            {showCodeEditor && (
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-1.5 text-[10px] text-zinc-500 cursor-pointer hover:text-zinc-400">
                  <input
                    type="checkbox"
                    checked={includeCode}
                    onChange={(e) => setIncludeCode(e.target.checked)}
                    className="w-3 h-3 rounded border-zinc-700 bg-zinc-900 text-zinc-400 accent-zinc-500"
                  />
                  Inclure le code
                </label>
                
                <div className="flex items-center gap-1">
                  {/* Stats Button */}
                  <button
                    onClick={() => setShowStats(!showStats)}
                    className={`p-1.5 rounded-lg transition-all duration-200 flex items-center gap-1 text-[10px] ${
                      showStats 
                        ? 'bg-cyan-500/20 text-cyan-400' 
                        : 'text-zinc-500 hover:text-cyan-400 hover:bg-cyan-500/10'
                    }`}
                    title="Statistiques"
                  >
                    <BarChart3 className="w-3 h-3" />
                  </button>
                  
                  {/* Flashcards Button */}
                  <button
                    onClick={() => setShowFlashcards(true)}
                    className="p-1.5 rounded-lg transition-all duration-200 flex items-center gap-1 text-[10px] text-zinc-500 hover:text-violet-400 hover:bg-violet-500/10"
                    title="Flashcards"
                  >
                    <Brain className="w-3 h-3" />
                    {course.flashcards.length > 0 && (
                      <span className="text-violet-400">{course.flashcards.length}</span>
                    )}
                  </button>
                  
                  {/* Toggle Tasks Button (split view) */}
                  {course.linkedProjectId && (
                    <button
                      onClick={() => setShowTasks(!showTasks)}
                      className={`p-1.5 rounded-lg transition-all duration-200 flex items-center gap-1 text-[10px] ${
                        showTasks 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                      }`}
                    >
                      <ListTodo className="w-3 h-3" />
                      Tâches
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Toggle pour terminal (pas de checkbox code) */}
            {showTerminal && (
              <div className="flex justify-end gap-2 mb-2">
                <button
                  onClick={() => setShowFlashcards(true)}
                  className="p-1.5 rounded-lg transition-all duration-200 flex items-center gap-1 text-[10px] text-zinc-500 hover:text-violet-400 hover:bg-violet-500/10"
                  title="Flashcards"
                >
                  <Brain className="w-3 h-3" />
                  {course.flashcards.length > 0 && (
                    <span className="text-violet-400">{course.flashcards.length}</span>
                  )}
                </button>
                
                {course.linkedProjectId && (
                  <button
                    onClick={() => setShowTasks(!showTasks)}
                    className={`p-1.5 rounded-lg transition-all duration-200 flex items-center gap-1 text-[10px] ${
                      showTasks 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                    }`}
                  >
                    <ListTodo className="w-3 h-3" />
                    Tâches
                  </button>
                )}
              </div>
            )}
            
            <ChatInput
              onSend={handleSendWithCode}
              isTyping={isTyping}
              disabled={false}
              placeholder={showTerminal ? "Pose une question sur le terminal..." : "Pose une question sur ton code..."}
              hasMessages={hasMessages}
            />
            
            {/* Tâches liées (compact en mode split) */}
            {course.linkedProjectId && showTasks && (
              <div className="mt-3 pt-3 border-t border-zinc-800/30">
                <LinkedTasks projectId={course.linkedProjectId} collapsed />
              </div>
            )}
          </div>
        </div>
        </div>
        
        {/* Flashcard Modal */}
        <FlashcardModal
          isOpen={showFlashcards}
          onClose={() => setShowFlashcards(false)}
          flashcards={course.flashcards}
          onAddFlashcard={handleAddFlashcard}
          onDeleteFlashcard={handleDeleteFlashcard}
          courseName={course.name}
          course={course}
        />
      </div>
    )
  }

  // Mode normal (sans programmation) - chat classique
  return (
    <div className="flex h-full overflow-hidden bg-black">
      <div className="flex flex-col flex-1 h-full min-w-0">
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
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <ChatInput
                  onSend={handleSendWithCode}
                  isTyping={isTyping}
                  disabled={false}
                  placeholder={hasMessages ? "Continuez la conversation..." : `Posez une question sur ${course.name}...`}
                  hasMessages={hasMessages}
                />
              </div>
              
              {/* Flashcards Button */}
              <button
                onClick={() => setShowFlashcards(true)}
                className="p-2.5 rounded-xl transition-all duration-200 flex-shrink-0 bg-zinc-800/50 text-zinc-500 hover:text-violet-400 hover:bg-violet-500/10 relative"
                title="Flashcards"
              >
                <Brain className="w-5 h-5" />
                {course.flashcards.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[10px] bg-violet-500 text-white rounded-full">
                    {course.flashcards.length}
                  </span>
                )}
              </button>
              
              {/* Toggle Tasks Button */}
              {course.linkedProjectId && (
                <button
                  onClick={() => setShowTasks(!showTasks)}
                  className={`p-2.5 rounded-xl transition-all duration-200 flex-shrink-0 ${
                    showTasks 
                      ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30' 
                      : 'bg-zinc-800/50 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                  }`}
                  title={showTasks ? "Masquer les tâches" : "Afficher les tâches"}
                >
                  <ListTodo className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Panneau des tâches liées (si projet lié ET showTasks) */}
      {course.linkedProjectId && showTasks && (
        <div className="hidden lg:block w-72 border-l border-zinc-800/50 bg-zinc-950 p-3 overflow-y-auto">
          <LinkedTasks projectId={course.linkedProjectId} />
        </div>
      )}
      
      {/* Flashcard Modal */}
      <FlashcardModal
        isOpen={showFlashcards}
        onClose={() => setShowFlashcards(false)}
        flashcards={course.flashcards}
        onAddFlashcard={handleAddFlashcard}
        onDeleteFlashcard={handleDeleteFlashcard}
        courseName={course.name}
        course={course}
      />
    </div>
  )
})

