import { AlertCircle, Clock, Zap, Target } from 'lucide-react'
import { Task } from '../../store/useStore'
import { useMemo } from 'react'

interface CommandCenterProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
}

export function CommandCenter({ tasks, onTaskClick }: CommandCenterProps) {
  const pendingTasks = useMemo(() => tasks.filter(t => !t.completed), [tasks])
  
  // Urgences (< 3h ou urgent)
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
    }).slice(0, 3)
  }, [pendingTasks])
  
  // Quick wins (< 15min estimé)
  const quickWins = useMemo(() => {
    return pendingTasks
      .filter(t => t.estimatedTime && t.estimatedTime <= 15 && t.priority !== 'urgent')
      .slice(0, 5)
  }, [pendingTasks])
  
  // Aujourd'hui (avec deadline aujourd'hui)
  const todayTasks = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return pendingTasks
      .filter(t => t.dueDate && t.dueDate.startsWith(today) && t.priority !== 'urgent')
      .slice(0, 7)
  }, [pendingTasks])
  
  // Overdue
  const overdueTasks = useMemo(() => {
    const now = new Date()
    return pendingTasks
      .filter(t => t.dueDate && new Date(t.dueDate) < now)
      .slice(0, 2)
  }, [pendingTasks])

  if (urgentTasks.length === 0 && quickWins.length === 0 && todayTasks.length === 0 && overdueTasks.length === 0) {
    return null
  }

  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-indigo-400" />
        <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Command Center</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Urgences */}
        {urgentTasks.length > 0 && (
          <div className="glass-widget p-4 border-l-4 border-rose-500">
            <div className="flex items-center gap-2 mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-rose-500 rounded-full blur-md opacity-50 animate-pulse" />
                <AlertCircle className="relative w-5 h-5 text-rose-400" />
              </div>
              <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider">
                {urgentTasks.length} Urgence{urgentTasks.length > 1 ? 's' : ''}
              </h3>
            </div>
            <div className="space-y-2">
              {urgentTasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="w-full text-left p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all group"
                >
                  <p className="text-sm font-bold text-rose-100 group-hover:text-white line-clamp-1">
                    {task.title}
                  </p>
                  {task.dueDate && (
                    <p className="text-xs text-rose-300/70 mt-1">
                      {new Date(task.dueDate).toLocaleString('fr-FR', { 
                        day: 'numeric', 
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Wins */}
        {quickWins.length > 0 && (
          <div className="glass-widget p-4 border-l-4 border-emerald-500">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                {quickWins.length} Quick Win{quickWins.length > 1 ? 's' : ''}
              </h3>
              <span className="text-xs text-zinc-500">(&lt; 15min)</span>
            </div>
            <div className="space-y-1.5">
              {quickWins.map(task => (
                <button
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="w-full text-left p-1.5 rounded-lg hover:bg-emerald-500/10 transition-all group"
                >
                  <p className="text-xs font-medium text-zinc-300 group-hover:text-white line-clamp-1">
                    {task.title}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Aujourd'hui */}
        {todayTasks.length > 0 && (
          <div className="glass-widget p-4 border-l-4 border-cyan-500">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
                {todayTasks.length} Aujourd'hui
              </h3>
            </div>
            <div className="space-y-1.5">
              {todayTasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="w-full text-left p-1.5 rounded-lg hover:bg-cyan-500/10 transition-all group"
                >
                  <p className="text-xs font-medium text-zinc-300 group-hover:text-white line-clamp-1">
                    {task.title}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Overdue */}
        {overdueTasks.length > 0 && (
          <div className="glass-widget p-4 border-l-4 border-amber-500 animate-pulse">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                {overdueTasks.length} En retard
              </h3>
            </div>
            <div className="space-y-2">
              {overdueTasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="w-full text-left p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all group"
                >
                  <p className="text-sm font-bold text-amber-100 group-hover:text-white line-clamp-1">
                    {task.title}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

