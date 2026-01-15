/**
 * 📦 ProjectTasksSection - Section de tâches groupées par projet dans une colonne
 * 
 * Design : Même style que TaskRow avec flèche à gauche
 * Repliable/dépliable pour montrer/cacher les tâches du projet
 */

import { useState } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import { Task, Project } from '../../store/useStore'
import { TaskRow } from './TaskRow'
import { ProjectRow } from './ProjectRow'

interface ProjectTasksSectionProps {
  project: Project | null  // null = tâches sans projet
  tasks: Task[]
  columnId: string
  startIndex: number  // Index global de la première tâche dans la colonne
  onTaskClick: (task: Task) => void
  onTaskToggle: (id: string) => void
  onFocus?: (task: Task) => void
}

export function ProjectTasksSection({
  project,
  tasks,
  columnId,
  startIndex,
  onTaskClick,
  onTaskToggle,
  onFocus
}: ProjectTasksSectionProps) {
  
  const [isExpanded, setIsExpanded] = useState(true)
  
  if (tasks.length === 0) return null
  
  return (
    <div className="mb-3">
      {/* Header du projet */}
      <ProjectRow
        project={project}
        tasksCount={tasks.length}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
      />
      
      {/* Liste des tâches (si déplié) */}
      {isExpanded && (
        <div className="space-y-1 pl-1">
          {tasks.map((task, localIndex) => {
            const globalIndex = startIndex + localIndex
            return (
              <Draggable
                key={task.id}
                draggableId={task.id}
                index={globalIndex}
                isDragDisabled={task.completed}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <TaskRow
                      task={task}
                      column={columnId as any}
                      index={globalIndex}
                      onClick={() => onTaskClick(task)}
                      onToggle={() => onTaskToggle(task.id)}
                      onFocus={onFocus}
                      isDragging={snapshot.isDragging}
                    />
                  </div>
                )}
              </Draggable>
            )
          })}
        </div>
      )}
    </div>
  )
}

