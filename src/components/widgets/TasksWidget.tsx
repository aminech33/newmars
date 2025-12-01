import { memo, useMemo } from 'react'
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'

interface TasksWidgetProps {
  widget: Widget
}

export const TasksWidget = memo(function TasksWidget({ widget }: TasksWidgetProps) {
  const { id, size = 'small' } = widget
  const { tasks, setView, toggleTask } = useStore()
  
  const pendingTasks = useMemo(() => tasks.filter(t => !t.completed), [tasks])
  const urgentTasks = useMemo(() => pendingTasks.filter(t => t.priority === 'urgent'), [pendingTasks])
  const todayTasks = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return pendingTasks.filter(t => t.dueDate === today)
  }, [pendingTasks])

  // Small: Juste le nombre
  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="Tâches" currentSize={size} onClick={() => setView('tasks')}>
        <div className="flex flex-col items-center justify-center h-full">
          <div className="relative mb-2">
            <div className="text-5xl font-bold text-indigo-400">{pendingTasks.length}</div>
            {urgentTasks.length > 0 && (
              <div className="absolute -top-1 -right-3 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">{urgentTasks.length}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-zinc-500 font-medium">en attente</p>
        </div>
      </WidgetContainer>
    )
  }

  // Medium: Top 4 tâches
  if (size === 'medium') {
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
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        }
      >
        <div className="space-y-2 h-full overflow-hidden">
          {pendingTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2" />
              <p className="text-sm text-zinc-400 font-medium">Tout est fait !</p>
            </div>
          ) : (
            <>
              {pendingTasks.slice(0, 4).map((task) => (
                <button
                  key={task.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleTask(task.id)
                  }}
                  className="flex items-center gap-3 w-full text-left hover:bg-white/5 p-2 -m-2 rounded-xl transition-colors group"
                >
                  <Circle className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                  <span className="text-sm text-zinc-300 truncate flex-1">{task.title}</span>
                  {task.priority === 'urgent' && (
                    <div className="w-2 h-2 bg-rose-500 rounded-full flex-shrink-0" />
                  )}
                </button>
              ))}
              {pendingTasks.length > 4 && (
                <div className="text-xs text-zinc-600 text-center pt-1">
                  +{pendingTasks.length - 4} autres
                </div>
              )}
            </>
          )}
        </div>
      </WidgetContainer>
    )
  }

  // Large: 8 tâches + stats
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
          className="text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      }
    >
      <div className="flex flex-col h-full">
        {/* Stats header */}
        <div className="flex gap-2 mb-3 pb-3 border-b border-white/5">
          <div className="flex-1 bg-rose-500/10 rounded-lg p-2">
            <div className="text-xl font-bold text-rose-400">{urgentTasks.length}</div>
            <div className="text-[10px] text-rose-300/70 uppercase tracking-wide">Urgent</div>
          </div>
          <div className="flex-1 bg-amber-500/10 rounded-lg p-2">
            <div className="text-xl font-bold text-amber-400">{todayTasks.length}</div>
            <div className="text-[10px] text-amber-300/70 uppercase tracking-wide">Aujourd'hui</div>
          </div>
          <div className="flex-1 bg-indigo-500/10 rounded-lg p-2">
            <div className="text-xl font-bold text-indigo-400">{pendingTasks.length}</div>
            <div className="text-[10px] text-indigo-300/70 uppercase tracking-wide">Total</div>
          </div>
        </div>

        {/* Task list */}
        <div className="space-y-1.5 flex-1 overflow-auto">
          {pendingTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2" />
              <p className="text-sm text-zinc-400 font-medium">Tout est fait !</p>
            </div>
          ) : (
            <>
              {pendingTasks.slice(0, 8).map((task) => (
                <button
                  key={task.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleTask(task.id)
                  }}
                  className="flex items-center gap-3 w-full text-left hover:bg-white/5 p-2 -m-2 rounded-xl transition-colors group"
                >
                  <Circle className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300 truncate">{task.title}</p>
                    {task.dueDate && (
                      <p className="text-xs text-zinc-600">
                        {new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                  {task.priority === 'urgent' && (
                    <div className="w-2 h-2 bg-rose-500 rounded-full flex-shrink-0" />
                  )}
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </WidgetContainer>
  )
})
