import { memo } from 'react'
import { Search, ArrowRight, Zap } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'

interface SearchWidgetTileProps {
  widget: Widget
}

export const SearchWidgetTile = memo(function SearchWidgetTile({ widget }: SearchWidgetTileProps) {
  const { id, size = 'small' } = widget
  const { setCommandPaletteOpen } = useStore()

  // SMALL - Search button
  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="" currentSize={size} onClick={() => setCommandPaletteOpen(true)}>
        <div className="h-full flex flex-col items-center justify-center p-4 group cursor-pointer">
          <div className="relative inline-block mb-3">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-50 group-hover:opacity-75 transition-opacity" />
            <Search className="relative w-10 h-10 text-blue-400" />
          </div>
          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">
            Recherche
          </div>
          <kbd className="text-xs text-zinc-500 font-medium bg-white/5 px-2 py-0.5 rounded border border-white/10">
            ⌘K
          </kbd>
        </div>
      </WidgetContainer>
    )
  }

  // MEDIUM - Search with categories
  if (size === 'medium') {
    return (
      <WidgetContainer 
        id={id} 
        title="Recherche"
        currentSize={size}
        actions={
          <button
            onClick={(e) => {
              e.stopPropagation()
              setCommandPaletteOpen(true)
            }}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        }
      >
        <div className="h-full flex flex-col gap-3">
          {/* Search Button */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="w-full bg-white/5 hover:bg-white/10 rounded-xl px-4 py-4 flex items-center gap-3 transition-all border border-white/10 hover:border-blue-500/30 group"
          >
            <Search className="w-5 h-5 text-blue-400 group-hover:text-blue-300" />
            <span className="text-sm text-zinc-400 group-hover:text-white flex-1 text-left">
              Rechercher...
            </span>
            <kbd className="text-xs text-zinc-600 px-2 py-1 bg-white/5 rounded border border-white/10">
              ⌘K
            </kbd>
          </button>
          
          {/* Quick Categories */}
          <div className="grid grid-cols-2 gap-2 flex-1">
            <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
              <div className="text-2xl mb-1">📋</div>
              <div className="text-xs text-zinc-400 font-medium">Tâches</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
              <div className="text-2xl mb-1">📚</div>
              <div className="text-xs text-zinc-400 font-medium">Livres</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
              <div className="text-2xl mb-1">📅</div>
              <div className="text-xs text-zinc-400 font-medium">Calendrier</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
              <div className="text-2xl mb-1">📔</div>
              <div className="text-xs text-zinc-400 font-medium">Journal</div>
            </div>
          </div>
        </div>
      </WidgetContainer>
    )
  }

  // LARGE - Full search panel
  return (
    <WidgetContainer 
      id={id} 
      title="Recherche"
      currentSize={size}
      actions={
        <kbd className="text-xs text-zinc-600 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
          ⌘K
        </kbd>
      }
    >
      <div className="h-full flex flex-col gap-3">
        {/* Search Button */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full bg-white/5 hover:bg-white/10 rounded-xl px-5 py-5 flex items-center gap-3 transition-all border border-white/10 hover:border-blue-500/30 group"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <Search className="relative w-6 h-6 text-blue-400" />
          </div>
          <span className="text-base text-zinc-300 group-hover:text-white flex-1 text-left transition-colors">
            Rechercher des tâches, événements, notes, livres...
          </span>
          <kbd className="text-xs text-zinc-600 px-3 py-2 bg-white/5 rounded-lg border border-white/10 group-hover:border-white/20 transition-colors">
            ⌘K
          </kbd>
        </button>

        {/* Quick Access Categories */}
        <div className="flex-1 overflow-auto">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wide">Accès rapide</span>
          </div>
          
          <div className="space-y-2">
            {[
              { icon: '📋', label: 'Tâches', desc: 'Rechercher dans vos tâches' },
              { icon: '📅', label: 'Calendrier', desc: 'Événements et rendez-vous' },
              { icon: '📚', label: 'Bibliothèque', desc: 'Livres et citations' },
              { icon: '📔', label: 'Journal', desc: 'Entrées personnelles' },
              { icon: '⏱️', label: 'Pomodoro', desc: 'Timer & time tracking' }
            ].map(item => (
              <button
                key={item.label}
                onClick={() => setCommandPaletteOpen(true)}
                className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10 group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                  <span className="text-base">{item.icon}</span>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-medium text-zinc-300 group-hover:text-white">{item.label}</div>
                  <div className="text-xs text-zinc-600 truncate">{item.desc}</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </WidgetContainer>
  )
})
