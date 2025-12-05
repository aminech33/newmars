import { useState, useMemo } from 'react'
import { X, Search, CheckSquare, Square, Filter } from 'lucide-react'
import { useStore, Project } from '../../store/useStore'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface AssignTasksToProjectModalProps {
  isOpen: boolean
  onClose: () => void
  project: Project
}

export function AssignTasksToProjectModal({ isOpen, onClose, project }: AssignTasksToProjectModalProps) {
  const { tasks, updateTask } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [showOnlyUnassigned, setShowOnlyUnassigned] = useState(true)

  // Tâches disponibles (non complétées)
  const availableTasks = useMemo(() => {
    return tasks.filter(t => {
      if (t.completed) return false
      if (showOnlyUnassigned && t.projectId && t.projectId !== project.id) return false
      if (searchQuery) {
        return t.title.toLowerCase().includes(searchQuery.toLowerCase())
      }
      return true
    })
  }, [tasks, searchQuery, showOnlyUnassigned, project.id])

  // Tâches déjà assignées à ce projet
  const currentProjectTasks = useMemo(() => {
    return tasks.filter(t => t.projectId === project.id && !t.completed)
  }, [tasks, project.id])

  const toggleTask = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const toggleAll = () => {
    if (selectedTaskIds.length === availableTasks.length) {
      setSelectedTaskIds([])
    } else {
      setSelectedTaskIds(availableTasks.map(t => t.id))
    }
  }

  const handleAssign = () => {
    selectedTaskIds.forEach(taskId => {
      updateTask(taskId, { projectId: project.id })
    })
    setSelectedTaskIds([])
    onClose()
  }

  const handleUnassign = (taskId: string) => {
    updateTask(taskId, { projectId: undefined })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      showCloseButton={false}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6 -mt-2 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
            style={{ backgroundColor: `${project.color}20`, border: `2px solid ${project.color}40` }}
          >
            {project.icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-200">
              Assigner des tâches
            </h3>
            <p className="text-sm text-zinc-500">
              Projet : {project.name}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-zinc-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex gap-6 -mx-6 px-6" style={{ height: 'calc(70vh - 200px)' }}>
        {/* Left: Available Tasks */}
        <div className="flex-1 flex flex-col border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800 space-y-3 bg-zinc-800/30">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-zinc-300">
                Tâches disponibles
              </h4>
              <button
                onClick={toggleAll}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {selectedTaskIds.length === availableTasks.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
            </div>

            {/* Search */}
            <Input
              icon={Search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une tâche..."
              size="sm"
            />

            {/* Filter */}
            <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyUnassigned}
                onChange={(e) => setShowOnlyUnassigned(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-800 bg-zinc-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
              />
              <Filter className="w-3 h-3" />
              Afficher uniquement les tâches non assignées
            </label>
          </div>

          {/* Task List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {availableTasks.length === 0 ? (
              <div className="text-center py-8 text-zinc-600">
                <p className="text-sm">Aucune tâche disponible</p>
              </div>
            ) : (
              availableTasks.map(task => {
                const isSelected = selectedTaskIds.includes(task.id)
                const isAlreadyInProject = task.projectId === project.id
                
                return (
                  <button
                    key={task.id}
                    onClick={() => !isAlreadyInProject && toggleTask(task.id)}
                    disabled={isAlreadyInProject}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-colors text-left ${
                      isAlreadyInProject
                        ? 'bg-zinc-800/30 border-zinc-800 opacity-50 cursor-not-allowed'
                        : isSelected
                        ? 'bg-indigo-500/20 border-indigo-500 ring-2 ring-indigo-500/50'
                        : 'bg-zinc-800/50 border-zinc-800 hover:border-zinc-800 hover:bg-zinc-800'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-5 h-5 text-zinc-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isAlreadyInProject ? 'text-zinc-600' : 'text-zinc-200'}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          task.priority === 'urgent' ? 'bg-rose-500/20 text-rose-400' :
                          task.priority === 'high' ? 'bg-amber-500/20 text-amber-400' :
                          task.priority === 'medium' ? 'bg-cyan-500/20 text-cyan-400' :
                          'bg-zinc-700 text-zinc-500'
                        }`}>
                          {task.priority}
                        </span>
                        {task.dueDate && (
                          <span className="text-xs text-zinc-500">
                            📅 {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                        {isAlreadyInProject && (
                          <span className="text-xs text-emerald-400">
                            ✓ Déjà assignée
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right: Current Project Tasks */}
        <div className="w-80 flex flex-col border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800 bg-zinc-800/30">
            <h4 className="text-sm font-semibold text-zinc-300">
              Tâches du projet ({currentProjectTasks.length})
            </h4>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {currentProjectTasks.length === 0 ? (
              <div className="text-center py-8 text-zinc-600">
                <p className="text-xs">Aucune tâche assignée</p>
              </div>
            ) : (
              currentProjectTasks.map(task => (
                <div
                  key={task.id}
                  className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-800 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-zinc-300 flex-1">
                      {task.title}
                    </p>
                    <button
                      onClick={() => handleUnassign(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                      title="Retirer du projet"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      task.priority === 'urgent' ? 'bg-rose-500/20 text-rose-400' :
                      task.priority === 'high' ? 'bg-amber-500/20 text-amber-400' :
                      task.priority === 'medium' ? 'bg-cyan-500/20 text-cyan-400' :
                      'bg-zinc-700 text-zinc-500'
                    }`}>
                      {task.priority}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs text-zinc-500">
                        {new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 mt-6 border-t border-zinc-800">
        <p className="text-sm text-zinc-500">
          {selectedTaskIds.length} tâche{selectedTaskIds.length > 1 ? 's' : ''} sélectionnée{selectedTaskIds.length > 1 ? 's' : ''}
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleAssign}
            disabled={selectedTaskIds.length === 0}
          >
            Assigner {selectedTaskIds.length > 0 && `(${selectedTaskIds.length})`}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
