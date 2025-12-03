import { Clock, CheckSquare, Calendar, Check, Pencil, Trash2 } from 'lucide-react'
import { Task, useStore } from '../../store/useStore'
import { Draggable } from '@hello-pangea/dnd'

interface TaskCardProps {
  task: Task
  index: number
  onClick: () => void
  onDelete?: (task: Task) => void
}

const priorityColors = {
  low: 'border-l-zinc-600',
  medium: 'border-l-cyan-500',
  high: 'border-l-amber-500',
  urgent: 'border-l-rose-500'
}

const categoryColors = {
  dev: 'text-indigo-400',
  design: 'text-cyan-400',
  work: 'text-amber-400',
  personal: 'text-emerald-400',
  urgent: 'text-rose-400'
}

export function TaskCard({ task, index, onClick, onDelete }: TaskCardProps) {
  const { projects, toggleTask, deleteTask } = useStore()
  const project = task.projectId ? projects.find(p => p.id === task.projectId) : null
  
  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0
  const totalSubtasks = task.subtasks?.length || 0
  
  const isOverdue = task.dueDate && new Date(task.dueDate).getTime() < Date.now()

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleTask(task.id)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(task)
    } else {
      deleteTask(task.id)
    }
  }
  
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`
            group p-3 bg-zinc-900/30 rounded-xl
            hover:bg-zinc-900/50
            transition-all duration-200 cursor-pointer
            border-l-2 ${priorityColors[task.priority]}
            ${snapshot.isDragging ? 'shadow-lg scale-102' : ''}
          `}
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            borderLeft: `3px solid`,
            ...provided.draggableProps.style
          }}
        >
          {/* Simple layout */}
          <div className="flex items-start gap-3">
            {/* Checkbox */}
            <button
              onClick={handleToggle}
              className={`flex-shrink-0 w-4 h-4 rounded border-2 transition-all mt-0.5 ${
                task.completed
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-zinc-600 hover:border-emerald-500'
                }`}
              >
                {task.completed && <Check className="w-4 h-4 text-white" />}
              </button>
              
              {/* Title & Content */}
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-medium mb-1 ${
                  task.completed ? 'text-zinc-600 line-through' : 'text-zinc-200'
                }`}>
                  {task.title}
                </h3>
                
                {/* Simple metadata inline */}
                <div className="flex items-center gap-2 text-xs text-zinc-600">
                  {project && (
                    <span style={{ color: project.color }}>{project.icon}</span>
                  )}
                  {task.dueDate && (
                    <span className={isOverdue ? 'text-rose-400' : ''}>
                      {new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                  {totalSubtasks > 0 && (
                    <span>{completedSubtasks}/{totalSubtasks}</span>
                  )}
                </div>
              </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}
