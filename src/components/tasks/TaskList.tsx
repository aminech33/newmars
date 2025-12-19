import { Task, useStore } from '../../store/useStore'
import { Check, Clock } from 'lucide-react'

interface TaskListProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onTaskDelete?: (task: Task) => void
}

export function TaskList({ tasks, onTaskClick, onTaskDelete }: TaskListProps) {
  const { toggleTask } = useStore()
  
  const handleToggle = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation()
    toggleTask(task.id)
  }
  
  // Séparer les tâches à faire et terminées
  const todoTasks = tasks.filter(t => !t.completed)
  const doneTasks = tasks.filter(t => t.completed)
  
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <span className="text-[10px] px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded-full font-medium">URGENT</span>
      case 'high':
        return <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full font-medium">PRIORITAIRE</span>
      default:
        return null
    }
  }
  
  const isOverdue = (task: Task) => {
    if (!task.dueDate) return false
    return new Date(task.dueDate) < new Date() && !task.completed
  }
  
  return (
    <div className="h-full overflow-y-auto space-y-6">
      {/* À FAIRE */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-500 mb-3 px-1">
          À FAIRE ({todoTasks.length})
        </h2>
        <div className="space-y-2">
          {todoTasks.length === 0 ? (
            <div className="p-8 text-center text-zinc-600">
              <p>🎉 Aucune tâche en attente</p>
              <p className="text-sm mt-2">Ajoutez une nouvelle tâche pour commencer</p>
            </div>
          ) : (
            todoTasks.map((task, index) => (
              <div
                key={task.id}
                onClick={() => onTaskClick(task)}
                className={`group relative p-4 bg-zinc-900/50 border rounded-xl cursor-pointer transition-all hover:bg-zinc-900 hover:border-zinc-700 ${
                  isOverdue(task) 
                    ? 'border-rose-500/30' 
                    : 'border-zinc-800'
                } ${
                  index === 0 ? 'ring-2 ring-indigo-500/20' : ''
                }`}
              >
                {index === 0 && (
                  <div className="absolute -top-2 left-4 px-2 py-0.5 bg-indigo-500 text-white text-[10px] font-bold rounded-full">
                    PROCHAINE
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={(e) => handleToggle(e, task)}
                    className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full border-2 border-zinc-700 hover:border-emerald-500 transition-colors"
                  />
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <h3 className="flex-1 text-sm font-medium text-zinc-200">
                        {task.title}
                      </h3>
                      {getPriorityBadge(task.priority)}
                    </div>
                    
                    {/* Info */}
                    <div className="flex items-center gap-3 text-xs text-zinc-600">
                      {task.dueDate && (
                        <div className={`flex items-center gap-1 ${isOverdue(task) ? 'text-rose-400' : ''}`}>
                          <Clock className="w-3 h-3" />
                          {new Date(task.dueDate).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </div>
                      )}
                      {task.estimatedTime && (
                        <span>{task.estimatedTime}min</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* TERMINÉES */}
      {doneTasks.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-600 mb-3 px-1">
            TERMINÉES ({doneTasks.length})
          </h2>
          <div className="space-y-2">
            {doneTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onTaskClick(task)}
                className="group p-3 bg-zinc-900/30 border border-zinc-800/50 rounded-xl cursor-pointer transition-all hover:bg-zinc-900/50"
              >
                <div className="flex items-start gap-3">
                  {/* Checkmark */}
                  <button
                    onClick={(e) => handleToggle(e, task)}
                    className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-emerald-400" />
                  </button>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm text-zinc-600 line-through">
                      {task.title}
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


