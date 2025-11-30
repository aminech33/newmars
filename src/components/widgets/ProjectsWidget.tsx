import { Briefcase, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'
import { calculateGlobalProjectStats, isProjectOverdue, getDaysUntilDeadline } from '../../utils/projectUtils'
import { useMemo } from 'react'

interface ProjectsWidgetProps {
  widget: Widget
}

export function ProjectsWidget({ widget }: ProjectsWidgetProps) {
  const { setView, projects, tasks } = useStore()
  
  const activeProjects = projects.filter(p => p.status === 'active')
  const stats = useMemo(() => calculateGlobalProjectStats(projects, tasks), [projects, tasks])
  const atRiskProjects = activeProjects.filter(p => isProjectOverdue(p) || (getDaysUntilDeadline(p) !== null && getDaysUntilDeadline(p)! < 3))

  if (widget.size === 'small') {
    return (
      <WidgetContainer widget={widget} onClick={() => setView('tasks')}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white">Projets</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div>
            <p className="text-xs text-mars-500">Actifs</p>
            <p className="text-2xl font-bold text-white">{stats.activeCount}</p>
          </div>
          {stats.atRiskCount > 0 && (
            <div className="flex items-center gap-1 text-orange-400">
              <AlertTriangle className="w-3 h-3" />
              <span className="text-xs">{stats.atRiskCount} à risque</span>
            </div>
          )}
        </div>
      </WidgetContainer>
    )
  }

  if (widget.size === 'medium') {
    return (
      <WidgetContainer widget={widget} onClick={() => setView('tasks')}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-400" />
            <span className="font-medium text-white">Projets</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setView('tasks')
            }}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Voir tout →
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-mars-800/30 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-mars-500">Actifs</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.activeCount}</p>
          </div>
          <div className="bg-mars-800/30 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-mars-500">Progression</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.averageProgress}%</p>
          </div>
        </div>

        {/* At Risk Projects */}
        {stats.atRiskCount > 0 && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-orange-300">{stats.atRiskCount} projet(s) à risque</span>
            </div>
          </div>
        )}
      </WidgetContainer>
    )
  }

  // Large size
  return (
    <WidgetContainer widget={widget} onClick={() => setView('tasks')}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-blue-400" />
          <span className="font-medium text-white">Projets Actifs</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setView('tasks')
          }}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          Gérer →
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-mars-800/30 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.activeCount}</p>
          <p className="text-xs text-mars-500">projets actifs</p>
        </div>
        <div className="bg-mars-800/30 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.averageProgress}%</p>
          <p className="text-xs text-mars-500">progression</p>
        </div>
        <div className="bg-mars-800/30 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.completedTasks}/{stats.totalTasks}</p>
          <p className="text-xs text-mars-500">tâches</p>
        </div>
      </div>

      {/* At Risk Projects */}
      {stats.atRiskCount > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium text-orange-300">{stats.atRiskCount} projet(s) à risque</span>
          </div>
          <div className="space-y-2">
            {atRiskProjects.slice(0, 2).map((project) => {
              const daysLeft = getDaysUntilDeadline(project)
              const overdue = isProjectOverdue(project)
              return (
                <div key={project.id} className="flex items-center gap-2">
                  <span className="text-lg">{project.icon || '📁'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{project.name}</p>
                    <p className="text-xs text-orange-400">
                      {overdue ? 'En retard' : `${daysLeft}j restants`}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Active Projects List */}
      <div>
        <h3 className="text-xs font-medium text-mars-400 mb-2">Projets en cours</h3>
        <div className="space-y-2">
          {activeProjects.length === 0 ? (
            <div className="text-center py-4">
              <Briefcase className="w-8 h-8 text-mars-600 mx-auto mb-2" />
              <p className="text-xs text-mars-400">Aucun projet actif</p>
            </div>
          ) : (
            activeProjects.slice(0, 3).map((project) => {
              const projectTasks = tasks.filter(t => t.projectId === project.id)
              const completedTasks = projectTasks.filter(t => t.status === 'done').length
              const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0

              return (
                <div
                  key={project.id}
                  className="bg-mars-800/30 rounded-xl p-3 hover:bg-mars-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{project.icon || '📁'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{project.name}</p>
                      <p className="text-xs text-mars-400">{completedTasks}/{projectTasks.length} tâches</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-mars-900 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${progress}%`,
                        backgroundColor: project.color || '#3b82f6'
                      }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </WidgetContainer>
  )
}
