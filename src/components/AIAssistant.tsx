import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Sparkles, Code, Lightbulb, BarChart3, Zap, BookOpen } from 'lucide-react'
import { useStore } from '../store/useStore'
import { generateGeminiStreamingResponse } from '../utils/geminiAI'
import { MessageBubble } from './ai/MessageBubble'
import { TypingIndicator } from './ai/TypingIndicator'
import { SuggestionCard } from './ai/SuggestionCard'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  isLiked?: boolean
}

const suggestions = [
  {
    icon: Code,
    title: "Aide au code",
    description: "Explique-moi un concept",
    prompt: "Explique-moi les closures en JavaScript avec un exemple simple"
  },
  {
    icon: Lightbulb,
    title: "Idée créative",
    description: "Inspire-moi",
    prompt: "Donne-moi 3 idées de projets créatifs que je peux réaliser ce weekend"
  },
  {
    icon: BarChart3,
    title: "Analyse productivité",
    description: "Résume ma journée",
    prompt: "Quelles sont mes priorités aujourd'hui ?"
  },
  {
    icon: Zap,
    title: "Question rapide",
    description: "Discussion simple",
    prompt: "Comment ça va ?"
  },
  {
    icon: BookOpen,
    title: "Apprentissage",
    description: "Enseigne-moi",
    prompt: "Enseigne-moi un concept intéressant en 2 minutes"
  },
]

