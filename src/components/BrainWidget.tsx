/**
 * 🧠 BrainWidget - Affiche les suggestions du cerveau
 * 
 * Widget discret qui affiche :
 * - Score de bien-être
 * - Suggestion actuelle
 * - Célébrations récentes
 */

import { memo, useState } from 'react'
import { Brain, Sparkles, ChevronDown, ChevronUp, X, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useBrain, getScoreColor, getScoreEmoji, getTrendEmoji, getScoreDescription } from '../brain'
import { useStore } from '../store/useStore'

export const BrainWidget = memo(function BrainWidget() {
  const { wellbeing, suggestions, predictions, dismissSuggestion } = useBrain()
  const setView = useStore(state => state.setView)
  const [expanded, setExpanded] = useState(false)
  
  const scoreColor = getScoreColor(wellbeing.overall)
  const scoreEmoji = getScoreEmoji(wellbeing.overall)
  
  // Action handler pour les suggestions
  const handleAction = (action: string) => {
    if (action.startsWith('navigate:')) {
      const view = action.replace('navigate:', '')
      setView(view as any)
    }
  }
  
  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 space-y-3">
      {/* Header avec score */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${scoreColor}20` }}
          >
            <Brain className="w-5 h-5" style={{ color: scoreColor }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-zinc-200">
                {wellbeing.overall}
              </span>
              <span className="text-xl">{scoreEmoji}</span>
              {wellbeing.trend === 'improving' && (
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              )}
              {wellbeing.trend === 'declining' && (
                <TrendingDown className="w-4 h-4 text-rose-400" />
              )}
              {wellbeing.trend === 'stable' && (
                <Minus className="w-4 h-4 text-zinc-500" />
              )}
            </div>
            <p className="text-xs text-zinc-500">Bien-être</p>
          </div>
        </div>
        
        <button className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      
      {/* Suggestion actuelle (toujours visible si existe) */}
      {suggestions.now && (
        <div 
          className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/30"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-zinc-300 flex-1">
              {suggestions.now.message}
            </p>
            <button 
              onClick={() => dismissSuggestion(suggestions.now!.id)}
              className="p-1 text-zinc-600 hover:text-zinc-400 transition-colors shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          
          {suggestions.now.actionable && (
            <button
              onClick={() => handleAction(suggestions.now!.actionable!.action)}
              className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {suggestions.now.actionable.label} →
            </button>
          )}
        </div>
      )}
      
      {/* Détails expandés */}
      {expanded && (
        <div className="space-y-3 pt-2 border-t border-zinc-800/50">
          {/* Breakdown du score */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Productivité', value: wellbeing.breakdown.productivity, max: 25 },
              { label: 'Santé', value: wellbeing.breakdown.health, max: 25 },
              { label: 'Mental', value: wellbeing.breakdown.mental, max: 25 },
              { label: 'Constance', value: wellbeing.breakdown.consistency, max: 25 },
            ].map(item => (
              <div key={item.label} className="text-center">
                <div className="text-sm font-medium text-zinc-300">
                  {item.value}/{item.max}
                </div>
                <div className="text-[10px] text-zinc-600">{item.label}</div>
                <div className="mt-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(item.value / item.max) * 100}%`,
                      backgroundColor: scoreColor 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          {/* Prédictions */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
              En ce moment
            </h4>
            <div className="flex flex-wrap gap-2">
              {predictions.isGoodTimeForWork && (
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-lg">
                  ⚡ Heure productive
                </span>
              )}
              {predictions.energyLevel === 'high' && (
                <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-lg">
                  🔥 Énergie haute
                </span>
              )}
              {predictions.energyLevel === 'low' && (
                <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-lg">
                  😴 Énergie basse
                </span>
              )}
              {predictions.shouldEatSoon && (
                <span className="px-2 py-1 bg-orange-500/10 text-orange-400 text-xs rounded-lg">
                  🍽️ Penser à manger
                </span>
              )}
              {predictions.optimalTaskType === 'break' && (
                <span className="px-2 py-1 bg-purple-500/10 text-purple-400 text-xs rounded-lg">
                  ☕ Pause recommandée
                </span>
              )}
            </div>
          </div>
          
          {/* Célébrations */}
          {suggestions.achievements.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Bravo !
              </h4>
              <div className="space-y-1">
                {suggestions.achievements.map(achievement => (
                  <div 
                    key={achievement.id}
                    className="text-sm text-zinc-400 flex items-center gap-2"
                  >
                    <span>{achievement.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Description du score */}
          <p className="text-xs text-zinc-600 italic">
            {getScoreDescription(wellbeing.overall)}
          </p>
        </div>
      )}
    </div>
  )
})

/**
 * Version compacte pour le Hub
 */
export const BrainWidgetCompact = memo(function BrainWidgetCompact() {
  const { wellbeing, suggestions } = useBrain()
  const scoreColor = getScoreColor(wellbeing.overall)
  const scoreEmoji = getScoreEmoji(wellbeing.overall)
  
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-zinc-900/30 rounded-xl border border-zinc-800/30">
      <div 
        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
        style={{ backgroundColor: `${scoreColor}15` }}
      >
        {scoreEmoji}
      </div>
      <div className="flex-1 min-w-0">
        {suggestions.now ? (
          <p className="text-xs text-zinc-400 truncate">
            {suggestions.now.message}
          </p>
        ) : (
          <p className="text-xs text-zinc-500">
            Tout va bien ! Score: {wellbeing.overall}/100
          </p>
        )}
      </div>
    </div>
  )
})



