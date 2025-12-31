/**
 * 📁 ProjectCard - Carte de projet minimaliste (style Linear)
 */

import { Draggable } from '@hello-pangea/dnd'
import { MoreHorizontal } from 'lucide-react'
import { Project, Task } from '../../store/useStore'
import { fontStack } from './taskUtils'
import { getOverdueTasks, projectColumnStyles, categorizeProject } from './projectUtils'
import { useState } from 'react'

interface ProjectCardProps {
  project: Project
  stats: {
    completed: number
    total: number
    progress: number
  }
  index: number
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
  onAssignTasks: () => void
  allTasks: Task[]
}

export function ProjectCard({
  project,
  stats,
  index,
  onClick,
  onEdit,
  onDelete,
  onAssignTasks,
  allTasks
}: ProjectCardProps) {
  const overdueCount = getOverdueTasks(project, allTasks)
  const status = categorizeProject(project, allTasks)
  const styles = projectColumnStyles[status]
  const [showMenu, setShowMenu] = useState(false)
  
  return (
    <Draggable draggableId={project.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`
            group flex items-center gap-4 h-12 px-4 rounded-lg cursor-pointer
            transition-all duration-150 relative
            ${styles.row} ${styles.rowHover} ${styles.opacity}
            ${snapshot.isDragging ? 'shadow-2xl scale-105 ring-2 ring-indigo-500/50' : ''}
          `}
          role="button"
          tabIndex={0}
          aria-label={`Projet ${project.name}, ${stats.total} tâches, ${stats.progress}% complété`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onClick()
            }
          }}
        >
          {/* Nom du projet */}
          <span className={`flex-1 min-w-0 text-[16px] font-semibold truncate ${fontStack} ${styles.text}`}>
            {project.name}
          </span>
          
          {/* Badge retards (si nécessaire) */}
          {overdueCount > 0 && (
            <span className={`text-[15px] font-bold text-rose-400 tabular-nums flex-shrink-0 ${fontStack}`}>
              !{overdueCount}
            </span>
          )}
          
          {/* Pourcentage */}
          <span className={`text-[16px] font-bold tabular-nums flex-shrink-0 ${fontStack} ${styles.text}`}>
            {stats.progress}%
          </span>
          
          {/* Barre de progression */}
          <div 
            className="w-32 h-1.5 bg-zinc-800/80 rounded-full overflow-hidden flex-shrink-0"
            role="progressbar"
            aria-valuenow={stats.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            title={`${stats.progress}% complété`}
          >
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${stats.progress}%`,
                backgroundColor: project.color
              }}
            />
          </div>
          
          {/* Stats */}
          <span className={`text-[15px] font-semibold tabular-nums flex-shrink-0 ${fontStack} ${styles.textSecondary}`}>
            {stats.completed}/{stats.total}
          </span>
          
          {/* Menu contextuel */}
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-1.5 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700/50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Options"
              title="Options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            
            {/* Dropdown menu */}
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(false)
                  }}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                      onAssignTasks()
                    }}
                    className={`w-full px-3 py-2 text-left text-[13px] text-zinc-300 hover:bg-zinc-700/50 transition-colors ${fontStack}`}
                  >
                    Assigner des tâches
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                      onEdit()
                    }}
                    className={`w-full px-3 py-2 text-left text-[13px] text-zinc-300 hover:bg-zinc-700/50 transition-colors ${fontStack}`}
                  >
                    Modifier
                  </button>
                  <div className="my-1 h-px bg-zinc-700/50" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                      onDelete()
                    }}
                    className={`w-full px-3 py-2 text-left text-[13px] text-rose-400 hover:bg-rose-500/10 transition-colors ${fontStack}`}
                  >
                    Supprimer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Draggable>
  )
}
