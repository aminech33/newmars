import { Sparkles } from 'lucide-react'

export function TypingIndicator() {
  return (
    <div className="flex gap-4 animate-fade-in">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg animate-pulse">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Typing Animation */}
      <div className="flex-1">
        <div className="px-4 py-3 rounded-2xl bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 backdrop-blur-sm border border-zinc-700/50 inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

