import { useState, useRef, useEffect, memo } from 'react'
import { Check, Calendar, ListChecks, Star } from 'lucide-react'
import { Task, useStore } from '../../store/useStore'
import { Draggable } from '@hello-pangea/dnd'

interface TaskCardProps {
  task: Task
  index: number
  onClick: () => void
  onDelete?: (task: Task) => void
}

const priorityColors = {
  low: '#71717a',      // zinc-500
  medium: '#06b6d4',   // cyan-500
  high: '#f59e0b',     // amber-500
  urgent: '#f43f5e'    // rose-500
}

function TaskCardComponent({ task, index, onClick }: TaskCardProps) {
  const { projects, toggleTask, updateTask, setPriorityTask } = useStore()
  const project = task.projectId ? projects.find(p => p.id === task.projectId) : null
  
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(task.title)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0
  const totalSubtasks = task.subtasks?.length || 0
  
  const isOverdue = task.dueDate && new Date(task.dueDate).getTime() < Date.now() && !task.completed
  const isDueToday = task.dueDate && new Date(task.dueDate).toDateString() === new Date().toDateString()
  
  const priorityColor = priorityColors[task.priority]

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditingTitle])

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleTask(task.id)
  }

  const handleSetPriority = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (task.isPriority) {
      // Si déjà prioritaire, la retirer
      updateTask(task.id, { isPriority: false })
    } else {
      // Sinon, la définir comme prioritaire (retire automatiquement l'ancienne)
      setPriorityTask(task.id)
    }
  }

  const handleTitleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditingTitle(true)
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedTitle(e.target.value)
  }

  const handleTitleBlur = () => {
    if (editedTitle.trim() && editedTitle !== task.title) {
      updateTask(task.id, { title: editedTitle.trim() })
    } else {
      setEditedTitle(task.title)
    }
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleTitleBlur()
    } else if (e.key === 'Escape') {
      setEditedTitle(task.title)
      setIsEditingTitle(false)
    }
  }

  const formatDueDate = (date: string) => {
    const d = new Date(date)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (d.toDateString() === today.toDateString()) return "Aujourd'hui"
    if (d.toDateString() === tomorrow.toDateString()) return 'Demain'
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
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
            group relative overflow-hidden
            p-4 rounded-2xl cursor-pointer
            bg-white/[0.03] backdrop-blur-xl
            border transition-all duration-300
            ${task.isPriority && !task.completed
              ? 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10' 
              : 'border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1]'
            }
            ${snapshot.isDragging ? 'bg-white/[0.08] shadow-xl' : ''}
            ${task.completed ? 'opacity-60' : ''}
          `}
          style={provided.draggableProps.style}
        >
          {/* Priority accent line */}
          <div 
            className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
            style={{ backgroundColor: priorityColor }}
          />

          <div className="flex items-start gap-3 pl-2">
            {/* Checkbox simple */}
            <button
              onClick={handleToggleComplete}
              className={`
                flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all
                ${task.completed
                  ? 'bg-emerald-500/30 border-emerald-500 hover:bg-emerald-500/40' 
                  : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                }
              `}
            >
              {task.completed && <Check className="w-4 h-4 text-emerald-400" strokeWidth={3} />}
            </button>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Project context - only text, no icons */}
              {project && (
                <div className="mb-1.5 text-[12.5px] text-white/50 font-medium leading-snug">
                  {project.name}
                </div>
              )}
              
              {/* Title - always dominant, larger and more readable */}
              {isEditingTitle ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editedTitle}
                  onChange={handleTitleChange}
                  onBlur={handleTitleBlur}
                  onKeyDown={handleTitleKeyDown}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full text-[16px] font-medium leading-[1.5] bg-zinc-900/80 text-white/90 px-2 py-1 rounded border border-indigo-500/50 focus:outline-none focus:border-indigo-500"
                />
              ) : (
                <h3 
                  onDoubleClick={handleTitleDoubleClick}
                  className={`
                    text-[16px] font-medium leading-[1.5]
                    ${task.completed
                      ? 'text-white/30 line-through' 
                      : 'text-white/90'
                    }
                  `}
                  title="Double-clic pour éditer"
                >
                  {task.title}
                </h3>
              )}
              
              {/* Metadata - only due date and subtasks, no project here */}
              {(task.dueDate || totalSubtasks > 0) && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                  {/* Due date */}
                  {task.dueDate && (
                    <span className={`
                      inline-flex items-center gap-1 text-[11px]
                      ${isOverdue 
                        ? 'text-rose-400/80' 
                        : isDueToday 
                          ? 'text-amber-400/80'
                          : 'text-white/40'
                      }
                    `}>
                      <Calendar className="w-3 h-3" />
                      {formatDueDate(task.dueDate)}
                    </span>
                  )}
                  
                  {/* Subtasks */}
                  {totalSubtasks > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-white/40">
                      <ListChecks className="w-3 h-3" />
                      {completedSubtasks}/{totalSubtasks}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Priority star button - only for non-completed tasks */}
            {!task.completed && (
              <button
                onClick={handleSetPriority}
                className={`
                  flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all
                  ${task.isPriority
                    ? 'bg-amber-500/20 hover:bg-amber-500/30' 
                    : 'bg-white/5 hover:bg-white/10'
                  }
                `}
                title={task.isPriority ? "Retirer la priorité" : "Définir comme prioritaire"}
              >
                <Star 
                  className={`w-4 h-4 transition-colors ${
                    task.isPriority 
                      ? 'text-amber-400 fill-amber-400' 
                      : 'text-white/30'
                  }`}
                  strokeWidth={1.5}
                />
              </button>
            )}
          </div>

          {/* Subtasks as mini cards */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="mt-3 pl-9 space-y-1.5">
              {task.subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={(e) => {
                      e.stopPropagation()
                      const { toggleSubtask } = useStore.getState()
                      toggleSubtask(task.id, subtask.id)
                    }}
                    className="w-3 h-3 rounded accent-indigo-500 cursor-pointer"
                  />
                  <span className={`text-[11px] flex-1 ${
                    subtask.completed 
                      ? 'text-zinc-600 line-through' 
                      : 'text-zinc-400'
                  }`}>
                    {subtask.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Draggable>
  )
}

// React.memo avec comparaison personnalisée pour éviter les re-renders inutiles
export const TaskCard = memo(TaskCardComponent, (prev, next) => {
  return (
    prev.task.id === next.task.id &&
    prev.task.title === next.task.title &&
    prev.task.completed === next.task.completed &&
    prev.task.priority === next.task.priority &&
    prev.task.isPriority === next.task.isPriority &&
    prev.task.dueDate === next.task.dueDate &&
    prev.task.projectId === next.task.projectId &&
    prev.task.subtasks?.length === next.task.subtasks?.length &&
    prev.index === next.index
  )
})
