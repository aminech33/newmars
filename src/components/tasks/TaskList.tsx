import { Task } from '../../store/useStore'
import { TaskCard } from './TaskCard'
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd'

interface TaskListProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onTaskDelete?: (task: Task) => void
}

export function TaskList({ tasks, onTaskClick }: TaskListProps) {
  // Séparer les tâches à faire et terminées
  const todoTasks = tasks.filter(t => !t.completed)
  const doneTasks = tasks.filter(t => t.completed)
  
  const handleDragEnd = (result: DropResult) => {
    // Drag & drop simple sans réorganisation complexe
    if (!result.destination) return
  }
  
  return (
    <div className="h-full overflow-y-auto space-y-6 scroll-smooth">
      {/* À FAIRE */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div>
          <h2 className="text-sm font-semibold text-zinc-500 mb-3 px-1">
            À FAIRE ({todoTasks.length})
          </h2>
          <Droppable droppableId="todo-tasks">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-2"
              >
                {todoTasks.length === 0 ? (
                  <div className="p-8 text-center text-zinc-600">
                    <p>🎉 Aucune tâche en attente</p>
                    <p className="text-sm mt-2">Ajoutez une nouvelle tâche pour commencer</p>
                  </div>
                ) : (
                  todoTasks.map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      onClick={() => onTaskClick(task)}
                    />
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>
      
      {/* TERMINÉES */}
      {doneTasks.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-600 mb-3 px-1">
            TERMINÉES ({doneTasks.length})
          </h2>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="done-tasks">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-2"
                >
                  {doneTasks.map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      onClick={() => onTaskClick(task)}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}
    </div>
  )
}


