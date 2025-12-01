import { Plus } from 'lucide-react'
import { Task, TaskStatus } from '../../store/useStore'
import { PostItTaskCard } from './PostItTaskCard'
import { Droppable } from '@hello-pangea/dnd'

interface CorkBoardColumnProps {
  status: TaskStatus
  title: string
  icon: string
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onAddTask?: () => void
}

const statusLabels = {
  backlog: 'Backlog',
  todo: 'À faire',
  'in-progress': 'En cours',
  done: 'Terminé'
}

export function CorkBoardColumn({ status, title, icon, tasks, onTaskClick, onAddTask }: CorkBoardColumnProps) {
  return (
    <div className="flex flex-col h-full min-w-[280px] max-w-[320px]">
      {/* Étiquette collée sur le liège */}
      <div 
        className="mb-4 p-3 rounded-lg relative"
        style={{
          background: 'linear-gradient(135deg, #f5f5dc 0%, #e8e8d0 100%)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15), inset 0 -1px 2px rgba(0,0,0,0.1)',
          border: '1px solid rgba(139, 115, 85, 0.2)'
        }}
      >
        {/* Ruban adhésif en haut */}
        <div 
          className="absolute -top-2 left-4 right-4 h-4 opacity-60"
          style={{
            background: 'rgba(255, 255, 255, 0.4)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(2px)'
          }}
        />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <div>
              <h2 
                className="text-sm font-semibold" 
                style={{ 
                  color: '#4a4035',
                  fontFamily: '"Indie Flower", cursive'
                }}
              >
                {title}
              </h2>
              <p className="text-xs opacity-60" style={{ color: '#6b5d50' }}>
                {tasks.length} post-it{tasks.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {onAddTask && (
            <button
              onClick={onAddTask}
              className="p-2 rounded-full transition-colors hover:bg-black/10"
              style={{ color: '#4a4035' }}
              aria-label={`Ajouter une tâche à ${statusLabels[status]}`}
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Zone droppable - panneau de liège */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex-1 p-4 rounded-2xl relative overflow-hidden
              transition-all duration-300
              ${snapshot.isDraggingOver ? 'ring-4 ring-amber-400/50' : ''}
            `}
            style={{
              background: 'linear-gradient(135deg, #d4a574 0%, #b8956a 100%)',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.15)',
              minHeight: '400px'
            }}
          >
            {/* Texture liège */}
            <div 
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 20% 30%, rgba(0,0,0,0.1) 1px, transparent 1px),
                  radial-gradient(circle at 60% 70%, rgba(0,0,0,0.1) 1px, transparent 1px),
                  radial-gradient(circle at 40% 50%, rgba(0,0,0,0.08) 1.5px, transparent 1.5px),
                  radial-gradient(circle at 80% 20%, rgba(0,0,0,0.08) 1px, transparent 1px),
                  radial-gradient(circle at 10% 80%, rgba(0,0,0,0.1) 1.5px, transparent 1.5px)
                `,
                backgroundSize: '60px 60px, 80px 80px, 50px 50px, 70px 70px, 90px 90px',
                backgroundPosition: '0 0, 20px 20px, 40px 10px, 10px 40px, 30px 30px'
              }}
            />
            
            {/* Post-its */}
            <div className="relative space-y-4">
              {tasks.length === 0 && (
                <div 
                  className="flex items-center justify-center h-32 opacity-50"
                  style={{ color: '#8b7355' }}
                >
                  <p className="text-sm" style={{ fontFamily: '"Indie Flower", cursive' }}>
                    Glissez un post-it ici
                  </p>
                </div>
              )}
              
              {tasks.map((task, index) => (
                <PostItTaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  onClick={() => onTaskClick(task)}
                />
              ))}
              {provided.placeholder}
            </div>
          </div>
        )}
      </Droppable>
    </div>
  )
}

