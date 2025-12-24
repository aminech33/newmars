import { useState, useMemo } from 'react'
import { ArrowLeft, TrendingUp, CheckCircle2, Circle, Clock, Target } from 'lucide-react'
import { useStore, Project, Task } from '../../store/useStore'

interface ProjectDetailsPageProps {
  project: Project
  onBack: () => void
}

const fontStack = 'font-[Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,SF_Pro_Display,Segoe_UI,Roboto,sans-serif]'

export function ProjectDetailsPage({ project, onBack }: ProjectDetailsPageProps) {
  const { tasks } = useStore()
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null)

  // Filtrer les tâches du projet
  const projectTasks = useMemo(() => 
    tasks.filter(t => t.projectId === project.id),
    [tasks, project.id]
  )

  // Stats globales
  const stats = useMemo(() => {
    const total = projectTasks.length
    const completed = projectTasks.filter(t => t.completed).length
    const inProgress = projectTasks.filter(t => t.status === 'in-progress').length
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0
    
    return { total, completed, inProgress, progress }
  }, [projectTasks])

  // Grouper par phases (si projet IA)
  const phases = useMemo(() => {
    if (!project.hasPhases) return null

    const maxPhase = Math.max(...projectTasks.map(t => t.phaseIndex ?? 0))
    const phaseGroups: Array<{
      index: number
      name: string
      tasks: Task[]
      completed: number
      total: number
      progress: number
      hasValidation: boolean
    }> = []

    for (let i = 0; i <= maxPhase; i++) {
      const phaseTasks = projectTasks.filter(t => t.phaseIndex === i)
      if (phaseTasks.length === 0) continue

      const completed = phaseTasks.filter(t => t.completed).length
      const total = phaseTasks.length
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0
      const hasValidation = phaseTasks.some(t => t.isValidation)

      phaseGroups.push({
        index: i,
        name: `Phase ${i + 1}`,
        tasks: phaseTasks,
        completed,
        total,
        progress,
        hasValidation
      })
    }

    return phaseGroups
  }, [projectTasks, project.hasPhases])

  return (
    <div className="min-h-screen w-full bg-zinc-950 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="mb-4 flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className={`text-sm ${fontStack}`}>Retour aux projets</span>
          </button>

          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
              style={{ backgroundColor: `${project.color}20`, border: `2px solid ${project.color}40` }}
            >
              {project.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className={`text-3xl font-bold text-zinc-100 mb-2 ${fontStack}`}>
                {project.name}
              </h1>
              <div className="flex items-center gap-4 text-sm">
                <span className={`text-zinc-500 ${fontStack}`}>
                  {stats.total} tâches · {stats.completed} complétées
                </span>
                {project.hasPhases && (
                  <span className={`px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded text-xs ${fontStack}`}>
                    Projet structuré IA
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <span className={`text-sm text-zinc-400 ${fontStack}`}>Progression globale</span>
            <span className={`text-2xl font-bold text-zinc-100 ${fontStack}`}>{stats.progress}%</span>
          </div>
          <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${stats.progress}%`,
                backgroundColor: project.color
              }}
            />
          </div>
          <div className="flex items-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className={`text-zinc-400 ${fontStack}`}>
                {stats.completed} complétées
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className={`text-zinc-400 ${fontStack}`}>
                {stats.inProgress} en cours
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="w-4 h-4 text-zinc-600" />
              <span className={`text-zinc-400 ${fontStack}`}>
                {stats.total - stats.completed - stats.inProgress} à faire
              </span>
            </div>
          </div>
        </div>

        {/* Phases View (si projet IA) */}
        {phases ? (
          <div className="space-y-4">
            <h2 className={`text-xl font-semibold text-zinc-100 mb-4 ${fontStack}`}>
              Phases du projet
            </h2>
            {phases.map((phase) => (
              <div
                key={phase.index}
                className="bg-zinc-900/30 rounded-xl border border-zinc-800 overflow-hidden"
              >
                {/* Phase Header */}
                <button
                  onClick={() => setSelectedPhase(selectedPhase === phase.index ? null : phase.index)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: `${project.color}20`, color: project.color }}
                    >
                      {phase.index + 1}
                    </div>
                    <div className="text-left">
                      <h3 className={`text-lg font-medium text-zinc-100 ${fontStack}`}>
                        {phase.name}
                      </h3>
                      <p className={`text-sm text-zinc-500 ${fontStack}`}>
                        {phase.completed}/{phase.total} tâches complétées
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {phase.hasValidation && (
                      <span className={`px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded ${fontStack}`}>
                        VALIDATION
                      </span>
                    )}
                    <div className="text-right">
                      <span className={`text-2xl font-bold ${fontStack}`} style={{ color: project.color }}>
                        {phase.progress}%
                      </span>
                    </div>
                  </div>
                </button>

                {/* Phase Progress */}
                <div className="px-6 pb-3">
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${phase.progress}%`,
                        backgroundColor: project.color
                      }}
                    />
                  </div>
                </div>

                {/* Phase Tasks (expandable) */}
                {selectedPhase === phase.index && (
                  <div className="px-6 pb-4 space-y-2">
                    {phase.tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                          task.completed
                            ? 'bg-zinc-800/30 opacity-60'
                            : task.isValidation
                            ? 'bg-emerald-500/10 border border-emerald-500/30'
                            : 'bg-zinc-800/50'
                        }`}
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-zinc-600 flex-shrink-0" />
                        )}
                        <span className={`flex-1 text-sm ${task.completed ? 'line-through text-zinc-500' : 'text-zinc-300'} ${fontStack}`}>
                          {task.title}
                        </span>
                        {task.effort && (
                          <span className={`px-2 py-0.5 text-xs rounded ${
                            task.effort === 'XS' ? 'bg-emerald-500/20 text-emerald-400' :
                            task.effort === 'S' ? 'bg-blue-500/20 text-blue-400' :
                            task.effort === 'M' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-rose-500/20 text-rose-400'
                          } ${fontStack}`}>
                            {task.effort}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Liste simple (projet sans phases) */
          <div className="space-y-4">
            <h2 className={`text-xl font-semibold text-zinc-100 mb-4 ${fontStack}`}>
              Tâches du projet
            </h2>
            <div className="space-y-2">
              {projectTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                    task.completed ? 'bg-zinc-800/30 opacity-60' : 'bg-zinc-800/50'
                  }`}
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-zinc-600 flex-shrink-0" />
                  )}
                  <span className={`flex-1 text-sm ${task.completed ? 'line-through text-zinc-500' : 'text-zinc-300'} ${fontStack}`}>
                    {task.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

