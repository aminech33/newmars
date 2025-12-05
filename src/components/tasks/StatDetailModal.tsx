import { Task } from '../../store/useStore'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

interface StatDetailModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  tasks: Task[]
  icon: string
}

export function StatDetailModal({ isOpen, onClose, title, tasks, icon }: StatDetailModalProps) {
  const categoryColors = {
    dev: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    design: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    work: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    personal: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    urgent: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-sm text-zinc-500">{tasks.length} tâche(s)</span>
          <Button variant="secondary" onClick={onClose}>
            Fermer
          </Button>
        </div>
      }
    >
      {/* Header with icon */}
      <div className="flex items-center gap-3 mb-6 -mt-2">
        <span className="text-3xl">{icon}</span>
        <h2 className="text-xl font-semibold text-zinc-100">
          {title}
        </h2>
      </div>

      {/* Content */}
      <div className="max-h-[50vh] overflow-y-auto -mx-6 px-6">
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
                className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-800 hover:border-zinc-800 transition-colors"
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
    </Modal>
  )
}
