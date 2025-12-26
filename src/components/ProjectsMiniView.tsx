/**
 * 📁 ProjectsMiniView — Vue compacte des projets actifs
 * 
 * Affiche les projets en cours avec leur progression
 * À intégrer dans le Hub
 */

import { useMemo } from 'react'
import { useStore } from '../store/useStore'

const fontStack = 'font-[Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,SF_Pro_Display,Segoe_UI,Roboto,sans-serif]'

export function ProjectsMiniView() {
  const projects = useStore((state) => state.projects)
  const tasks = useStore((state) => state.tasks)
  const setView = useStore((state) => state.setView)
  
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  
  // Projets actifs avec leurs statistiques
  const activeProjects = useMemo(() => {
    return projects
      .filter(p => !p.archived)
      .map(project => {
        // Compter les tâches du projet
        const projectTasks = tasks.filter(t => t.projectId === project.id)
        const totalTasks = projectTasks.length
        const completedTasks = projectTasks.filter(t => t.completed).length
        const remainingTasks = totalTasks - completedTasks
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        
        // Tâches du jour liées au projet
        const todayProjectTasks = projectTasks.filter(t => 
          !t.completed && (
            t.dueDate === todayStr ||
            t.isPriority ||
            (t.createdAt && (Date.now() - t.createdAt) < 24 * 60 * 60 * 1000)
          )
        ).length
        
        // Déterminer la phase actuelle (pour projets avec phases)
        let currentPhase = 0
        let totalPhases = project.phaseCount || 0
        
        if (project.hasPhases && project.phaseCount) {
          // Trouver la phase actuelle en fonction des tâches
          const phases = Array.from({ length: project.phaseCount }, (_, i) => i)
          for (const phase of phases) {
            const phaseTasks = projectTasks.filter(t => t.phaseIndex === phase)
            const phaseCompleted = phaseTasks.every(t => t.completed)
            if (!phaseCompleted) {
              currentPhase = phase + 1 // +1 car on affiche "Phase 1" et non "Phase 0"
              break
            }
          }
          if (currentPhase === 0) currentPhase = project.phaseCount // Toutes les phases terminées
        }
        
        return {
          ...project,
          totalTasks,
          completedTasks,
          remainingTasks,
          progress,
          currentPhase,
          totalPhases,
          todayProjectTasks,
        }
      })
      .filter(p => p.totalTasks > 0) // Seulement les projets avec des tâches
      .sort((a, b) => b.remainingTasks - a.remainingTasks) // Tri par nombre de tâches restantes
      .slice(0, 2) // Top 2 projets actifs
  }, [projects, tasks, todayStr])
  
  if (activeProjects.length === 0) {
    return null // Pas de projets actifs
  }
  
  return (
    <div>
      <p className={`text-[16px] uppercase tracking-[0.1em] text-zinc-400 mb-3 ml-0.5 font-bold ${fontStack}`}>
        Projets ({activeProjects.length} actifs)
      </p>
      
      <div className="space-y-2">
        {activeProjects.map((project) => (
          <button
            key={project.id}
            onClick={() => setView('tasks')} // Va à la page Tasks (à améliorer avec filtre projet)
            className={`
              w-full px-3 py-2.5 
              bg-zinc-950/30 hover:bg-zinc-900/40
              border border-zinc-800/30 hover:border-zinc-700/50
              rounded-lg
              transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-zinc-500/50 focus:ring-offset-2 focus:ring-offset-black
              text-left
              ${fontStack}
            `}
            aria-label={`Projet ${project.name}, ${project.progress}% complété`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-[16px]">{project.icon}</span>
                <span className="text-[14px] text-zinc-300 font-medium truncate">
                  {project.name}
                </span>
              </div>
              <span className="text-[13px] text-zinc-500 font-medium tabular-nums ml-2">
                {project.progress}%
              </span>
            </div>
            
            {/* Barre de progression */}
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden mb-1.5">
              <div 
                className="h-full rounded-full transition-all duration-300"
                style={{ 
                  width: `${project.progress}%`,
                  backgroundColor: project.color 
                }}
                role="progressbar"
                aria-valuenow={project.progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            
            {/* Infos supplémentaires */}
            <div className="flex items-center gap-3 text-[11px] text-zinc-600">
              {project.hasPhases && project.totalPhases > 0 && (
                <span>
                  Phase {project.currentPhase}/{project.totalPhases}
                </span>
              )}
              <span>
                {project.remainingTasks} tâche{project.remainingTasks > 1 ? 's' : ''}
              </span>
              {project.todayProjectTasks > 0 && (
                <span className="text-emerald-500 font-medium">
                  • {project.todayProjectTasks} aujourd'hui
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

