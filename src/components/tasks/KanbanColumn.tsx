import { Task, TaskStatus } from '../../store/useStore'
import { TaskCard } from './TaskCard'
import { Droppable } from '@hello-pangea/dnd'

interface KanbanColumnProps {
  status: TaskStatus
  title: string
  icon: string
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onTaskDelete?: (task: Task) => void
}

const statusColors = {
  todo: 'from-indigo-500/20 to-indigo-600/20',
  'in-progress': 'from-amber-500/20 to-amber-600/20',
  done: 'from-emerald-500/20 to-emerald-600/20'
}

const statusBorders = {
  todo: 'rgba(99, 102, 241, 0.3)',
  'in-progress': 'rgba(245, 158, 11, 0.3)',
  done: 'rgba(16, 185, 129, 0.3)'
}

export function KanbanColumn({ status, title, icon, tasks, onTaskClick, onTaskDelete }: KanbanColumnProps) {
  return (
    <div className="flex flex-col h-full min-w-[320px] flex-1">
      {/* Header */}
      <div 
        className={`
          mb-4 p-4 rounded-2xl backdrop-blur-xl
          bg-gradient-to-br ${statusColors[status]}
          shadow-[0_4px_16px_rgba(0,0,0,0.2)]
        `}
        style={{ border: `1px solid ${statusBorders[status]}` }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h2 className="text-base font-semibold text-zinc-200">{title}</h2>
            <p className="text-xs text-zinc-500">{tasks.length} tâche{tasks.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>
      
      {/* Tasks */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex-1 space-y-3 overflow-y-auto pr-1
              ${snapshot.isDraggingOver ? 'bg-white/5 rounded-2xl p-2' : ''}
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
              <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
                <span className="text-3xl mb-2">{icon}</span>
                <p className="text-zinc-500 text-sm">Aucune tâche</p>
                <p className="text-zinc-600 text-xs mt-1">Glissez une tâche ici</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  )
}
