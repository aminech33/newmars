/**
 * 📋 TasksPage - Page principale des tâches (refactorisée)
 * 
 * Composants extraits :
 * - TaskRow : Ligne de tâche draggable
 * - TemporalColumnComponent : Colonne temporelle avec drag & drop
 * - DefineProjectZone : Zone de définition du projet
 * - PlanningZone : Zone de planification intégrée
 * - TasksHeader : Header avec navigation et actions
 * - taskUtils : Utilitaires et types partagés
 */

import { useState, useEffect, useMemo } from 'react'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'

import { useStore, Task, TaskCategory, type TemporalColumn } from '../../store/useStore'
import { TaskDetails } from './TaskDetails'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { PomodoroPage } from '../pomodoro/PomodoroPage'
import { PomodoroOverlay } from '../pomodoro/PomodoroOverlay'

// Composants extraits
import { TasksHeader } from './TasksHeader'
import { TemporalColumnComponent } from './TemporalColumnComponent'
import { DefineProjectZone } from './DefineProjectZone'
import { PlanningZone } from './PlanningZone'

// Utilitaires
import { 
  fontStack, 
  COLUMNS, 
  getCurrentPhase, 
  categorizeTask 
} from './taskUtils'
import { 
  autoCategorizeTasks, 
  estimateTaskDuration, 
  detectPriority,
  sortTasksForColumn
} from '../../utils/taskIntelligence'

// Types
type PlanningStep = 'none' | 'define' | 'plan'
type TasksTab = 'tasks' | 'focus'

interface PlanningContext {
  domain: string
  selectedSkills: string[]
}

