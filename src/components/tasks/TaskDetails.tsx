import { X, Calendar, Clock, Tag, CheckSquare, Plus, Trash2, Flag, Link as LinkIcon, FolderKanban } from 'lucide-react'
import { useState } from 'react'
import { Task, TaskPriority, TaskCategory, useStore } from '../../store/useStore'

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

const categories: { value: TaskCategory; label: string; color: string }[] = [
  { value: 'dev', label: 'Dev', color: 'text-indigo-400' },
  { value: 'design', label: 'Design', color: 'text-cyan-400' },
  { value: 'work', label: 'Travail', color: 'text-amber-400' },
  { value: 'personal', label: 'Perso', color: 'text-emerald-400' },
  { value: 'urgent', label: 'Urgent', color: 'text-rose-400' }
]

export function TaskDetails({ task, onClose }: TaskDetailsProps) {
  const { updateTask, deleteTask, addSubtask, toggleSubtask, deleteSubtask, addEvent, events, projects } = useStore()
  const [newSubtask, setNewSubtask] = useState('')
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [description, setDescription] = useState(task.description || '')
  
  const activeProjects = projects.filter(p => p.status === 'active')
  const taskProject = projects.find(p => p.id === task.projectId)
  
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
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-2xl h-full bg-mars-surface shadow-[0_0_64px_rgba(0,0,0,0.5)] overflow-y-auto animate-slide-in-right"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="sticky top-0 z-10 backdrop-blur-xl bg-mars-surface/80 border-b border-zinc-800 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <input
                type="text"
                value={task.title}
                onChange={(e) => updateTask(task.id, { title: e.target.value })}
                className="w-full text-xl font-semibold text-zinc-200 bg-transparent border-none focus:outline-none"
              />
              <p className="text-sm text-zinc-600 mt-1">
                Créée le {new Date(task.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-600 hover:text-zinc-400 transition-all rounded-xl hover:bg-zinc-800/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Priority & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                <Flag className="w-3.5 h-3.5" />
                Priorité
              </label>
              <select
                value={task.priority}
                onChange={(e) => updateTask(task.id, { priority: e.target.value as TaskPriority })}
                className="w-full px-3 py-2 bg-zinc-900/50 rounded-xl text-sm text-zinc-300 focus:outline-none focus:bg-zinc-900 transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {priorities.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                <Tag className="w-3.5 h-3.5" />
                Catégorie
              </label>
              <select
                value={task.category}
                onChange={(e) => updateTask(task.id, { category: e.target.value as TaskCategory })}
                className="w-full px-3 py-2 bg-zinc-900/50 rounded-xl text-sm text-zinc-300 focus:outline-none focus:bg-zinc-900 transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {categories.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Project */}
          {activeProjects.length > 0 && (
            <div>
              <label className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                <FolderKanban className="w-3.5 h-3.5" />
                Projet
              </label>
              <select
                value={task.projectId || ''}
                onChange={(e) => updateTask(task.id, { projectId: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-zinc-900/50 rounded-xl text-sm text-zinc-300 focus:outline-none focus:bg-zinc-900 transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <option value="">Aucun projet</option>
                {activeProjects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.icon || '📁'} {p.name}
                  </option>
                ))}
              </select>
              {taskProject && (
                <div className="mt-2 p-2 bg-zinc-900/30 rounded-lg">
                  <div className="flex items-center gap-2 text-xs">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: taskProject.color }}
                    />
                    <span className="text-zinc-400">{taskProject.name}</span>
                    {taskProject.deadline && (
                      <span className="text-zinc-600">
                        · Deadline: {new Date(taskProject.deadline).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Due Date & Estimated Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                <Calendar className="w-3.5 h-3.5" />
                Date d'échéance
              </label>
              <input
                type="date"
                value={task.dueDate || ''}
                onChange={(e) => updateTask(task.id, { dueDate: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900/50 rounded-xl text-sm text-zinc-300 focus:outline-none focus:bg-zinc-900 transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                <Clock className="w-3.5 h-3.5" />
                Temps estimé (min)
              </label>
              <input
                type="number"
                value={task.estimatedTime || ''}
                onChange={(e) => updateTask(task.id, { estimatedTime: parseInt(e.target.value) || undefined })}
                placeholder="30"
                className="w-full px-3 py-2 bg-zinc-900/50 rounded-xl text-sm text-zinc-300 focus:outline-none focus:bg-zinc-900 transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>
          </div>
          
          {/* Description */}
          <div>
            <label className="text-xs text-zinc-500 mb-2 block">Description</label>
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
          </div>
          
          {/* Subtasks */}
          <div>
            <label className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
              <CheckSquare className="w-3.5 h-3.5" />
              Sous-tâches ({task.subtasks?.filter(st => st.completed).length || 0}/{task.subtasks?.length || 0})
            </label>
            
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
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-700 hover:text-rose-400 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            
            {/* Linked Event */}
            <div className="mt-4 pt-4 border-t border-zinc-900/50">
              <label className="block text-xs text-zinc-500 mb-2 flex items-center gap-1">
                <LinkIcon className="w-3 h-3" /> Événement lié
              </label>
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
                  className="w-full p-3 bg-zinc-900/50 border border-zinc-800 hover:border-cyan-600 rounded-xl text-sm text-zinc-400 hover:text-cyan-400 transition-all flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Bloquer du temps dans le calendrier
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                placeholder="Ajouter une sous-tâche..."
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
          </div>
          
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


import { Task, TaskPriority, TaskCategory, useStore } from '../../store/useStore'

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

const categories: { value: TaskCategory; label: string; color: string }[] = [
  { value: 'dev', label: 'Dev', color: 'text-indigo-400' },
  { value: 'design', label: 'Design', color: 'text-cyan-400' },
  { value: 'work', label: 'Travail', color: 'text-amber-400' },
  { value: 'personal', label: 'Perso', color: 'text-emerald-400' },
  { value: 'urgent', label: 'Urgent', color: 'text-rose-400' }
]

export function TaskDetails({ task, onClose }: TaskDetailsProps) {
  const { updateTask, deleteTask, addSubtask, toggleSubtask, deleteSubtask, addEvent, events, projects } = useStore()
  const [newSubtask, setNewSubtask] = useState('')
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [description, setDescription] = useState(task.description || '')
  
  const activeProjects = projects.filter(p => p.status === 'active')
  const taskProject = projects.find(p => p.id === task.projectId)
  
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
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-2xl h-full bg-mars-surface shadow-[0_0_64px_rgba(0,0,0,0.5)] overflow-y-auto animate-slide-in-right"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="sticky top-0 z-10 backdrop-blur-xl bg-mars-surface/80 border-b border-zinc-800 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <input
                type="text"
                value={task.title}
                onChange={(e) => updateTask(task.id, { title: e.target.value })}
                className="w-full text-xl font-semibold text-zinc-200 bg-transparent border-none focus:outline-none"
              />
              <p className="text-sm text-zinc-600 mt-1">
                Créée le {new Date(task.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-600 hover:text-zinc-400 transition-all rounded-xl hover:bg-zinc-800/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Priority & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                <Flag className="w-3.5 h-3.5" />
                Priorité
              </label>
              <select
                value={task.priority}
                onChange={(e) => updateTask(task.id, { priority: e.target.value as TaskPriority })}
                className="w-full px-3 py-2 bg-zinc-900/50 rounded-xl text-sm text-zinc-300 focus:outline-none focus:bg-zinc-900 transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {priorities.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                <Tag className="w-3.5 h-3.5" />
                Catégorie
              </label>
              <select
                value={task.category}
                onChange={(e) => updateTask(task.id, { category: e.target.value as TaskCategory })}
                className="w-full px-3 py-2 bg-zinc-900/50 rounded-xl text-sm text-zinc-300 focus:outline-none focus:bg-zinc-900 transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {categories.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Project */}
          {activeProjects.length > 0 && (
            <div>
              <label className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                <FolderKanban className="w-3.5 h-3.5" />
                Projet
              </label>
              <select
                value={task.projectId || ''}
                onChange={(e) => updateTask(task.id, { projectId: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-zinc-900/50 rounded-xl text-sm text-zinc-300 focus:outline-none focus:bg-zinc-900 transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <option value="">Aucun projet</option>
                {activeProjects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.icon || '📁'} {p.name}
                  </option>
                ))}
              </select>
              {taskProject && (
                <div className="mt-2 p-2 bg-zinc-900/30 rounded-lg">
                  <div className="flex items-center gap-2 text-xs">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: taskProject.color }}
                    />
                    <span className="text-zinc-400">{taskProject.name}</span>
                    {taskProject.deadline && (
                      <span className="text-zinc-600">
                        · Deadline: {new Date(taskProject.deadline).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Due Date & Estimated Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                <Calendar className="w-3.5 h-3.5" />
                Date d'échéance
              </label>
              <input
                type="date"
                value={task.dueDate || ''}
                onChange={(e) => updateTask(task.id, { dueDate: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900/50 rounded-xl text-sm text-zinc-300 focus:outline-none focus:bg-zinc-900 transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                <Clock className="w-3.5 h-3.5" />
                Temps estimé (min)
              </label>
              <input
                type="number"
                value={task.estimatedTime || ''}
                onChange={(e) => updateTask(task.id, { estimatedTime: parseInt(e.target.value) || undefined })}
                placeholder="30"
                className="w-full px-3 py-2 bg-zinc-900/50 rounded-xl text-sm text-zinc-300 focus:outline-none focus:bg-zinc-900 transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>
          </div>
          
          {/* Description */}
          <div>
            <label className="text-xs text-zinc-500 mb-2 block">Description</label>
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
          </div>
          
          {/* Subtasks */}
          <div>
            <label className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
              <CheckSquare className="w-3.5 h-3.5" />
              Sous-tâches ({task.subtasks?.filter(st => st.completed).length || 0}/{task.subtasks?.length || 0})
            </label>
            
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
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-700 hover:text-rose-400 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            
            {/* Linked Event */}
            <div className="mt-4 pt-4 border-t border-zinc-900/50">
              <label className="block text-xs text-zinc-500 mb-2 flex items-center gap-1">
                <LinkIcon className="w-3 h-3" /> Événement lié
              </label>
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
                  className="w-full p-3 bg-zinc-900/50 border border-zinc-800 hover:border-cyan-600 rounded-xl text-sm text-zinc-400 hover:text-cyan-400 transition-all flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Bloquer du temps dans le calendrier
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                placeholder="Ajouter une sous-tâche..."
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
          </div>
          
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

