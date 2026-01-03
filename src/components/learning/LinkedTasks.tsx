import { memo, useState } from 'react'
import { Check, ChevronDown, ChevronUp, ListTodo, ExternalLink, Star } from 'lucide-react'
import { useStore, Task } from '../../store/useStore'
import { fontStack } from '../tasks/taskUtils'

interface LinkedTasksProps {
  projectId: string
  collapsed?: boolean
  onClose?: () => void
}

export const LinkedTasks = memo(function LinkedTasks({ projectId, collapsed: initialCollapsed = false }: LinkedTasksProps) {
  const { tasks, projects, toggleTask, setView, setPriorityTask, updateTask } = useStore()
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
  
  const handlePriority = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation()
    if (task.isPriority) {
      updateTask(task.id, { isPriority: false })
    } else {
      setPriorityTask(task.id)
    }
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
          <div className="max-h-64 overflow-y-auto space-y-1">
            {projectTasks.map(task => (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task)}
                className={`
                  group flex items-center gap-3 h-11 px-3 rounded-xl cursor-pointer
                  transition-all duration-150 ease-out relative
                  ${task.completed 
                    ? 'bg-emerald-500/5 hover:bg-emerald-500/10 opacity-50' 
                    : 'bg-zinc-800/50 hover:bg-zinc-800/80 hover:shadow-lg hover:shadow-black/25 hover:-translate-y-0.5'
                  }
                  ${task.isPriority && !task.completed ? 'ring-1 ring-amber-500/20 bg-amber-500/[0.04]' : ''}
                `}
              >
                {/* Checkbox */}
                <div className="flex-shrink-0">
                  {task.completed ? (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-emerald-500/20 ring-1 ring-emerald-500/40 transition-all duration-150">
                      <Check className="w-3 h-3 text-emerald-400" strokeWidth={2.5} />
                    </div>
                  ) : (
                    <div className={`
                      w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center
                      transition-all duration-150 ease-out
                      ${task.isPriority 
                        ? 'border-amber-400/80 hover:border-amber-300 hover:bg-amber-400/15' 
                        : 'border-zinc-400 hover:border-zinc-200 hover:bg-white/10'
                      }
                      hover:scale-110 active:scale-95
                    `} />
                  )}
                </div>
                
                {/* Project color indicator */}
                <div 
                  className="w-1 h-5 rounded-full flex-shrink-0 opacity-80"
                  style={{ backgroundColor: project.color }}
                />
                
                {/* Task title */}
                <span className={`
                  flex-1 min-w-0 text-[15px] leading-normal truncate
                  transition-all duration-200 ${fontStack}
                  ${task.completed 
                    ? 'text-zinc-500 line-through opacity-70' 
                    : 'text-zinc-50'
                  }
                `}>
                  {task.title}
                </span>
                
                {/* Priority star */}
                {!task.completed && (
                  <button
                    onClick={(e) => handlePriority(e, task)}
                    className={`
                      flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center
                      transition-all duration-150
                      ${task.isPriority ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                      hover:bg-white/10 active:scale-90
                    `}
                  >
                    <Star 
                      className={`w-3.5 h-3.5 transition-all duration-150 ${
                        task.isPriority 
                          ? 'text-amber-400 fill-amber-400' 
                          : 'text-zinc-500 group-hover:text-zinc-400'
                      }`}
                    />
                  </button>
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