export function TasksPage() {
  const { 
    tasks, 
    addTask, 
    toggleTask, 
    deleteTask, 
    selectedTaskId, 
    setSelectedTaskId, 
    updateTask, 
    addToast 
  } = useStore()
  
  // États locaux
  const [activeTab, setActiveTab] = useState<TasksTab>('tasks')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [focusTask, setFocusTask] = useState<Task | null>(null)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<{ task: Task } | null>(null)
  const [planningStep, setPlanningStep] = useState<PlanningStep>('none')
  const [planningContext, setPlanningContext] = useState<PlanningContext | null>(null)
  const [lastCurrentPhase, setLastCurrentPhase] = useState(0)
  
  // ═══════════════════════════════════════════════════════════════
  // DÉTECTION DE DÉBLOCAGE - Toast quand une phase se débloque
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    const currentPhase = getCurrentPhase(tasks)
    
    if (currentPhase > lastCurrentPhase && lastCurrentPhase > 0) {
      const phaseName = `Phase ${currentPhase + 1}`
      const unlockedTasksCount = tasks.filter(t => t.phaseIndex === currentPhase).length
      
      addToast(
        `🎉 ${phaseName} débloquée ! ${unlockedTasksCount} nouvelles tâches disponibles`,
        'success'
      )
    }
    
    setLastCurrentPhase(currentPhase)
  }, [tasks, lastCurrentPhase, addToast])
  
  // ═══════════════════════════════════════════════════════════════
  // DRAG & DROP HANDLER
  // ═══════════════════════════════════════════════════════════════
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result
    
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return
    }
    
    const newColumn = destination.droppableId as TemporalColumn
    updateTask(draggableId, { temporalColumn: newColumn })
  }
  
  // Sélection de tâche depuis l'extérieur
  useEffect(() => {
    if (selectedTaskId) {
      const task = tasks.find(t => t.id === selectedTaskId)
      if (task) setSelectedTask(task)
      setSelectedTaskId(null)
    }
  }, [selectedTaskId, tasks, setSelectedTaskId])
  
  // ═══════════════════════════════════════════════════════════════
  // ORGANISATION DES TÂCHES PAR COLONNE
  // ═══════════════════════════════════════════════════════════════
  const tasksByColumn = useMemo(() => {
    const result: Record<TemporalColumn, Task[]> = {
      today: [],
      inProgress: [],
      upcoming: [],
      distant: []
    }
    
    tasks.forEach(task => {
      result[categorizeTask(task, tasks)].push(task)
    })
    
    // Tri intelligent basé sur Smart Score
    Object.keys(result).forEach(key => {
      result[key as TemporalColumn] = sortTasksForColumn(result[key as TemporalColumn])
    })
    
    return result
  }, [tasks])
  
  // ═══════════════════════════════════════════════════════════════
  // RACCOURCIS CLAVIER
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        setShowQuickAdd(true)
      }
      if (e.key === 'Escape' && showQuickAdd) {
        setShowQuickAdd(false)
        setNewTaskTitle('')
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showQuickAdd])
  
  // ═══════════════════════════════════════════════════════════════
  // AJOUT RAPIDE DE TÂCHE
  // ═══════════════════════════════════════════════════════════════
  const handleQuickAdd = () => {
    if (!newTaskTitle.trim()) return
    
    addTask({
      title: newTaskTitle,
      category: autoCategorizeTasks(newTaskTitle) as TaskCategory,
      priority: detectPriority(newTaskTitle),
      estimatedTime: estimateTaskDuration(newTaskTitle),
      completed: false,
      status: 'todo'
    })
    
    setNewTaskTitle('')
    setShowQuickAdd(false)
  }
  
  // ═══════════════════════════════════════════════════════════════
  // STATISTIQUES DE PROGRESSION
  // ═══════════════════════════════════════════════════════════════
  const progressionStats = useMemo(() => {
    const currentPhase = getCurrentPhase(tasks)
    const phaseTasks = tasks.filter(t => t.phaseIndex !== undefined)
    
    if (phaseTasks.length === 0) {
      return null
    }
    
    const totalPhases = Math.max(...phaseTasks.map(t => t.phaseIndex!)) + 1
    const tasksInCurrentPhase = tasks.filter(t => t.phaseIndex === currentPhase)
    const completedInCurrentPhase = tasksInCurrentPhase.filter(t => t.completed).length
    const totalInCurrentPhase = tasksInCurrentPhase.length
    const progressPercent = totalInCurrentPhase > 0 
      ? Math.round((completedInCurrentPhase / totalInCurrentPhase) * 100) 
      : 0
    
    return {
      currentPhase: currentPhase + 1,
      totalPhases,
      completedInCurrentPhase,
      totalInCurrentPhase,
      progressPercent
    }
  }, [tasks])

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-zinc-950">
      {/* Header */}
      <TasksHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        progressionStats={progressionStats}
        planningStep={planningStep}
        setPlanningStep={setPlanningStep}
        setShowQuickAdd={setShowQuickAdd}
      />
      
      {/* Contenu selon l'onglet actif */}
      {activeTab === 'tasks' ? (
        <>
          {/* Quick Add */}
          <div className={`
            overflow-hidden border-b border-zinc-800/30 bg-zinc-900/30
            transition-all duration-200 ease-out
            ${showQuickAdd ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}
          `}>
            <div className="px-5 py-3 flex items-center gap-3">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleQuickAdd()
                  if (e.key === 'Escape') { setShowQuickAdd(false); setNewTaskTitle('') }
                }}
                placeholder="Que devez-vous faire ?"
                className={`flex-1 h-12 px-4 bg-zinc-800/60 text-zinc-100 placeholder:text-zinc-500 rounded-xl border border-zinc-700/50 focus:outline-none focus:border-zinc-600 focus:ring-2 focus:ring-zinc-600/20 text-[16px] transition-all duration-150 ${fontStack}`}
                autoFocus={showQuickAdd}
              />
              <button
                onClick={handleQuickAdd}
                disabled={!newTaskTitle.trim()}
                className={`h-12 px-6 bg-zinc-100 text-zinc-900 rounded-xl text-[15px] font-semibold disabled:opacity-25 disabled:cursor-not-allowed hover:bg-white transition-all duration-150 active:scale-[0.98] ${fontStack}`}
              >
                Ajouter
              </button>
            </div>
          </div>
          
          {/* Columns */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex-1 flex overflow-hidden">
              {COLUMNS.map((config) => {
                // Remplacer Lointain par la zone de définition/planification si active
                if (config.id === 'distant' && planningStep !== 'none') {
                  return (
                    <div key="planning" className="flex-1 min-w-0 relative">
                      <div className="absolute left-0 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-zinc-800/50 to-transparent" />
                      
                      {planningStep === 'define' && (
                        <DefineProjectZone
                          onCancel={() => setPlanningStep('none')}
                          onPlanify={(domain, selectedSkills) => {
                            setPlanningContext({ domain, selectedSkills })
                            setPlanningStep('plan')
                          }}
                        />
                      )}
                      
                      {planningStep === 'plan' && (
                        <PlanningZone 
                          onProjectCreated={() => {
                            setPlanningStep('none')
                            setPlanningContext(null)
                          }}
                          onCancel={() => {
                            setPlanningStep('none')
                            setPlanningContext(null)
                          }}
                          preselectedSkills={planningContext?.selectedSkills}
                          preselectedDomain={planningContext?.domain}
                        />
                      )}
                    </div>
                  )
                }
                
                return (
                  <TemporalColumnComponent
                    key={config.id}
                    config={config}
                    tasks={tasksByColumn[config.id]}
                    onTaskClick={setSelectedTask}
                    onTaskToggle={toggleTask}
                    allTasks={tasks}
                    onFocus={setFocusTask}
                  />
                )
              })}
            </div>
          </DragDropContext>
          
          {/* Task Details */}
          {selectedTask && (
            <TaskDetails
              task={selectedTask}
              onClose={() => setSelectedTask(null)}
            />
          )}

          {/* Pomodoro Overlay */}
          {focusTask && (
            <PomodoroOverlay
              task={focusTask}
              onClose={() => setFocusTask(null)}
              onComplete={() => setFocusTask(null)}
            />
          )}

          {/* Confirm Delete */}
          <ConfirmDialog
            isOpen={!!confirmDelete}
            onClose={() => setConfirmDelete(null)}
            onConfirm={() => { if (confirmDelete) { deleteTask(confirmDelete.task.id); setConfirmDelete(null) } }}
            title="Supprimer ?"
            message={`"${confirmDelete?.task.title}"`}
            confirmText="Supprimer"
            cancelText="Annuler"
            variant="danger"
          />
        </>
      ) : (
        /* Onglet Focus - Pomodoro intégré */
        <div className="flex-1 overflow-hidden">
          <PomodoroPage embedded />
        </div>
      )}
    </div>
  )
}
