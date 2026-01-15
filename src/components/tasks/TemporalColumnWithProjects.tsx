/**
 * 📋 TemporalColumnWithProjects - Colonne temporelle avec sections par projet
 * 
 * Groupe les tâches par projet avec sections repliables
 */

import { Droppable } from '@hello-pangea/dnd'
import { Task, Project, TemporalColumn } from '../../store/useStore'
import { ProjectTasksSection } from './ProjectTasksSection'
import { PlanningInput } from './PlanningInput'
import { SkillsSelection } from './SkillsSelection'
import { PlanningZone } from './PlanningZone'
import { fontStack, ColumnConfig, getCurrentPhase } from './taskUtils'

interface TemporalColumnWithProjectsProps {
  config: ColumnConfig
  tasksByProject: Array<{ project: Project | null, tasks: Task[] }>
  allTasks: Task[]
  onTaskClick: (task: Task) => void
  onTaskToggle: (id: string) => void
  onFocus?: (task: Task) => void
  planningStep?: 'none' | 'define' | 'analyzing' | 'skills' | 'plan'
  planningContext?: { domain: string; selectedSkills: string[]; domainMap?: any } | null
  onClosePlanning?: () => void
  onBackPlanning?: () => void
  onStartAnalysis?: (domain: string) => Promise<void>
  onSelectSkills?: (skills: string[]) => void
}

export function TemporalColumnWithProjects({
  config,
  tasksByProject,
  allTasks,
  onTaskClick,
  onTaskToggle,
  onFocus,
  planningStep = 'none',
  planningContext,
  onClosePlanning,
  onBackPlanning,
  onStartAnalysis,
  onSelectSkills
}: TemporalColumnWithProjectsProps) {
  
  const column = config.id
  const isToday = column === 'today'
  const isDistant = column === 'distant'
  
  // Compter les tâches totales (non complétées)
  const totalTasks = tasksByProject.reduce((sum, { tasks }) => 
    sum + tasks.filter(t => !t.completed).length, 0
  )
  
  // Calcul des phases bloquées pour la colonne Lointain
  const currentPhase = getCurrentPhase(allTasks)
  const blockedTasks = isDistant ? allTasks.filter(t => 
    t.phaseIndex !== undefined && 
    t.phaseIndex > currentPhase && 
    !t.completed
  ) : []
  const hasBlockedPhases = blockedTasks.length > 0
  const nextPhaseToUnlock = hasBlockedPhases ? currentPhase + 1 : null
  const validationTasksRemaining = allTasks.filter(t => 
    t.phaseIndex === currentPhase && 
    t.isValidation && 
    !t.completed
  ).length
  
  // Configuration visuelle par colonne
  const columnStyles = {
    today: {
      bg: 'bg-zinc-900/60',
      header: 'text-zinc-50',
      count: 'bg-zinc-700/70 text-zinc-200',
      empty: 'text-zinc-600',
    },
    upcoming: {
      bg: 'bg-zinc-950/40',
      header: 'text-zinc-500',
      count: 'text-zinc-600',
      empty: 'text-zinc-700',
    },
    distant: {
      bg: 'bg-zinc-950/60',
      header: 'text-zinc-600',
      count: 'text-zinc-700',
      empty: 'text-zinc-800',
    },
  }
  
  const styles = columnStyles[column]
  
  return (
    <div className={`flex-1 min-w-0 flex flex-col ${
      isDistant && (planningStep === 'define' || planningStep === 'analyzing' || planningStep === 'skills' || planningStep === 'plan')
        ? 'bg-indigo-950/40 border-2 border-indigo-500/30'
        : styles.bg
    } rounded-2xl transition-all duration-300`}>
      {/* En-tête de colonne */}
      <div className="px-4 py-4 border-b border-zinc-800/30">
        {/* Mode Planification : Header spécial */}
        {isDistant && (planningStep === 'define' || planningStep === 'analyzing' || planningStep === 'skills') ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className={`text-base font-bold text-indigo-400 ${fontStack}`}>
                ✨ Planifier un projet
              </h2>
              {onClosePlanning && (
                <button
                  onClick={onClosePlanning}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <span className="text-xs">Annuler</span>
                </button>
              )}
            </div>
            
            {/* Input de planification */}
            {(planningStep === 'define' || planningStep === 'analyzing') && onStartAnalysis && (
              <PlanningInput
                onAnalyze={onStartAnalysis}
                onClose={onClosePlanning!}
              />
            )}
            
            {/* Message sélection compétences */}
            {planningStep === 'skills' && (
              <div className="text-center py-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                <p className={`text-xs text-indigo-400 font-medium ${fontStack}`}>
                  ⬇️ Sélectionnez les compétences ci-dessous
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Mode Normal : Titre classique */
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className={`text-base font-bold ${styles.header} ${fontStack}`}>
                {config.title}
              </h2>
              <span className={`text-lg font-bold tabular-nums ${styles.header} ${fontStack}`}>
                {totalTasks}
              </span>
            </div>
            
            {/* Info phases bloquées */}
            {hasBlockedPhases && (
              <div className="mt-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-400/90 mb-1">
                  🔒 Phase {nextPhaseToUnlock! + 1} bloquée
                </p>
                <p className="text-xs text-amber-500/70">
                  {validationTasksRemaining > 0 
                    ? `Terminez ${validationTasksRemaining} validation${validationTasksRemaining > 1 ? 's' : ''}`
                    : 'Phase en cours de déblocage...'
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Contenu : SkillsSelection, PlanningZone OU Sections par projet */}
      {isDistant && planningStep === 'skills' && planningContext?.domainMap && onSelectSkills ? (
        // Mode Sélection des compétences
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <SkillsSelection
            domainMap={planningContext.domainMap}
            onPlanify={onSelectSkills}
          />
        </div>
      ) : isDistant && planningStep === 'plan' && planningContext && onClosePlanning && onBackPlanning ? (
        // Mode Planification étape finale : Génération du plan
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <PlanningZone
            domain={planningContext.domain}
            selectedSkills={planningContext.selectedSkills}
            onClose={onClosePlanning}
            onBack={onBackPlanning}
          />
        </div>
      ) : (
        // Mode Normal : Affichage des tâches avec drag & drop
        <Droppable droppableId={column}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex-1 overflow-y-auto px-4 py-3"
            >
              {totalTasks === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <p className={`text-sm ${styles.empty} ${fontStack}`}>
                    {isToday ? 'Aucune tâche en cours' : 
                     column === 'upcoming' ? 'Aucune tâche à venir' : 
                     'Aucune tâche plus tard'}
                  </p>
                </div>
              ) : (
                <>
                  {(() => {
                    let runningIndex = 0
                    return tasksByProject.map(({ project, tasks }) => {
                      const startIndex = runningIndex
                      runningIndex += tasks.length
                      return (
                        <ProjectTasksSection
                          key={project?.id || 'no-project'}
                          project={project}
                          tasks={tasks}
                          columnId={column}
                          startIndex={startIndex}
                          onTaskClick={onTaskClick}
                          onTaskToggle={onTaskToggle}
                          onFocus={onFocus}
                        />
                      )
                    })
                  })()}
                </>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      )}
    </div>
  )
}

