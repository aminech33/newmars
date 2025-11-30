import { useMemo } from 'react'
import { X, ExternalLink, CheckSquare, Clock, TrendingUp, Calendar as CalendarIcon } from 'lucide-react'
import { Project } from '../../types/project'
import { useStore } from '../../store/useStore'
import { calculateProjectStats, getDaysUntilDeadline, isProjectOverdue } from '../../utils/projectUtils'

interface ProjectDetailModalProps {
  project: Project
  onClose: () => void
  onEdit?: () => void
}

export function ProjectDetailModal({ project, onClose, onEdit }: ProjectDetailModalProps) {
  const { tasks, setView } = useStore()
  
  const stats = calculateProjectStats(project, tasks)
  const projectTasks = useMemo(() => tasks.filter(t => t.projectId === project.id), [tasks, project.id])
  const daysUntilDeadline = getDaysUntilDeadline(project)
  const overdue = isProjectOverdue(project)

  const handleOpenTasks = () => {
    setView('tasks')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-mars-900 rounded-3xl shadow-2xl overflow-hidden animate-scale-in border border-mars-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-6"
          style={{ backgroundColor: `${project.color}15` }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                style={{ backgroundColor: `${project.color}30`, border: `2px solid ${project.color}60` }}
              >
                {project.icon || '📁'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{project.name}</h2>
                <p className="text-sm text-mars-500 capitalize">{project.status}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-mars-600 hover:text-mars-400 transition-colors rounded-xl hover:bg-mars-800/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {project.description && (
            <p className="text-sm text-mars-400">{project.description}</p>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-mars-400">Progression</span>
              <span className="text-lg font-bold text-white">{stats.progress}%</span>
            </div>
            <div className="h-3 bg-mars-950 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${stats.progress}%`,
                  backgroundColor: project.color
                }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-mars-800/50 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <CheckSquare className="w-4 h-4 text-blue-400" />
                <p className="text-xs text-mars-600">Tâches</p>
              </div>
              <p className="text-xl font-bold text-white">
                {stats.completedTasksCount}/{stats.tasksCount}
              </p>
            </div>

            <div className="bg-mars-800/50 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-green-400" />
                <p className="text-xs text-mars-600">Temps</p>
              </div>
              <p className="text-xl font-bold text-white">
                {stats.actualHours}h
              </p>
              <p className="text-xs text-mars-600">/ {stats.estimatedHours}h</p>
            </div>

            {project.deadline && (
              <div className="bg-mars-800/50 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarIcon className="w-4 h-4 text-yellow-400" />
                  <p className="text-xs text-mars-600">Deadline</p>
                </div>
                <p className={`text-xl font-bold ${overdue ? 'text-rose-400' : daysUntilDeadline && daysUntilDeadline < 7 ? 'text-amber-400' : 'text-white'}`}>
                  {overdue ? 'En retard' : daysUntilDeadline !== null ? `${daysUntilDeadline}j` : '-'}
                </p>
                <p className="text-xs text-mars-600">
                  {new Date(project.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            )}

            {project.goal && (
              <div className="bg-mars-800/50 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <p className="text-xs text-mars-600">Objectif</p>
                </div>
                <p className="text-sm text-mars-300 line-clamp-2">{project.goal}</p>
              </div>
            )}
          </div>

          {/* Recent Tasks */}
          {projectTasks.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-mars-400 mb-3">Tâches récentes</h3>
              <div className="space-y-2">
                {projectTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 bg-mars-800/50 rounded-xl"
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      readOnly
                      className="w-4 h-4 rounded"
                    />
                    <span className={`text-sm flex-1 ${task.completed ? 'text-mars-600 line-through' : 'text-mars-300'}`}>
                      {task.title}
                    </span>
                    <span className="text-xs text-mars-600 capitalize">{task.status}</span>
                  </div>
                ))}
              </div>
              {projectTasks.length > 5 && (
                <p className="text-xs text-mars-600 mt-2 text-center">
                  +{projectTasks.length - 5} autres tâches
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleOpenTasks}
              className="flex-1 px-4 py-3 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Voir toutes les tâches
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


