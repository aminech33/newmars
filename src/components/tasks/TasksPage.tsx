import { useState, useMemo } from 'react'
import { ArrowLeft, Plus, Search, LayoutList, LayoutGrid, Zap, TrendingUp, FolderKanban, X } from 'lucide-react'
import { useStore, Task, TaskCategory, PROJECTS } from '../../store/useStore'
import { SmartSuggestion } from './SmartSuggestion'
import { KanbanBoard } from './KanbanBoard'
import { TaskDetails } from './TaskDetails'
import { TaskFilters, TaskFilterState } from './TaskFilters'
import { analyzeProductivityPatterns, autoCategorizeTasks, estimateTaskDuration, detectPriority } from '../../utils/taskIntelligence'

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
  const { tasks, addTask, setView } = useStore()
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'all'>('all')
  const [selectedProject, setSelectedProject] = useState<string | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskProject, setNewTaskProject] = useState<string | undefined>(undefined)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
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
  
  // Get unique projects from tasks
  const projectsInUse = useMemo(() => {
    const projectNames = new Set(tasks.map(t => t.project).filter(Boolean))
    return PROJECTS.filter(p => projectNames.has(p.name))
  }, [tasks])
  
  // Project stats
  const projectStats = useMemo(() => {
    const stats: Record<string, { total: number; completed: number }> = {}
    tasks.forEach(task => {
      if (task.project) {
        if (!stats[task.project]) stats[task.project] = { total: 0, completed: 0 }
        stats[task.project].total++
        if (task.completed) stats[task.project].completed++
      }
    })
    return stats
  }, [tasks])
  
  // Filter tasks with advanced filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Project filter
      if (selectedProject !== 'all' && task.project !== selectedProject) return false
      
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
  }, [tasks, selectedCategory, selectedProject, searchQuery, advancedFilters])
  
  const handleQuickAdd = () => {
    if (newTaskTitle.trim()) {
      const category = autoCategorizeTasks(newTaskTitle)
      const estimatedTime = estimateTaskDuration(newTaskTitle)
      const priority = detectPriority(newTaskTitle)
      
      // Use selected project or the one from filter
      const project = newTaskProject || (selectedProject !== 'all' ? selectedProject : undefined)
      
      addTask({
        title: newTaskTitle,
        completed: false,
        category,
        status: 'todo',
        priority,
        estimatedTime,
        focusScore: 0,
        project
      })
      
      setNewTaskTitle('')
      setNewTaskProject(undefined)
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
                placeholder="Titre de la tâche..."
                className="w-full bg-transparent text-zinc-300 placeholder:text-zinc-700 focus:outline-none text-sm"
                autoFocus
              />
              
              {/* Project selector */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="text-xs text-zinc-600">Projet:</span>
                <button
                  onClick={() => setNewTaskProject(undefined)}
                  className={`px-2 py-1 rounded-lg text-xs transition-all ${
                    !newTaskProject && selectedProject === 'all'
                      ? 'bg-zinc-700 text-zinc-300'
                      : 'text-zinc-600 hover:text-zinc-400'
                  }`}
                >
                  Aucun
                </button>
                {PROJECTS.map((project) => (
                  <button
                    key={project.name}
                    onClick={() => setNewTaskProject(project.name)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
                      newTaskProject === project.name || (selectedProject === project.name && !newTaskProject)
                        ? 'text-white'
                        : 'text-zinc-600 hover:text-zinc-400'
                    }`}
                    style={
                      newTaskProject === project.name || (selectedProject === project.name && !newTaskProject)
                        ? { backgroundColor: `${project.color}30`, color: project.color }
                        : {}
                    }
                  >
                    <span>{project.icon}</span>
                    <span>{project.name}</span>
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleQuickAdd}
                  className="px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-xl text-xs hover:bg-indigo-500/30 transition-colors"
                >
                  Créer
                </button>
                <button
                  onClick={() => {
                    setShowQuickAdd(false)
                    setNewTaskProject(undefined)
                  }}
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
        {projectsInUse.length > 0 && (
          <div className="mb-6 p-4 bg-zinc-900/30 backdrop-blur-xl rounded-2xl"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <FolderKanban className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-medium text-zinc-400">Projets</h3>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSelectedProject('all')}
                className={`
                  px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-300
                  ${selectedProject === 'all'
                    ? 'bg-indigo-500/20 text-indigo-400 shadow-[0_2px_8px_rgba(91,127,255,0.2)]'
                    : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/30'
                  }
                `}
                style={selectedProject === 'all' ? { border: '1px solid rgba(91,127,255,0.2)' } : {}}
              >
                Tous
              </button>
              
              {projectsInUse.map((project) => {
                const stats = projectStats[project.name]
                return (
                  <button
                    key={project.name}
                    onClick={() => setSelectedProject(project.name)}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-300
                      ${selectedProject === project.name
                        ? 'bg-zinc-800/50 shadow-[0_2px_8px_rgba(0,0,0,0.2)]'
                        : 'hover:bg-zinc-800/30'
                      }
                    `}
                    style={{
                      border: selectedProject === project.name ? '1px solid rgba(255,255,255,0.08)' : 'none',
                      color: selectedProject === project.name ? project.color : '#71717a'
                    }}
                  >
                    <span>{project.icon}</span>
                    <span>{project.name}</span>
                    {stats && (
                      <span className="text-zinc-600">
                        ({stats.completed}/{stats.total})
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            
            {selectedProject !== 'all' && (
              <div className="mt-3 pt-3 border-t border-zinc-800/50">
                {(() => {
                  const project = PROJECTS.find(p => p.name === selectedProject)
                  const stats = projectStats[selectedProject]
                  if (!project || !stats) return null
                  
                  const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
                  
                  return (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-xs text-zinc-600">
                          Progression: <span className="text-zinc-400 font-medium">{progress}%</span>
                        </div>
                        <div className="text-xs text-zinc-600">
                          Tâches: <span className="text-zinc-400 font-medium">{stats.completed}/{stats.total}</span>
                        </div>
                        {/* Progress bar */}
                        <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${progress}%`, backgroundColor: project.color }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedProject('all')}
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
                    {task.project && (
                      <span 
                        className="px-2 py-0.5 rounded-lg text-xs"
                        style={{ 
                          backgroundColor: `${PROJECTS.find(p => p.name === task.project)?.color}20`,
                          color: PROJECTS.find(p => p.name === task.project)?.color 
                        }}
                      >
                        {PROJECTS.find(p => p.name === task.project)?.icon} {task.project}
                      </span>
                    )}
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
    </div>
  )
}
