import { useState } from 'react'
import { X } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { projectTemplates, getTemplateById } from '../../utils/projectUtils'
import { Project } from '../../types/project'

interface ProjectModalProps {
  onClose: () => void
  project?: Project | null
}

const defaultColors = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ef4444', // red
  '#6b7280', // gray
]

const defaultIcons = ['📁', '🚀', '💼', '🏠', '📚', '🎯', '💡', '🎨', '🔧', '🌟']

export function ProjectModal({ onClose, project }: ProjectModalProps) {
  const { addProject, updateProject, addTask } = useStore()
  
  const [step, setStep] = useState<'template' | 'details'>(project ? 'details' : 'template')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  
  const [name, setName] = useState(project?.name || '')
  const [description, setDescription] = useState(project?.description || '')
  const [color, setColor] = useState(project?.color || defaultColors[0])
  const [icon, setIcon] = useState(project?.icon || defaultIcons[0])
  const [deadline, setDeadline] = useState(project?.deadline || '')
  const [goal, setGoal] = useState(project?.goal || '')

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = getTemplateById(templateId)
    if (template) {
      setName(template.name)
      setColor(template.color)
      setIcon(template.icon)
    }
    setStep('details')
  }

  const handleSubmit = () => {
    if (!name.trim()) return

    const projectData = {
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      icon,
      status: 'active' as const,
      deadline: deadline || undefined,
      goal: goal.trim() || undefined
    }

    if (project) {
      // Update existing project
      updateProject(project.id, projectData)
    } else {
      // Create new project
      const newProjectId = `project-${Date.now()}`
      addProject({ id: newProjectId, ...projectData })
      
      // Add default tasks from template if selected
      if (selectedTemplate) {
        const template = getTemplateById(selectedTemplate)
        if (template && template.defaultTasks.length > 0) {
          setTimeout(() => {
            template.defaultTasks.forEach((task) => {
              addTask({
                title: task.title,
                completed: false,
                category: (task.category as any) || 'work',
                status: 'todo',
                priority: (task.priority as any) || 'medium',
                description: task.description,
                estimatedTime: task.estimatedMinutes,
                projectId: newProjectId
              })
            })
          }, 100)
        }
      }
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-mars-900 rounded-3xl shadow-2xl overflow-hidden animate-scale-in border border-mars-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-mars-800">
          <div>
            <h2 className="text-lg font-medium text-white">
              {project ? 'Modifier le projet' : 'Nouveau Projet'}
            </h2>
            <p className="text-xs text-mars-400 mt-1">
              {step === 'template' ? 'Choisissez un template ou partez de zéro' : 'Remplissez les détails du projet'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-mars-600 hover:text-mars-400 transition-colors rounded-xl hover:bg-mars-800/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {step === 'template' && !project && (
            <div className="grid grid-cols-2 gap-3">
              {projectTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className="p-4 text-left bg-mars-800/50 rounded-2xl hover:bg-mars-800 transition-all group border border-mars-700/50"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${template.color}20` }}
                    >
                      {template.icon}
                    </div>
                    <h3 className="text-sm font-medium text-white">{template.name}</h3>
                  </div>
                  <p className="text-xs text-mars-400">{template.description}</p>
                  {template.defaultTasks.length > 0 && (
                    <p className="text-xs text-mars-500 mt-2">{template.defaultTasks.length} tâches incluses</p>
                  )}
                </button>
              ))}
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-mars-400 mb-2">Nom du projet *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Lancement App newmars"
                  className="w-full bg-mars-800/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-mars-500 border border-mars-700/50"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-mars-400 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez votre projet..."
                  rows={3}
                  className="w-full bg-mars-800/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-mars-500 resize-none border border-mars-700/50"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-mars-400 mb-2">Couleur</label>
                <div className="flex gap-2">
                  {defaultColors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-10 h-10 rounded-xl transition-all ${color === c ? 'ring-2 ring-white scale-110' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-medium text-mars-400 mb-2">Icône</label>
                <div className="flex gap-2 flex-wrap">
                  {defaultIcons.map((i) => (
                    <button
                      key={i}
                      onClick={() => setIcon(i)}
                      className={`w-12 h-12 rounded-xl text-2xl transition-all ${icon === i ? 'bg-mars-800 ring-2 ring-white scale-110' : 'bg-mars-800/50 hover:bg-mars-800'}`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              {/* Goal */}
              <div>
                <label className="block text-sm font-medium text-mars-400 mb-2">Objectif</label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Ex: Atteindre 1000 utilisateurs"
                  className="w-full bg-mars-800/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-mars-500 border border-mars-700/50"
                />
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium text-mars-400 mb-2">Date limite</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-mars-800/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-mars-700/50"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-mars-800">
          {step === 'details' && !project && (
            <button
              onClick={() => setStep('template')}
              className="px-4 py-2 text-mars-500 hover:text-mars-300 transition-colors"
            >
              Retour
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-mars-500 hover:text-mars-300 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {project ? 'Mettre à jour' : 'Créer le projet'}
          </button>
        </div>
      </div>
    </div>
  )
}


