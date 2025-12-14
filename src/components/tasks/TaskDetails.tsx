import { X, Calendar, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Task, useStore } from '../../store/useStore'

interface TaskDetailsProps {
  task: Task
  onClose: () => void
}

export function TaskDetails({ task, onClose }: TaskDetailsProps) {
  const { updateTask, deleteTask, toggleTask } = useStore()
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [title, setTitle] = useState(task.title)

  const handleSaveTitle = () => {
    if (title.trim()) {
      updateTask(task.id, { title: title.trim() })
      setIsEditingTitle(false)
    }
  }

  const handleDelete = () => {
    if (confirm('Supprimer cette tâche ?')) {
      deleteTask(task.id)
      onClose()
    }
  }

  const handleToggleComplete = () => {
    toggleTask(task.id)
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-xl h-full bg-mars-surface shadow-[0_0_64px_rgba(0,0,0,0.5)] overflow-y-auto animate-slide-in-right"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="sticky top-0 z-10 backdrop-blur-xl bg-mars-surface/80 border-b border-zinc-800 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle()
                    if (e.key === 'Escape') {
                      setTitle(task.title)
                      setIsEditingTitle(false)
                    }
                  }}
                  autoFocus
                  className="w-full text-xl font-semibold text-zinc-200 bg-zinc-900/50 px-3 py-2 rounded-xl border border-indigo-500/50 focus:outline-none focus:border-indigo-500"
                />
              ) : (
                <h1 
                  onClick={() => setIsEditingTitle(true)}
                  className="text-xl font-semibold text-zinc-200 cursor-pointer hover:text-zinc-100 transition-colors px-3 py-2"
                  title="Cliquer pour éditer"
                >
                  {task.title}
                </h1>
              )}
              <p className="text-sm text-zinc-600 px-3 mt-1">
                Créée le {new Date(task.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-600 hover:text-zinc-400 transition-colors rounded-xl hover:bg-zinc-800/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Deadline si elle existe */}
          {task.dueDate && (
            <div className="flex items-center gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
              <Calendar className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-xs text-zinc-500 mb-1">ÉCHÉANCE</p>
                <p className="text-sm text-zinc-300">
                  {new Date(task.dueDate).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Indicateur IA discret */}
          {(task.priority !== 'medium' || task.estimatedTime || task.category !== 'work') && (
            <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl">
              <p className="text-xs text-indigo-400/80">
                ✨ Défini automatiquement par l'IA
              </p>
            </div>
          )}
          
          {/* Action principale : Marquer comme terminée */}
          <button
            onClick={handleToggleComplete}
            className={`w-full px-6 py-4 rounded-xl text-base font-medium transition-all ${
              task.completed
                ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
            }`}
          >
            {task.completed ? '↩️ Rouvrir la tâche' : '✓ Marquer comme terminée'}
          </button>
          
          {/* Delete Button */}
          <div className="pt-4 border-t border-zinc-800">
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500/20 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer la tâche
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
