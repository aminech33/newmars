import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, FolderKanban, TrendingUp } from 'lucide-react'
import { useStore, Task, TaskCategory, PROJECT_COLORS, PROJECT_ICONS } from '../../store/useStore'
import { KanbanBoard } from './KanbanBoard'
import { TaskDetails } from './TaskDetails'
import { UnifiedFilters, TaskFilterState } from './UnifiedFilters'
import { AddProjectModal } from './AddProjectModal'
import { CreateProjectWithTasksModal } from './CreateProjectWithTasksModal'
import { TaskQuotaDisplay } from './TaskQuotaDisplay'
import { TaskQuotaSettings } from './TaskQuotaSettings'
import { ProjectsManagementPage } from './ProjectsManagementPage'
import { StatsPage } from './StatsPage'
import { StatDetailModal } from './StatDetailModal'
import { TaskFAB } from './TaskFAB'
import { UndoToast } from '../ui/UndoToast'
import { Tooltip } from '../ui/Tooltip'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { CommandCenter } from './CommandCenter'
import { useUndo } from '../../hooks/useUndo'
import { useDebounce } from '../../hooks/useDebounce'
import { useTaskFilters, QuickFilter } from '../../hooks/useTaskFilters'
import { useTaskStats } from '../../hooks/useTaskStats'
import { useProjectManagement } from '../../hooks/useProjectManagement'
import { autoCategorizeTasks, estimateTaskDuration, detectPriority } from '../../utils/taskIntelligence'

