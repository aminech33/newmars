import { useState, useEffect } from 'react'
import { Search, Edit3, Plus, Save, Layout, RotateCcw } from 'lucide-react'
import { useStore } from '../store/useStore'
import { WidgetGrid } from './WidgetGrid'
import { WidgetPicker } from './WidgetPicker'
import { ThemePicker } from './ThemePicker'

export function HubV2() {
  const { tasks, isEditMode, setEditMode, saveLayout, addTask, setView, setFocusMode, widgets, resetWidgets } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const [showWidgetPicker, setShowWidgetPicker] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [layoutName, setLayoutName] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSaveLayout = () => {
    if (layoutName.trim()) {
      saveLayout(layoutName.trim())
      setLayoutName('')
      setShowSaveDialog(false)
      setEditMode(false)
    }
  }

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !searchQuery.trim()) return
    
    const query = searchQuery.trim()
    
    // Commande IA
    if (query.startsWith('/ai ')) {
      setView('ai')
      setSearchQuery('')
      return
    }
    
    // Commande Focus
    if (query === '/focus') {
      const task = tasks.find(t => !t.completed)
      if (task) setFocusMode(true, task.id)
      setSearchQuery('')
      return
    }
    
    // Commande Pomodoro
    if (query === '/pomodoro' || query === '/p') {
      const task = tasks.find(t => !t.completed)
      if (task) setFocusMode(true, task.id)
      setSearchQuery('')
      return
    }
    
    // Navigation
    if (query === '/tasks' || query === '/t') {
      setView('tasks')
      setSearchQuery('')
      return
    }
    if (query === '/dashboard' || query === '/d') {
      setView('dashboard')
      setSearchQuery('')
      return
    }
    if (query === '/ai' || query === '/a') {
      setView('ai')
      setSearchQuery('')
      return
    }
    
    // Par défaut : créer une tâche
    addTask({ 
      title: query, 
      completed: false, 
      category: 'dev',
      status: 'todo',
      priority: 'medium'
    })
    setSearchQuery('')
  }

  return (
    <div className="min-h-full w-full overflow-y-auto">
      <div 
        className={`w-full max-w-[1800px] mx-auto px-6 lg:px-8 py-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        {/* Omnibar */}
        <div className="sticky top-0 z-20 -mx-6 lg:-mx-8 px-6 lg:px-8 py-4 mb-6 backdrop-blur-xl bg-mars-bg/80">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-zinc-500 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                placeholder="Taper pour créer, rechercher, ou demander à l'IA..."
                className="w-full bg-zinc-900/50 shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_28px_rgba(0,0,0,0.25)] focus:shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-2xl pl-11 pr-20 py-3 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none transition-all duration-300"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                autoFocus
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <kbd className="text-[10px] text-zinc-700 px-1.5 py-0.5 rounded" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>⌘K</kbd>
              </div>
            </div>
            <ThemePicker />
          </div>
          {searchQuery && (
            <div className="mt-2 text-xs text-zinc-600">
              {searchQuery.startsWith('/ai ') ? (
                <span>🤖 Demander à l'IA</span>
              ) : searchQuery.startsWith('/') ? (
                <span>⚡ Commande</span>
              ) : (
                <span>✓ Créer une tâche</span>
              )}
            </div>
          )}
        </div>

        {/* Edit Mode Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {isEditMode && (
              <span className="flex items-center gap-2 text-xs text-zinc-600">
                <span className="w-2 h-2 rounded-full bg-indigo-500/60 animate-pulse" />
                Mode édition
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ThemePicker />
            {isEditMode && (
              <>
                <button
                  onClick={() => {
                    if (confirm('Restaurer les widgets par défaut ? Cela supprimera votre configuration actuelle.')) {
                      resetWidgets()
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] rounded-xl transition-all duration-300"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                  title="Restaurer les widgets par défaut"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowWidgetPicker(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] rounded-xl transition-all duration-300"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ajouter
                </button>
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] rounded-xl transition-all duration-300"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <Save className="w-3.5 h-3.5" />
                  Sauvegarder
                </button>
              </>
            )}
            <button
              onClick={() => setEditMode(!isEditMode)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl transition-all duration-300 ${
                isEditMode
                  ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 shadow-[0_2px_8px_rgba(91,127,255,0.2)]'
                  : 'text-zinc-600 hover:text-zinc-400 shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]'
              }`}
              style={!isEditMode ? { border: '1px solid rgba(255,255,255,0.08)' } : {}}
            >
              {isEditMode ? <Layout className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              {isEditMode ? 'Terminer' : 'Personnaliser'}
            </button>
          </div>
        </div>

        {/* No widgets message */}
        {!isEditMode && widgets.length === 0 && (
          <div className="text-center py-16 mb-6">
            <p className="text-zinc-500 mb-4">Aucun widget configuré</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  resetWidgets()
                }}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-2xl hover:bg-zinc-700 shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.4)] transition-all duration-300"
              >
                Restaurer les widgets par défaut
              </button>
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-2xl hover:bg-indigo-500/30 shadow-[0_4px_16px_rgba(91,127,255,0.2)] hover:shadow-[0_6px_20px_rgba(91,127,255,0.3)] transition-all duration-300"
              >
                Personnaliser mon espace
              </button>
            </div>
          </div>
        )}

        {/* Widget Grid */}
        <WidgetGrid />
      </div>

      {/* Widget Picker Modal */}
      <WidgetPicker isOpen={showWidgetPicker} onClose={() => setShowWidgetPicker(false)} />

      {/* Save Layout Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-mars-surface border border-zinc-800 rounded-2xl p-6 animate-scale-in">
            <h3 className="text-lg font-medium text-zinc-200 mb-4">Sauvegarder le layout</h3>
            <input
              type="text"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              placeholder="Nom du layout..."
              className="w-full bg-zinc-900 text-zinc-200 placeholder:text-zinc-700 px-4 py-3 rounded-lg border border-zinc-800 focus:outline-none focus:border-zinc-600"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveLayout()}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveLayout}
                className="px-4 py-2 text-sm bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
