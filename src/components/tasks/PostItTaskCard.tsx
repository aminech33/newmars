import { useState, useRef, useEffect } from 'react'
import { Clock, Check, Calendar } from 'lucide-react'
import { Task, useStore } from '../../store/useStore'
import { Draggable } from '@hello-pangea/dnd'

interface PostItTaskCardProps {
  task: Task
  index: number
  onClick: () => void
}

// Couleurs post-it selon priorité
const postItColors = {
  low: {
    bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
    shadow: 'rgba(76, 175, 80, 0.3)',
    text: '#2e7d32'
  },
  medium: {
    bg: 'linear-gradient(135deg, #fff9c4 0%, #fff59d 100%)',
    shadow: 'rgba(255, 193, 7, 0.3)',
    text: '#f57f17'
  },
  high: {
    bg: 'linear-gradient(135deg, #ffe0b2 0%, #ffcc80 100%)',
    shadow: 'rgba(255, 152, 0, 0.3)',
    text: '#e65100'
  },
  urgent: {
    bg: 'linear-gradient(135deg, #ffcdd2 0%, #ef9a9a 100%)',
    shadow: 'rgba(244, 67, 54, 0.3)',
    text: '#c62828'
  }
}

export function PostItTaskCard({ task, index, onClick }: PostItTaskCardProps) {
  const { toggleTask, projects, updateTask } = useStore()
  const project = task.projectId ? projects.find(p => p.id === task.projectId) : null
  const colors = postItColors[task.priority]
  
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(task.title)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0
  const totalSubtasks = task.subtasks?.length || 0
  const isOverdue = task.dueDate && new Date(task.dueDate).getTime() < Date.now()

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditingTitle])

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleTask(task.id)
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

  // Rotation aléatoire mais stable (basée sur l'ID)
  const rotation = ((task.id.charCodeAt(0) + task.id.charCodeAt(task.id.length - 1)) % 7) - 3

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`
            group relative cursor-pointer
            transition-colors duration-300
            ${snapshot.isDragging ? 'scale-110 z-50' : 'hover:scale-105 hover:z-10'}
            ${task.completed ? 'opacity-60' : ''}
          `}
          style={{
            transform: snapshot.isDragging 
              ? provided.draggableProps.style?.transform 
              : `rotate(${rotation}deg)`,
            ...provided.draggableProps.style
          }}
        >
          {/* Punaise */}
          <div 
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full z-10 shadow-lg"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffd54f, #ffa000)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset -1px -1px 2px rgba(0,0,0,0.2)'
            }}
          />
          
          {/* Post-it */}
          <div
            className="relative p-4 pt-6 min-h-[140px] rounded-sm"
            style={{
              background: colors.bg,
              boxShadow: `
                0 1px 3px ${colors.shadow},
                0 10px 20px ${colors.shadow},
                inset 0 -2px 4px rgba(0,0,0,0.1)
              `,
              backgroundImage: `
                ${colors.bg},
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 24px,
                  rgba(0,0,0,0.05) 24px,
                  rgba(0,0,0,0.05) 25px
                )
              `
            }}
          >
            {/* Texture papier */}
            <div 
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.3\' /%3E%3C/svg%3E")'
              }}
            />
            
            {/* Contenu */}
            <div className="relative space-y-3">
              {/* Checkbox + Titre */}
              <div className="flex items-start gap-2">
                <button
                  onClick={handleToggle}
                  className={`flex-shrink-0 w-5 h-5 rounded border-2 transition-colors ${
                    task.completed
                      ? 'bg-black/80 border-black/80'
                      : 'border-black/30 hover:border-black/50'
                  }`}
                  style={{ marginTop: '2px' }}
                >
                  {task.completed && <Check className="w-4 h-4 text-white" />}
                </button>
                
                {isEditingTitle ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editedTitle}
                    onChange={handleTitleChange}
                    onBlur={handleTitleBlur}
                    onKeyDown={handleTitleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 text-sm font-medium leading-snug px-2 py-1 rounded border-2 focus:outline-none"
                    style={{ 
                      color: colors.text,
                      fontFamily: '"Indie Flower", "Comic Sans MS", cursive',
                      borderColor: colors.text,
                      backgroundColor: 'rgba(255, 255, 255, 0.8)'
                    }}
                  />
                ) : (
                  <p 
                    onDoubleClick={handleTitleDoubleClick}
                    className={`text-sm font-medium leading-snug ${
                      task.completed ? 'line-through opacity-60' : ''
                    }`}
                    style={{ 
                      color: colors.text,
                      fontFamily: '"Indie Flower", "Comic Sans MS", cursive'
                    }}
                    title="Double-clic pour éditer"
                  >
                    {task.title}
                  </p>
                )}
              </div>

              {/* Métadonnées */}
              <div className="space-y-1.5 text-xs" style={{ color: colors.text }}>
                {/* Projet */}
                {project && (
                  <div className="flex items-center gap-1.5 opacity-70">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="font-medium">{project.name}</span>
                  </div>
                )}

                {/* Date limite */}
                {task.dueDate && (
                  <div className={`flex items-center gap-1.5 ${isOverdue ? 'font-bold' : 'opacity-70'}`}>
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(task.dueDate).toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </span>
                    {isOverdue && <span className="text-red-600">⚠️</span>}
                  </div>
                )}

                {/* Durée estimée */}
                {task.estimatedTime && (
                  <div className="flex items-center gap-1.5 opacity-70">
                    <Clock className="w-3 h-3" />
                    <span>{task.estimatedTime}min</span>
                  </div>
                )}

                {/* Sous-tâches */}
                {totalSubtasks > 0 && (
                  <div className="opacity-70">
                    <span className="font-medium">{completedSubtasks}/{totalSubtasks}</span> sous-tâches
                  </div>
                )}
              </div>

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {task.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-[10px] rounded-full bg-black/10 font-medium"
                      style={{ color: colors.text }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Coin plié */}
            <div 
              className="absolute bottom-0 right-0 w-0 h-0 opacity-40"
              style={{
                borderLeft: '20px solid transparent',
                borderTop: '20px solid transparent',
                borderBottom: '20px solid rgba(0,0,0,0.2)',
                filter: 'blur(1px)'
              }}
            />
          </div>
        </div>
      )}
    </Draggable>
  )
}


