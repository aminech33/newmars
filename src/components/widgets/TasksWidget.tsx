import { memo, useMemo } from 'react'
import { AlertCircle, Clock, Zap, CheckSquare, CheckCircle2 } from 'lucide-react'
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
  
  // Command Center Logic
  const urgentTasks = useMemo(() => {
    const now = new Date()
    return pendingTasks.filter(t => {
      if (t.priority === 'urgent') return true
      if (t.dueDate) {
        const due = new Date(t.dueDate)
        const hoursUntil = (due.getTime() - now.getTime()) / (1000 * 60 * 60)
        return hoursUntil > 0 && hoursUntil < 3
      }
      return false
    }).slice(0, 2)
  }, [pendingTasks])
  
  const quickWins = useMemo(() => {
    return pendingTasks
      .filter(t => t.estimatedTime && t.estimatedTime <= 15 && t.priority !== 'urgent')
      .slice(0, 2)
  }, [pendingTasks])
  
  const todayTasks = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return pendingTasks
      .filter(t => t.dueDate && t.dueDate.startsWith(today) && t.priority !== 'urgent')
      .slice(0, 2)
  }, [pendingTasks])
  
  const overdueTasks = useMemo(() => {
    const now = new Date()
    return pendingTasks
      .filter(t => t.dueDate && new Date(t.dueDate) < now)
      .slice(0, 2)
  }, [pendingTasks])

  const hasCommandCenter = urgentTasks.length > 0 || quickWins.length > 0 || todayTasks.length > 0 || overdueTasks.length > 0

  return (
    <WidgetContainer id={id} title="" currentSize="notification" onClick={() => setView('tasks')}>
      <div className="h-full flex flex-col p-4 gap-2 relative">
        {/* Header compact */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
            <div className="text-2xl font-bold text-white tabular-nums leading-none">
              {pendingTasks.length}
            </div>
            <div className="text-[10px] text-emerald-400/80 uppercase tracking-wider font-semibold">
              TÂCHES
            </div>
          </div>
        </div>

        {/* Command Center - Priorités */}
        {hasCommandCenter ? (
          <div className="flex-1 space-y-2 overflow-hidden">
            {/* Urgences */}
            {urgentTasks.length > 0 && (
              <div className="p-2 rounded-lg bg-rose-500/10 border-l-2 border-rose-500">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertCircle className="w-3 h-3 text-rose-400" />
                  <span className="text-[10px] font-bold text-rose-400 uppercase">{urgentTasks.length} Urgent</span>
                </div>
                {urgentTasks.map(task => (
                  <button
                    key={task.id}
                    onClick={(e) => { e.stopPropagation(); toggleTask(task.id) }}
                    className="w-full text-left text-xs text-rose-200 hover:text-white truncate py-0.5"
                  >
                    • {task.title}
                  </button>
                ))}
              </div>
            )}
            
            {/* En retard */}
            {overdueTasks.length > 0 && (
              <div className="p-2 rounded-lg bg-amber-500/10 border-l-2 border-amber-500">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertCircle className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] font-bold text-amber-400 uppercase">{overdueTasks.length} En retard</span>
                </div>
                {overdueTasks.map(task => (
                  <button
                    key={task.id}
                    onClick={(e) => { e.stopPropagation(); toggleTask(task.id) }}
                    className="w-full text-left text-xs text-amber-200 hover:text-white truncate py-0.5"
                  >
                    • {task.title}
                  </button>
                ))}
              </div>
            )}
            
            {/* Quick Wins */}
            {quickWins.length > 0 && (
              <div className="p-2 rounded-lg bg-emerald-500/10 border-l-2 border-emerald-500">
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">{quickWins.length} Quick Win</span>
                  <span className="text-[9px] text-zinc-500">(&lt;15min)</span>
                </div>
                {quickWins.map(task => (
                  <button
                    key={task.id}
                    onClick={(e) => { e.stopPropagation(); toggleTask(task.id) }}
                    className="w-full text-left text-xs text-emerald-200 hover:text-white truncate py-0.5"
                  >
                    • {task.title}
                  </button>
                ))}
              </div>
            )}
            
            {/* Aujourd'hui */}
            {todayTasks.length > 0 && (
              <div className="p-2 rounded-lg bg-cyan-500/10 border-l-2 border-cyan-500">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span className="text-[10px] font-bold text-cyan-400 uppercase">{todayTasks.length} Aujourd'hui</span>
                </div>
                {todayTasks.map(task => (
                  <button
                    key={task.id}
                    onClick={(e) => { e.stopPropagation(); toggleTask(task.id) }}
                    className="w-full text-left text-xs text-cyan-200 hover:text-white truncate py-0.5"
                  >
                    • {task.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Pas de priorités = tout est fait ou pas de tâches urgentes
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mb-2" />
            <span className="text-sm text-zinc-500">
              {pendingTasks.length === 0 ? 'Tout est fait !' : 'Aucune urgence'}
            </span>
            {pendingTasks.length > 0 && (
              <span className="text-xs text-zinc-600 mt-1">
                {pendingTasks.length} tâche{pendingTasks.length > 1 ? 's' : ''} en cours
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-center">
          <span className="text-[10px] text-zinc-500">
            Cliquer pour voir toutes les tâches →
          </span>
        </div>
      </div>
    </WidgetContainer>
  )
})
