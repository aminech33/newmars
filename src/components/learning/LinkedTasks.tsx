import { memo, useState } from 'react'
import { Check, ChevronDown, ChevronUp, ListTodo, ExternalLink } from 'lucide-react'
import { useStore, Task } from '../../store/useStore'

interface LinkedTasksProps {
  projectId: string
  collapsed?: boolean
}

export const LinkedTasks = memo(function LinkedTasks({ projectId, collapsed: initialCollapsed = false }: LinkedTasksProps) {
  const { tasks, projects, toggleTask, setView, setSelectedTaskId } = useStore()
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed)
  
  const project = projects.find(p => p.id === projectId)
  const projectTasks = tasks.filter(t => t.projectId === projectId)
  
  if (!project || projectTasks.length === 0) {
    return null
  }
  
  const completedCount = projectTasks.filter(t => t.completed).length
  const totalCount = projectTasks.length
  const progress = Math.round((completedCount / totalCount) * 100)
  
  const handleTaskClick = (task: Task) => {
    toggleTask(task.id)
  }
  
  const handleGoToTasks = () => {
    setView('tasks')
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div 
            className="w-6 h-6 rounded-lg flex items-center justify-center text-sm"
            style={{ backgroundColor: `${project.color}20` }}
          >
            {project.icon}
          </div>
          <div className="text-left">
            <div className="text-xs font-medium text-zinc-300">{project.name}</div>
            <div className="text-[10px] text-zinc-600">
              {completedCount}/{totalCount} tâches • {progress}%
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Mini progress bar */}
          <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          {isCollapsed ? (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronUp className="w-4 h-4 text-zinc-500" />
          )}
        </div>
      </button>
      
      {/* Tasks List */}
      {!isCollapsed && (
        <div className="px-2 pb-2">
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {projectTasks.map(task => (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task)}
                className={`
                  flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer
                  transition-all duration-150
                  ${task.completed 
                    ? 'bg-emerald-500/5 hover:bg-emerald-500/10' 
                    : 'hover:bg-zinc-800/50'
                  }
                `}
              >
                {/* Checkbox */}
                <div className={`
                  w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0
                  transition-all duration-150
                  ${task.completed
                    ? 'bg-emerald-500/20 border-emerald-500/50'
                    : 'border-zinc-600 hover:border-zinc-400'
                  }
                `}>
                  {task.completed && (
                    <Check className="w-2.5 h-2.5 text-emerald-400" strokeWidth={3} />
                  )}
                </div>
                
                {/* Task title */}
                <span className={`
                  text-xs flex-1 truncate
                  ${task.completed ? 'text-zinc-500 line-through' : 'text-zinc-300'}
                `}>
                  {task.title}
                </span>
                
                {/* Priority indicator */}
                {task.priority === 'urgent' && !task.completed && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                )}
                {task.priority === 'high' && !task.completed && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
          
          {/* Footer link */}
          <button
            onClick={handleGoToTasks}
            className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30 rounded-lg transition-colors"
          >
            <ListTodo className="w-3 h-3" />
            Voir dans Tâches
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
        </div>
      )}
    </div>
  )
})



