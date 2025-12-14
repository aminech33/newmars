import { useState } from 'react'
import { X, Sparkles, Loader2, Calendar, CheckCircle2, Trash2, Edit2 } from 'lucide-react'
import { useStore } from '../../store/useStore'

interface GenerateProjectFromIdeaProps {
  isOpen: boolean
  onClose: () => void
}

interface ProjectPlan {
  projectName: string
  suggestedDeadline: string | null
  tasks: Array<{ title: string }>
}

export function GenerateProjectFromIdea({ isOpen, onClose }: GenerateProjectFromIdeaProps) {
  const { addProject, addTask } = useStore()
  const [idea, setIdea] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<ProjectPlan | null>(null)
  const [editableTasks, setEditableTasks] = useState<Array<{ title: string; isEditing: boolean }>>([])
  const [error, setError] = useState<string | null>(null)
  
  const handleGenerate = async () => {
    if (!idea.trim() || idea.trim().length < 5) {
      setError('Décris ton idée en au moins 5 caractères')
      return
    }
    
    setIsGenerating(true)
    setError(null)
    
    try {
      const response = await fetch('http://localhost:8000/api/tasks/generate-project-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: idea.trim() })
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors de la génération du plan')
      }
      
      const plan: ProjectPlan = await response.json()
      setGeneratedPlan(plan)
      setEditableTasks(plan.tasks.map(t => ({ title: t.title, isEditing: false })))
      
    } catch (err) {
      setError('Impossible de générer le plan. Vérifie que le backend est démarré.')
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }
  
  const handleRemoveTask = (index: number) => {
    setEditableTasks(prev => prev.filter((_, i) => i !== index))
  }
  
  const handleEditTask = (index: number, newTitle: string) => {
    setEditableTasks(prev => prev.map((task, i) => 
      i === index ? { ...task, title: newTitle } : task
    ))
  }
  
  const handleToggleEdit = (index: number) => {
    setEditableTasks(prev => prev.map((task, i) => 
      i === index ? { ...task, isEditing: !task.isEditing } : task
    ))
  }
  
  const handleCreateProject = () => {
    if (!generatedPlan || editableTasks.length === 0) return
    
    // Créer le projet
    const projectId = addProject({
      name: generatedPlan.projectName,
      color: '#3b82f6',
      icon: '✨'
    })
    
    // Créer toutes les tâches éditées
    editableTasks.forEach((task, index) => {
      if (task.title.trim()) {
        addTask({
          title: task.title.trim(),
          category: 'work',
          priority: index === 0 ? 'high' : 'medium',
          projectId,
          completed: false,
          status: 'todo',
          dueDate: generatedPlan.suggestedDeadline || undefined
        })
      }
    })
    
    // Réinitialiser et fermer
    setIdea('')
    setGeneratedPlan(null)
    setEditableTasks([])
    onClose()
  }
  
  const handleReset = () => {
    setGeneratedPlan(null)
    setEditableTasks([])
    setError(null)
    setIdea('')
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Planifier un projet
                </h2>
                <p className="text-sm text-zinc-500 mt-0.5">
                  L'IA génère un plan que tu peux modifier avant de créer
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {!generatedPlan ? (
            /* Étape 1 : Saisie de l'idée */
            <>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Décris ton idée
                </label>
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      handleGenerate()
                    }
                  }}
                  placeholder="Ex: Créer un podcast, Apprendre le piano, Organiser un voyage..."
                  rows={4}
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 resize-none"
                  autoFocus
                />
              </div>
              
              {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
                  {error}
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !idea.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl transition-colors font-medium"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Générer le plan
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Annuler
                </button>
              </div>
            </>
          ) : (
            /* Étape 2 : Modification et validation */
            <>
              <div className="space-y-4">
                {/* Nom du projet */}
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-2">
                    PROJET
                  </label>
                  <div className="px-4 py-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                    <p className="text-lg font-semibold text-white">
                      ✨ {generatedPlan.projectName}
                    </p>
                  </div>
                </div>
                
                {/* Deadline */}
                {generatedPlan.suggestedDeadline && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-2">
                      DEADLINE
                    </label>
                    <div className="flex items-center gap-2 px-4 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      <p className="text-sm text-cyan-300">
                        {new Date(generatedPlan.suggestedDeadline).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Tâches éditables */}
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-2">
                    TÂCHES ({editableTasks.length})
                  </label>
                  <p className="text-xs text-amber-400 mb-3">
                    ⚠️ Modifie ou supprime les tâches avant de créer le projet
                  </p>
                  <div className="space-y-2">
                    {editableTasks.map((task, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 px-3 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl hover:bg-zinc-800 transition-colors group"
                      >
                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-zinc-700 text-zinc-400 text-xs font-medium rounded-full mt-1">
                          {index + 1}
                        </div>
                        
                        {task.isEditing ? (
                          <input
                            type="text"
                            value={task.title}
                            onChange={(e) => handleEditTask(index, e.target.value)}
                            onBlur={() => handleToggleEdit(index)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleToggleEdit(index)
                            }}
                            autoFocus
                            className="flex-1 bg-zinc-900 px-2 py-1 text-sm text-zinc-200 rounded border border-indigo-500 focus:outline-none"
                          />
                        ) : (
                          <p className="flex-1 text-sm text-zinc-300">
                            {task.title}
                          </p>
                        )}
                        
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleToggleEdit(index)}
                            className="p-1 text-zinc-500 hover:text-indigo-400 transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveTask(index)}
                            className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleCreateProject}
                  disabled={editableTasks.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl transition-colors font-medium"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Créer le projet ({editableTasks.length} tâches)
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Recommencer
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

