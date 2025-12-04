import { useState } from 'react'
import { X, Plus, Trash2, Calendar, Clock } from 'lucide-react'
import { PROJECT_COLORS, PROJECT_ICONS, TaskCategory, TaskPriority } from '../../store/useStore'

interface TaskTemplate {
  id: string
  title: string
  dueDate?: string
  estimatedTime?: number
  priority: TaskPriority
  category: TaskCategory
}

interface CreateProjectWithTasksModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (projectData: {
    name: string
    color: string
    icon: string
    tasks: Omit<TaskTemplate, 'id'>[]
  }) => void
}

export function CreateProjectWithTasksModal({ isOpen, onClose, onCreate }: CreateProjectWithTasksModalProps) {
  const [projectName, setProjectName] = useState('')
  const [projectColor, setProjectColor] = useState(PROJECT_COLORS[0])
  const [projectIcon, setProjectIcon] = useState(PROJECT_ICONS[0])
  const [tasks, setTasks] = useState<TaskTemplate[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')

  if (!isOpen) return null

  const addTask = () => {
    if (!newTaskTitle.trim()) return
    
    const newTask: TaskTemplate = {
      id: Math.random().toString(36).substring(2, 9),
      title: newTaskTitle,
      priority: 'medium',
      category: 'work'
    }
    
    setTasks([...tasks, newTask])
    setNewTaskTitle('')
  }

  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id))
  }

  const updateTask = (id: string, updates: Partial<TaskTemplate>) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectName.trim()) return

    onCreate({
      name: projectName,
      color: projectColor,
      icon: projectIcon,
      tasks: tasks.map(({ id, ...task }) => task)
    })

    // Reset form
    setProjectName('')
    setProjectColor(PROJECT_COLORS[0])
    setProjectIcon(PROJECT_ICONS[0])
    setTasks([])
    setNewTaskTitle('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 my-8 animate-scale-in shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-zinc-900 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl">
              <span className="text-2xl">{projectIcon}</span>
            </div>
            <h3 className="text-xl font-semibold text-zinc-200">
              Créer un projet avec tâches
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Informations du projet</h4>
            
            {/* Project Name */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Nom du projet
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Ex: Application mobile, Site web..."
                className="w-full bg-zinc-800 text-zinc-200 placeholder:text-zinc-600 px-4 py-3 rounded-lg border border-zinc-700 focus:outline-none focus:border-indigo-500 transition-colors"
                autoFocus
              />
            </div>

            {/* Color & Icon */}
            <div className="grid grid-cols-2 gap-4">
              {/* Color Picker */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-3">
                  Couleur
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PROJECT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setProjectColor(color)}
                      className={`w-8 h-8 rounded-lg transition-all ${
                        projectColor === color 
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110' 
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-3">
                  Icône
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {PROJECT_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setProjectIcon(icon)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                        projectIcon === icon 
                          ? 'bg-indigo-500/20 ring-2 ring-indigo-500 scale-110' 
                          : 'bg-zinc-800 hover:bg-zinc-700'
                      }`}
                      title={icon}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Tâches du projet</h4>
            
            {/* Add Task */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTask())}
                placeholder="Ajouter une tâche..."
                className="flex-1 bg-zinc-800 text-zinc-200 placeholder:text-zinc-600 px-4 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="button"
                onClick={addTask}
                className="px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>

            {/* Task List */}
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-zinc-600">
                <p className="text-sm">Aucune tâche ajoutée</p>
                <p className="text-xs mt-1">Ajoutez des tâches avec leurs deadlines individuelles</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 space-y-3"
                  >
                    {/* Task Title */}
                    <div className="flex items-start justify-between gap-2">
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => updateTask(task.id, { title: e.target.value })}
                        className="flex-1 bg-transparent text-zinc-200 font-medium focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeTask(task.id)}
                        className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Task Details */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Due Date */}
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Deadline
                        </label>
                        <input
                          type="date"
                          value={task.dueDate || ''}
                          onChange={(e) => updateTask(task.id, { dueDate: e.target.value })}
                          className="w-full bg-zinc-900 text-zinc-300 text-sm px-3 py-1.5 rounded border border-zinc-700 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      {/* Estimated Time */}
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Durée estimée (min)
                        </label>
                        <input
                          type="number"
                          value={task.estimatedTime || ''}
                          onChange={(e) => updateTask(task.id, { estimatedTime: parseInt(e.target.value) || undefined })}
                          placeholder="30"
                          className="w-full bg-zinc-900 text-zinc-300 text-sm px-3 py-1.5 rounded border border-zinc-700 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Priority & Category */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Priority */}
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Priorité</label>
                        <select
                          value={task.priority}
                          onChange={(e) => updateTask(task.id, { priority: e.target.value as TaskPriority })}
                          className="w-full bg-zinc-900 text-zinc-300 text-sm px-3 py-1.5 rounded border border-zinc-700 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="low">Basse</option>
                          <option value="medium">Moyenne</option>
                          <option value="high">Haute</option>
                          <option value="urgent">Urgente</option>
                        </select>
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Catégorie</label>
                        <select
                          value={task.category}
                          onChange={(e) => updateTask(task.id, { category: e.target.value as TaskCategory })}
                          className="w-full bg-zinc-900 text-zinc-300 text-sm px-3 py-1.5 rounded border border-zinc-700 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="dev">Dev</option>
                          <option value="design">Design</option>
                          <option value="work">Travail</option>
                          <option value="personal">Perso</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-zinc-800">
            <p className="text-sm text-zinc-500">
              {tasks.length} tâche{tasks.length > 1 ? 's' : ''} ajoutée{tasks.length > 1 ? 's' : ''}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!projectName.trim()}
                className="flex items-center gap-2 px-6 py-2 text-sm bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Créer le projet
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

