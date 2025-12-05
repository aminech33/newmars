import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useStore, TaskCategory } from '../store/useStore'

export function QuickAdd() {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<TaskCategory>('dev')
  const { addTask, currentView } = useStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    addTask({ 
      title: title.trim(), 
      completed: false, 
      category,
      status: 'todo',
      priority: 'medium'
    })
    setTitle('')
    setIsOpen(false)
  }

  // Don't show on tasks page (has its own add UI)
  if (currentView === 'tasks') return null

  return (
    <>
      {isOpen ? (
        <div className="fixed bottom-6 right-6 z-40 w-80 bg-mars-surface border border-zinc-800 rounded-xl p-4 shadow-2xl animate-scale-in">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Nouvelle tâche</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-600 hover:text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de la tâche..."
              className="w-full bg-transparent text-zinc-200 placeholder:text-zinc-700 border-b border-zinc-800 pb-2 focus:outline-none focus:border-zinc-600"
              autoFocus
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
              className="w-full bg-zinc-900 text-zinc-400 text-sm border border-zinc-800 rounded px-3 py-2 focus:outline-none focus:border-zinc-600"
            >
              <option value="dev">Dev</option>
              <option value="design">Design</option>
              <option value="work">Travail</option>
              <option value="personal">Perso</option>
              <option value="urgent">Urgent</option>
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-400"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs bg-indigo-500/20 text-indigo-400 rounded hover:bg-indigo-500/30"
              >
                Créer
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-full flex items-center justify-center shadow-lg transition-colors hover:scale-110 active:scale-95"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </>
  )
}
