import { Task, TaskStatus, useStore } from '../../store/useStore'
import { KanbanColumn } from './KanbanColumn'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'

interface KanbanBoardProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
}

const columns: { status: TaskStatus; title: string; icon: string }[] = [
  { status: 'backlog', title: 'Backlog', icon: '📥' },
  { status: 'todo', title: 'À faire', icon: '🎯' },
  { status: 'in-progress', title: 'En cours', icon: '⚡' },
  { status: 'done', title: 'Terminé', icon: '✅' }
]

export function KanbanBoard({ tasks, onTaskClick }: KanbanBoardProps) {
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
      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {columns.map((column) => (
          <KanbanColumn
            key={column.status}
            status={column.status}
            title={column.title}
            icon={column.icon}
            tasks={getTasksByStatus(column.status)}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
    </DragDropContext>
  )
}
