/**
 * 📋 TaskRow - Ligne de tâche draggable
 */

import { useState } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import { Check, Star, Timer } from 'lucide-react'
import { useStore, Task, type TemporalColumn } from '../../store/useStore'
import { fontStack } from './taskUtils'

interface TaskRowProps {
  task: Task
  column: TemporalColumn
  index: number
  onClick: () => void
  onToggle: () => void
  onFocus?: (task: Task) => void
}

export function TaskRow({ 
  task, 
  column,
  index,
  onClick,
  onToggle,
  onFocus
}: TaskRowProps) {
  const { projects, setPriorityTask, updateTask } = useStore()
  const project = task.projectId ? projects.find(p => p.id === task.projectId) : null
  const [isChecking, setIsChecking] = useState(false)
  
  const isUpcoming = column === 'upcoming'
  const isDistant = column === 'distant'
  const isToday = column === 'today'
  const isOverdue = task.dueDate && new Date(task.dueDate).getTime() < Date.now() && !task.completed
  
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isDistant && !task.completed) {
      setIsChecking(true)
      setTimeout(() => setIsChecking(false), 350)
    }
    onToggle()
  }
  
  const handlePriority = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (task.isPriority) {
      updateTask(task.id, { isPriority: false })
    } else {
      setPriorityTask(task.id)
    }
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) return "Auj."
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (d.toDateString() === tomorrow.toDateString()) return 'Dem.'
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  // Configuration visuelle par colonne
  const columnConfig = {
    today: {
      row: 'bg-zinc-800/50 hover:bg-zinc-800/80',
      rowHover: 'hover:shadow-lg hover:shadow-black/25 hover:-translate-y-0.5',
      text: 'text-zinc-50',
      textSecondary: 'text-zinc-400',
      checkbox: 'border-zinc-400 hover:border-zinc-200 hover:bg-white/10',
      checkboxPriority: 'border-amber-400/80 hover:border-amber-300 hover:bg-amber-400/15',
      dateBadge: 'text-zinc-300 bg-zinc-700/50',
      opacity: '',
    },
    inProgress: {
      row: 'bg-zinc-800/35 hover:bg-zinc-800/55',
      rowHover: 'hover:shadow-md hover:shadow-black/15 hover:-translate-y-px',
      text: 'text-zinc-200',
      textSecondary: 'text-zinc-500',
      checkbox: 'border-zinc-500 hover:border-zinc-300 hover:bg-zinc-600/30',
      checkboxPriority: 'border-amber-500/70 hover:border-amber-400 hover:bg-amber-400/10',
      dateBadge: 'text-zinc-400 bg-zinc-700/35',
      opacity: '',
    },
    upcoming: {
      row: 'bg-zinc-800/20 hover:bg-zinc-800/35',
      rowHover: 'hover:shadow-sm hover:shadow-black/10 hover:-translate-y-px',
      text: 'text-zinc-400',
      textSecondary: 'text-zinc-600',
      checkbox: 'border-zinc-600 hover:border-zinc-400 hover:bg-zinc-600/20',
      checkboxPriority: 'border-amber-600/50 hover:border-amber-500 hover:bg-amber-400/10',
      dateBadge: 'text-zinc-500 bg-zinc-800/40',
      opacity: 'opacity-85',
    },
    distant: {
      row: 'bg-zinc-900/30 hover:bg-zinc-800/25',
      rowHover: '',
      text: 'text-zinc-500',
      textSecondary: 'text-zinc-700',
      checkbox: 'border-zinc-700',
      checkboxPriority: 'border-amber-700/40',
      dateBadge: 'text-zinc-600 bg-zinc-800/25',
      opacity: 'opacity-60 hover:opacity-75',
    },
  }

  const config = columnConfig[column]

  // Checkbox
  const Checkbox = () => {
    if (task.completed) {
      return (
        <div className="w-5 h-5 rounded-full flex items-center justify-center bg-emerald-500/20 ring-1 ring-emerald-500/40 transition-all duration-150">
          <Check className="w-3 h-3 text-emerald-400" strokeWidth={2.5} />
        </div>
      )
    }
    
    if (isDistant) {
      return (
        <div className={`w-5 h-5 rounded-full border-[1.5px] ${config.checkbox} transition-all duration-150`} />
      )
    }
    
    return (
      <button
        onClick={handleToggle}
        className={`
          w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center
          transition-all duration-150 ease-out
          ${task.isPriority ? config.checkboxPriority : config.checkbox}
          hover:scale-110 active:scale-95
          focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-1 focus:ring-offset-zinc-900
          ${isChecking ? 'scale-90 bg-emerald-500/30 border-emerald-400' : ''}
        `}
      />
    )
  }

  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={task.completed}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`
            group flex items-center gap-3 h-12 px-3.5 rounded-xl cursor-pointer
            transition-all duration-150 ease-out relative
            ${config.row} ${config.rowHover} ${config.opacity}
            ${task.isPriority && !task.completed && !isDistant ? 'ring-1 ring-amber-500/20 bg-amber-500/[0.04]' : ''}
            ${task.completed ? 'opacity-45' : ''}
            ${isChecking ? 'scale-[0.99]' : ''}
            ${snapshot.isDragging ? 'shadow-2xl shadow-black/50 scale-105 rotate-2 ring-2 ring-indigo-500/50' : ''}
            ${task.isValidation && !task.completed ? 'ring-1 ring-emerald-500/30' : ''}
          `}
        >
          {/* Badge VALIDATION */}
          {task.isValidation && !task.completed && (
            <div className="absolute -top-1.5 -right-1.5 px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded-md shadow-lg flex items-center gap-0.5">
              <Check className="w-2.5 h-2.5" strokeWidth={3} />
              VALIDATION
            </div>
          )}
          
          <Checkbox />
          
          {/* Project indicator */}
          {project && (
            <div 
              className={`w-1 h-5 rounded-full flex-shrink-0 transition-opacity duration-150
                ${isDistant ? 'opacity-40' : isUpcoming ? 'opacity-60' : 'opacity-80'}
              `}
              style={{ backgroundColor: project.color }}
            />
          )}
          
          {/* Title */}
          <span className={`
            flex-1 min-w-0 text-[17px] leading-normal truncate
            transition-all duration-200 ${fontStack}
            ${task.completed ? 'line-through opacity-70' : ''} 
            ${config.text}
            ${isDistant && !task.completed ? 'blur-[0.6px] group-hover:blur-0' : ''}
          `}>
            {task.title}
          </span>
          
          {/* Date badge */}
          {task.dueDate && !task.completed && (
            <span className={`
              flex-shrink-0 text-[13px] leading-none tabular-nums px-2.5 py-1 rounded-md
              transition-all duration-150 ${fontStack}
              ${isOverdue ? 'text-rose-400 bg-rose-500/15 font-medium' : config.dateBadge}
              ${isDistant ? 'opacity-60 group-hover:opacity-90' : ''}
            `}>
              {formatDate(task.dueDate)}
            </span>
          )}
          
          {/* Priority star */}
          {!isDistant && !task.completed && !snapshot.isDragging && (
            <button
              onClick={handlePriority}
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
          
          {/* Focus button (Aujourd'hui only) */}
          {isToday && !task.completed && !snapshot.isDragging && onFocus && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onFocus(task)
              }}
              className={`
                flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center
                transition-all duration-150
                opacity-0 group-hover:opacity-100
                hover:bg-red-500/10 active:scale-90
              `}
              title="Démarrer un Pomodoro"
            >
              <Timer 
                className="w-3.5 h-3.5 text-red-400 group-hover:text-red-300"
              />
            </button>
          )}
        </div>
      )}
    </Draggable>
  )
}

