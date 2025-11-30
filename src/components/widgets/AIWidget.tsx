import { memo } from 'react'
import { Sparkles, ArrowRight } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'

interface AIWidgetProps {
  widget: Widget
}

export const AIWidget = memo(function AIWidget({ widget }: AIWidgetProps) {
  const { id, size = 'small' } = widget
  const { setView } = useStore()

  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="Assistant" currentSize={size} onClick={() => setView('ai')}>
        <div className="flex flex-col items-center justify-center h-full">
          <Sparkles className="w-8 h-8 text-violet-500/60 mb-2" />
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 animate-pulse" />
            <span className="text-xs text-zinc-600">Actif</span>
          </div>
        </div>
      </WidgetContainer>
    )
  }

  return (
    <WidgetContainer 
      id={id} 
      title="Assistant IA"
      currentSize={size}
      onClick={() => setView('ai')}
      actions={
        <button
          onClick={(e) => {
            e.stopPropagation()
            setView('ai')
          }}
          className="text-zinc-700 hover:text-zinc-500 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      }
    >
      <div className="flex flex-col justify-center h-full">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-violet-500/60" />
          <div>
            <p className="text-sm text-zinc-300">Prêt à vous aider</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 animate-pulse" />
              <span className="text-xs text-zinc-600">En ligne</span>
            </div>
          </div>
        </div>
        {size === 'large' && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-600">Suggestions :</p>
            <p className="text-xs text-zinc-500">• Quelles sont mes priorités ?</p>
            <p className="text-xs text-zinc-500">• Résume ma semaine</p>
          </div>
        )}
      </div>
    </WidgetContainer>
  )
})
