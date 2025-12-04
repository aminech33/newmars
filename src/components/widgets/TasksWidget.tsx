import { memo, useMemo } from 'react'
import { AlertCircle, Circle, CheckSquare, CheckCircle2, Plus } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'

interface TasksWidgetProps {
  widget: Widget
}

export const TasksWidget = memo(function TasksWidget({ widget }: TasksWidgetProps) {
  const { id } = widget
  const { tasks, setView, toggleTask, addTask } = useStore()
  
  const pendingTasks = useMemo(() => tasks.filter(t => !t.completed), [tasks])
  const urgentTasks = useMemo(() => pendingTasks.filter(t => t.priority === 'urgent'), [pendingTasks])
  
  // Prochaine tâche prioritaire (avec date de préférence)
  const nextTask = useMemo(() => {
    // Prioriser les tâches urgentes avec dates
    const urgentWithDates = pendingTasks
      .filter(t => t.priority === 'urgent' && t.dueDate)
      .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
    
    if (urgentWithDates.length > 0) return urgentWithDates[0]
    
    // Sinon tâches urgentes sans dates
    const urgentNoDates = pendingTasks.filter(t => t.priority === 'urgent' && !t.dueDate)
    if (urgentNoDates.length > 0) return urgentNoDates[0]
    
    // Sinon tâches normales avec dates
    const normalWithDates = pendingTasks
      .filter(t => t.dueDate)
      .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
    
    if (normalWithDates.length > 0) return normalWithDates[0]
    
    // Sinon première tâche disponible
    return pendingTasks[0]
  }, [pendingTasks])
  
  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    setView('tasks')
  }

  // Format date/time pour affichage
  const formatDueDate = (dueDate: string | undefined) => {
    if (!dueDate) return null
    const date = new Date(dueDate)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const isToday = date.toDateString() === today.toDateString()
    const isTomorrow = date.toDateString() === tomorrow.toDateString()
    
    if (isToday) return "Aujourd'hui"
    if (isTomorrow) return "Demain"
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  // Top 3 tâches pour affichage
  const topTasks = useMemo(() => {
    return pendingTasks.slice(0, 3)
  }, [pendingTasks])

  return (
    <WidgetContainer id={id} title="" currentSize="notification" onClick={() => setView('tasks')}>
      <div className="h-full flex flex-col p-5 gap-2.5 relative">
        {/* Header avec badge urgent proéminent */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-emerald-400 hover-glow" strokeWidth={1.5} />
            <div className="text-3xl font-bold text-white tabular-nums leading-none font-mono-display number-glow">
              {pendingTasks.length}
            </div>
            <div className="text-[10px] text-emerald-400/80 uppercase tracking-wider font-semibold">
              TÂCHES
            </div>
          </div>
          {urgentTasks.length > 0 && (
            <div className="relative">
              <div className="absolute inset-0 bg-rose-500 rounded-full blur-md opacity-50 animate-pulse" />
              <div className="relative px-2.5 py-1 bg-gradient-to-br from-rose-500 to-rose-600 rounded-full shadow-lg shadow-rose-500/50 border border-rose-400/30">
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {urgentTasks.length}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Task List - 3 tâches */}
        <div className="flex-1 space-y-1.5 overflow-hidden">
          {topTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center h-full">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mb-2" />
              <span className="text-sm text-zinc-500">Tout est fait !</span>
            </div>
          ) : (
            topTasks.map((task, index) => {
              const isUrgent = task.priority === 'urgent'
              return (
                <button
                  key={task.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleTask(task.id)
                  }}
                  className={`flex items-start gap-2 w-full text-left rounded-lg
                             hover:bg-white/5 transition-all group relative
                             ${isUrgent 
                               ? 'p-2.5 bg-gradient-to-r from-rose-500/10 to-transparent border-l-2 border-rose-500 shadow-lg shadow-rose-500/10' 
                               : 'p-2'
                             }`}
                >
                  {isUrgent && (
                    <div className="absolute inset-0 bg-rose-500/5 rounded-lg animate-pulse" />
                  )}
                  <Circle className={`flex-shrink-0 mt-0.5 transition-colors ${
                    isUrgent 
                      ? 'w-4 h-4 text-rose-400 group-hover:text-rose-300' 
                      : 'w-3.5 h-3.5 text-emerald-400 group-hover:text-emerald-300'
                  }`} />
                  <div className="flex-1 min-w-0 relative z-10">
                    <p className={`transition-colors line-clamp-1 ${
                      isUrgent 
                        ? 'text-sm font-bold text-rose-100 group-hover:text-white' 
                        : 'text-xs font-medium text-zinc-300 group-hover:text-white'
                    }`}>
                      {task.title}
                    </p>
                    {task.dueDate && (
                      <p className={`mt-0.5 ${
                        isUrgent 
                          ? 'text-[10px] text-rose-300/80 font-medium' 
                          : 'text-[10px] text-zinc-500'
                      }`}>
                        {formatDueDate(task.dueDate)}
                      </p>
                    )}
                  </div>
                  {isUrgent && (
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5 animate-pulse" />
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Footer Stats */}
        {pendingTasks.length > 0 && (
          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <span className="text-[10px] text-zinc-600">
              {pendingTasks.filter(t => t.dueDate).length} avec échéance
            </span>
            <button
              onClick={handleQuickAdd}
              className="flex items-center gap-1 px-2 py-1 rounded-lg
                         bg-emerald-500/10 hover:bg-emerald-500/20
                         text-emerald-400 hover:text-emerald-300
                         transition-all duration-200 group"
            >
              <Plus className="w-3 h-3" strokeWidth={2.5} />
              <span className="text-[10px] font-semibold">Ajouter</span>
            </button>
          </div>
        )}
      </div>
    </WidgetContainer>
  )
})
