import { FileText, CheckSquare, Timer, Zap } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'

interface QuickActionsWidgetProps {
  id: string
  size: 'small' | 'medium' | 'large'
}

export function QuickActionsWidget({ id, size }: QuickActionsWidgetProps) {
  const { setView, addQuickNote, tasks, setFocusMode } = useStore()

  const actions = [
    {
      icon: FileText,
      label: 'Nouvelle note',
      action: () => {
        addQuickNote('Note rapide...')
        setView('hub')
      },
      color: 'cyan'
    },
    {
      icon: CheckSquare,
      label: 'Nouvelle tâche',
      action: () => setView('tasks'),
      color: 'indigo'
    },
    {
      icon: Timer,
      label: 'Start Pomodoro',
      action: () => {
        const nextTask = tasks.find(t => !t.completed)
        if (nextTask) {
          setFocusMode(true, nextTask.id)
        }
      },
      color: 'rose'
    },
    {
      icon: Zap,
      label: 'Mode Focus',
      action: () => {
        const nextTask = tasks.find(t => !t.completed)
        if (nextTask) {
          setFocusMode(true, nextTask.id)
        }
      },
      color: 'amber'
    },
  ]

  const colorClasses: Record<string, string> = {
    cyan: 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20',
    rose: 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20',
    amber: 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20',
    violet: 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20',
  }

  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="Actions" currentSize={size}>
        <div className="flex flex-col items-center justify-center h-full">
          <Zap className="w-8 h-8 text-zinc-600 mb-2" />
          <p className="text-xs text-zinc-600">Rapides</p>
        </div>
      </WidgetContainer>
    )
  }

  return (
    <WidgetContainer id={id} title="⚡ Actions Rapides" currentSize={size}>
      <div className="grid grid-cols-2 gap-2 h-full">
        {actions.slice(0, size === 'large' ? 4 : 4).map((action, index) => {
          const Icon = action.icon
          return (
            <button
              key={index}
              onClick={action.action}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl ${colorClasses[action.color]} transition-all duration-200 hover:scale-105 active:scale-95`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          )
        })}
      </div>
    </WidgetContainer>
  )
}
