import { useState, useMemo } from 'react'
import { ArrowLeft, Plus, Search, LayoutList, LayoutGrid, Zap, TrendingUp, FolderKanban, X } from 'lucide-react'
import { useStore, Task, TaskCategory } from '../../store/useStore'
import { SmartSuggestion } from './SmartSuggestion'
import { KanbanBoard } from './KanbanBoard'
import { TaskDetails } from './TaskDetails'
import { TaskFilters, TaskFilterState } from './TaskFilters'
import { ProjectModal } from '../projects/ProjectModal'
import { analyzeProductivityPatterns, autoCategorizeTasks, estimateTaskDuration, detectPriority } from '../../utils/taskIntelligence'
import { calculateProjectStats } from '../../utils/projectUtils'

type ViewMode = 'list' | 'kanban' | 'focus'

const categories: { key: TaskCategory | 'all'; label: string; color: string }[] = [
  { key: 'all', label: 'Toutes', color: 'text-zinc-400' },
  { key: 'dev', label: 'Dev', color: 'text-indigo-400' },
  { key: 'design', label: 'Design', color: 'text-cyan-400' },
  { key: 'work', label: 'Travail', color: 'text-amber-400' },
  { key: 'personal', label: 'Perso', color: 'text-emerald-400' },
  { key: 'urgent', label: 'Urgent', color: 'text-rose-400' },
]

