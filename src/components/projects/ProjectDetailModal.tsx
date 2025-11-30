import { useMemo, useState } from 'react'
import { X, ExternalLink, CheckSquare, Clock, TrendingUp, Calendar as CalendarIcon, LayoutGrid, List } from 'lucide-react'
import { Project } from '../../types/project'
import { useStore } from '../../store/useStore'
import { calculateProjectStats, getDaysUntilDeadline, isProjectOverdue } from '../../utils/projectUtils'
import { TaskStatus } from '../../store/useStore'

interface ProjectDetailModalProps {
  project: Project
  onClose: () => void
  onEdit?: () => void
}

const statusLabels: Record<TaskStatus, string> = {
  'backlog': 'Backlog',
  'todo': 'À faire',
  'in-progress': 'En cours',
  'done': 'Terminé'
}

const statusColors: Record<TaskStatus, string> = {
  'backlog': 'bg-zinc-500',
  'todo': 'bg-blue-500',
  'in-progress': 'bg-amber-500',
  'done': 'bg-emerald-500'
}

export function ProjectDetailModal({ project, onClose, onEdit }: ProjectDetailModalProps) {
  const { tasks, setView, toggleTask, updateTask } = useStore()
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban')
  
  const stats = calculateProjectStats(project, tasks)
  const projectTasks = useMemo(() => tasks.filter(t => t.projectId === project.id), [tasks, project.id])
  const daysUntilDeadline = getDaysUntilDeadline(project.deadline)
  const overdue = isProjectOverdue(project.deadline)

  // Grouper les tâches par statut pour le Kanban
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, typeof projectTasks> = {
      'backlog': [],
      'todo': [],
      'in-progress': [],
      'done': []
    }
    projectTasks.forEach(task => {
      grouped[task.status].push(task)
    })
    return grouped
  }, [projectTasks])

  const handleOpenTasks = () => {
    setView('tasks')
    onClose()
  }

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    updateTask(taskId, { 
      status: newStatus,
      completed: newStatus === 'done'
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl max-h-[90vh] bg-mars-900 rounded-3xl shadow-2xl overflow-hidden animate-scale-in border border-mars-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-5 flex-shrink-0"
          style={{ backgroundColor: `${project.color}15` }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${project.color}30`, border: `2px solid ${project.color}60` }}
              >
                {project.icon || '📁'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{project.name}</h2>
                <p className="text-sm text-mars-500 capitalize">{project.status}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex bg-mars-800/50 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-mars-700 text-white' : 'text-mars-500 hover:text-mars-300'}`}
                  title="Vue Kanban"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-mars-700 text-white' : 'text-mars-500 hover:text-mars-300'}`}
                  title="Vue Liste"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-mars-600 hover:text-mars-400 transition-colors rounded-xl hover:bg-mars-800/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <span className="text-mars-400">{stats.completedTasks}/{stats.totalTasks} tâches</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-mars-800 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all"
                  style={{ width: `${stats.progress}%`, backgroundColor: project.color }}
                />
              </div>
              <span className="text-mars-400">{stats.progress}%</span>
            </div>
            {project.deadline && (
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-amber-400" />
                <span className={overdue ? 'text-rose-400' : 'text-mars-400'}>
                  {overdue ? 'En retard' : daysUntilDeadline !== null ? `${daysUntilDeadline}j restants` : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {projectTasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare className="w-12 h-12 text-mars-700 mx-auto mb-3" />
              <p className="text-mars-500 mb-4">Aucune tâche dans ce projet</p>
              <button
                onClick={handleOpenTasks}
                className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-all"
              >
                Ajouter des tâches
              </button>
            </div>
          ) : viewMode === 'kanban' ? (
            /* Kanban View */
            <div className="grid grid-cols-4 gap-4 h-full min-h-[400px]">
              {(['backlog', 'todo', 'in-progress', 'done'] as TaskStatus[]).map((status) => (
                <div key={status} className="flex flex-col">
                  {/* Column Header */}
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
                    <span className="text-sm font-medium text-mars-400">{statusLabels[status]}</span>
                    <span className="text-xs text-mars-600 ml-auto">{tasksByStatus[status].length}</span>
                  </div>
                  
                  {/* Column Content */}
                  <div className="flex-1 bg-mars-800/30 rounded-xl p-2 space-y-2 overflow-auto">
                    {tasksByStatus[status].map((task) => (
                      <div
                        key={task.id}
                        className="bg-mars-800 rounded-xl p-3 cursor-pointer hover:bg-mars-700 transition-all group"
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => toggleTask(task.id)}
                            className="mt-1 w-4 h-4 rounded border-mars-600"
                          />
                          <span className={`text-sm flex-1 ${task.completed ? 'text-mars-600 line-through' : 'text-mars-200'}`}>
                            {task.title}
                          </span>
                        </div>
                        
                        {/* Quick Status Change */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {(['backlog', 'todo', 'in-progress', 'done'] as TaskStatus[]).map((s) => (
                            <button
                              key={s}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStatusChange(task.id, s)
                              }}
                              className={`w-2 h-2 rounded-full transition-all ${
                                task.status === s ? statusColors[s] : 'bg-mars-600 hover:' + statusColors[s]
                              }`}
                              title={statusLabels[s]}
                            />
                          ))}
                        </div>
                        
                        {/* Task Meta */}
                        <div className="flex items-center gap-2 mt-2">
                          {task.priority === 'urgent' && <span className="text-xs">🔥</span>}
                          {task.priority === 'high' && <span className="text-xs">⚡</span>}
                          {task.estimatedTime && (
                            <span className="text-xs text-mars-600">{task.estimatedTime}min</span>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {tasksByStatus[status].length === 0 && (
                      <div className="text-center py-8 text-mars-600 text-xs">
                        Aucune tâche
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-2">
              {projectTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 bg-mars-800/50 rounded-xl hover:bg-mars-800 transition-all"
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    className="w-4 h-4 rounded"
                  />
                  <span className={`text-sm flex-1 ${task.completed ? 'text-mars-600 line-through' : 'text-mars-300'}`}>
                    {task.title}
                  </span>
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                    className="text-xs bg-mars-700 text-mars-300 px-2 py-1 rounded-lg border-none focus:ring-0"
                  >
                    {(['backlog', 'todo', 'in-progress', 'done'] as TaskStatus[]).map((s) => (
                      <option key={s} value={s}>{statusLabels[s]}</option>
                    ))}
                  </select>
                  {task.priority === 'urgent' && <span>🔥</span>}
                  {task.priority === 'high' && <span>⚡</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-mars-800 flex gap-3">
          <button
            onClick={handleOpenTasks}
            className="flex-1 px-4 py-2.5 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-all duration-300 flex items-center justify-center gap-2 text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            Gérer les tâches
          </button>
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-2.5 bg-mars-800 text-mars-400 rounded-xl hover:bg-mars-700 transition-all duration-300 text-sm"
            >
              Modifier le projet
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
