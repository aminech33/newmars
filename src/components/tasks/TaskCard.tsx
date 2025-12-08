import { useState, useRef, useEffect } from 'react'
import { Check, Play, Pause, Calendar, ListChecks } from 'lucide-react'
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

export function TaskCard({ task, index, onClick }: TaskCardProps) {
  const { projects, toggleTask, moveTask, updateTask } = useStore()
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

  // Actions
  const handleStartTask = (e: React.MouseEvent) => {
    e.stopPropagation()
    moveTask(task.id, 'in-progress')
  }

  const handlePauseTask = (e: React.MouseEvent) => {
    e.stopPropagation()
    moveTask(task.id, 'todo')
  }

  const handleCompleteTask = (e: React.MouseEvent) => {
    e.stopPropagation()
    moveTask(task.id, 'done')
    if (!task.completed) {
      toggleTask(task.id)
    }
  }

  const handleReopenTask = (e: React.MouseEvent) => {
    e.stopPropagation()
    moveTask(task.id, 'todo')
    if (task.completed) {
      toggleTask(task.id)
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

  // Render action button based on status
  const renderActionButton = () => {
    if (task.status === 'todo') {
      // À faire → Play button to start
      return (
        <button
          onClick={handleStartTask}
          className="flex-shrink-0 w-7 h-7 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 flex items-center justify-center transition-colors group/btn"
          title="Commencer"
        >
          <Play className="w-3.5 h-3.5 text-amber-400 group-hover/btn:scale-110 transition-transform" fill="currentColor" />
        </button>
      )
    }
    
    if (task.status === 'in-progress') {
      // En cours → Pause button
      return (
        <button
          onClick={handlePauseTask}
          className="flex-shrink-0 w-7 h-7 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 flex items-center justify-center transition-colors animate-pulse"
          title="Mettre en pause"
        >
          <Pause className="w-3.5 h-3.5 text-indigo-400" fill="currentColor" />
        </button>
      )
    }
    
    if (task.status === 'done') {
      // Terminé → Check button (can reopen)
      return (
        <button
          onClick={handleReopenTask}
          className="flex-shrink-0 w-7 h-7 rounded-lg bg-emerald-500/30 flex items-center justify-center transition-colors hover:bg-emerald-500/20"
          title="Rouvrir"
        >
          <Check className="w-4 h-4 text-emerald-400" strokeWidth={3} />
        </button>
      )
    }
    
    return null
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
            border border-white/[0.06]
            hover:bg-white/[0.06] hover:border-white/[0.1]
            transition-[background-color,border-color] duration-300
            ${snapshot.isDragging ? 'bg-white/[0.08] shadow-xl' : ''}
            ${task.status === 'done' ? 'opacity-60' : ''}
          `}
          style={provided.draggableProps.style}
        >
          {/* Priority accent line */}
          <div 
            className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
            style={{ backgroundColor: priorityColor }}
          />

          <div className="flex items-start gap-3 pl-2">
            {/* Action Button (Play/Pause/Check) */}
            {renderActionButton()}
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Title */}
              {isEditingTitle ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editedTitle}
                  onChange={handleTitleChange}
                  onBlur={handleTitleBlur}
                  onKeyDown={handleTitleKeyDown}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full text-[13px] font-medium leading-relaxed bg-zinc-900/80 text-white/90 px-2 py-1 rounded border border-indigo-500/50 focus:outline-none focus:border-indigo-500"
                />
              ) : (
                <h3 
                  onDoubleClick={handleTitleDoubleClick}
                  className={`
                    text-[13px] font-medium leading-relaxed
                    ${task.status === 'done'
                      ? 'text-white/30 line-through' 
                      : 'text-white/90'
                    }
                  `}
                  title="Double-clic pour éditer"
                >
                  {task.title}
                </h3>
              )}
              
              {/* Metadata */}
              {(project || task.dueDate || totalSubtasks > 0) && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                  {/* Project */}
                  {project && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-white/40">
                      <span>{project.icon}</span>
                      <span className="max-w-[100px] truncate">{project.name}</span>
                    </span>
                  )}
                  
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

            {/* Complete button for in-progress tasks */}
            {task.status === 'in-progress' && (
              <button
                onClick={handleCompleteTask}
                className="flex-shrink-0 w-7 h-7 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 flex items-center justify-center transition-colors"
                title="Terminer"
              >
                <Check className="w-4 h-4 text-emerald-400" strokeWidth={2.5} />
              </button>
            )}

            {/* Urgent indicator */}
            {task.priority === 'urgent' && task.status !== 'done' && (
              <div className="w-2 h-2 rounded-full bg-rose-500/80 animate-pulse" />
            )}
          </div>

          {/* Subtasks as mini cards */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="mt-3 pl-11 space-y-1.5">
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