export function TasksPage() {
  const { tasks, addTask, setView, projects } = useStore()
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'all'>('all')
  const [selectedProjectId, setSelectedProjectId] = useState<string | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState<TaskFilterState>({
    categories: [],
    priorities: [],
    statuses: [],
    showCompleted: true,
    hasSubtasks: null,
    hasDueDate: null,
  })
  
  // Analytics
  const analytics = analyzeProductivityPatterns(tasks)
  const completedToday = tasks.filter(t => {
    const today = new Date().setHours(0, 0, 0, 0)
    return t.completed && t.createdAt >= today
  }).length
  
  // Project stats
  const projectStats = useMemo(() => {
    return projects.map(p => calculateProjectStats(p, tasks))
  }, [projects, tasks])
  
  const activeProjects = projects.filter(p => p.status === 'active')
  
  // Filter tasks with advanced filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Project filter
      if (selectedProjectId !== 'all' && task.projectId !== selectedProjectId) return false
      
      // Basic category filter
      if (selectedCategory !== 'all' && task.category !== selectedCategory) return false
      
      // Search filter
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      
      // Advanced filters
      if (advancedFilters.categories.length > 0 && !advancedFilters.categories.includes(task.category)) return false
      if (advancedFilters.priorities.length > 0 && !advancedFilters.priorities.includes(task.priority)) return false
      if (advancedFilters.statuses.length > 0 && !advancedFilters.statuses.includes(task.status)) return false
      if (!advancedFilters.showCompleted && task.completed) return false
      if (advancedFilters.hasSubtasks === true && (!task.subtasks || task.subtasks.length === 0)) return false
      if (advancedFilters.hasDueDate === true && !task.dueDate) return false
      
      return true
    })
  }, [tasks, selectedCategory, selectedProjectId, searchQuery, advancedFilters])
  
  const handleQuickAdd = () => {
    if (newTaskTitle.trim()) {
      const category = autoCategorizeTasks(newTaskTitle)
      const estimatedTime = estimateTaskDuration(newTaskTitle)
      const priority = detectPriority(newTaskTitle)
      
      addTask({
        title: newTaskTitle,
        completed: false,
        category,
        status: 'todo',
        priority,
        estimatedTime,
        focusScore: 0
      })
      
      setNewTaskTitle('')
      setShowQuickAdd(false)
    }
  }
  
  return (
    <div className="min-h-screen w-full bg-mars-bg">
      <div className="w-full max-w-[1800px] mx-auto px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setView('hub')}
                className="p-2 text-zinc-600 hover:text-zinc-400 transition-all rounded-xl hover:bg-zinc-800/50"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-zinc-200">Tâches</h1>
                <p className="text-sm text-zinc-600 mt-0.5">
                  {tasks.filter(t => !t.completed).length} en cours · {completedToday} complétées aujourd'hui
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowQuickAdd(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-2xl hover:bg-indigo-500/30 shadow-[0_4px_16px_rgba(91,127,255,0.2)] transition-all duration-300"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Nouvelle tâche</span>
            </button>
          </div>
          
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
                placeholder="Titre de la tâche (l'IA détectera automatiquement la catégorie et la priorité)..."
                className="w-full bg-transparent text-zinc-300 placeholder:text-zinc-700 focus:outline-none text-sm"
                autoFocus
              />
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleQuickAdd}
                  className="px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-xl text-xs hover:bg-indigo-500/30 transition-colors"
                >
                  Créer
                </button>
                <button
                  onClick={() => setShowQuickAdd(false)}
                  className="px-3 py-1.5 text-zinc-500 rounded-xl text-xs hover:bg-zinc-800/50 transition-colors"
                >
                  Annuler
                </button>
                <span className="text-xs text-zinc-700 ml-2">
                  💡 L'IA analyse automatiquement votre tâche
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Smart Suggestion */}
        <SmartSuggestion tasks={tasks} />
        
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-zinc-900/30 backdrop-blur-xl rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-xl">
                <LayoutList className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-200">{tasks.length}</p>
                <p className="text-xs text-zinc-600">Total</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-zinc-900/30 backdrop-blur-xl rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-xl">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-200">{completedToday}</p>
                <p className="text-xs text-zinc-600">Aujourd'hui</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-zinc-900/30 backdrop-blur-xl rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-xl">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-200">{analytics.completionRate}%</p>
                <p className="text-xs text-zinc-600">Taux</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-zinc-900/30 backdrop-blur-xl rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <span className="text-xl">⚡</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-200">{analytics.tasksPerDay}</p>
                <p className="text-xs text-zinc-600">Par jour</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Projects Bar */}
        {activeProjects.length > 0 && (
          <div className="mb-6 p-4 bg-zinc-900/30 backdrop-blur-xl rounded-2xl"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-medium text-zinc-400">Projets</h3>
              </div>
              <button
                onClick={() => setShowProjectModal(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                + Nouveau projet
              </button>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSelectedProjectId('all')}
                className={`
                  px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-300
                  ${selectedProjectId === 'all'
                    ? 'bg-indigo-500/20 text-indigo-400 shadow-[0_2px_8px_rgba(91,127,255,0.2)]'
                    : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/30'
                  }
                `}
                style={selectedProjectId === 'all' ? { border: '1px solid rgba(91,127,255,0.2)' } : {}}
              >
                Tous les projets
              </button>
              
              {activeProjects.map((project) => {
                const stats = projectStats.find(s => s.id === project.id)
                return (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-300
                      ${selectedProjectId === project.id
                        ? 'bg-zinc-800/50 shadow-[0_2px_8px_rgba(0,0,0,0.2)]'
                        : 'hover:bg-zinc-800/30'
                      }
                    `}
                    style={{
                      border: selectedProjectId === project.id ? '1px solid rgba(255,255,255,0.08)' : 'none',
                      color: selectedProjectId === project.id ? project.color : '#71717a'
                    }}
                  >
                    <span>{project.icon || '📁'}</span>
                    <span>{project.name}</span>
                    {stats && (
                      <span className="text-zinc-600">({stats.tasksCount})</span>
                    )}
                  </button>
                )
              })}
            </div>
            
            {selectedProjectId !== 'all' && (
              <div className="mt-3 pt-3 border-t border-zinc-800/50">
                {(() => {
                  const project = projects.find(p => p.id === selectedProjectId)
                  const stats = projectStats.find(s => s.id === selectedProjectId)
                  if (!project || !stats) return null
                  
                  return (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-xs text-zinc-600">
                          Progression: <span className="text-zinc-400 font-medium">{stats.progress}%</span>
                        </div>
                        <div className="text-xs text-zinc-600">
                          Tâches: <span className="text-zinc-400 font-medium">{stats.completedTasksCount}/{stats.tasksCount}</span>
                        </div>
                        {project.deadline && (
                          <div className="text-xs text-zinc-600">
                            Deadline: <span className="text-zinc-400 font-medium">{new Date(project.deadline).toLocaleDateString('fr-FR')}</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedProjectId('all')}
                        className="p-1 text-zinc-600 hover:text-zinc-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        )}
        
        {/* Filters & View Modes */}
        <div className="flex items-center justify-between mb-6">
          {/* Search & Filters */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="pl-10 pr-4 py-2 bg-zinc-900/50 rounded-xl text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:bg-zinc-900 transition-colors w-64"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <TaskFilters onFilterChange={setAdvancedFilters} />
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`
                    px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-300
                    ${selectedCategory === cat.key
                      ? `${cat.color} bg-zinc-800/50 shadow-[0_2px_8px_rgba(0,0,0,0.2)]`
                      : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/30'
                    }
                  `}
                  style={selectedCategory === cat.key ? { border: '1px solid rgba(255,255,255,0.08)' } : {}}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* View Modes */}
          <div className="flex items-center gap-2 p-1 bg-zinc-900/50 rounded-xl"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <button
              onClick={() => setViewMode('list')}
              className={`
                p-2 rounded-lg transition-all duration-300
                ${viewMode === 'list'
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-zinc-600 hover:text-zinc-400'
                }
              `}
              title="Vue Liste"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`
                p-2 rounded-lg transition-all duration-300
                ${viewMode === 'kanban'
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-zinc-600 hover:text-zinc-400'
                }
              `}
              title="Vue Kanban"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('focus')}
              className={`
                p-2 rounded-lg transition-all duration-300
                ${viewMode === 'focus'
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-zinc-600 hover:text-zinc-400'
                }
              `}
              title="Mode Focus"
            >
              <Zap className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="h-[calc(100vh-400px)]">
          {viewMode === 'kanban' && (
            <KanbanBoard
              tasks={filteredTasks}
              onTaskClick={setSelectedTask}
            />
          )}
          
          {viewMode === 'list' && (
            <div className="space-y-2">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="p-4 bg-zinc-900/30 backdrop-blur-xl rounded-2xl hover:bg-zinc-900/50 cursor-pointer transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 rounded accent-indigo-500"
                    />
                    <span className={`flex-1 ${task.completed ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>
                      {task.title}
                    </span>
                    {task.estimatedTime && (
                      <span className="text-xs text-zinc-600">⏱️ {task.estimatedTime}min</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {viewMode === 'focus' && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-6xl mb-4">🎯</p>
                <p className="text-zinc-400 text-lg">Mode Focus</p>
                <p className="text-zinc-600 text-sm mt-2">Bientôt disponible</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Task Details Panel */}
      {selectedTask && (
        <TaskDetails
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
      
      {/* Project Modal */}
      {showProjectModal && (
        <ProjectModal onClose={() => setShowProjectModal(false)} />
      )}
    </div>
  )
}
