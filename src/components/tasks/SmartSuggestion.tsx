import { Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { Task } from '../../store/useStore'
import { suggestNextTask, generateSmartSuggestions } from '../../utils/taskIntelligence'

interface SmartSuggestionProps {
  tasks: Task[]
}

export function SmartSuggestion({ tasks }: SmartSuggestionProps) {
  const [dismissed, setDismissed] = useState(false)
  
  const nextTask = suggestNextTask(tasks)
  const suggestions = generateSmartSuggestions(tasks)
  
  if (dismissed || (!nextTask && suggestions.length === 0)) return null
  
  return (
    <div className="mb-6 backdrop-blur-xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 rounded-2xl p-4 shadow-[0_4px_24px_rgba(91,127,255,0.1)] animate-slide-up"
      style={{ border: '1px solid rgba(99, 102, 241, 0.2)' }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Sparkles className="w-5 h-5 text-indigo-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-indigo-300 mb-2">💡 Suggestion Intelligente</h3>
          
          {nextTask && (
            <div className="mb-3 p-3 bg-zinc-900/30 rounded-xl">
              <p className="text-sm text-zinc-300 mb-1">
                Commencer par : <span className="font-medium text-zinc-100">"{nextTask.title}"</span>
              </p>
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                {nextTask.estimatedTime && (
                  <span>⏱️ ~{nextTask.estimatedTime}min</span>
                )}
                <span className={`
                  ${nextTask.priority === 'urgent' ? 'text-rose-400' : ''}
                  ${nextTask.priority === 'high' ? 'text-amber-400' : ''}
                  ${nextTask.priority === 'medium' ? 'text-cyan-400' : ''}
                  ${nextTask.priority === 'low' ? 'text-zinc-500' : ''}
                `}>
                  {nextTask.priority === 'urgent' && '🔴 Urgent'}
                  {nextTask.priority === 'high' && '🟠 Haute priorité'}
                  {nextTask.priority === 'medium' && '🟡 Priorité moyenne'}
                  {nextTask.priority === 'low' && '🟢 Basse priorité'}
                </span>
              </div>
            </div>
          )}
          
          {suggestions.length > 0 && (
            <div className="space-y-1.5">
              {suggestions.slice(0, 2).map((suggestion, index) => (
                <p key={index} className="text-xs text-zinc-400">
                  {suggestion}
                </p>
              ))}
            </div>
          )}
        </div>
        
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 p-1 text-zinc-600 hover:text-zinc-400 transition-colors rounded-lg hover:bg-zinc-800/50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
