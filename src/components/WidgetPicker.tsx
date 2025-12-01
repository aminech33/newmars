import { useState, useMemo, useEffect } from 'react'
import { X, Search, Plus } from 'lucide-react'
import { useStore } from '../store/useStore'
import { WidgetType } from '../types/widgets'
import { widgetRegistry, widgetCategories, WidgetDefinition } from '../config/widgetRegistry'

interface WidgetPickerProps {
  isOpen: boolean
  onClose: () => void
}

export function WidgetPicker({ isOpen, onClose }: WidgetPickerProps) {
  const { addWidget, widgets } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all')
  const [_hoveredWidget, setHoveredWidget] = useState<string | null>(null)

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      setSelectedCategory('all')
    }
  }, [isOpen])

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Filter widgets
  const filteredWidgets = useMemo(() => {
    return Object.values(widgetRegistry).filter(widget => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!widget.label.toLowerCase().includes(query) && 
            !widget.description.toLowerCase().includes(query)) {
          return false
        }
      }
      
      // Category filter
      if (selectedCategory !== 'all' && widget.category !== selectedCategory) {
        return false
      }
      
      return true
    })
  }, [searchQuery, selectedCategory])

  // Group by category
  const groupedWidgets = useMemo(() => {
    if (selectedCategory !== 'all') {
      return { [selectedCategory]: filteredWidgets }
    }
    
    return filteredWidgets.reduce((acc, widget) => {
      if (!acc[widget.category]) acc[widget.category] = []
      acc[widget.category].push(widget)
      return acc
    }, {} as Record<string, WidgetDefinition[]>)
  }, [filteredWidgets, selectedCategory])

  const handleAddWidget = (type: WidgetType) => {
    const definition = widgetRegistry[type]
    
    // Find next available position
    const maxY = Math.max(0, ...widgets.map(w => w.position.y + w.dimensions.height))
    
    addWidget({
      type,
      size: definition?.defaultSize || 'medium',
      dimensions: { width: 1, height: 1 },
      position: { x: 0, y: maxY }
    })
    
    onClose()
  }

  // Check if widget already exists
  const isWidgetAdded = (type: string) => {
    return widgets.some(w => w.type === type)
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="widget-picker-title"
    >
      <div 
        className="w-full max-w-3xl bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
          <div>
            <h2 id="widget-picker-title" className="text-lg font-semibold text-zinc-100">
              Ajouter un widget
            </h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              {Object.keys(widgetRegistry).length} widgets disponibles
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-xl transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="px-6 py-4 border-b border-zinc-800/50 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un widget..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/50 rounded-xl text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              autoFocus
            />
          </div>
          
          {/* Category filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border border-transparent'
              }`}
            >
              Tous
            </button>
            {widgetCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border border-transparent'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Widget Grid */}
        <div className="p-6 max-h-[60vh] overflow-auto">
          {filteredWidgets.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-zinc-500">Aucun widget trouvé</p>
              <p className="text-zinc-700 text-sm mt-1">Essayez une autre recherche</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedWidgets).map(([category, categoryWidgets]) => {
                const categoryInfo = widgetCategories.find(c => c.id === category)
                
                return (
                  <div key={category}>
                    {selectedCategory === 'all' && (
                      <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span>{categoryInfo?.icon}</span>
                        <span>{categoryInfo?.label}</span>
                      </h3>
                    )}
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {categoryWidgets.map((widget) => {
                        const Icon = widget.icon
                        const alreadyAdded = isWidgetAdded(widget.type)
                        
                        return (
                          <button
                            key={widget.type}
                            onClick={() => handleAddWidget(widget.type as WidgetType)}
                            onMouseEnter={() => setHoveredWidget(widget.type)}
                            onMouseLeave={() => setHoveredWidget(null)}
                            disabled={alreadyAdded}
                            className={`
                              relative p-4 text-left rounded-2xl transition-all duration-200 group
                              ${alreadyAdded 
                                ? 'bg-zinc-800/30 opacity-50 cursor-not-allowed' 
                                : 'bg-zinc-800/50 hover:bg-zinc-800 hover:shadow-lg hover:scale-[1.02]'
                              }
                            `}
                            style={{ border: '1px solid rgba(255,255,255,0.05)' }}
                          >
                            {/* Icon */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                              alreadyAdded ? 'bg-zinc-700/50' : 'bg-indigo-500/10 group-hover:bg-indigo-500/20'
                            }`}>
                              <Icon className={`w-5 h-5 ${alreadyAdded ? 'text-zinc-600' : 'text-indigo-400'}`} />
                            </div>
                            
                            {/* Content */}
                            <h4 className={`text-sm font-medium mb-1 ${alreadyAdded ? 'text-zinc-600' : 'text-zinc-200'}`}>
                              {widget.label}
                            </h4>
                            <p className={`text-xs ${alreadyAdded ? 'text-zinc-700' : 'text-zinc-500'}`}>
                              {widget.description}
                            </p>
                            
                            {/* Add indicator */}
                            {!alreadyAdded && (
                              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="p-1.5 bg-indigo-500 rounded-lg">
                                  <Plus className="w-3 h-3 text-white" />
                                </div>
                              </div>
                            )}
                            
                            {/* Already added badge */}
                            {alreadyAdded && (
                              <div className="absolute top-3 right-3">
                                <span className="text-[10px] text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">
                                  Ajouté
                                </span>
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-600">
              {widgets.length} widget{widgets.length > 1 ? 's' : ''} actif{widgets.length > 1 ? 's' : ''}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
