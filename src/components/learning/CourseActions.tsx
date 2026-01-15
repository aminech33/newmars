import { memo } from 'react'
import { ListTodo, BarChart3 } from 'lucide-react'

interface CourseActionsProps {
  showTasks: boolean
  showStats: boolean
  onToggleTasks: () => void
  onToggleStats: () => void
  tasksCount?: number
}

export const CourseActions = memo(function CourseActions({
  showTasks,
  showStats,
  onToggleTasks,
  onToggleStats,
  tasksCount = 0
}: CourseActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onToggleTasks}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          showTasks
            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
        }`}
        title="Tâches liées"
      >
        <ListTodo className="w-3.5 h-3.5" />
        {tasksCount > 0 && <span className="text-xs">{tasksCount}</span>}
      </button>

      <button
        onClick={onToggleStats}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          showStats
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
        }`}
        title="Statistiques"
      >
        <BarChart3 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
})

