import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'

interface NotesWidgetProps {
  widget: Widget
}

export function NotesWidget({ widget }: NotesWidgetProps) {
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

  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="Notes" currentSize={size}>
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-4xl font-extralight text-zinc-200 mb-1">{quickNotes.length}</p>
          <p className="text-xs text-zinc-600">notes</p>
        </div>
      </WidgetContainer>
    )
  }

  return (
    <WidgetContainer 
      id={id} 
      title="Notes rapides"
      currentSize={size}
      actions={
        !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-zinc-700 hover:text-zinc-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        )
      }
    >
      <div className="space-y-2 overflow-auto h-full">
        {isAdding && (
          <form onSubmit={handleAdd} className="animate-fade-in">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Nouvelle note..."
              className="w-full bg-transparent text-zinc-300 text-sm placeholder:text-zinc-700 border-b border-zinc-800 pb-2 focus:outline-none focus:border-zinc-600"
              autoFocus
              onBlur={() => {
                if (!newNote.trim()) setIsAdding(false)
              }}
            />
          </form>
        )}
        
        {quickNotes.slice(0, size === 'large' ? 8 : 4).map((note) => (
          <div key={note.id} className="group flex items-start gap-2 text-sm">
            <span className="text-zinc-700 mt-0.5">•</span>
            <span className="text-zinc-400 flex-1">{note.content}</span>
            <button
              onClick={() => deleteQuickNote(note.id)}
              className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-rose-400 transition-all"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        
        {quickNotes.length === 0 && !isAdding && (
          <div className="flex flex-col items-center justify-center h-full text-center py-4">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-zinc-400 text-sm font-medium mb-1">Aucune note</p>
            <p className="text-zinc-700 text-xs">Capturez vos idées</p>
          </div>
        )}
      </div>
    </WidgetContainer>
  )
}
