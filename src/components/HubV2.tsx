import { useState, useEffect } from 'react'
import { Edit3, Plus, Save, Layout, RotateCcw } from 'lucide-react'
import { useStore } from '../store/useStore'
import { WidgetGrid } from './WidgetGrid'
import { WidgetPicker } from './WidgetPicker'
import { AppBar } from './AppBar'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input } from './ui/Input'

export function HubV2() {
  const { isEditMode, setEditMode, saveLayout, widgets, resetWidgets } = useStore()
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

  return (
    <div className="min-h-full w-full overflow-y-auto scroll-touch pb-24 md:pb-4">
      <div 
        className={`w-full max-w-[1800px] mx-auto px-4 md:px-6 lg:px-8 py-1 transition-colors duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >

        {/* App Bar - Dock d'icônes en haut */}
        <div className="mb-1">
          <AppBar />
        </div>

        {/* Edit Mode Controls - Hidden on mobile in non-edit mode */}
        <div className={`flex items-center justify-between mb-1 ${!isEditMode ? 'hidden md:flex' : ''}`}>
          <div className="flex items-center gap-2">
            {isEditMode && (
              <span className="flex items-center gap-2 text-xs text-zinc-600">
                <span className="w-2 h-2 rounded-full bg-indigo-500/60 animate-pulse" />
                Mode édition
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {isEditMode && (
              <>
                <button
                  onClick={() => {
                    if (confirm('Restaurer les widgets par défaut ? Cela supprimera votre configuration actuelle.')) {
                      resetWidgets()
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 md:py-1.5 text-xs text-zinc-400 hover:text-zinc-200 shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] rounded-xl transition-colors duration-300"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                  title="Restaurer les widgets par défaut"
                >
                  <RotateCcw className="w-4 h-4 md:w-3.5 md:h-3.5" />
                </button>
                <button
                  onClick={() => setShowWidgetPicker(true)}
                  className="flex items-center gap-2 px-3 py-2 md:py-1.5 text-xs text-zinc-400 hover:text-zinc-200 shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] rounded-xl transition-colors duration-300"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <Plus className="w-4 h-4 md:w-3.5 md:h-3.5" />
                  <span className="hidden sm:inline">Ajouter</span>
                </button>
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="flex items-center gap-2 px-3 py-2 md:py-1.5 text-xs text-zinc-400 hover:text-zinc-200 shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] rounded-xl transition-colors duration-300"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <Save className="w-4 h-4 md:w-3.5 md:h-3.5" />
                  <span className="hidden sm:inline">Sauvegarder</span>
                </button>
              </>
            )}
            <button
              onClick={() => setEditMode(!isEditMode)}
              className={`flex items-center gap-2 px-3 py-2 md:py-1.5 text-xs rounded-xl transition-colors duration-300 ${
                isEditMode
                  ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 shadow-[0_2px_8px_rgba(91,127,255,0.2)]'
                  : 'text-zinc-600 hover:text-zinc-400 shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]'
              }`}
              style={!isEditMode ? { border: '1px solid rgba(255,255,255,0.08)' } : {}}
            >
              {isEditMode ? <Layout className="w-4 h-4 md:w-3.5 md:h-3.5" /> : <Edit3 className="w-4 h-4 md:w-3.5 md:h-3.5" />}
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
                className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-2xl hover:bg-zinc-700 shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.4)] transition-colors duration-300"
              >
                Restaurer les widgets par défaut
              </button>
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-2xl hover:bg-indigo-500/30 shadow-[0_4px_16px_rgba(91,127,255,0.2)] hover:shadow-[0_6px_20px_rgba(91,127,255,0.3)] transition-colors duration-300"
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
      <Modal
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        title="Sauvegarder le layout"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowSaveDialog(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleSaveLayout}>
              Sauvegarder
            </Button>
          </>
        }
      >
        <Input
          value={layoutName}
          onChange={(e) => setLayoutName(e.target.value)}
          placeholder="Nom du layout..."
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleSaveLayout()}
        />
      </Modal>
    </div>
  )
}
