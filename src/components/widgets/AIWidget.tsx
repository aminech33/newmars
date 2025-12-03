import { memo } from 'react'
import { Sparkles, Zap, MessageSquare } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'

interface AIWidgetProps {
  widget: Widget
}

export const AIWidget = memo(function AIWidget({ widget }: AIWidgetProps) {
  const { id } = widget
  const { setView } = useStore()

  return (
    <WidgetContainer id={id} title="" currentSize="notification" onClick={() => setView('ai')}>
      <div className="h-full flex flex-col p-6 gap-4">
        {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <Sparkles className="w-12 h-12 text-blue-400" strokeWidth={1.5} />
              </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">En ligne</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center flex-1 flex flex-col justify-center">
          <div className="text-5xl font-bold text-white leading-none mb-3">
            IA
          </div>
          <div className="text-sm text-zinc-500 uppercase tracking-wide mb-4">
            assistant
          </div>
          
          {/* Features */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <MessageSquare className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <span className="text-sm text-zinc-300">Pose tes questions</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <Zap className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span className="text-sm text-zinc-300">Réponses instantanées</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-2 border-t border-white/10">
          <span className="text-xs text-zinc-400">
            Propulsé par GPT-4
          </span>
        </div>
      </div>
    </WidgetContainer>
  )
})
