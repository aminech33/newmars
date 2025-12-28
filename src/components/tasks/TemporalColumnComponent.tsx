/**
 * 📋 TemporalColumn - Colonne temporelle avec drag & drop
 */

import { Droppable } from '@hello-pangea/dnd'
import { Task } from '../../store/useStore'
import { TaskRow } from './TaskRow'
import { fontStack, ColumnConfig, getCurrentPhase } from './taskUtils'

interface TemporalColumnProps {
  config: ColumnConfig
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onTaskToggle: (taskId: string) => void
  allTasks: Task[]
  onFocus?: (task: Task) => void
}

export function TemporalColumnComponent({ 
  config, 
  tasks, 
  onTaskClick,
  onTaskToggle,
  allTasks,
  onFocus
}: TemporalColumnProps) {
  const column = config.id
  const isToday = column === 'today'
  const isDistant = column === 'distant'
  
  const todoTasks = tasks.filter(t => !t.completed)
  const doneTasks = tasks.filter(t => t.completed)
  
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
    inProgress: {
      bg: 'bg-zinc-900/30',
      header: 'text-zinc-300',
      count: 'text-zinc-400',
      empty: 'text-zinc-700',
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
    <Droppable droppableId={config.id}>
      {(provided, snapshot) => (
        <div 
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`flex-1 min-w-0 flex flex-col h-full relative ${styles.bg} ${
            snapshot.isDraggingOver ? 'ring-2 ring-inset ring-indigo-500/50' : ''
          }`}
        >
          {/* Separator */}
          {!isToday && (
            <div className="absolute left-0 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-zinc-800/50 to-transparent" />
          )}
          
          {/* Header */}
          <div className="px-4 pt-5 pb-3">
            <div className="flex items-center gap-3">
              <h2 className={`text-[19px] font-semibold leading-tight tracking-tight ${fontStack} ${styles.header}`}>
                {config.title}
              </h2>
              {todoTasks.length > 0 && (
                <span className={`text-[14px] leading-none tabular-nums px-2 py-1 rounded-md ${fontStack} ${styles.count}`}>
                  {todoTasks.length}
                </span>
              )}
            </div>
            
          </div>
          
          {/* Tasks list */}
          <div className="flex-1 overflow-y-auto px-2.5 pb-4">
            {todoTasks.length === 0 && doneTasks.length === 0 ? (
              <div className="h-20 flex items-center justify-center">
                <span className={`text-[15px] ${fontStack} ${styles.empty}`}>
                  {isToday ? "Journée libre" : snapshot.isDraggingOver ? "Déposer ici" : '—'}
                </span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {/* Message de phases bloquées (colonne Lointain uniquement) */}
                {isDistant && hasBlockedPhases && (
                  <div className="mb-4 px-4 py-3 bg-zinc-900/60 border border-zinc-800/50 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800/60 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">🔒</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] font-medium text-zinc-400 mb-1 ${fontStack}`}>
                          Phase {nextPhaseToUnlock! + 1} bloquée
                        </p>
                        <p className={`text-[12px] text-zinc-600 leading-relaxed ${fontStack}`}>
                          {validationTasksRemaining > 0 ? (
                            <>Complète la validation de Phase {currentPhase + 1} pour débloquer {blockedTasks.length} tâches</>
                          ) : (
                            <>Complète toutes les tâches de Phase {currentPhase + 1} pour débloquer la suite</>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {todoTasks.map((task, index) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    column={column}
                    index={index}
                    onClick={() => onTaskClick(task)}
                    onToggle={() => onTaskToggle(task.id)}
                    onFocus={onFocus}
                  />
                ))}
                
                {provided.placeholder}
                
                {/* Completed section - Today only */}
                {isToday && doneTasks.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-zinc-800/50">
                    <p className={`text-[12px] text-zinc-600 uppercase tracking-wider mb-3 px-1 font-semibold ${fontStack}`}>
                      Terminées
                    </p>
                    <div className="space-y-1">
                      {doneTasks.slice(0, 4).map((task, index) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          column={column}
                          index={todoTasks.length + index}
                          onClick={() => onTaskClick(task)}
                          onToggle={() => onTaskToggle(task.id)}
                        />
                      ))}
                    </div>
                    {doneTasks.length > 4 && (
                      <button className={`w-full mt-2 py-2 text-[13px] text-zinc-600 hover:text-zinc-400 transition-colors ${fontStack}`}>
                        +{doneTasks.length - 4} autres
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Droppable>
  )
}

