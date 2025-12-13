import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Plus, Search, MoreVertical, ChevronDown, FolderKanban, BarChart3, Settings, X } from 'lucide-react'
import { useStore, Task, TaskCategory, PROJECT_COLORS, PROJECT_ICONS } from '../../store/useStore'
import { KanbanBoard } from './KanbanBoard'
import { TaskDetails } from './TaskDetails'
import { AddProjectModal } from './AddProjectModal'
import { CreateProjectWithTasksPage } from './CreateProjectWithTasksPage'
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
  const [advancedFilters, setAdvancedFilters] = useState({
    categories: [] as string[],
    priorities: [] as string[],
    statuses: [] as string[],
    showCompleted: true,
    hasSubtasks: null as boolean | null,
    hasDueDate: null as boolean | null,
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
  
  // Fairphone UI states
  const [showMenu, setShowMenu] = useState(false)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)
  
  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilterDropdown(false)
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
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
  
  // Filter labels
  const filterLabels: Record<QuickFilter, string> = {
    all: 'Toutes',
    today: "Aujourd'hui",
    overdue: 'En retard',
    high: 'Priorité haute',
    'no-date': 'Sans date'
  }
  
  const sortLabels: Record<string, string> = {
    none: 'Défaut',
    dueDate: 'Date',
    priority: 'Priorité',
    title: 'Nom'
  }
  
  // Show sub-pages if activated
  if (showProjectsManagement) {
    return <ProjectsManagementPage onBack={() => setShowProjectsManagement(false)} />
  }

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse 80% 50% at top right, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse 80% 50% at bottom left, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
          linear-gradient(to bottom, #0a0a1a 0%, #000 100%)
        `
      }}
    >
      {/* Header Fairphone - Une seule ligne */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/30">
        {/* Back */}
        <button
          onClick={() => setView('hub')}
          className="p-1 text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        
        {/* Search - Juste après la flèche */}
        <div className="flex-1 max-w-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
            <Search className="w-3.5 h-3.5 text-zinc-500" />
            <input
              id="task-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="flex-1 bg-transparent text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-zinc-500 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        
        {/* Filter Dropdown */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
              quickFilter !== 'all' 
                ? 'bg-white/10 text-white' 
                : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            {filterLabels[quickFilter]}
            <ChevronDown className="w-3 h-3" />
          </button>
          {showFilterDropdown && (
            <div className="absolute top-full mt-1 right-0 w-36 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 py-1">
              {(Object.keys(filterLabels) as QuickFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => { setQuickFilter(filter); setShowFilterDropdown(false) }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                    quickFilter === filter ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  {filterLabels[filter]}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Sort Dropdown */}
        <div className="relative" ref={sortRef}>
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
              sortBy !== 'none' 
                ? 'bg-white/10 text-white' 
                : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            {sortLabels[sortBy]}
            <ChevronDown className="w-3 h-3" />
          </button>
          {showSortDropdown && (
            <div className="absolute top-full mt-1 right-0 w-32 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 py-1">
              {Object.entries(sortLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => { setSortBy(key as any); setShowSortDropdown(false) }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                    sortBy === key ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Menu ⋮ */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-zinc-800/50"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {showMenu && (
            <div className="absolute top-full mt-1 right-0 w-44 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 py-1">
              <button
                onClick={() => { setView('dashboard'); setShowMenu(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Dashboard
              </button>
              <button
                onClick={() => { setShowProjectsManagement(true); setShowMenu(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <FolderKanban className="w-3.5 h-3.5" />
                Projets
              </button>
              <button
                onClick={() => { setShowQuotaSettings(true); setShowMenu(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                Quota
              </button>
            </div>
          )}
        </div>
        
        {/* Add Button */}
        <Tooltip content="Ctrl+N" side="bottom">
          <button
            onClick={() => setShowQuickAdd(true)}
            className="p-1.5 text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>
      
      {/* Quick Add Input - Apparaît sous le header */}
      {showQuickAdd && (
        <div className="px-4 py-2 border-b border-zinc-800/30">
          <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/50 rounded-lg border border-zinc-700/50">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleQuickAdd()
                if (e.key === 'Escape') setShowQuickAdd(false)
              }}
              placeholder="Nouvelle tâche..."
              className="flex-1 bg-transparent text-sm text-zinc-300 placeholder:text-zinc-500 focus:outline-none"
              autoFocus
            />
            <button
              onClick={() => setShowQuickAdd(false)}
              className="text-zinc-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Kanban - Prend tout l'espace */}
      <div className="flex-1 overflow-hidden px-4 py-3">
        <KanbanBoard
          tasks={sortedTasks}
          onTaskClick={setSelectedTask}
          onTaskDelete={handleDeleteWithUndo}
        />
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
