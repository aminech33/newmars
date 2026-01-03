/**
 * 📂 ProjectRow - Header de section projet repliable
 * 
 * Design cohérent avec TaskRow (simple et clean)
 */

import { ChevronDown } from 'lucide-react'
import { Project } from '../../store/useStore'
import { fontStack } from './taskUtils'

interface ProjectRowProps {
  project: Project | null
  tasksCount: number
  isExpanded: boolean
  onToggle: () => void
}

export function ProjectRow({ project, tasksCount, isExpanded, onToggle }: ProjectRowProps) {
  const projectName = project ? project.name : 'Sans projet'
  const projectColor = project ? project.color : '#6b7280'
  
  return (
    <button
      onClick={onToggle}
      className={`
        group relative w-full flex items-center gap-3 h-12 px-3.5 rounded-xl mb-1.5
        bg-zinc-800/40 hover:bg-zinc-800/60
        transition-all duration-150 ease-out
        ${fontStack}
      `}
      aria-expanded={isExpanded}
      aria-label={`${projectName}, ${tasksCount} tâche${tasksCount > 1 ? 's' : ''}`}
    >
      {/* Flèche premium (même style que TaskRow) */}
      <div 
        className={`
          flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center
          transition-all duration-200 ease-out
          ${isExpanded ? 'bg-zinc-700/50' : 'bg-transparent'}
          group-hover:bg-zinc-700/70
        `}
      >
        <ChevronDown 
          className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 transition-colors"
          style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        />
      </div>
      
      {/* Nom du projet (police plus grande que TaskRow) */}
      <span className={`
        flex-1 text-[19px] leading-normal truncate
        font-semibold text-zinc-200 group-hover:text-white
        transition-all duration-150
        ${fontStack}
      `}>
        {projectName}
      </span>
      
      {/* Compteur plus grand */}
      <span className="text-base font-semibold text-zinc-400 tabular-nums flex-shrink-0">
        {tasksCount}
      </span>
    </button>
  )
}

