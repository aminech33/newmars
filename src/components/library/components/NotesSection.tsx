import { useState } from 'react'
import { X } from 'lucide-react'
import { ReadingNote } from '../../../types/library'
import { Button } from '../../ui/Button'
import { Textarea } from '../../ui/Input'
import { formatDateShort } from '../../../utils/libraryFormatters'

interface NotesSectionProps {
  notes?: ReadingNote[]
  onAddNote: (content: string) => void
  onDeleteNote: (noteId: string) => void
}

export function NotesSection({ notes = [], onAddNote, onDeleteNote }: NotesSectionProps) {
  const [newNote, setNewNote] = useState('')

  const handleAdd = () => {
    if (newNote.trim()) {
      onAddNote(newNote.trim())
      setNewNote('')
    }
  }

  return (
    <div className="space-y-4">
      {/* Ajouter note */}
      <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-800">
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Ajouter une note..."
          rows={3}
          maxLength={2000}
        />
        <div className="flex justify-end mt-3">
          <Button
            variant="primary"
            size="sm"
            onClick={handleAdd}
            disabled={!newNote.trim()}
          >
            Ajouter
          </Button>
        </div>
      </div>

      {/* Liste notes */}
      <div className="space-y-3">
        {notes.map((note) => (
          <div
            key={note.id}
            className="bg-zinc-800/50 rounded-xl p-4 group relative"
          >
            <p className="text-zinc-300 text-sm whitespace-pre-wrap pr-8">
              {note.content}
            </p>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-zinc-600">
                {formatDateShort(note.addedAt)}
              </span>
              <button
                onClick={() => onDeleteNote(note.id)}
                className="absolute top-3 right-3 p-1 text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                aria-label="Supprimer cette note"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {notes.length === 0 && (
          <p className="text-center text-zinc-600 py-8 text-sm">
            Aucune note pour le moment
          </p>
        )}
      </div>
    </div>
  )
}

