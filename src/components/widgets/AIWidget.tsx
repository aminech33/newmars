import { memo } from 'react'
import { Sparkles, ArrowRight, Zap, Brain } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'

interface AIWidgetProps {
  widget: Widget
}

export const AIWidget = memo(function AIWidget({ widget }: AIWidgetProps) {
  const { id, size = 'small' } = widget
  const { setView } = useStore()

  // SMALL - Design immersif
  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="" currentSize={size} onClick={() => setView('ai')}>
        <div className="h-full flex flex-col justify-between p-5 overflow-hidden">
          
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="mb-3">
              <div className="absolute inset-0 bg-white/20 blur-xl rounded-full animate-pulse" />
              <Sparkles className="relative w-12 h-12 text-white" />
            </div>
            <div className="text-xs font-semibold text-white/80 uppercase tracking-wide mb-2">Assistant IA</div>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              <span className="text-xs text-white font-medium">En ligne</span>
            </div>
          </div>
        </div>
      </WidgetContainer>
    )
  }

  // MEDIUM - Carte moderne
  if (size === 'medium') {
    return (
      <WidgetContainer 
        id={id} 
        title=""
        currentSize={size}
        onClick={() => setView('ai')}
        actions={
          <button
            onClick={(e) => {
              e.stopPropagation()
              setView('ai')
            }}
            className="text-purple-200 hover:text-white transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        }
      >
        <div className="h-full p-5 overflow-auto">
          {/* Pattern de fond */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)'
          }} />

          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-5 h-5 text-white/90" />
                <span className="text-sm font-semibold text-white/90 uppercase tracking-wide">Assistant IA</span>
              </div>
            </div>

            {/* Status */}
            <div className="bg-white/10 backdrop-blur-sm shadow-md shadow-black/5 rounded-xl p-4 mb-4 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 blur-lg rounded-full animate-pulse" />
                  <Sparkles className="relative w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="text-base font-medium text-white">Prêt à vous aider</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                    <span className="text-xs text-white/70">En ligne</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="space-y-2 flex-1">
              <div className="text-xs text-white/70 font-semibold uppercase tracking-wide mb-2">Suggestions</div>
              <div className="space-y-2">
                <div className="p-3 bg-white/10 backdrop-blur-sm shadow-md shadow-black/5 rounded-lg border border-white/20 hover:bg-white/15 hover:shadow-lg transition-all cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-white/70" />
                    <span className="text-sm text-white/90">Quelles sont mes priorités ?</span>
                  </div>
                </div>
                <div className="p-3 bg-white/10 backdrop-blur-sm shadow-md shadow-black/5 rounded-lg border border-white/20 hover:bg-white/15 hover:shadow-lg transition-all cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-white/70" />
                    <span className="text-sm text-white/90">Résume ma semaine</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </WidgetContainer>
    )
  }

  // LARGE - Vue complète
  return (
    <WidgetContainer 
      id={id} 
      title=""
      currentSize={size}
      onClick={() => setView('ai')}
      actions={
        <button
          onClick={(e) => {
            e.stopPropagation()
            setView('ai')
          }}
          className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs text-white transition-colors"
        >
          Ouvrir
        </button>
      }
    >
      <div 
        className="absolute inset-0 p-6 overflow-y-auto"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        {/* Pattern de fond */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)'
        }} />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 blur-xl rounded-full animate-pulse" />
              <Brain className="relative w-8 h-8 text-white" />
            </div>
            <div>
              <div className="text-lg font-semibold text-white uppercase tracking-wide">Assistant IA</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                <span className="text-xs text-white/70">En ligne et prêt</span>
              </div>
            </div>
          </div>

          {/* Main card */}
          <div className="bg-white/15 backdrop-blur-sm shadow-lg shadow-black/5 rounded-2xl p-6 mb-6 border border-white/30">
            <div className="flex items-start gap-4 mb-4">
              <Sparkles className="w-10 h-10 text-white" />
              <div>
                <div className="text-base font-medium text-white mb-2">Comment puis-je vous aider ?</div>
                <div className="text-sm text-white/80">
                  Posez-moi des questions sur vos tâches, objectifs, ou demandez des conseils de productivité.
                </div>
              </div>
            </div>
          </div>

          {/* Suggestions */}
          <div className="mb-4">
            <div className="text-xs text-white/70 font-semibold uppercase tracking-wide mb-3">Suggestions</div>
            <div className="space-y-2">
              <div className="p-4 bg-white/10 backdrop-blur-sm shadow-md shadow-black/5 rounded-xl border border-white/20 hover:bg-white/15 hover:shadow-lg transition-all cursor-pointer group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-sm font-medium text-white">Quelles sont mes priorités ?</div>
                </div>
                <div className="text-xs text-white/70">Analyse vos tâches et identifie les priorités</div>
              </div>

              <div className="p-4 bg-white/10 backdrop-blur-sm shadow-md shadow-black/5 rounded-xl border border-white/20 hover:bg-white/15 hover:shadow-lg transition-all cursor-pointer group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-sm font-medium text-white">Résume ma semaine</div>
                </div>
                <div className="text-xs text-white/70">Aperçu de votre productivité hebdomadaire</div>
              </div>

              <div className="p-4 bg-white/10 backdrop-blur-sm shadow-md shadow-black/5 rounded-xl border border-white/20 hover:bg-white/15 hover:shadow-lg transition-all cursor-pointer group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-sm font-medium text-white">Conseils de productivité</div>
                </div>
                <div className="text-xs text-white/70">Optimisez votre workflow quotidien</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  )
})
