import { Task, TaskStatus, useStore } from '../../store/useStore'
import { KanbanColumn } from './KanbanColumn'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'

interface KanbanBoardProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onTaskDelete?: (task: Task) => void
}

const columns: { status: TaskStatus; title: string; icon: string }[] = [
  { status: 'todo', title: 'À faire', icon: '🎯' },
  { status: 'in-progress', title: 'En cours', icon: '⚡' },
  { status: 'done', title: 'Terminé', icon: '✅' }
]

export function KanbanBoard({ tasks, onTaskClick, onTaskDelete }: KanbanBoardProps) {
  const { moveTask } = useStore()
  
  const handleDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result
    
    if (!destination) return
    
    const newStatus = destination.droppableId as TaskStatus
    moveTask(draggableId, newStatus)
  }
  
  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(t => t.status === status)
  }
  
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="h-full overflow-x-auto">
        <div className="flex gap-4 min-w-max h-full">
          {columns.map((column) => (
            <KanbanColumn
              key={column.status}
              status={column.status}
              title={column.title}
              icon={column.icon}
              tasks={getTasksByStatus(column.status)}
              onTaskClick={onTaskClick}
              onTaskDelete={onTaskDelete}
            />
          ))}
        </div>
      </div>
    </DragDropContext>
  )
}

