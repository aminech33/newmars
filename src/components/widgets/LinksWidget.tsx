import { ExternalLink, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'

interface LinksWidgetProps {
  widget: Widget
}

export function LinksWidget({ widget }: LinksWidgetProps) {
  const { id, size = 'small' } = widget
  const { quickLinks, deleteQuickLink } = useStore()
  const [isAdding, setIsAdding] = useState(false)

  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="Liens" currentSize={size}>
        <div className="flex flex-col items-center justify-center h-full">
          <ExternalLink className="w-8 h-8 text-zinc-600 mb-2" />
          <p className="text-xs text-zinc-600">{quickLinks.length} liens</p>
        </div>
      </WidgetContainer>
    )
  }

  return (
    <WidgetContainer 
      id={id} 
      title="Liens rapides"
      currentSize={size}
      actions={
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-zinc-700 hover:text-zinc-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      }
    >
      <div className="space-y-2 overflow-auto h-full">
        {quickLinks.map((link) => (
          <div key={link.id} className="group flex items-center gap-2">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 flex-1 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span>{link.label}</span>
            </a>
            <button
              onClick={() => deleteQuickLink(link.id)}
              className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-rose-400 transition-all"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        
        {quickLinks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-4">
            <div className="text-4xl mb-3">🔗</div>
            <p className="text-zinc-400 text-sm font-medium mb-1">Aucun lien</p>
            <p className="text-zinc-700 text-xs">Ajoutez vos favoris</p>
          </div>
        )}
      </div>
    </WidgetContainer>
  )
}
