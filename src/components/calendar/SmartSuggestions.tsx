import { Lightbulb, X } from 'lucide-react'
import { useState } from 'react'
import { Event } from '../../types/calendar'
import { generateSmartSuggestions } from '../../utils/calendarIntelligence'

interface SmartSuggestionsProps {
  events: Event[]
}

export function SmartSuggestions({ events }: SmartSuggestionsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const suggestions = generateSmartSuggestions(events)
  
  const visibleSuggestions = suggestions.filter(s => !dismissed.has(s))
  
  if (visibleSuggestions.length === 0) return null
  
  const handleDismiss = (suggestion: string) => {
    setDismissed(new Set([...dismissed, suggestion]))
  }
  
  return (
    <div className="space-y-2 mb-4">
      {visibleSuggestions.map((suggestion, index) => (
        <div
          key={index}
          className="flex items-start gap-3 p-3 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-indigo-500/20 rounded-xl animate-fade-in"
        >
          <Lightbulb className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          <p className="flex-1 text-xs text-zinc-300 leading-relaxed">
            {suggestion}
          </p>
          <button
            onClick={() => handleDismiss(suggestion)}
            className="text-zinc-600 hover:text-zinc-400 transition-colors"
            aria-label="Ignorer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}




