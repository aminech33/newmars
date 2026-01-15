/**
 * 📋 TasksPage - Page principale des tâches (refactorisée)
 * 
 * Architecture :
 * - 3 colonnes temporelles (today, upcoming, distant)
 * - Distribution optimale (10-15-24)
 * - Drag & drop entre colonnes
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'

import { useStore, Task, TaskCategory, type TemporalColumn, Project } from '../../store/useStore'
import { TaskDetails } from './TaskDetails'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { PomodoroPage } from '../pomodoro/PomodoroPage'
import { PomodoroOverlay } from '../pomodoro/PomodoroOverlay'

// Composants extraits
import { TasksHeader } from './TasksHeader'
import { TemporalColumnWithProjects } from './TemporalColumnWithProjects'
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
type PlanningStep = 'none' | 'define' | 'analyzing' | 'skills' | 'plan'
type TasksTab = 'tasks' | 'focus'

interface DomainMap {
  domain: string
  title: string
  levels: any[] // From DefineProjectZone
}

interface PlanningContext {
  domain: string
  selectedSkills: string[]
  domainMap?: DomainMap
}

export function TasksPage() {
  const { 
    tasks, 
    projects,
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

  // Optimistic update pour drag & drop fluide
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, Partial<Task>>>(new Map())
  
  // ═══════════════════════════════════════════════════════════════
  // GESTION DE LA PLANIFICATION IA
  // ═══════════════════════════════════════════════════════════════
  const handleStartAnalysis = async (domain: string) => {
    setPlanningStep('analyzing')
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000)
    
    try {
      const response = await fetch('http://localhost:8000/api/skills/generate-domain-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim() }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.detail || `Erreur serveur (${response.status})`)
      }
      
      const data = await response.json()
      
      if (!data || !data.levels || !Array.isArray(data.levels)) {
        throw new Error('Réponse invalide du serveur')
      }
      
      if (data.levels.length === 0) {
        throw new Error('Aucune compétence trouvée pour ce domaine')
      }
      
      // Passer à l'étape de sélection des compétences
      setPlanningContext({
        domain: domain.trim(),
        selectedSkills: [],
        domainMap: data
      })
      setPlanningStep('skills')
      
    } catch (err) {
      clearTimeout(timeoutId)
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          addToast('Timeout : l\'analyse prend trop de temps', 'error')
        } else if (err.message.includes('Failed to fetch')) {
          addToast('Impossible de contacter le serveur', 'error')
        } else {
          addToast(err.message, 'error')
        }
      }
      
      setPlanningStep('define')
    }
  }
  
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
  
  // Sélection de tâche depuis l'extérieur
  useEffect(() => {
    if (selectedTaskId) {
      const task = tasks.find(t => t.id === selectedTaskId)
      if (task) setSelectedTask(task)
      setSelectedTaskId(null)
    }
  }, [selectedTaskId, tasks, setSelectedTaskId])
  
  // ═══════════════════════════════════════════════════════════════
  // TÂCHES AVEC OPTIMISTIC UPDATES APPLIQUÉS
  // ═══════════════════════════════════════════════════════════════
  const effectiveTasks = useMemo(() => {
    if (optimisticUpdates.size === 0) return tasks
    return tasks.map(task => {
      const update = optimisticUpdates.get(task.id)
      return update ? { ...task, ...update } : task
    })
  }, [tasks, optimisticUpdates])

  // Nettoyer les optimistic updates quand les tâches sont synchronisées
  useEffect(() => {
    if (optimisticUpdates.size === 0) return

    // Vérifier si les updates sont maintenant reflétés dans le store
    const updatesToRemove: string[] = []
    optimisticUpdates.forEach((update, taskId) => {
      const task = tasks.find(t => t.id === taskId)
      if (task) {
        const isSynced = Object.entries(update).every(
          ([key, value]) => task[key as keyof Task] === value
        )
        if (isSynced) updatesToRemove.push(taskId)
      }
    })

    if (updatesToRemove.length > 0) {
      setOptimisticUpdates(prev => {
        const next = new Map(prev)
        updatesToRemove.forEach(id => next.delete(id))
        return next
      })
    }
  }, [tasks, optimisticUpdates])

  // ═══════════════════════════════════════════════════════════════
  // DRAG & DROP HANDLER
  // ═══════════════════════════════════════════════════════════════
  const handleDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return
    }

    const destColumn = destination.droppableId as TemporalColumn

    // Utiliser effectiveTasks pour inclure les updates en cours
    const destColumnTasks = effectiveTasks
      .filter(t => categorizeTask(t, effectiveTasks) === destColumn && !t.completed && t.id !== draggableId)
      .sort((a, b) => (a.manualOrder ?? Infinity) - (b.manualOrder ?? Infinity))

    // Calculer le nouvel ordre
    const destIndex = destination.index
    let newOrder: number

    if (destColumnTasks.length === 0) {
      newOrder = 0
    } else if (destIndex === 0) {
      const firstOrder = destColumnTasks[0]?.manualOrder ?? 0
      newOrder = firstOrder - 1
    } else if (destIndex >= destColumnTasks.length) {
      const lastOrder = destColumnTasks[destColumnTasks.length - 1]?.manualOrder ?? destColumnTasks.length
      newOrder = lastOrder + 1
    } else {
      const prevTask = destColumnTasks[destIndex - 1]
      const nextTask = destColumnTasks[destIndex]
      const prevOrder = prevTask?.manualOrder ?? destIndex - 1
      const nextOrder = nextTask?.manualOrder ?? destIndex
      newOrder = (prevOrder + nextOrder) / 2
    }

    const updates = {
      temporalColumn: destColumn,
      manualOrder: newOrder
    }

    // 1. Optimistic update immédiat (UI instantanée)
    setOptimisticUpdates(prev => new Map(prev).set(draggableId, updates))

    // 2. Mettre à jour le store (persistance)
    updateTask(draggableId, updates)
  }, [effectiveTasks, updateTask])
  
  // ═══════════════════════════════════════════════════════════════
  // ORGANISATION DES TÂCHES PAR COLONNE ET PAR PROJET
  // ═══════════════════════════════════════════════════════════════
  const tasksByColumnAndProject = useMemo(() => {
    const result: Record<TemporalColumn, Array<{ project: Project | null, tasks: Task[] }>> = {
      today: [],
      upcoming: [],
      distant: []
    }

    // Grouper les tâches par colonne d'abord (utilise effectiveTasks pour optimistic UI)
    const tasksByColumn: Record<TemporalColumn, Task[]> = {
      today: [],
      upcoming: [],
      distant: []
    }

    effectiveTasks.forEach(task => {
      tasksByColumn[categorizeTask(task, effectiveTasks)].push(task)
    })
    
    // Tri : respecter l'ordre manuel si défini, sinon tri intelligent
    Object.keys(tasksByColumn).forEach(key => {
      const column = key as TemporalColumn
      const columnTasks = tasksByColumn[column]

      // Séparer tâches avec ordre manuel vs sans
      const withManualOrder = columnTasks.filter(t => t.manualOrder !== undefined)
      const withoutManualOrder = columnTasks.filter(t => t.manualOrder === undefined)

      // Trier chaque groupe
      withManualOrder.sort((a, b) => (a.manualOrder ?? 0) - (b.manualOrder ?? 0))
      const sortedWithoutOrder = sortTasksForColumn(withoutManualOrder)

      // Combiner : tâches avec ordre manuel d'abord, puis les autres
      tasksByColumn[column] = [...withManualOrder, ...sortedWithoutOrder]
    })
    
    // Grouper par projet dans chaque colonne
    Object.keys(tasksByColumn).forEach(columnKey => {
      const column = columnKey as TemporalColumn
      const columnTasks = tasksByColumn[column]
      
      // Map pour grouper les tâches par projectId
      const tasksByProject = new Map<string | null, Task[]>()
      
      columnTasks.forEach(task => {
        const projectId = task.projectId || null
        if (!tasksByProject.has(projectId)) {
          tasksByProject.set(projectId, [])
        }
        tasksByProject.get(projectId)!.push(task)
      })
      
      // Trier les projets : avec projet d'abord, puis sans projet
      const sortedProjects: Array<{ project: Project | null, tasks: Task[] }> = []
      
      // D'abord les projets (triés par ordre alphabétique)
      const projectEntries = Array.from(tasksByProject.entries())
        .filter(([projectId]) => projectId !== null)
        .map(([projectId, tasks]) => ({
          project: projects.find(p => p.id === projectId) || null,
          tasks
        }))
        .sort((a, b) => {
          if (!a.project || !b.project) return 0
          return a.project.name.localeCompare(b.project.name)
        })
      
      sortedProjects.push(...projectEntries)
      
      // Ensuite les tâches sans projet
      if (tasksByProject.has(null)) {
        sortedProjects.push({
          project: null,
          tasks: tasksByProject.get(null)!
        })
      }
      
      result[column] = sortedProjects
    })
    
    return result
  }, [effectiveTasks, projects])
  
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
                aria-label="Titre de la nouvelle tâche"
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
          
          {/* Columns avec sections par projet */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex-1 flex overflow-hidden gap-3 px-3">
              {COLUMNS.map((config) => (
                <TemporalColumnWithProjects
                  key={config.id}
                  config={config}
                  tasksByProject={tasksByColumnAndProject[config.id]}
                  allTasks={effectiveTasks}
                  onTaskClick={setSelectedTask}
                  onTaskToggle={toggleTask}
                  onFocus={setFocusTask}
                  planningStep={config.id === 'distant' ? planningStep : 'none'}
                  planningContext={config.id === 'distant' ? planningContext : null}
                  onClosePlanning={config.id === 'distant' ? () => {
                    setPlanningStep('none')
                    setPlanningContext(null)
                  } : undefined}
                  onBackPlanning={config.id === 'distant' ? () => setPlanningStep('skills') : undefined}
                  onStartAnalysis={config.id === 'distant' ? handleStartAnalysis : undefined}
                  onSelectSkills={config.id === 'distant' ? (skills: string[]) => {
                    setPlanningContext({ 
                      domain: planningContext?.domain || '', 
                      selectedSkills: skills,
                      domainMap: planningContext?.domainMap
                    })
                    setPlanningStep('plan')
                  } : undefined}
                />
              ))}
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
