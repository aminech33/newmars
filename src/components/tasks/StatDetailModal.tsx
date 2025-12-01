import { X } from 'lucide-react'
import { useEffect } from 'react'
import { Task } from '../../store/useStore'

interface StatDetailModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  tasks: Task[]
  icon: string
}

export function StatDetailModal({ isOpen, onClose, title, tasks, icon }: StatDetailModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
    }
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const categoryColors = {
    dev: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    design: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    work: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    personal: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    urgent: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl animate-scale-in max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="stat-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{icon}</span>
            <h2 id="stat-title" className="text-xl font-semibold text-zinc-100">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-5xl mb-4 block">{icon}</span>
              <p className="text-zinc-500">Aucune tâche dans cette catégorie</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div 
                  key={task.id}
                  className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50 hover:border-zinc-600/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-sm font-medium text-zinc-200 flex-1">{task.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-lg border ${categoryColors[task.category]}`}>
                      {task.category}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-xs text-zinc-500 line-clamp-2 mb-2">{task.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-zinc-600">
                    <span className={task.completed ? 'text-emerald-400' : 'text-zinc-500'}>
                      {task.completed ? '✅ Complétée' : '⏳ En cours'}
                    </span>
                    {task.estimatedTime && (
                      <span>• ⏱️ {task.estimatedTime}min</span>
                    )}
                    {task.dueDate && (
                      <span>• 📅 {new Date(task.dueDate).toLocaleDateString('fr-FR')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">{tasks.length} tâche(s)</span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

