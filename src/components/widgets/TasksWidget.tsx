import { memo, useMemo } from 'react'
import { CheckCircle2, Circle, ArrowRight, AlertCircle } from 'lucide-react'
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

  // Small: Count + first task (Apple style)
  if (size === 'small') {
    const firstTask = pendingTasks[0]
    
    return (
      <WidgetContainer id={id} title="" currentSize={size} onClick={() => setView('tasks')}>
        <div className="h-full flex flex-col items-center justify-center gap-4 p-6">
          {/* Title */}
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Tâches
          </div>

          {/* BIG COUNT */}
          <div className="text-7xl font-bold text-white tabular-nums leading-none">
            {pendingTasks.length}
          </div>

          {/* Subtitle */}
          <div className="text-xs text-zinc-500">
            en attente
          </div>

          {/* Urgent badge - if exists */}
          {urgentTasks.length > 0 && (
            <div className="mt-2 px-3 py-1.5 bg-rose-500/20 rounded-full border border-rose-500/30">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-xs text-rose-400 font-medium">{urgentTasks.length} urgente{urgentTasks.length > 1 ? 's' : ''}</span>
              </div>
            </div>
          )}
        </div>
      </WidgetContainer>
    )
  }

  // Medium: Interactive task list (5 tasks)
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
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        }
      >
        <div className="h-full flex flex-col gap-3">
          {/* Summary card */}
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-white">{pendingTasks.length} en attente</div>
              <div className="text-xs text-zinc-400">
                {urgentTasks.length > 0 ? `${urgentTasks.length} urgente${urgentTasks.length > 1 ? 's' : ''}` : 'Aucune urgente'}
              </div>
            </div>
            {urgentTasks.length > 0 && (
              <div className="flex items-center justify-center w-7 h-7 bg-rose-500/20 rounded-full">
                <span className="text-xs font-bold text-rose-400">{urgentTasks.length}</span>
              </div>
            )}
          </div>

          {/* Task list */}
          <div className="flex-1 space-y-1 overflow-auto">
            {pendingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <CheckCircle2 className="w-10 h-10 text-zinc-600 mb-2" />
                <p className="text-sm text-zinc-500 font-medium">Tout est fait !</p>
              </div>
            ) : (
              <>
                {pendingTasks.slice(0, 5).map((task) => (
                  <button
                    key={task.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleTask(task.id)
                    }}
                    className="flex items-center gap-2 w-full text-left hover:bg-white/5 p-2 rounded-lg transition-colors group"
                  >
                    <Circle className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 transition-colors flex-shrink-0" />
                    <span className="text-xs text-zinc-300 group-hover:text-white truncate flex-1">
                      {task.title}
                    </span>
                    {task.priority === 'urgent' && (
                      <AlertCircle className="w-3 h-3 text-rose-400 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      </WidgetContainer>
    )
  }

  // Large: Stats + full interactive list
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
          className="text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      }
    >
      <div className="h-full flex flex-col gap-3">
        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-2xl font-bold text-white tabular-nums">{pendingTasks.length}</div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-wide">En attente</div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-2xl font-bold text-rose-400 tabular-nums">{urgentTasks.length}</div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-wide">Urgentes</div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-2xl font-bold text-emerald-400 tabular-nums">{tasks.filter(t => t.completed).length}</div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-wide">Complétées</div>
          </div>
        </div>

        {/* Task list with categories */}
        <div className="flex-1 space-y-3 overflow-auto">
          {pendingTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <CheckCircle2 className="w-12 h-12 text-zinc-600 mb-2" />
              <p className="text-sm text-zinc-500 font-medium">Tout est fait !</p>
            </div>
          ) : (
            <>
              {/* Today's tasks */}
              {todayTasks.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                    Aujourd'hui ({todayTasks.length})
                  </div>
                  <div className="space-y-1">
                    {todayTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleTask(task.id)
                        }}
                        className="flex items-center gap-2 w-full text-left hover:bg-white/5 p-2 rounded-lg transition-colors group"
                      >
                        <Circle className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 transition-colors flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-zinc-300 group-hover:text-white truncate">
                            {task.title}
                          </p>
                        </div>
                        {task.priority === 'urgent' && (
                          <AlertCircle className="w-3 h-3 text-rose-400 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Other tasks */}
              {pendingTasks.filter(t => !todayTasks.includes(t)).length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                    Autres ({pendingTasks.filter(t => !todayTasks.includes(t)).length})
                  </div>
                  <div className="space-y-1">
                    {pendingTasks
                      .filter(t => !todayTasks.includes(t))
                      .slice(0, 6)
                      .map((task) => (
                        <button
                          key={task.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleTask(task.id)
                          }}
                          className="flex items-center gap-2 w-full text-left hover:bg-white/5 p-2 rounded-lg transition-colors group"
                        >
                          <Circle className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 transition-colors flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-zinc-300 group-hover:text-white truncate">
                              {task.title}
                            </p>
                            {task.dueDate && (
                              <p className="text-[10px] text-zinc-600">
                                {new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                              </p>
                            )}
                          </div>
                          {task.priority === 'urgent' && (
                            <AlertCircle className="w-3 h-3 text-rose-400 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </WidgetContainer>
  )
})
