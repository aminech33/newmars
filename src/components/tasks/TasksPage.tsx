import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, FolderKanban, BarChart3, ArrowUpDown } from 'lucide-react'
import { useStore, Task, TaskCategory, PROJECT_COLORS, PROJECT_ICONS } from '../../store/useStore'
import { KanbanBoard } from './KanbanBoard'
import { TaskDetails } from './TaskDetails'
import { UnifiedFilters, TaskFilterState } from './UnifiedFilters'
import { AddProjectModal } from './AddProjectModal'
import { CreateProjectWithTasksPage } from './CreateProjectWithTasksPage'
import { TaskQuotaDisplay } from './TaskQuotaDisplay'
import { TaskQuotaSettings } from './TaskQuotaSettings'
import { ProjectsManagementPage } from './ProjectsManagementPage'
import { StatDetailModal } from './StatDetailModal'
import { TaskFAB } from './TaskFAB'
import { Tooltip } from '../ui/Tooltip'
import { ConfirmDialog } from '../ui/ConfirmDialog'
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
  const [sortBy, setSortBy] = useState<'none' | 'dueDate' | 'priority' | 'title'>('none')
  
  // Quick Add States
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskProjectId, setNewTaskProjectId] = useState<string | undefined>(undefined)
  
  // Project Management States
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectColor, setNewProjectColor] = useState(PROJECT_COLORS[0])
  const [newProjectIcon, setNewProjectIcon] = useState(PROJECT_ICONS[0])
  
  // Confirmation
  const [confirmDelete, setConfirmDelete] = useState<{ task: Task } | null>(null)
  
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
  
  // Sort filtered tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'none') return 0
    
    if (sortBy === 'dueDate') {
      // Tasks without due date go to end
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    }
    
    if (sortBy === 'priority') {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }
    
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title)
    }
    
    return 0
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
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])
  
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
    deleteTask(task.id)
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

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-mars-surface">
      {/* Header - Compact */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('hub')}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg hover:bg-zinc-800/50"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-semibold text-zinc-200">Tâches</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('dashboard')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-800/50 transition-colors"
            title="Voir les statistiques dans le Dashboard"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Dashboard</span>
          </button>
          <button
            onClick={() => setShowProjectsManagement(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-800/50 transition-colors"
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Projets</span>
          </button>
          <Tooltip content="Ctrl+N" side="bottom">
            <button
              onClick={() => setShowQuickAdd(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Nouvelle</span>
            </button>
          </Tooltip>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {/* Quick Add */}
        {showQuickAdd && (
          <div className="mb-3 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleQuickAdd()
                if (e.key === 'Escape') setShowQuickAdd(false)
              }}
              placeholder="Titre de la tâche..."
              className="w-full bg-transparent text-zinc-300 placeholder:text-zinc-600 focus:outline-none text-sm"
              autoFocus
            />
          </div>
        )}
        
        {/* Task Quota Display */}
        <div className="mb-3">
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
        
        {/* Sort Menu */}
        <div className="mb-3 flex items-center gap-2 px-1">
          <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-xs text-zinc-500">Trier par :</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setSortBy('none')}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                sortBy === 'none'
                  ? 'bg-white/10 text-white'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              }`}
            >
              Défaut
            </button>
            <button
              onClick={() => setSortBy('dueDate')}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                sortBy === 'dueDate'
                  ? 'bg-white/10 text-white'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              }`}
            >
              Date
            </button>
            <button
              onClick={() => setSortBy('priority')}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                sortBy === 'priority'
                  ? 'bg-white/10 text-white'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              }`}
            >
              Priorité
            </button>
            <button
              onClick={() => setSortBy('title')}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                sortBy === 'title'
                  ? 'bg-white/10 text-white'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              }`}
            >
              Nom
            </button>
          </div>
        </div>
        
        {/* Content - Kanban prend tout l'espace restant */}
        <div className="h-[calc(100vh-280px)]">
          <KanbanBoard
            tasks={sortedTasks}
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
      
      {/* Create Project With Tasks Page */}
      <CreateProjectWithTasksPage
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

