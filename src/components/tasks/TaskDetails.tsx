import { X, CheckSquare, Plus, Trash2, Flag, MoveRight, Check, FolderKanban, Link as LinkIcon, Calendar } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Task, TaskPriority, useStore } from '../../store/useStore'
import { Collapsible } from '../ui/Collapsible'

interface TaskDetailsProps {
  task: Task
  onClose: () => void
}

const priorities: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Basse', color: 'text-zinc-500' },
  { value: 'medium', label: 'Moyenne', color: 'text-cyan-400' },
  { value: 'high', label: 'Haute', color: 'text-amber-400' },
  { value: 'urgent', label: 'Urgente', color: 'text-rose-400' }
]

export function TaskDetails({ task, onClose }: TaskDetailsProps) {
  const { updateTask, deleteTask, addSubtask, toggleSubtask, deleteSubtask, addEvent, events, projects } = useStore()
  const [newSubtask, setNewSubtask] = useState('')
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [description, setDescription] = useState(task.description || '')
  const [showSaved, setShowSaved] = useState(false)

  // Auto-save feedback
  useEffect(() => {
    if (showSaved) {
      const timer = setTimeout(() => setShowSaved(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [showSaved])

  const handleUpdate = (updates: Partial<Task>) => {
    updateTask(task.id, updates)
    setShowSaved(true)
  }

  const handleTitleDoubleClick = () => {
    setIsEditingTitle(true)
  }

  const handleTitleBlur = () => {
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditingTitle(false)
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false)
    }
  }
  
  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      addSubtask(task.id, newSubtask.trim())
      setNewSubtask('')
    }
  }
  
  const handleSaveDescription = () => {
    updateTask(task.id, { description })
    setIsEditingDescription(false)
  }
  
  const handleDelete = () => {
    if (confirm('Supprimer cette tâche ?')) {
      deleteTask(task.id)
      onClose()
    }
  }

  const handleBlockTime = () => {
    if (confirm('Bloquer du temps dans le calendrier pour cette tâche ?')) {
      const startDate = task.dueDate || new Date().toISOString().split('T')[0]
      const duration = task.estimatedTime || 60
      const startTime = '09:00' // Default start time
      const [hours, minutes] = startTime.split(':').map(Number)
      const endMinutes = hours * 60 + minutes + duration
      const endHours = Math.floor(endMinutes / 60)
      const endMins = endMinutes % 60
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`

      addEvent({
        title: `⏱️ ${task.title}`,
        description: task.description,
        startDate,
        startTime,
        endTime,
        type: 'custom',
        category: task.category === 'dev' || task.category === 'design' ? 'work' : task.category === 'personal' ? 'personal' : 'work',
        priority: task.priority,
        isRecurring: false,
        completed: false,
        linkedTaskId: task.id,
      })
    }
  }

  // Find linked event
  const linkedEvent = events.find(e => e.linkedTaskId === task.id)
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-2xl h-full bg-mars-surface shadow-[0_0_64px_rgba(0,0,0,0.5)] overflow-y-auto animate-slide-in-right"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="sticky top-0 z-10 backdrop-blur-xl bg-mars-surface/80 border-b border-zinc-800 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={task.title}
                  onChange={(e) => handleUpdate({ title: e.target.value })}
                  onBlur={handleTitleBlur}
                  onKeyDown={handleTitleKeyDown}
                  autoFocus
                  className="w-full text-xl font-semibold text-zinc-200 bg-zinc-900/50 px-3 py-2 rounded-xl border border-indigo-500/50 focus:outline-none focus:border-indigo-500"
                />
              ) : (
                <h1 
                  onDoubleClick={handleTitleDoubleClick}
                  className="w-full text-xl font-semibold text-zinc-200 cursor-pointer hover:text-zinc-100 transition-colors px-3 py-2"
                  title="Double-clic pour éditer"
                >
                  {task.title}
                </h1>
              )}
              <div className="flex items-center gap-3 mt-1 px-3">
                <p className="text-sm text-zinc-600">
                  Créée le {new Date(task.createdAt).toLocaleDateString('fr-FR')}
                </p>
                {/* Auto-save indicator */}
                {showSaved && (
                  <div className="flex items-center gap-1 text-xs text-emerald-400 animate-fade-in">
                    <Check className="w-3 h-3" />
                    <span>Sauvegardé</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-600 hover:text-zinc-400 transition-colors rounded-xl hover:bg-zinc-800/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Project */}
          <Collapsible title="Projet" icon={<FolderKanban className="w-4 h-4 text-zinc-500" />} defaultOpen={true}>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleUpdate({ projectId: undefined })}
                className={`px-3 py-1.5 rounded-xl text-xs transition-colors ${
                  !task.projectId
                    ? 'bg-zinc-700 text-zinc-300'
                    : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/50'
                }`}
              >
                Aucun
              </button>
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleUpdate({ projectId: project.id })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-colors ${
                    task.projectId === project.id
                      ? 'text-white'
                      : 'text-zinc-600 hover:text-zinc-400'
                  }`}
                  style={
                    task.projectId === project.id
                      ? { backgroundColor: `${project.color}30`, color: project.color }
                      : {}
                  }
                >
                  <span>{project.icon}</span>
                  <span>{project.name}</span>
                </button>
              ))}
            </div>
          </Collapsible>
          
          {/* Priority */}
          <Collapsible title="Priorité" icon={<Flag className="w-4 h-4 text-zinc-500" />} defaultOpen={true}>
            <div>
              <label className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                <Flag className="w-3.5 h-3.5" />
                Priorité
              </label>
              <select
                value={task.priority}
                onChange={(e) => handleUpdate({ priority: e.target.value as TaskPriority })}
                className="w-full px-3 py-2 bg-zinc-900/50 rounded-xl text-sm text-zinc-300 focus:outline-none focus:bg-zinc-900 transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {priorities.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </Collapsible>
          
          {/* Move to Column (Accessibility) */}
          <Collapsible title="Déplacer vers" icon={<MoveRight className="w-4 h-4 text-zinc-500" />} defaultOpen={false}>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleUpdate({ temporalColumn: 'today' })}
                disabled={task.temporalColumn === 'today'}
                className={`px-3 py-2 rounded-xl text-sm text-left transition-colors ${
                  task.temporalColumn === 'today'
                    ? 'bg-zinc-700 text-zinc-300 cursor-not-allowed'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
                aria-label="Déplacer vers Aujourd'hui"
              >
                Aujourd'hui
              </button>
              <button
                onClick={() => handleUpdate({ temporalColumn: 'inProgress' })}
                disabled={task.temporalColumn === 'inProgress'}
                className={`px-3 py-2 rounded-xl text-sm text-left transition-colors ${
                  task.temporalColumn === 'inProgress'
                    ? 'bg-zinc-700 text-zinc-300 cursor-not-allowed'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
                aria-label="Déplacer vers En cours"
              >
                En cours
              </button>
              <button
                onClick={() => handleUpdate({ temporalColumn: 'upcoming' })}
                disabled={task.temporalColumn === 'upcoming'}
                className={`px-3 py-2 rounded-xl text-sm text-left transition-colors ${
                  task.temporalColumn === 'upcoming'
                    ? 'bg-zinc-700 text-zinc-300 cursor-not-allowed'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
                aria-label="Déplacer vers À venir"
              >
                À venir
              </button>
              <button
                onClick={() => handleUpdate({ temporalColumn: 'distant' })}
                disabled={task.temporalColumn === 'distant'}
                className={`px-3 py-2 rounded-xl text-sm text-left transition-colors ${
                  task.temporalColumn === 'distant'
                    ? 'bg-zinc-700 text-zinc-300 cursor-not-allowed'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
                aria-label="Déplacer vers Lointain"
              >
                Lointain
              </button>
            </div>
          </Collapsible>
          
          {/* Description */}
          <Collapsible title="Description" defaultOpen={!!task.description}>
            {isEditingDescription ? (
              <div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ajouter une description..."
                  rows={4}
                  className="w-full px-3 py-2 bg-zinc-900/50 rounded-xl text-sm text-zinc-300 focus:outline-none focus:bg-zinc-900 transition-colors resize-none"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleSaveDescription}
                    className="px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-xl text-sm hover:bg-indigo-500/30 transition-colors"
                  >
                    Sauvegarder
                  </button>
                  <button
                    onClick={() => {
                      setDescription(task.description || '')
                      setIsEditingDescription(false)
                    }}
                    className="px-3 py-1.5 text-zinc-500 rounded-xl text-sm hover:bg-zinc-800/50 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingDescription(true)}
                className="px-3 py-2 bg-zinc-900/50 rounded-xl text-sm text-zinc-400 cursor-pointer hover:bg-zinc-900 transition-colors min-h-[100px]"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {task.description || 'Cliquer pour ajouter une description...'}
              </div>
            )}
          </Collapsible>
          
          {/* Subtasks */}
          <Collapsible 
            title={`Sous-tâches (${task.subtasks?.filter(st => st.completed).length || 0}/${task.subtasks?.length || 0})`}
            icon={<CheckSquare className="w-4 h-4 text-zinc-500" />}
            defaultOpen={true}
          >
            <div className="space-y-2 mb-3">
              {task.subtasks?.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-2 p-2 bg-zinc-900/30 rounded-xl group"
                >
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={() => toggleSubtask(task.id, subtask.id)}
                    className="w-4 h-4 rounded accent-indigo-500"
                  />
                  <span className={`flex-1 text-sm ${subtask.completed ? 'text-zinc-600 line-through' : 'text-zinc-300'}`}>
                    {subtask.title}
                  </span>
                  <button
                    onClick={() => deleteSubtask(task.id, subtask.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-700 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSubtask()
                }}
                placeholder="Nouvelle sous-tâche..."
                className="flex-1 px-3 py-2 bg-zinc-900/50 rounded-xl text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:bg-zinc-900 transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              />
              <button
                onClick={handleAddSubtask}
                className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl hover:bg-indigo-500/30 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </Collapsible>
            
          {/* Linked Event */}
          <Collapsible title="Événement lié" icon={<LinkIcon className="w-4 h-4 text-zinc-500" />} defaultOpen={false}>
            {linkedEvent ? (
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                <p className="text-sm text-cyan-300">📅 {linkedEvent.title}</p>
                <p className="text-xs text-zinc-600 mt-1">
                  {linkedEvent.startDate} {linkedEvent.startTime && `à ${linkedEvent.startTime}`}
                </p>
              </div>
            ) : (
              <button
                onClick={handleBlockTime}
                className="w-full p-3 bg-zinc-900/50 border border-zinc-800 hover:border-cyan-600 rounded-xl text-sm text-zinc-400 hover:text-cyan-400 transition-colors flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Bloquer du temps dans le calendrier
              </button>
            )}
          </Collapsible>
          
          {/* Delete Button */}
          <div className="pt-4 border-t border-zinc-800">
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500/20 transition-colors text-sm font-medium"
            >
              Supprimer la tâche
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
