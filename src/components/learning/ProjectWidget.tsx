import { useState } from 'react'
import { ChevronRight, ChevronDown, CheckCircle2, Circle, ExternalLink } from 'lucide-react'
import { Course } from '../../types/learning'
import { useStore } from '../../store/useStore'

interface ProjectWidgetProps {
  course: Course
}

export function ProjectWidget({ course }: ProjectWidgetProps) {
  const { projects, tasks, toggleTask, updateLearningCourse, setView } = useStore()
  const [expanded, setExpanded] = useState(false)
  
  const project = projects.find(p => p.id === course.linkedProjectId)
  
  if (!project) return null

  const projectTasks = tasks.filter(t => t.projectId === project.id)
  const completedTasks = projectTasks.filter(t => t.completed).length
  const totalTasks = projectTasks.length

  const completedConcepts = course.topics?.filter(t => t.status === 'completed').length || 0
  const totalConcepts = course.topics?.length || 0

  const toggleConceptStatus = (topicId: string) => {
    if (!course.topics) return
    
    const updatedTopics = course.topics.map(topic => {
      if (topic.id === topicId) {
        const newStatus = topic.status === 'completed' ? 'pending' : 'completed'
        return {
          ...topic,
          status: newStatus as 'pending' | 'in_progress' | 'completed',
          completedAt: newStatus === 'completed' ? Date.now() : undefined
        }
      }
      return topic
    })
    
    const newProgress = Math.round((updatedTopics.filter(t => t.status === 'completed').length / updatedTopics.length) * 100)
    
    updateLearningCourse(course.id, {
      topics: updatedTopics,
      progress: newProgress,
      updatedAt: Date.now()
    })
  }

  const navigateToProject = () => {
    setView('tasks')
    // NOTE: La navigation vers le projet spécifique se fait via le store (selectedProjectId)
  }

  // Masquer le widget si aucune activité (concepts et tâches à zéro)
  const hasActivity = (totalConcepts > 0 && completedConcepts > 0) || (totalTasks > 0 && completedTasks > 0)
  
  // Si pas d'activité, ne rien afficher
  if (!hasActivity && !expanded) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      {/* Bouton compact */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="group bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 hover:border-zinc-700/50 rounded-2xl p-4 shadow-2xl transition-[border-color,transform] duration-200 hover:scale-105"
          style={{ minWidth: '140px' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">{project.icon}</span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-medium text-zinc-300 truncate max-w-[100px]">
                {project.name}
              </p>
              <div className="flex gap-2 text-[10px] text-zinc-600 mt-0.5">
                {totalConcepts > 0 && completedConcepts > 0 && (
                  <span>🎯 {completedConcepts}/{totalConcepts}</span>
                )}
                {totalTasks > 0 && completedTasks > 0 && (
                  <span>✅ {completedTasks}/{totalTasks}</span>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </div>
        </button>
      )}

      {/* Panel expandé */}
      {expanded && (
        <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl shadow-2xl overflow-hidden animate-scale-in" style={{ width: '340px', maxHeight: '600px' }}>
          {/* Header */}
          <div className="p-4 border-b border-zinc-800/50 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">{project.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">{project.name}</p>
                  <p className="text-xs text-zinc-600">Projet lié</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={navigateToProject}
                  className="p-2 hover:bg-zinc-800/50 rounded-lg transition-[background-color] duration-200"
                  title="Voir le projet"
                >
                  <ExternalLink className="w-4 h-4 text-zinc-500" aria-hidden="true" />
                </button>
                <button
                  onClick={() => setExpanded(false)}
                  className="p-2 hover:bg-zinc-800/50 rounded-lg transition-[background-color] duration-200"
                >
                  <ChevronDown className="w-4 h-4 text-zinc-500" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
            {/* Section Concepts */}
            <div className="p-4 border-b border-zinc-800/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                  🎯 Concepts
                  <span className="text-xs text-zinc-600">
                    {completedConcepts}/{totalConcepts}
                  </span>
                </h3>
              </div>

              {/* Progress bar */}
              {totalConcepts > 0 && (
                <div 
                  className="w-full h-1.5 bg-zinc-800 rounded-full mb-4"
                  role="progressbar"
                  aria-valuenow={completedConcepts}
                  aria-valuemin={0}
                  aria-valuemax={totalConcepts}
                  aria-label="Progression des concepts"
                >
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-[width] duration-500"
                    style={{ width: `${(completedConcepts / totalConcepts) * 100}%` }}
                  />
                </div>
              )}

              {/* Liste concepts */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {course.topics && course.topics.length > 0 ? (
                  course.topics.map(topic => (
                    <label 
                      key={topic.id}
                      className="flex items-center gap-3 p-2 hover:bg-zinc-800/30 rounded-lg cursor-pointer group transition-[background-color] duration-200"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          toggleConceptStatus(topic.id)
                        }}
                        className="flex-shrink-0"
                      >
                        {topic.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                        ) : (
                          <Circle className="w-4 h-4 text-zinc-600 group-hover:text-zinc-500" aria-hidden="true" />
                        )}
                      </button>
                      <span className={`text-sm flex-1 ${
                        topic.status === 'completed' 
                          ? 'line-through text-zinc-600' 
                          : 'text-zinc-300'
                      }`}>
                        {topic.name}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-xs text-zinc-600 text-center py-4">
                    Aucun concept défini
                  </p>
                )}
              </div>
            </div>

            {/* Section Tâches */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                  ✅ Tâches
                  <span className="text-xs text-zinc-600">
                    {completedTasks}/{totalTasks}
                  </span>
                </h3>
              </div>

              {/* Liste tâches */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {projectTasks.length > 0 ? (
                  projectTasks.map(task => (
                    <label 
                      key={task.id}
                      className="flex items-center gap-3 p-2 hover:bg-zinc-800/30 rounded-lg cursor-pointer group transition-[background-color] duration-200"
                    >
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        className="w-4 h-4 rounded border-zinc-700 text-zinc-400 focus:ring-zinc-600 focus:ring-offset-0 accent-zinc-500"
                      />
                      <span className={`text-sm flex-1 ${
                        task.completed 
                          ? 'line-through text-zinc-600' 
                          : 'text-zinc-300'
                      }`}>
                        {task.title}
                      </span>
                      {task.priority === 'urgent' && !task.completed && (
                        <span className="text-xs text-rose-400">!</span>
                      )}
                    </label>
                  ))
                ) : (
                  <p className="text-xs text-zinc-600 text-center py-4">
                    Aucune tâche dans ce projet
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


