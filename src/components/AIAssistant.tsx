import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Send, Sparkles, Loader2 } from 'lucide-react'
import { useStore } from '../store/useStore'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const suggestions = [
  "Quelles sont mes priorités ?",
  "Résume ma semaine",
  "Planifie ma journée",
]

export function AIAssistant() {
  const { setView, tasks, focusMinutes } = useStore()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Comment puis-je vous aider aujourd'hui ?",
      timestamp: Date.now(),
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const generateResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase()
    const pendingTasks = tasks.filter(t => !t.completed)
    const completedTasks = tasks.filter(t => t.completed)
    const urgentTasks = tasks.filter(t => t.category === 'urgent' && !t.completed)

    if (lowerMessage.includes('priorit') || lowerMessage.includes('urgent')) {
      if (urgentTasks.length > 0) {
        return `${urgentTasks.length} tâche(s) urgente(s) :\n\n${urgentTasks.map(t => `→ ${t.title}`).join('\n')}`
      }
      const topTasks = pendingTasks.slice(0, 3)
      return `Vos priorités :\n\n${topTasks.map(t => `→ ${t.title}`).join('\n')}`
    }

    if (lowerMessage.includes('résume') || lowerMessage.includes('semaine')) {
      return `Cette semaine :\n\n→ ${completedTasks.length} tâches terminées\n→ ${pendingTasks.length} en cours\n→ ${Math.floor(focusMinutes / 60)}h de focus\n\n${completedTasks.length > pendingTasks.length ? 'Excellent travail.' : 'Continuez ainsi.'}`
    }

    if (lowerMessage.includes('planif') || lowerMessage.includes('journée')) {
      const todayTasks = pendingTasks.slice(0, 3)
      if (todayTasks.length === 0) {
        return "Aucune tâche en attente. Profitez de votre journée."
      }
      return `Plan suggéré :\n\n${todayTasks.map((t, i) => `${i + 1}. ${t.title}`).join('\n')}`
    }

    return `${pendingTasks.length} tâches en cours. Comment puis-je vous aider ?`
  }

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

    setTimeout(() => {
      const response = generateResponse(userMessage.content)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsTyping(false)
    }, 600 + Math.random() * 400)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="h-full w-full flex flex-col view-transition">
      {/* Minimal Header */}
      <header className="flex-shrink-0 px-6 py-5 border-b border-zinc-900">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={() => setView('hub')}
            className="p-2 -ml-2 text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-zinc-600" />
            <h1 className="text-xl font-medium tracking-tight text-zinc-200">Assistant</h1>
          </div>
        </div>
      </header>

      {/* Messages - No bubbles, clean layout */}
      <div className="flex-1 overflow-auto px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              {message.role === 'assistant' ? (
                <div className="flex gap-4">
                  <span className="text-zinc-700 mt-0.5">◆</span>
                  <p className="text-zinc-400 whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
              ) : (
                <div className="flex gap-4">
                  <span className="text-zinc-600 mt-0.5">▸</span>
                  <p className="text-zinc-200 whitespace-pre-wrap">{message.content}</p>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-4 animate-fade-in">
              <span className="text-zinc-700 mt-0.5">◆</span>
              <Loader2 className="w-4 h-4 text-zinc-600 animate-spin" />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggestions */}
      {messages.length < 3 && (
        <div className="px-6 pb-4">
          <div className="max-w-2xl mx-auto flex gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setInput(suggestion)}
                className="px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-400 border border-zinc-800 hover:border-zinc-700 rounded-full transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Inline Input */}
      <div className="flex-shrink-0 px-6 pb-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 py-4 border-t border-zinc-900">
            <span className="text-zinc-700">▸</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez une question..."
              className="flex-1 bg-transparent text-zinc-200 placeholder:text-zinc-700 focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="text-zinc-700 hover:text-zinc-400 disabled:opacity-30 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
