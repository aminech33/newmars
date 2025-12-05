import { useState, useRef } from 'react'
import { Plus, Trash2, FolderPlus } from 'lucide-react'
import { PROJECT_COLORS, PROJECT_ICONS } from '../../store/useStore'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

type DeadlineGroup = 'this-week' | 'next-week' | 'this-month' | 'no-deadline'

interface TaskItem {
  id: string
  title: string
  group: DeadlineGroup
}

const deadlineGroups: { key: DeadlineGroup; label: string; emoji: string; getDate: () => string | undefined }[] = [
  { 
    key: 'this-week', 
    label: 'Cette semaine', 
    emoji: '🔥',
    getDate: () => {
      const d = new Date()
      d.setDate(d.getDate() + (7 - d.getDay()))
      return d.toISOString().split('T')[0]
    }
  },
  { 
    key: 'next-week', 
    label: 'Semaine prochaine', 
    emoji: '📅',
    getDate: () => {
      const d = new Date()
      d.setDate(d.getDate() + (14 - d.getDay()))
      return d.toISOString().split('T')[0]
    }
  },
  { 
    key: 'this-month', 
    label: 'Ce mois', 
    emoji: '📆',
    getDate: () => {
      const d = new Date()
      d.setMonth(d.getMonth() + 1, 0)
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

interface CreateProjectWithTasksModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (projectData: {
    name: string
    color: string
    icon: string
    tasks: Array<{ title: string; dueDate?: string; priority: 'medium'; category: 'work' }>
  }) => void
}

export function CreateProjectWithTasksModal({ isOpen, onClose, onCreate }: CreateProjectWithTasksModalProps) {
  const [projectName, setProjectName] = useState('')
  const [projectColor, setProjectColor] = useState(PROJECT_COLORS[0])
  const [projectIcon, setProjectIcon] = useState(PROJECT_ICONS[0])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [activeGroup, setActiveGroup] = useState<DeadlineGroup>('this-week')
  const [inputValue, setInputValue] = useState('')
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

  const handleSubmit = () => {
    if (!projectName.trim()) return

    const tasksWithDates = tasks.map(task => {
      const groupConfig = deadlineGroups.find(g => g.key === task.group)
      return {
        title: task.title,
        dueDate: groupConfig?.getDate(),
        priority: 'medium' as const,
        category: 'work' as const
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
    setTasks([])
    setInputValue('')
    setActiveGroup('this-week')
  }

  const totalTasks = tasks.length

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <p className="text-sm text-zinc-500">
            {totalTasks} tâche{totalTasks !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              variant="primary"
              onClick={handleSubmit}
              disabled={!projectName.trim()}
            >
              Créer le projet
            </Button>
          </div>
        </div>
      }
    >
      {/* Header - Project Name */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => {
            const currentIndex = PROJECT_ICONS.indexOf(projectIcon)
            setProjectIcon(PROJECT_ICONS[(currentIndex + 1) % PROJECT_ICONS.length])
          }}
          className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
        >
          <span className="text-2xl">{projectIcon}</span>
        </button>
        <div className="flex-1">
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Nom du projet..."
            className="w-full bg-transparent text-xl font-semibold text-white placeholder:text-zinc-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Color Picker */}
      <div className="flex items-center gap-2 mb-6 pb-6 border-b border-white/5">
        <span className="text-xs text-zinc-500">Couleur:</span>
        <div className="flex gap-1.5">
          {PROJECT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setProjectColor(color)}
              className={`w-6 h-6 rounded-full transition-transform ${
                projectColor === color ? 'scale-125 ring-2 ring-white/30' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Task Input - SIMPLE */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Ajouter des tâches
        </label>
        
        {/* Group selector */}
        <div className="flex gap-2 mb-3">
          {deadlineGroups.map((group) => (
            <button
              key={group.key}
              type="button"
              onClick={() => setActiveGroup(group.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeGroup === group.key
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              }`}
            >
              <span>{group.emoji}</span>
              <span>{group.label}</span>
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

      {/* Tasks List */}
      <div className="space-y-4 max-h-[300px] overflow-y-auto">
        {deadlineGroups.map((group) => {
          const groupTasks = getTasksByGroup(group.key)
          if (groupTasks.length === 0) return null
          
          return (
            <div key={group.key}>
              <div className="flex items-center gap-2 mb-2">
                <span>{group.emoji}</span>
                <span className="text-sm font-medium text-zinc-400">{group.label}</span>
                <span className="text-xs text-zinc-600">({groupTasks.length})</span>
              </div>
              <div className="space-y-1 pl-6">
                {groupTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 group py-1"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span className="flex-1 text-sm text-zinc-300">{task.title}</span>
                    <button
                      type="button"
                      onClick={() => removeTask(task.id)}
                      className="p-1 text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {totalTasks === 0 && (
        <div className="text-center py-8 bg-zinc-800/20 rounded-xl border border-dashed border-zinc-800">
          <FolderPlus className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
          <p className="text-sm text-zinc-600">Aucune tâche ajoutée</p>
          <p className="text-xs text-zinc-700 mt-1">Tapez ci-dessus et appuyez sur Entrée ou cliquez sur Ajouter</p>
        </div>
      )}
    </Modal>
  )
}
