/**
 * 🤖 Terminal Command Suggester - Suggestions intelligentes IA
 */

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
// import { suggestTerminalCommand } from '../../utils/learningIntelligence'  // TODO: Re-implement

interface TerminalSuggesterProps {
  recentCommands: string[]
  recentOutput: string
  onAcceptSuggestion: (command: string) => void
}

export function TerminalSuggester({
  recentCommands,
  recentOutput,
  onAcceptSuggestion
}: TerminalSuggesterProps) {
  const [userIntent, setUserIntent] = useState('')
  const [suggestion, setSuggestion] = useState<{
    command: string
    explanation: string
    confidence: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showInput, setShowInput] = useState(false)

  const handleSuggest = async () => {
    if (!userIntent.trim() || userIntent.length < 3) return

    setIsLoading(true)
    try {
      const result = await suggestTerminalCommand(
        recentCommands,
        recentOutput,
        userIntent
      )
      
      if (result && result.confidence > 60) {
        setSuggestion(result)
      } else {
        setSuggestion(null)
      }
    } catch (error) {
      console.error('Suggestion failed:', error)
      setSuggestion(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccept = () => {
    if (suggestion) {
      onAcceptSuggestion(suggestion.command)
      setUserIntent('')
      setSuggestion(null)
      setShowInput(false)
    }
  }

  return (
    <div className="absolute top-2 right-2 z-10">
      {!showInput ? (
        <button
          onClick={() => setShowInput(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-xs font-medium text-purple-300 transition-all hover:scale-105"
          title="Suggérer une commande IA"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>IA</span>
        </button>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 shadow-2xl w-80">
          {/* Input */}
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={userIntent}
              onChange={(e) => setUserIntent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSuggest()
                if (e.key === 'Escape') setShowInput(false)
              }}
              placeholder="Que veux-tu faire ?"
              className="flex-1 px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500"
              autoFocus
            />
            <button
              onClick={handleSuggest}
              disabled={isLoading || userIntent.length < 3}
              className="px-2 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded text-xs font-medium transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                'OK'
              )}
            </button>
            <button
              onClick={() => setShowInput(false)}
              className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded text-xs transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Suggestion */}
          {suggestion && (
            <div className="space-y-2">
              <div className="p-2 bg-zinc-800/50 rounded border border-zinc-700">
                <code className="text-xs text-emerald-400 font-mono">
                  $ {suggestion.command}
                </code>
                <p className="text-xs text-zinc-400 mt-1">
                  {suggestion.explanation}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-zinc-500">
                    Confiance: {suggestion.confidence}%
                  </span>
                  <button
                    onClick={handleAccept}
                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors"
                  >
                    Exécuter
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* État vide */}
          {!suggestion && !isLoading && userIntent.length >= 3 && (
            <p className="text-xs text-zinc-500 text-center py-2">
              Appuie sur Entrée pour suggérer
            </p>
          )}
        </div>
      )}
    </div>
  )
}

