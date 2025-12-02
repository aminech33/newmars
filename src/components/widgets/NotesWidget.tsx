import { memo, useState } from 'react'
import { Plus, X, BookOpen, ArrowRight, Edit3 } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'

interface NotesWidgetProps {
  widget: Widget
}

export const NotesWidget = memo(function NotesWidget({ widget }: NotesWidgetProps) {
  const { id, size = 'small' } = widget
  const { quickNotes, addQuickNote, deleteQuickNote } = useStore()
  const [isAdding, setIsAdding] = useState(false)
  const [newNote, setNewNote] = useState('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (newNote.trim()) {
      addQuickNote(newNote.trim())
      setNewNote('')
      setIsAdding(false)
    }
  }

  // SMALL - Design immersif
  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="" currentSize={size} onClick={() => setIsAdding(true)}>
        <div className="h-full flex flex-col items-center justify-center relative p-6">
          {/* Subtle horizontal lines - notebook paper style */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Top line */}
            <line x1="15" y1="20" x2="85" y2="20" stroke="white" strokeWidth="0.3" opacity="0.1" strokeDasharray="2,2"/>
            {/* Middle-top line */}
            <line x1="15" y1="40" x2="85" y2="40" stroke="white" strokeWidth="0.3" opacity="0.1" strokeDasharray="2,2"/>
            {/* Middle-bottom line */}
            <line x1="15" y1="60" x2="85" y2="60" stroke="white" strokeWidth="0.3" opacity="0.1" strokeDasharray="2,2"/>
            {/* Bottom line */}
            <line x1="15" y1="80" x2="85" y2="80" stroke="white" strokeWidth="0.3" opacity="0.1" strokeDasharray="2,2"/>
          </svg>

          {/* CONTENT - centered */}
          <div className="relative z-10 flex flex-col items-center justify-center gap-3">
            {/* Calligraphic title */}
            <h3 className="font-['Great_Vibes'] italic text-3xl text-zinc-200 tracking-wide" style={{ textShadow: '0 0 8px rgba(255,255,255,0.1)' }}>
              Notes
            </h3>

            {/* Count */}
            <div className="text-6xl font-bold text-white tabular-nums leading-none">
              {quickNotes.length}
            </div>
              
            {/* Label */}
            <div className="text-xs text-zinc-400 font-medium">
              notes rapides
            </div>
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
            setIsAdding(true)
          }}
          className="text-teal-200 hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
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
              <Edit3 className="w-5 h-5 text-white/90" />
              <span className="text-sm font-semibold text-white/90 uppercase tracking-wide">Notes Rapides</span>
            </div>
          </div>

          {/* Add form */}
          {isAdding && (
            <form onSubmit={handleAdd} className="mb-4 animate-fade-in">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Écrivez votre note..."
                className="w-full px-4 py-3 bg-white/15 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
                autoFocus
                onBlur={() => {
                  if (!newNote.trim()) setIsAdding(false)
                }}
              />
            </form>
          )}
          
          {/* Notes list */}
          {quickNotes.length > 0 ? (
            <div className="space-y-2 flex-1 overflow-auto">
              {quickNotes.slice(0, size === 'large' ? 8 : 4).map((note) => (
                <div 
                  key={note.id} 
                  className="group flex items-start gap-3 p-3 bg-white/10 backdrop-blur-sm border border-white/20 shadow-md shadow-black/5 rounded-xl hover:bg-white/15 hover:shadow-lg transition-all"
                >
                  <span className="text-white/70 mt-0.5">•</span>
                  <span className="text-sm text-white/90 flex-1">{note.content}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteQuickNote(note.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 text-white/60 hover:text-white transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : !isAdding ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 border border-white/20">
                <BookOpen className="w-8 h-8 text-white/70" />
              </div>
              <p className="text-base text-white/90 font-medium mb-2">Aucune note</p>
              <p className="text-sm text-white/70 mb-4">Capturez vos idées rapidement</p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsAdding(true)
                }}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-xl text-sm text-white font-medium transition-all"
              >
                Créer une note
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </WidgetContainer>
  )
})
