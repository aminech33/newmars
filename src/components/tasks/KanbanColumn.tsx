import { Plus } from 'lucide-react'
import { Task, TaskStatus } from '../../store/useStore'
import { TaskCard } from './TaskCard'
import { Droppable } from '@hello-pangea/dnd'

interface KanbanColumnProps {
  status: TaskStatus
  title: string
  icon: string
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onAddTask?: () => void
  onTaskDelete?: (task: Task) => void
}

const statusColors = {
  backlog: 'from-zinc-500/20 to-zinc-600/20',
  todo: 'from-cyan-500/20 to-cyan-600/20',
  'in-progress': 'from-amber-500/20 to-amber-600/20',
  done: 'from-emerald-500/20 to-emerald-600/20'
}

const statusBorders = {
  backlog: 'rgba(113, 113, 122, 0.3)',
  todo: 'rgba(6, 182, 212, 0.3)',
  'in-progress': 'rgba(245, 158, 11, 0.3)',
  done: 'rgba(16, 185, 129, 0.3)'
}

export function KanbanColumn({ status, title, icon, tasks, onTaskClick, onAddTask, onTaskDelete }: KanbanColumnProps) {
  return (
    <div className="flex flex-col h-full min-w-[300px] max-w-[350px]">
      {/* Header */}
      <div 
        className={`
          mb-4 p-4 rounded-2xl backdrop-blur-xl
          bg-gradient-to-br ${statusColors[status]}
          shadow-[0_4px_16px_rgba(0,0,0,0.2)]
        `}
        style={{ border: `1px solid ${statusBorders[status]}` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">{title}</h2>
              <p className="text-xs text-zinc-500">{tasks.length} tâche{tasks.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {onAddTask && (
            <button
              onClick={onAddTask}
              className="p-1.5 text-zinc-600 hover:text-zinc-400 transition-all rounded-lg hover:bg-zinc-800/50"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Tasks */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex-1 space-y-3 overflow-y-auto pr-2
              ${snapshot.isDraggingOver ? 'bg-zinc-800/20 rounded-2xl p-2' : ''}
              transition-colors duration-200
            `}
            style={{
              minHeight: '200px'
            }}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onClick={() => onTaskClick(task)}
                onDelete={onTaskDelete}
              />
            ))}
            {provided.placeholder}
            
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-zinc-600 text-sm">Aucune tâche</p>
                <p className="text-zinc-700 text-xs mt-1">Glissez une tâche ici</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  )
}
