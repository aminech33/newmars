import { memo } from 'react'
import { Lightbulb } from 'lucide-react'
import { HealthSuggestion } from '../../utils/healthIntelligence'

interface HealthSuggestionsProps {
  suggestions: HealthSuggestion[]
}

const PRIORITY_COLORS = {
  high: 'border-rose-500/30 bg-rose-500/5',
  medium: 'border-amber-500/30 bg-amber-500/5',
  low: 'border-emerald-500/30 bg-emerald-500/5'
}

export const HealthSuggestions = memo(function HealthSuggestions({ suggestions }: HealthSuggestionsProps) {
  if (suggestions.length === 0) return null

  return (
    <div 
      className="bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
      style={{ border: '1px solid rgba(255,255,255,0.08)' }}
      role="region"
      aria-label="Suggestions intelligentes"
    >
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-amber-400" aria-hidden="true" />
        <h2 className="text-lg font-medium text-zinc-200">Suggestions intelligentes</h2>
      </div>
      
      <div className="space-y-3">
        {suggestions.slice(0, 5).map((suggestion, index) => (
          <div 
            key={index} 
            className={`p-4 rounded-2xl border ${PRIORITY_COLORS[suggestion.priority]} transition-all hover:scale-[1.01]`}
          >
            <p className="text-sm text-zinc-300 mb-1">{suggestion.message}</p>
            {suggestion.action && (
              <p className="text-xs text-zinc-500 flex items-center gap-1">
                <span aria-hidden="true">💡</span> {suggestion.action}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
})

