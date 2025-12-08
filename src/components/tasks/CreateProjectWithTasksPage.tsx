import { useState, useRef } from 'react'
import { Plus, Trash2, FolderPlus, X, ArrowLeft, Settings } from 'lucide-react'
import { PROJECT_COLORS, PROJECT_ICONS, TaskCategory, useStore } from '../../store/useStore'
import { Button } from '../ui/Button'

type DeadlineGroup = 'this-week' | 'next-week' | 'rest-of-month' | 'next-month' | 'rest-of-quarter' | 'no-deadline'

interface TaskItem {
  id: string
  title: string
  group: DeadlineGroup
  customDate?: string
}

const deadlineGroups: { 
  key: DeadlineGroup; 
  label: string; 
  emoji: string; 
  getDate: () => string | undefined;
  getMinDate?: () => string;
  getMaxDate?: () => string;
}[] = [
  { 
    key: 'this-week', 
    label: 'Cette semaine', 
    emoji: '🔥',
    getDate: () => {
      const d = new Date()
      d.setDate(d.getDate() + 7)
      return d.toISOString().split('T')[0]
    },
    getMinDate: () => {
      const d = new Date()
      return d.toISOString().split('T')[0]
    },
    getMaxDate: () => {
      const d = new Date()
      d.setDate(d.getDate() + 7)
      return d.toISOString().split('T')[0]
    }
  },
  { 
    key: 'next-week', 
    label: 'Semaine prochaine', 
    emoji: '📅',
    getDate: () => {
      const d = new Date()
      d.setDate(d.getDate() + 14)
      return d.toISOString().split('T')[0]
    },
    getMinDate: () => {
      const d = new Date()
      d.setDate(d.getDate() + 8)
      return d.toISOString().split('T')[0]
    },
    getMaxDate: () => {
      const d = new Date()
      d.setDate(d.getDate() + 14)
      return d.toISOString().split('T')[0]
    }
  },
  { 
    key: 'rest-of-month', 
    label: 'Reste du mois', 
    emoji: '📆',
    getDate: () => {
      const d = new Date()
      d.setMonth(d.getMonth() + 1, 0)
      return d.toISOString().split('T')[0]
    },
    getMinDate: () => {
      const d = new Date()
      d.setDate(d.getDate() + 15)
      return d.toISOString().split('T')[0]
    },
    getMaxDate: () => {
      const d = new Date()
      d.setMonth(d.getMonth() + 1, 0)
      return d.toISOString().split('T')[0]
    }
  },
  { 
    key: 'next-month', 
    label: 'Mois prochain', 
    emoji: '🗓️',
    getDate: () => {
      const d = new Date()
      d.setMonth(d.getMonth() + 2, 0)
      return d.toISOString().split('T')[0]
    },
    getMinDate: () => {
      const d = new Date()
      d.setMonth(d.getMonth() + 1, 1)
      return d.toISOString().split('T')[0]
    },
    getMaxDate: () => {
      const d = new Date()
      d.setMonth(d.getMonth() + 2, 0)
      return d.toISOString().split('T')[0]
    }
  },
  { 
    key: 'rest-of-quarter', 
    label: 'Reste du trimestre', 
    emoji: '📊',
    getDate: () => {
      const d = new Date()
      const currentMonth = d.getMonth()
      const quarterEndMonth = Math.floor(currentMonth / 3) * 3 + 2
      d.setMonth(quarterEndMonth + 1, 0)
      return d.toISOString().split('T')[0]
    },
    getMinDate: () => {
      const d = new Date()
      d.setMonth(d.getMonth() + 2, 1)
      return d.toISOString().split('T')[0]
    },
    getMaxDate: () => {
      const d = new Date()
      const currentMonth = d.getMonth()
      const quarterEndMonth = Math.floor(currentMonth / 3) * 3 + 2
      d.setMonth(quarterEndMonth + 1, 0)
      return d.toISOString().split('T')[0]
    }
  },
  { 
    key: 'no-deadline', 
    label: 'Sans deadline', 
    emoji: '💭',
    getDate: () => undefined
  },
]

interface CreateProjectWithTasksPageProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (projectData: {
    name: string
    color: string
    icon: string
    tasks: Array<{ title: string; dueDate?: string; priority: 'medium'; category: TaskCategory }>
  }) => void
}

