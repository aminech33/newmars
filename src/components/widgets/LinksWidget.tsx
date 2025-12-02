import { memo, useState } from 'react'
import { ExternalLink, Plus, X, ArrowRight, Link as LinkIcon } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'

interface LinksWidgetProps {
  widget: Widget
}

export const LinksWidget = memo(function LinksWidget({ widget }: LinksWidgetProps) {
  const { id, size = 'small' } = widget
  const { quickLinks, addQuickLink, deleteQuickLink } = useStore()
  const [isAdding, setIsAdding] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newUrl, setNewUrl] = useState('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (newLabel.trim() && newUrl.trim()) {
      addQuickLink(newLabel.trim(), newUrl.trim())
      setNewLabel('')
      setNewUrl('')
      setIsAdding(false)
    }
  }

  // SMALL - Design immersif
  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="" currentSize={size} onClick={() => setIsAdding(true)}>
        <div className="h-full flex flex-col justify-between p-5 overflow-hidden">
          
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="text-xs font-semibold text-white/80 uppercase tracking-wide mb-1">Liens</div>
            <ExternalLink className="w-10 h-10 text-white mb-2" />
            <div className="text-2xl font-bold text-white">{quickLinks.length}</div>
            <div className="text-xs text-white/70">favoris</div>
          </div>
        </div>
      </WidgetContainer>
    )
  }

  // MEDIUM & LARGE - Carte moderne
  return (
    <WidgetContainer 
      id={id} 
      title=""
      currentSize={size}
      actions={
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsAdding(!isAdding)
          }}
          className="text-teal-200 hover:text-white transition-colors"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
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
              <LinkIcon className="w-5 h-5 text-white/90" />
              <span className="text-sm font-semibold text-white/90 uppercase tracking-wide">Liens Rapides</span>
            </div>
          </div>

          {/* Add form */}
          {isAdding && (
            <form onSubmit={handleAdd} className="space-y-2 mb-4 animate-fade-in">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Nom du lien"
                className="w-full px-4 py-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                autoFocus
              />
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-xl text-sm text-white font-medium transition-all"
              >
                Ajouter
              </button>
            </form>
          )}
          
          {/* Links list */}
          {quickLinks.length > 0 ? (
            <div className="space-y-2 flex-1 overflow-auto">
              {quickLinks.map((link) => (
                <div 
                  key={link.id}
                  className="group flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm border border-white/20 shadow-md shadow-black/5 rounded-xl hover:bg-white/15 hover:shadow-lg transition-all"
                >
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 flex-1 min-w-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-4 h-4 text-white/70 flex-shrink-0" />
                    <span className="text-sm text-white/90 truncate">{link.label}</span>
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteQuickLink(link.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 text-white/60 hover:text-white transition-all flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : !isAdding ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 border border-white/20">
                <ExternalLink className="w-8 h-8 text-white/70" />
              </div>
              <p className="text-base text-white/90 font-medium mb-2">Aucun lien</p>
              <p className="text-sm text-white/70 mb-4">Ajoutez vos sites favoris</p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsAdding(true)
                }}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-xl text-sm text-white font-medium transition-all"
              >
                Ajouter un lien
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </WidgetContainer>
  )
})
