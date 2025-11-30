import { X } from 'lucide-react'
import { useEffect } from 'react'

interface MetricDetailModalProps {
  isOpen: boolean
  onClose: () => void
  metric: {
    label: string
    value: number
    max: number
    icon: string
    description: string
    tips: string[]
  }
}

export function MetricDetailModal({ isOpen, onClose, metric }: MetricDetailModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
    }
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const percent = Math.round((metric.value / metric.max) * 100)

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="metric-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="text-3xl" role="img" aria-label={metric.label}>{metric.icon}</span>
            <h2 id="metric-title" className="text-xl font-semibold text-zinc-100">{metric.label}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Score */}
          <div className="text-center">
            <div className="text-5xl font-light text-zinc-100 mb-2">
              {metric.value}<span className="text-2xl text-zinc-600">/{metric.max}</span>
            </div>
            <div className="text-sm text-zinc-500 mb-4">{percent}% de l'objectif</div>
            
            {/* Progress bar */}
            <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-2">Description</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">{metric.description}</p>
          </div>

          {/* Tips */}
          {metric.tips.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">💡 Conseils pour améliorer</h3>
              <ul className="space-y-2">
                {metric.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-500">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors"
          >
            Compris !
          </button>
        </div>
      </div>
    </div>
  )
}