export function AIAssistant() {
  const { 
    setView, 
    tasks, 
    focusMinutes, 
    habits, 
    books,
    learningCourses
  } = useStore()
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "👋 Bonjour ! Je suis Gemini, votre assistant IA. Je peux vous aider avec du code, des idées créatives, analyser votre productivité, ou simplement discuter. Comment puis-je vous aider ?",
      timestamp: Date.now(),
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Prepare assistant message ID (but don't create the bubble yet)
    const assistantMessageId = (Date.now() + 1).toString()
    let messageCreated = false

    try {
      // Detect if user is asking about productivity/data
      const lowerContent = userMessage.content.toLowerCase()
      const needsData = 
        lowerContent.includes('tâche') ||
        lowerContent.includes('task') ||
        lowerContent.includes('priorité') ||
        lowerContent.includes('habitude') ||
        lowerContent.includes('livre') ||
        lowerContent.includes('cours') ||
        lowerContent.includes('focus') ||
        lowerContent.includes('productiv') ||
        lowerContent.includes('journée') ||
        lowerContent.includes('semaine') ||
        lowerContent.includes('aujourd\'hui') ||
        lowerContent.includes('résume') ||
        lowerContent.includes('analyse')

      // Build context based on need
      let context = ''
      
      if (needsData) {
        // Full context with user data
        const pendingTasks = tasks.filter(t => !t.completed)
        const completedTasks = tasks.filter(t => t.completed)
        const urgentTasks = tasks.filter(t => t.category === 'urgent' && !t.completed)
        const activeHabits = habits.filter(h => !h.archived)
        const readingBooks = books.filter(b => b.status === 'reading')
        const activeCourses = learningCourses.filter(c => c.status === 'active')

        context = `Tu es un assistant IA polyvalent et chaleureux. L'utilisateur t'a demandé des infos sur sa productivité/données personnelles. Voici ses données actuelles :

📋 TÂCHES: ${tasks.length} total (${completedTasks.length} complétées, ${pendingTasks.length} en cours, ${urgentTasks.length} urgentes)
${pendingTasks.length > 0 ? `En cours: ${pendingTasks.slice(0, 5).map(t => t.title).join(', ')}` : ''}

🔥 HABITUDES: ${activeHabits.length} actives${activeHabits.length > 0 ? ` (${activeHabits.map(h => h.name).join(', ')})` : ''}
📚 LECTURE: ${readingBooks.length} livre(s) en cours${readingBooks.length > 0 ? ` (${readingBooks.map(b => b.title).join(', ')})` : ''}
🎓 COURS: ${activeCourses.length} actif(s)${activeCourses.length > 0 ? ` (${activeCourses.map(c => c.name).join(', ')})` : ''}
⏱️ FOCUS: ${Math.floor(focusMinutes / 60)}h${focusMinutes % 60}min total

Réponds de manière naturelle, chaleureuse et utile. N'hésite pas à féliciter ou encourager si c'est pertinent !`
      } else {
        // Minimal context - general conversation
        context = `Tu es Gemini, un assistant IA polyvalent développé par Google. Tu peux discuter de tout, aider sur n'importe quel sujet, expliquer des concepts, donner des conseils, être créatif, etc.

Sois naturel, chaleureux et serviable. Réponds comme un ami intelligent et bienveillant. N'hésite pas à poser des questions pour mieux comprendre les besoins de l'utilisateur.

Tu as aussi accès aux données personnelles de l'utilisateur (tâches, habitudes, livres, cours...) mais uniquement si il te le demande explicitement.`
      }

      // Build conversation history
      const conversationHistory = messages
        .filter(m => m.id !== '1' && m.id !== assistantMessageId)
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }))

      // Use streaming API with real-time updates
      let accumulatedContent = ''
      await generateGeminiStreamingResponse(
        context,
        userMessage.content,
        conversationHistory,
        (chunk) => {
          // Accumulate chunks
          accumulatedContent += chunk
          
          // Create message on first chunk (avoid empty bubble)
          if (!messageCreated) {
            setMessages(prev => [...prev, {
              id: assistantMessageId,
              role: 'assistant',
              content: accumulatedContent,
              timestamp: Date.now(),
            }])
            messageCreated = true
          } else {
            // Update existing message
            setMessages(prev => prev.map(m => 
              m.id === assistantMessageId 
                ? { ...m, content: accumulatedContent }
                : m
            ))
          }
        }
      )
    } catch (error) {
      setMessages(prev => prev.map(m => 
        m.id === assistantMessageId 
          ? { ...m, content: `❌ Une erreur est survenue. ${error instanceof Error ? error.message : ''}` }
          : m
      ))
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      {/* Header - Standard */}
      <header className="flex-shrink-0 px-4 py-2 border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('hub')}
            className="p-1.5 hover:bg-zinc-800/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-400" />
          </button>
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h1 className="text-lg font-semibold text-zinc-200">Assistant IA</h1>
          <span className="text-xs text-zinc-500">Gemini 2.5 Flash</span>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-auto px-4 py-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
              isLiked={message.isLiked}
              onCopy={() => {}}
              onLike={() => {
                setMessages(prev => prev.map(m =>
                  m.id === message.id ? { ...m, isLiked: !m.isLiked } : m
                ))
              }}
              onRegenerate={() => {
                // Régénération: récupérer le dernier message utilisateur et le renvoyer
                const lastUserMessage = messages.filter(m => m.role === 'user').pop()
                if (lastUserMessage) {
                  setInput(lastUserMessage.content)
                  // Trigger send on next tick after state update
                  setTimeout(() => {
                    const sendButton = document.querySelector('[data-send-button]') as HTMLButtonElement
                    sendButton?.click()
                  }, 0)
                }
              }}
            />
          ))}

          {isTyping && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggestions (only show if less than 2 messages) */}
      {messages.length <= 1 && (
        <div className="flex-shrink-0 px-4 pb-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xs font-medium text-zinc-400 mb-2">💡 Suggestions</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {suggestions.map((suggestion, index) => (
                <SuggestionCard
                  key={index}
                  icon={suggestion.icon}
                  title={suggestion.title}
                  description={suggestion.description}
                  onClick={() => setInput(suggestion.prompt)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Premium Input Area */}
      <div className="flex-shrink-0 px-6 pb-6 border-t border-zinc-900/50">
        <div className="max-w-4xl mx-auto pt-4">
          <div className="relative">
            {/* Textarea */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question... (Shift+Enter pour nouvelle ligne)"
              rows={1}
              className="w-full px-4 py-3 pr-12 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent resize-none transition-[border-color,box-shadow] duration-200"
              style={{
                minHeight: '48px',
                maxHeight: '200px',
              }}
            />

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="absolute right-2 bottom-2 p-2 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-[background,transform,opacity] duration-200 hover:scale-105 disabled:hover:scale-100 shadow-lg shadow-indigo-500/20"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>

          {/* Helper Text */}
          <p className="text-xs text-zinc-600 mt-2">
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">Enter</kbd> pour envoyer · 
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 ml-1">Shift+Enter</kbd> pour nouvelle ligne
          </p>
        </div>
      </div>
    </div>
  )
}
