import { Clock, CheckSquare, MoreVertical, Calendar } from 'lucide-react'
import { Task } from '../../store/useStore'
import { Draggable } from '@hello-pangea/dnd'

interface TaskCardProps {
  task: Task
  index: number
  onClick: () => void
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

export function TaskCard({ task, index, onClick }: TaskCardProps) {
  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0
  const totalSubtasks = task.subtasks?.length || 0
  
  const isOverdue = task.dueDate && new Date(task.dueDate).getTime() < Date.now()
  
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`
            group p-4 bg-zinc-900/40 backdrop-blur-sm rounded-2xl
            shadow-[0_2px_8px_rgba(0,0,0,0.2)]
            hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)]
            hover:bg-zinc-900/60
            transition-all duration-300 cursor-pointer
            border-l-4 ${priorityColors[task.priority]}
            ${snapshot.isDragging ? 'shadow-[0_8px_32px_rgba(0,0,0,0.4)] scale-105' : ''}
          `}
          style={{
            border: '1px solid rgba(255,255,255,0.05)',
            borderLeft: `4px solid`,
            ...provided.draggableProps.style
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-medium text-zinc-200 line-clamp-2 flex-1 pr-2">
              {task.title}
            </h3>
            <button className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-zinc-400 transition-all rounded-lg hover:bg-zinc-800/50">
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {/* Description */}
          {task.description && (
            <p className="text-xs text-zinc-500 mb-3 line-clamp-2">
              {task.description}
            </p>
          )}
          
          {/* Metadata */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Category */}
            <span className={`${categoryColors[task.category]} font-medium`}>
              {task.category}
            </span>
            
            {/* Estimated Time */}
            {task.estimatedTime && (
              <span className="flex items-center gap-1 text-zinc-600">
                <Clock className="w-3 h-3" />
                {task.estimatedTime}min
              </span>
            )}
            
            {/* Due Date */}
            {task.dueDate && (
              <span className={`flex items-center gap-1 ${isOverdue ? 'text-rose-400' : 'text-zinc-600'}`}>
                <Calendar className="w-3 h-3" />
                {new Date(task.dueDate).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
              </span>
            )}
            
            {/* Subtasks */}
            {totalSubtasks > 0 && (
              <span className="flex items-center gap-1 text-zinc-600">
                <CheckSquare className="w-3 h-3" />
                {completedSubtasks}/{totalSubtasks}
              </span>
            )}
          </div>
          
          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {task.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-[10px] bg-zinc-800/50 text-zinc-500 rounded-lg"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </Draggable>
  )
}

import { Task } from '../../store/useStore'
import { Draggable } from '@hello-pangea/dnd'

interface TaskCardProps {
  task: Task
  index: number
  onClick: () => void
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

export function TaskCard({ task, index, onClick }: TaskCardProps) {
  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0
  const totalSubtasks = task.subtasks?.length || 0
  
  const isOverdue = task.dueDate && new Date(task.dueDate).getTime() < Date.now()
  
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`
            group p-4 bg-zinc-900/40 backdrop-blur-sm rounded-2xl
            shadow-[0_2px_8px_rgba(0,0,0,0.2)]
            hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)]
            hover:bg-zinc-900/60
            transition-all duration-300 cursor-pointer
            border-l-4 ${priorityColors[task.priority]}
            ${snapshot.isDragging ? 'shadow-[0_8px_32px_rgba(0,0,0,0.4)] scale-105' : ''}
          `}
          style={{
            border: '1px solid rgba(255,255,255,0.05)',
            borderLeft: `4px solid`,
            ...provided.draggableProps.style
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-medium text-zinc-200 line-clamp-2 flex-1 pr-2">
              {task.title}
            </h3>
            <button className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-zinc-400 transition-all rounded-lg hover:bg-zinc-800/50">
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {/* Description */}
          {task.description && (
            <p className="text-xs text-zinc-500 mb-3 line-clamp-2">
              {task.description}
            </p>
          )}
          
          {/* Metadata */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Category */}
            <span className={`${categoryColors[task.category]} font-medium`}>
              {task.category}
            </span>
            
            {/* Estimated Time */}
            {task.estimatedTime && (
              <span className="flex items-center gap-1 text-zinc-600">
                <Clock className="w-3 h-3" />
                {task.estimatedTime}min
              </span>
            )}
            
            {/* Due Date */}
            {task.dueDate && (
              <span className={`flex items-center gap-1 ${isOverdue ? 'text-rose-400' : 'text-zinc-600'}`}>
                <Calendar className="w-3 h-3" />
                {new Date(task.dueDate).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
              </span>
            )}
            
            {/* Subtasks */}
            {totalSubtasks > 0 && (
              <span className="flex items-center gap-1 text-zinc-600">
                <CheckSquare className="w-3 h-3" />
                {completedSubtasks}/{totalSubtasks}
              </span>
            )}
          </div>
          
          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {task.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-[10px] bg-zinc-800/50 text-zinc-500 rounded-lg"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </Draggable>
  )
}


