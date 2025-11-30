import { useState } from 'react'
import { MoreVertical, Star, Trash2, Play, Pause, CheckCircle, Calendar } from 'lucide-react'
import { Project } from '../../types/project'
import { useStore } from '../../store/useStore'
import { calculateProjectStats, getDaysUntilDeadline, isProjectOverdue } from '../../utils/projectUtils'

interface ProjectCardProps {
  project: Project
  onClick?: () => void
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const { tasks, updateProject, deleteProject, toggleProjectFavorite } = useStore()
  const [showMenu, setShowMenu] = useState(false)
  
  const stats = calculateProjectStats(project, tasks)
  const daysUntilDeadline = getDaysUntilDeadline(project)
  const overdue = isProjectOverdue(project)

  const handleStatusChange = (status: Project['status']) => {
    updateProject(project.id, { status })
    setShowMenu(false)
  }

  const handleDelete = () => {
    if (confirm(`Supprimer le projet "${project.name}" ? Les tâches associées ne seront pas supprimées.`)) {
      deleteProject(project.id)
    }
  }

  const getStatusIcon = () => {
    switch (project.status) {
      case 'active': return <Play className="w-3 h-3" />
      case 'paused': return <Pause className="w-3 h-3" />
      case 'completed': return <CheckCircle className="w-3 h-3" />
      default: return null
    }
  }

  const getStatusColor = () => {
    switch (project.status) {
      case 'active': return 'text-green-400 bg-green-500/20'
      case 'paused': return 'text-yellow-400 bg-yellow-500/20'
      case 'completed': return 'text-blue-400 bg-blue-500/20'
      case 'archived': return 'text-mars-600 bg-mars-800'
      default: return 'text-mars-600'
    }
  }

  return (
    <div
      className="bg-mars-900/50 backdrop-blur-sm rounded-3xl p-5 border border-mars-800/50 hover:border-mars-700/50 transition-all cursor-pointer group"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${project.color}20`, border: `2px solid ${project.color}40` }}
          >
            {project.icon || '📁'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-white truncate">{project.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-lg flex items-center gap-1 ${getStatusColor()}`}>
                {getStatusIcon()}
                {project.status}
              </span>
              {project.isFavorite && <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />}
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="p-1 text-mars-600 hover:text-mars-400 transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div
              className="absolute right-0 top-8 bg-mars-900 rounded-xl shadow-xl z-10 py-1 min-w-[150px] border border-mars-800"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => toggleProjectFavorite(project.id)}
                className="w-full px-3 py-2 text-left text-sm text-mars-400 hover:bg-mars-800 flex items-center gap-2"
              >
                <Star className="w-3 h-3" fill={project.isFavorite ? 'currentColor' : 'none'} />
                {project.isFavorite ? 'Retirer favori' : 'Ajouter favori'}
              </button>
              <button
                onClick={() => handleStatusChange('active')}
                className="w-full px-3 py-2 text-left text-sm text-mars-400 hover:bg-mars-800 flex items-center gap-2"
              >
                <Play className="w-3 h-3" />
                Actif
              </button>
              <button
                onClick={() => handleStatusChange('paused')}
                className="w-full px-3 py-2 text-left text-sm text-mars-400 hover:bg-mars-800 flex items-center gap-2"
              >
                <Pause className="w-3 h-3" />
                En pause
              </button>
              <button
                onClick={() => handleStatusChange('completed')}
                className="w-full px-3 py-2 text-left text-sm text-mars-400 hover:bg-mars-800 flex items-center gap-2"
              >
                <CheckCircle className="w-3 h-3" />
                Complété
              </button>
              <div className="border-t border-mars-800 my-1" />
              <button
                onClick={handleDelete}
                className="w-full px-3 py-2 text-left text-sm text-rose-400 hover:bg-mars-800 flex items-center gap-2"
              >
                <Trash2 className="w-3 h-3" />
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-sm text-mars-500 mb-4 line-clamp-2">{project.description}</p>
      )}

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-mars-600 mb-1">
          <span>Progression</span>
          <span>{stats.progress}%</span>
        </div>
        <div className="h-2 bg-mars-900 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${stats.progress}%`,
              backgroundColor: project.color
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-mars-900/50 p-2 rounded-xl">
          <p className="text-xs text-mars-600">Tâches</p>
          <p className="text-sm font-medium text-white">
            {stats.completedTasksCount}/{stats.tasksCount}
          </p>
        </div>
        <div className="bg-mars-900/50 p-2 rounded-xl">
          <p className="text-xs text-mars-600">Temps</p>
          <p className="text-sm font-medium text-white">
            {stats.actualHours}h / {stats.estimatedHours}h
          </p>
        </div>
      </div>

      {/* Deadline */}
      {project.deadline && (
        <div className={`flex items-center gap-2 text-xs ${overdue ? 'text-rose-400' : daysUntilDeadline && daysUntilDeadline < 7 ? 'text-amber-400' : 'text-mars-600'}`}>
          <Calendar className="w-3 h-3" />
          {overdue ? (
            <span>En retard</span>
          ) : daysUntilDeadline !== null ? (
            <span>{daysUntilDeadline} jours restants</span>
          ) : (
            <span>{new Date(project.deadline).toLocaleDateString('fr-FR')}</span>
          )}
        </div>
      )}
    </div>
  )
}


