import { memo, useMemo } from 'react'
import { AlertCircle, Circle, CheckSquare, CheckCircle2 } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'

interface TasksWidgetProps {
  widget: Widget
}

export const TasksWidget = memo(function TasksWidget({ widget }: TasksWidgetProps) {
  const { id } = widget
  const { tasks, setView, toggleTask } = useStore()
  
  const pendingTasks = useMemo(() => tasks.filter(t => !t.completed), [tasks])
  const urgentTasks = useMemo(() => pendingTasks.filter(t => t.priority === 'urgent'), [pendingTasks])
  
  // Top 3 tâches (urgentes en premier)
  const topTasks = useMemo(() => {
    const urgent = pendingTasks.filter(t => t.priority === 'urgent').slice(0, 3)
    if (urgent.length >= 3) return urgent
    
    const remaining = pendingTasks.filter(t => t.priority !== 'urgent').slice(0, 3 - urgent.length)
    return [...urgent, ...remaining]
  }, [pendingTasks])

  return (
    <WidgetContainer id={id} title="" currentSize="notification" onClick={() => setView('tasks')}>
      <div className="h-full flex flex-col p-6 gap-4">
        {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <CheckSquare className="w-12 h-12 text-emerald-400" strokeWidth={1.5} />
              </div>
          {urgentTasks.length > 0 && (
            <div className="px-3 py-1 bg-gradient-to-br from-rose-500 to-rose-600 rounded-full shadow-lg shadow-rose-500/30">
              <span className="text-sm font-bold text-white">{urgentTasks.length}</span>
            </div>
          )}
        </div>

        {/* Big Count */}
        <div className="text-center">
          <div className="text-6xl font-bold text-white tabular-nums leading-none">
            {pendingTasks.length}
          </div>
          <div className="text-sm text-zinc-500 uppercase tracking-wide mt-2">
            tâches
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 space-y-2 overflow-hidden">
          {topTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-zinc-500 text-sm py-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-2" />
              <span>Tout est fait !</span>
            </div>
          ) : (
            topTasks.map((task) => (
              <button
                key={task.id}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleTask(task.id)
                }}
                className="flex items-start gap-2 w-full text-left p-2 rounded-lg
                           hover:bg-white/5 transition-colors group"
              >
                <Circle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5
                                   group-hover:text-emerald-300 transition-colors" />
                <span className="text-sm text-zinc-300 group-hover:text-white 
                                 transition-colors line-clamp-2 flex-1">
                  {task.title}
                </span>
                {task.priority === 'urgent' && (
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        {urgentTasks.length > 0 && (
          <div className="text-center pt-2 border-t border-white/10">
            <span className="text-xs text-rose-400 font-medium">
              {urgentTasks.length} urgente{urgentTasks.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </WidgetContainer>
  )
})