export function TasksPage() {
  const { tasks, projects, addTask, addProject, deleteTask, setView, selectedTaskId, setSelectedTaskId } = useStore()
  
  // View & Selection States
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  
  // Deep linking: ouvrir la tâche sélectionnée depuis la recherche
  useEffect(() => {
    if (selectedTaskId) {
      const task = tasks.find(t => t.id === selectedTaskId)
      if (task) {
        setSelectedTask(task)
      }
      // Reset après utilisation
      setSelectedTaskId(null)
    }
  }, [selectedTaskId, tasks, setSelectedTaskId])
  const [selectedStat, setSelectedStat] = useState<'total' | 'today' | 'completed' | 'productivity' | null>(null)
  const [showProjectsManagement, setShowProjectsManagement] = useState(false)
  const [showStatsPage, setShowStatsPage] = useState(false)
  const [showCreateProjectWithTasks, setShowCreateProjectWithTasks] = useState(false)
  const [showQuotaSettings, setShowQuotaSettings] = useState(false)
  
  // Filter States
  const [selectedProjectId, setSelectedProjectId] = useState<string | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all')
  const [advancedFilters, setAdvancedFilters] = useState<TaskFilterState>({
    categories: [],
    priorities: [],
    statuses: [],
    showCompleted: true,
    hasSubtasks: null,
    hasDueDate: null,
  })
  
  // Quick Add States
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskProjectId, setNewTaskProjectId] = useState<string | undefined>(undefined)
  
  // Project Management States
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectColor, setNewProjectColor] = useState(PROJECT_COLORS[0])
  const [newProjectIcon, setNewProjectIcon] = useState(PROJECT_ICONS[0])
  
  // Confirmation & Undo
  const [confirmDelete, setConfirmDelete] = useState<{ task: Task } | null>(null)
  const { addAction, undo, showToast, currentAction, canUndo } = useUndo()
  
  // Debounced search
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  
  // Custom Hooks
  const { filteredTasks } = useTaskFilters({
    tasks,
    selectedProjectId,
    searchQuery: debouncedSearchQuery,
    quickFilter,
    advancedFilters
  })
  
  const { last7DaysStats, completedToday } = useTaskStats(tasks)
  useProjectManagement(tasks, projects)
  
  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        setShowQuickAdd(true)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        document.getElementById('task-search')?.focus()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && canUndo) {
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [canUndo, undo])
  
  // Handlers
  const handleQuickAdd = () => {
    if (!newTaskTitle.trim()) return
    
    const projectId = newTaskProjectId || (selectedProjectId !== 'all' ? selectedProjectId : undefined)
    const category = autoCategorizeTasks(newTaskTitle)
    const estimatedTime = estimateTaskDuration(newTaskTitle)
    const priority = detectPriority(newTaskTitle)
    
    addTask({
      title: newTaskTitle,
      category: category as TaskCategory,
      priority,
      estimatedTime,
      projectId,
      completed: false,
      status: 'todo'
    })
    
    setNewTaskTitle('')
    setNewTaskProjectId(undefined)
    setShowQuickAdd(false)
  }
  
  const handleCreateProject = () => {
    if (!newProjectName.trim()) return
    
    addProject({
      name: newProjectName,
      color: newProjectColor,
      icon: newProjectIcon
    })
    
    // Reset form and close modal
    setNewProjectName('')
    setNewProjectColor(PROJECT_COLORS[0])
    setNewProjectIcon(PROJECT_ICONS[0])
    setShowNewProject(false)
  }
  
  const handleCreateProjectWithTasks = (projectData: {
    name: string
    color: string
    icon: string
    tasks: Array<{
      title: string
      dueDate?: string
      estimatedTime?: number
      priority: any
      category: any
    }>
  }) => {
    // Create project first and get its ID
    const projectId = addProject({
      name: projectData.name,
      color: projectData.color,
      icon: projectData.icon
    })
    
    // Then create all tasks with the correct project ID
    projectData.tasks.forEach((task) => {
      addTask({
        title: task.title,
        category: task.category || 'work',
        priority: task.priority || 'medium',
        estimatedTime: task.estimatedTime,
        dueDate: task.dueDate,
        completed: false,
        status: 'todo',
        projectId: projectId
      })
    })
    
    setShowCreateProjectWithTasks(false)
  }
  
  const handleDeleteWithUndo = (task: Task) => {
    setConfirmDelete({ task })
  }
  
  const confirmDeleteTask = () => {
    if (!confirmDelete) return
    const task = confirmDelete.task
    const taskCopy = { ...task }
    deleteTask(task.id)
    addAction({
      type: 'delete',
      data: taskCopy,
      undo: () => addTask(taskCopy),
      label: `Tâche "${task.title}" supprimée`
    })
    setConfirmDelete(null)
  }
  
  const handleResetFilters = () => {
    setSelectedProjectId('all')
    setSearchQuery('')
    setQuickFilter('all')
    setAdvancedFilters({
      categories: [],
      priorities: [],
      statuses: [],
      showCompleted: true,
      hasSubtasks: null,
      hasDueDate: null,
    })
  }
  
  // Show sub-pages if activated
  if (showProjectsManagement) {
    return <ProjectsManagementPage onBack={() => setShowProjectsManagement(false)} />
  }

  if (showStatsPage) {
    return (
      <StatsPage 
        onBack={() => setShowStatsPage(false)}
        tasks={tasks}
        last7DaysStats={last7DaysStats}
        completedToday={completedToday}
      />
    )
  }

  return (
    <div className="h-full flex flex-col bg-mars-surface">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setView('hub')}
            className="p-2 text-zinc-600 hover:text-zinc-400 transition-colors rounded-xl hover:bg-zinc-800/50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-zinc-200">Tâches</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowStatsPage(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 text-zinc-400 rounded-2xl hover:bg-zinc-700/50 border border-white/10 transition-colors duration-300"
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Stats</span>
          </button>
          <button
            onClick={() => setShowProjectsManagement(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 text-zinc-400 rounded-2xl hover:bg-zinc-700/50 border border-white/10 transition-colors duration-300"
          >
            <FolderKanban className="w-4 h-4" />
            <span className="text-sm font-medium">Projets</span>
          </button>
          <Tooltip content="Ctrl+N" side="bottom">
            <button
              onClick={() => setShowQuickAdd(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-2xl hover:bg-indigo-500/30 shadow-[0_4px_16px_rgba(91,127,255,0.2)] transition-colors duration-300"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Nouvelle tâche</span>
            </button>
          </Tooltip>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        {/* Quick Add */}
        {showQuickAdd && (
          <div className="mb-4 p-4 bg-zinc-900/50 rounded-2xl backdrop-blur-xl animate-slide-up"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleQuickAdd()
                if (e.key === 'Escape') setShowQuickAdd(false)
              }}
              placeholder="Titre de la tâche..."
              className="w-full bg-transparent text-zinc-300 placeholder:text-zinc-700 focus:outline-none text-sm"
              autoFocus
            />
          </div>
        )}
        
        
        {/* Command Center - Vue prioritaire */}
        <CommandCenter
          tasks={tasks}
          onTaskClick={(task) => setSelectedTask(task)}
        />
        
        {/* Task Quota Display */}
        <div className="mb-6">
          <TaskQuotaDisplay onSettingsClick={() => setShowQuotaSettings(true)} />
        </div>
        
        {/* Unified Filters */}
        <UnifiedFilters
          quickFilter={quickFilter}
          onQuickFilterChange={setQuickFilter}
          advancedFilters={advancedFilters}
          onAdvancedFilterChange={setAdvancedFilters}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onReset={handleResetFilters}
        />
        
        {/* Content */}
        <div className="h-[calc(100vh-400px)]">
          <KanbanBoard
            tasks={filteredTasks}
            onTaskClick={setSelectedTask}
            onTaskDelete={handleDeleteWithUndo}
          />
        </div>
      </div>
      
      {/* Task Details Panel */}
      {selectedTask && (
        <TaskDetails
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
      
      {/* FAB Mobile */}
      <TaskFAB onClick={() => setShowQuickAdd(true)} />
      
      {/* Undo Toast */}
      <UndoToast
        message={currentAction?.label || ''}
        onUndo={undo}
        isVisible={showToast}
      />
      
      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteTask}
        title="Supprimer la tâche ?"
        message={`Êtes-vous sûr de vouloir supprimer "${confirmDelete?.task.title}" ? Cette action peut être annulée pendant 5 secondes.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
      />
      
      {/* Stat Detail Modals */}
      {selectedStat === 'total' && (
        <StatDetailModal
          isOpen={true}
          onClose={() => setSelectedStat(null)}
          title="Toutes les tâches"
          tasks={tasks}
          icon="📋"
        />
      )}
      {selectedStat === 'today' && (
        <StatDetailModal
          isOpen={true}
          onClose={() => setSelectedStat(null)}
          title="Tâches d'aujourd'hui"
          tasks={tasks.filter(t => {
            const today = new Date().setHours(0, 0, 0, 0)
            const taskDate = new Date(t.createdAt).setHours(0, 0, 0, 0)
            return taskDate === today
          })}
          icon="📅"
        />
      )}
      {selectedStat === 'completed' && (
        <StatDetailModal
          isOpen={true}
          onClose={() => setSelectedStat(null)}
          title="Tâches complétées"
          tasks={tasks.filter(t => t.completed)}
          icon="✅"
        />
      )}
      {selectedStat === 'productivity' && (
        <StatDetailModal
          isOpen={true}
          onClose={() => setSelectedStat(null)}
          title="Tâches productives"
          tasks={tasks.filter(t => (t.focusScore || 0) > 50)}
          icon="⚡"
        />
      )}

      {/* Add Project Modal */}
      <AddProjectModal
        isOpen={showNewProject}
        onClose={() => setShowNewProject(false)}
        projectName={newProjectName}
        onNameChange={setNewProjectName}
        projectColor={newProjectColor}
        onColorChange={setNewProjectColor}
        projectIcon={newProjectIcon}
        onIconChange={setNewProjectIcon}
        onCreate={handleCreateProject}
      />
      
      {/* Create Project With Tasks Modal */}
      <CreateProjectWithTasksModal
        isOpen={showCreateProjectWithTasks}
        onClose={() => setShowCreateProjectWithTasks(false)}
        onCreate={handleCreateProjectWithTasks}
      />
      
      {/* Task Quota Settings */}
      <TaskQuotaSettings
        isOpen={showQuotaSettings}
        onClose={() => setShowQuotaSettings(false)}
      />
    </div>
  )
}