export function CreateProjectWithTasksPage({ isOpen, onClose, onCreate }: CreateProjectWithTasksPageProps) {
  const { getAllCategories, addCategory } = useStore()
  const categories = getAllCategories()
  
  const [projectName, setProjectName] = useState('')
  const [projectColor, setProjectColor] = useState(PROJECT_COLORS[0])
  const [projectIcon, setProjectIcon] = useState(PROJECT_ICONS[0])
  const [projectCategory, setProjectCategory] = useState<TaskCategory>('work')
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [activeGroup, setActiveGroup] = useState<DeadlineGroup>('this-week')
  const [inputValue, setInputValue] = useState('')
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryLabel, setNewCategoryLabel] = useState('')
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('📁')
  const [groupCustomDates, setGroupCustomDates] = useState<Record<DeadlineGroup, string>>({
    'this-week': '',
    'next-week': '',
    'rest-of-month': '',
    'next-month': '',
    'rest-of-quarter': '',
    'no-deadline': ''
  })
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAddTask = () => {
    const title = inputValue.trim()
    if (!title) return
    
    const newTask: TaskItem = {
      id: Date.now().toString(),
      title,
      group: activeGroup
    }
    
    setTasks([...tasks, newTask])
    setInputValue('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTask()
    }
  }

  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id))
  }

  const getTasksByGroup = (group: DeadlineGroup) => tasks.filter(t => t.group === group)

  const handleAddCategory = () => {
    if (!newCategoryLabel.trim()) return
    const newId = addCategory(newCategoryLabel.trim(), newCategoryEmoji)
    setProjectCategory(newId)
    setNewCategoryLabel('')
    setNewCategoryEmoji('📁')
    setShowAddCategory(false)
  }

  const handleSubmit = () => {
    if (!projectName.trim()) return

    const tasksWithDates = tasks.map(task => {
      const customDate = groupCustomDates[task.group]
      const groupConfig = deadlineGroups.find(g => g.key === task.group)
      
      return {
        title: task.title,
        dueDate: customDate || groupConfig?.getDate(),
        priority: 'medium' as const,
        category: projectCategory
      }
    })

    onCreate({
      name: projectName,
      color: projectColor,
      icon: projectIcon,
      tasks: tasksWithDates
    })

    // Reset
    setProjectName('')
    setProjectColor(PROJECT_COLORS[0])
    setProjectIcon(PROJECT_ICONS[0])
    setProjectCategory('work')
    setTasks([])
    setInputValue('')
    setActiveGroup('this-week')
    setGroupCustomDates({
      'this-week': '',
      'next-week': '',
      'rest-of-month': '',
      'next-month': '',
      'rest-of-quarter': '',
      'no-deadline': ''
    })
  }

  const totalTasks = tasks.length

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-mars-surface overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-mars-surface/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Retour</span>
            </button>
            
            <div className="flex items-center gap-3">
              <p className="text-sm text-zinc-500">
                {totalTasks} tâche{totalTasks !== 1 ? 's' : ''}
              </p>
              <Button 
                variant="primary"
                onClick={handleSubmit}
                disabled={!projectName.trim()}
              >
                Créer le projet
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Project Info */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Nouveau projet</h2>
              
              {/* Project Name & Icon */}
              <div className="flex items-center gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = PROJECT_ICONS.indexOf(projectIcon)
                    setProjectIcon(PROJECT_ICONS[(currentIndex + 1) % PROJECT_ICONS.length])
                  }}
                  className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"
                >
                  <span className="text-4xl">{projectIcon}</span>
                </button>
                <div className="flex-1">
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Nom du projet..."
                    autoFocus
                    className="w-full bg-transparent text-2xl font-semibold text-white placeholder:text-zinc-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Color Picker */}
              <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/5 mb-6">
                <label className="block text-sm font-medium text-zinc-400 mb-4">
                  Couleur du projet
                </label>
                <div className="flex gap-3 flex-wrap">
                  {PROJECT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setProjectColor(color)}
                      className={`w-12 h-12 rounded-xl transition-transform ${
                        projectColor === color ? 'scale-125 ring-2 ring-white/50 ring-offset-4 ring-offset-mars-surface' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Category Picker */}
              <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-zinc-400">
                    Catégorie (pour toutes les tâches)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(!showAddCategory)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Nouvelle
                  </button>
                </div>
                
                {showAddCategory && (
                  <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCategoryEmoji}
                        onChange={(e) => setNewCategoryEmoji(e.target.value)}
                        placeholder="📁"
                        maxLength={2}
                        className="w-12 text-center bg-zinc-900/50 text-white px-2 py-2 rounded-lg border border-white/5 focus:border-indigo-500/50 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={newCategoryLabel}
                        onChange={(e) => setNewCategoryLabel(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                        placeholder="Nom de la catégorie..."
                        className="flex-1 bg-zinc-900/50 text-white px-3 py-2 rounded-lg border border-white/5 focus:border-indigo-500/50 focus:outline-none text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        disabled={!newCategoryLabel.trim()}
                        className="px-3 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors disabled:opacity-30 text-sm"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2 flex-wrap">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setProjectCategory(cat.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        projectCategory === cat.id
                          ? 'bg-indigo-500/20 text-indigo-400 ring-2 ring-indigo-500/30'
                          : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-300'
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Add Task Input */}
            <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/5">
              <label className="block text-sm font-medium text-zinc-400 mb-4">
                Ajouter des tâches
              </label>
              
              {/* Group selector - Wrapped */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {deadlineGroups.map((group) => (
                  <button
                    key={group.key}
                    type="button"
                    onClick={() => setActiveGroup(group.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      activeGroup === group.key
                        ? 'bg-indigo-500/20 text-indigo-400 ring-2 ring-indigo-500/30'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                    }`}
                  >
                    <span>{group.emoji}</span>
                    <span className="whitespace-nowrap">{group.label}</span>
                  </button>
                ))}
              </div>

              {/* Input + Button */}
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Nouvelle tâche pour "${deadlineGroups.find(g => g.key === activeGroup)?.label}"...`}
                  className="flex-1 bg-white/5 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none px-4 py-3 rounded-xl focus:bg-white/10 border border-white/5 focus:border-indigo-500/50"
                />
                <button
                  type="button"
                  onClick={handleAddTask}
                  disabled={!inputValue.trim()}
                  className="px-4 py-3 bg-indigo-500/20 text-indigo-400 rounded-xl hover:bg-indigo-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Ajouter</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Tasks List */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-6">Tâches du projet</h3>
            
            <div className="space-y-6">
              {deadlineGroups.map((group) => {
                const groupTasks = getTasksByGroup(group.key)
                if (groupTasks.length === 0) return null
                
                const defaultDate = group.getDate()
                const customDate = groupCustomDates[group.key]
                const minDate = group.getMinDate?.()
                const maxDate = group.getMaxDate?.()
                
                return (
                  <div key={group.key} className="bg-white/[0.02] rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-lg">{group.emoji}</span>
                      <span className="text-sm font-medium text-zinc-300">{group.label}</span>
                      <span className="text-xs text-zinc-600">({groupTasks.length})</span>
                      
                      {/* Date picker for this group */}
                      {group.key !== 'no-deadline' && (
                        <input
                          type="date"
                          value={customDate || defaultDate || ''}
                          min={minDate}
                          max={maxDate}
                          onChange={(e) => setGroupCustomDates(prev => ({
                            ...prev,
                            [group.key]: e.target.value
                          }))}
                          className="ml-auto text-xs bg-zinc-900/50 text-zinc-400 px-3 py-1.5 rounded-lg border border-white/5 focus:border-indigo-500/50 focus:outline-none"
                          title={`Date entre le ${minDate} et le ${maxDate}`}
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      {groupTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 group p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                          <span className="flex-1 text-sm text-zinc-300">{task.title}</span>
                          <button
                            type="button"
                            onClick={() => removeTask(task.id)}
                            className="p-1.5 text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-rose-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Empty state */}
              {totalTasks === 0 && (
                <div className="text-center py-16 bg-white/[0.02] rounded-2xl border border-dashed border-zinc-800">
                  <FolderPlus className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
                  <p className="text-sm text-zinc-600">Aucune tâche ajoutée</p>
                  <p className="text-xs text-zinc-700 mt-2">
                    Sélectionnez une période et ajoutez des tâches
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

