/**
 * 📁 ProjectColumn - Colonne de projets avec drag & drop
 */

import { Droppable } from '@hello-pangea/dnd'
import { Project, Task } from '../../store/useStore'
import { ProjectColumnConfig, calculateProjectStats, projectColumnStyles } from './projectUtils'
import { ProjectCard } from './ProjectCard'
import { fontStack } from './taskUtils'

interface ProjectColumnProps {
  config: ProjectColumnConfig
  projects: Project[]
  tasks: Task[]
  onProjectClick: (project: Project) => void
  onProjectEdit: (project: Project) => void
  onProjectDelete: (projectId: string) => void
  onAssignTasks: (project: Project) => void
}

export function ProjectColumn({
  config,
  projects,
  tasks,
  onProjectClick,
  onProjectEdit,
  onProjectDelete,
  onAssignTasks
}: ProjectColumnProps) {
  const Icon = config.icon
  const styles = projectColumnStyles[config.id]
  
  return (
    <div className="flex-1 min-w-0 flex flex-col h-full">
      {/* Column Header - Style aligné avec TasksPage */}
      <div className="flex-shrink-0 px-4 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <h2 
            className={`text-[19px] font-semibold leading-tight tracking-tight ${fontStack} ${styles.header}`}
          >
            {config.label}
          </h2>
          {projects.length > 0 && (
            <span 
              className={`text-[14px] leading-none tabular-nums px-2 py-1 rounded-md ${fontStack} ${styles.count}`}
              aria-label={`${projects.length} projets`}
            >
              {projects.length}
            </span>
          )}
        </div>
      </div>
      
      {/* Droppable Area */}
      <Droppable droppableId={config.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 px-2.5 pb-4 overflow-y-auto space-y-1.5 transition-colors duration-200 ${
              snapshot.isDraggingOver ? 'bg-zinc-900/30' : ''
            }`}
          >
            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 transition-transform duration-300 hover:scale-110"
                  style={{ 
                    backgroundColor: `${config.color}15`,
                    border: `2px dashed ${config.color}30`
                  }}
                >
                  <Icon 
                    className="w-8 h-8" 
                    style={{ color: `${config.color}60` }}
                  />
                </div>
                <p className={`text-[13px] font-medium text-zinc-600 mb-1 ${fontStack}`}>
                  Aucun projet {config.label.toLowerCase()}
                </p>
                <p className={`text-[11px] text-zinc-700 leading-relaxed max-w-[180px] ${fontStack}`}>
                  {config.id === 'todo' && 'Créez un nouveau projet pour commencer'}
                  {config.id === 'inProgress' && 'Les projets en progression apparaîtront ici'}
                  {config.id === 'completed' && 'Les projets terminés seront listés ici'}
                  {config.id === 'archived' && 'Archivez des projets pour les retrouver ici'}
                </p>
              </div>
            ) : (
              projects.map((project, index) => {
                const stats = calculateProjectStats(project, tasks)
                return (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    stats={stats}
                    index={index}
                    onClick={() => onProjectClick(project)}
                    onEdit={() => onProjectEdit(project)}
                    onDelete={() => onProjectDelete(project.id)}
                    onAssignTasks={() => onAssignTasks(project)}
                    allTasks={tasks}
                  />
                )
              })
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      
      {/* Column Separator */}
      <div className="absolute right-0 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-zinc-800/50 to-transparent" />
    </div>
  )
}

