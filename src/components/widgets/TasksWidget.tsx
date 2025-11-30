import { ArrowRight } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'

interface TasksWidgetProps {
  widget: Widget
}

export function TasksWidget({ widget }: TasksWidgetProps) {
  const { id, size = 'small' } = widget
  const { tasks, setView } = useStore()
  const pendingTasks = tasks.filter(t => !t.completed)

  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="Tâches" currentSize={size}>
        <button
          onClick={() => setView('tasks')}
          className="flex flex-col items-center justify-center h-full text-center group"
        >
          <p className="text-4xl font-extralight text-zinc-200 mb-1">{pendingTasks.length}</p>
          <p className="text-xs text-zinc-600">en cours</p>
        </button>
      </WidgetContainer>
    )
  }

  return (
    <WidgetContainer 
      id={id} 
      title="Tâches"
      currentSize={size}
      onClick={() => setView('tasks')}
      actions={
        <button
          onClick={(e) => {
            e.stopPropagation()
            setView('tasks')
          }}
          className="text-zinc-700 hover:text-zinc-500 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      }
    >
      <div className="space-y-2 overflow-auto h-full">
        {pendingTasks.slice(0, size === 'large' ? 6 : 3).map((task) => (
          <div key={task.id} className="flex items-center gap-3 text-sm hover:bg-zinc-800/30 rounded-lg p-2 -m-2 transition-colors">
            <span className="w-1 h-1 rounded-full bg-zinc-700 flex-shrink-0" />
            <span className="text-zinc-500 truncate">{task.title}</span>
          </div>
        ))}
        {pendingTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-4">
            <div className="text-4xl mb-3">🎯</div>
            <p className="text-zinc-400 text-sm font-medium mb-1">Aucune tâche !</p>
            <p className="text-zinc-700 text-xs">Profitez de ce moment</p>
          </div>
        )}
      </div>
    </WidgetContainer>
  )
}
