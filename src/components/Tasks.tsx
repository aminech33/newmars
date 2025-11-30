import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { useStore, TaskCategory } from '../store/useStore'

const categories: { key: TaskCategory | 'all'; label: string; color: string }[] = [
  { key: 'all', label: 'Toutes', color: 'text-zinc-400' },
  { key: 'dev', label: 'Dev', color: 'text-indigo-400' },
  { key: 'design', label: 'Design', color: 'text-cyan-400' },
  { key: 'work', label: 'Travail', color: 'text-amber-400' },
  { key: 'personal', label: 'Perso', color: 'text-emerald-400' },
  { key: 'urgent', label: 'Urgent', color: 'text-rose-400' },
]

const categoryDots: Record<TaskCategory, string> = {
  dev: 'bg-indigo-400',
  design: 'bg-cyan-400',
  work: 'bg-amber-400',
  personal: 'bg-emerald-400',
  urgent: 'bg-rose-400',
}

export function Tasks() {
  const { tasks, addTask, toggleTask, deleteTask, updateTask, setView } = useStore()
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>('dev')
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'all'>('all')
  const [showCompleted, setShowCompleted] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(0)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)

  const filteredTasks = tasks
    .filter(task => {
      if (selectedCategory !== 'all' && task.category !== selectedCategory) return false
      if (!showCompleted && task.completed) return false
      return true
    })
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      return b.createdAt - a.createdAt
    })

  useEffect(() => {
    if (editingTaskId && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [editingTaskId])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAdding || editingTaskId) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedTaskIndex(i => Math.min(i + 1, filteredTasks.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedTaskIndex(i => Math.max(i - 1, 0))
      } else if (e.key === ' ' && filteredTasks[selectedTaskIndex]) {
        e.preventDefault()
        toggleTask(filteredTasks[selectedTaskIndex].id)
      } else if (e.key === 'Enter' && filteredTasks[selectedTaskIndex]) {
        e.preventDefault()
        const task = filteredTasks[selectedTaskIndex]
        setEditingTaskId(task.id)
        setEditValue(task.title)
      } else if (e.key === 'Delete' && filteredTasks[selectedTaskIndex]) {
        e.preventDefault()
        deleteTask(filteredTasks[selectedTaskIndex].id)
      } else if (e.key === 'n') {
        e.preventDefault()
        setIsAdding(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filteredTasks, selectedTaskIndex, isAdding, editingTaskId, toggleTask, deleteTask])

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    addTask({ 
      title: newTaskTitle.trim(), 
      completed: false, 
      category: newTaskCategory,
      status: 'todo',
      priority: 'medium'
    })
    setNewTaskTitle('')
    setIsAdding(false)
  }

  const handleEditTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editValue.trim() || !editingTaskId) return
    updateTask(editingTaskId, { title: editValue.trim() })
    setEditingTaskId(null)
    setEditValue('')
  }

  const startEditing = (taskId: string, title: string) => {
    setEditingTaskId(taskId)
    setEditValue(title)
  }

  const pendingCount = tasks.filter(t => !t.completed).length
  const completedCount = tasks.filter(t => t.completed).length

  return (
    <div className="h-full w-full flex flex-col view-transition">
      {/* Minimal Header */}
      <header className="flex-shrink-0 px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => setView('hub')}
            className="p-2 -ml-2 text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-medium tracking-tight text-zinc-200">Tâches</h1>
          </div>
          <span className="text-xs text-zinc-600">{pendingCount} en cours</span>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex">
        {/* Category Sidebar */}
        <aside className="w-36 flex-shrink-0 px-4 py-2 border-r border-zinc-900">
          <nav className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === cat.key
                    ? 'bg-zinc-900 text-zinc-200'
                    : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                {cat.label}
              </button>
            ))}
            
            <div className="pt-4 border-t border-zinc-900 mt-4">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  showCompleted ? 'text-zinc-400' : 'text-zinc-700'
                }`}
              >
                Terminées ({completedCount})
              </button>
            </div>
          </nav>
        </aside>

        {/* Task List */}
        <main className="flex-1 overflow-auto px-6 py-4">
          <div className="max-w-2xl">
            {/* Add Task */}
            {isAdding ? (
              <form onSubmit={handleAddTask} className="mb-6 animate-fade-in">
                <div className="flex items-center gap-4 py-3 border-b border-zinc-800">
                  <span className="w-4 h-4 rounded-full border-2 border-zinc-700" />
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Nouvelle tâche..."
                    className="flex-1 bg-transparent text-zinc-200 placeholder:text-zinc-700 focus:outline-none"
                    autoFocus
                  />
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value as TaskCategory)}
                    className="bg-transparent text-xs text-zinc-500 border border-zinc-800 rounded px-2 py-1 focus:outline-none"
                  >
                    <option value="dev">Dev</option>
                    <option value="design">Design</option>
                    <option value="work">Travail</option>
                    <option value="personal">Perso</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="text-zinc-600 hover:text-zinc-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                className="w-full flex items-center gap-4 py-3 mb-4 text-zinc-700 hover:text-zinc-500 transition-colors group"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Ajouter une tâche</span>
                <span className="text-xs text-zinc-800 ml-auto">N</span>
              </button>
            )}

            {/* Tasks */}
            <div className="space-y-0">
              {filteredTasks.map((task, index) => (
                <div
                  key={task.id}
                  className={`group flex items-center gap-4 py-3.5 border-b border-zinc-900 hover:border-zinc-800 transition-colors animate-fade-in ${
                    index === selectedTaskIndex && !editingTaskId ? 'bg-zinc-900/30' : ''
                  }`}
                  style={{ animationDelay: `${index * 20}ms` }}
                  onDoubleClick={() => startEditing(task.id, task.title)}
                >
                  {/* Circle Checkbox */}
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`flex-shrink-0 w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                      task.completed
                        ? 'bg-zinc-600 border-zinc-600'
                        : 'border-zinc-700 hover:border-zinc-500'
                    }`}
                  >
                    {task.completed && (
                      <svg className="w-full h-full text-zinc-900" viewBox="0 0 16 16">
                        <path
                          fill="currentColor"
                          d="M6.5 10.5L4 8l-.7.7 3.2 3.2 6.5-6.5-.7-.7z"
                        />
                      </svg>
                    )}
                  </button>
                  
                  {/* Task Title - Editable */}
                  {editingTaskId === task.id ? (
                    <form onSubmit={handleEditTask} className="flex-1">
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => {
                          if (editValue.trim()) {
                            updateTask(task.id, { title: editValue.trim() })
                          }
                          setEditingTaskId(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setEditingTaskId(null)
                            setEditValue('')
                          }
                        }}
                        className="w-full bg-transparent text-zinc-200 text-sm border-b border-indigo-500/50 focus:outline-none"
                      />
                    </form>
                  ) : (
                    <span className={`flex-1 text-sm transition-colors ${
                      task.completed ? 'text-zinc-700 line-through' : 'text-zinc-300'
                    }`}>
                      {task.title}
                    </span>
                  )}
                  
                  {/* Category Dot */}
                  <span className={`w-1.5 h-1.5 rounded-full ${categoryDots[task.category]} opacity-60`} />
                  
                  {/* Delete */}
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-rose-400 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {filteredTasks.length === 0 && (
                <div className="py-16 text-center">
                  <p className="text-zinc-700 text-sm">Aucune tâche</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Keyboard hints */}
      <div className="flex-shrink-0 px-6 py-3 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-6 text-xs text-zinc-700">
          <span><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">↑↓</kbd> Naviguer</span>
          <span><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">Space</kbd> Toggle</span>
          <span><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">Enter</kbd> Éditer</span>
          <span><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">N</kbd> Nouveau</span>
          <span><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">Del</kbd> Supprimer</span>
        </div>
      </div>
    </div>
  )
}
