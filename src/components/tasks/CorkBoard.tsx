import { Task, TaskStatus, useStore } from '../../store/useStore'
import { CorkBoardColumn } from './CorkBoardColumn'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'

interface CorkBoardProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onTaskDelete?: (task: Task) => void
}

const columns: { status: TaskStatus; title: string; icon: string }[] = [
  { status: 'backlog', title: 'Backlog', icon: '📥' },
  { status: 'todo', title: 'À faire', icon: '🎯' },
  { status: 'in-progress', title: 'En cours', icon: '⚡' },
  { status: 'done', title: 'Terminé', icon: '✅' }
]

export function CorkBoard({ tasks, onTaskClick }: CorkBoardProps) {
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
      {/* Mur avec tableau de liège */}
      <div 
        className="h-full p-6 overflow-x-auto"
        style={{
          background: 'linear-gradient(180deg, #2c2416 0%, #1a150e 100%)',
          backgroundImage: `
            linear-gradient(180deg, #2c2416 0%, #1a150e 100%),
            repeating-linear-gradient(90deg, 
              transparent, 
              transparent 100px, 
              rgba(0,0,0,0.05) 100px, 
              rgba(0,0,0,0.05) 101px
            )
          `
        }}
      >
        <div className="flex gap-6 min-w-max h-full">
          {columns.map((column) => (
            <CorkBoardColumn
              key={column.status}
              status={column.status}
              title={column.title}
              icon={column.icon}
              tasks={getTasksByStatus(column.status)}
              onTaskClick={onTaskClick}
            />
          ))}
        </div>
      </div>
    </DragDropContext>
  )
}

