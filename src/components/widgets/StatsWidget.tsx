import { TrendingUp } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'

interface StatsWidgetProps {
  id: string
  size: 'small' | 'medium' | 'large'
}

export function StatsWidget({ id, size }: StatsWidgetProps) {
  const { tasks, focusMinutes, setView } = useStore()
  const completedTasks = tasks.filter(t => t.completed).length

  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="Stats" currentSize={size}>
        <button
          onClick={() => setView('dashboard')}
          className="flex flex-col items-center justify-center h-full"
        >
          <p className="text-4xl font-extralight text-zinc-200 mb-1">{completedTasks}</p>
          <p className="text-xs text-zinc-600">terminées</p>
        </button>
      </WidgetContainer>
    )
  }

  return (
    <WidgetContainer id={id} title="Statistiques" currentSize={size}>
      <div className="grid grid-cols-2 gap-4 h-full">
        <div className="text-center">
          <p className="text-3xl font-extralight text-zinc-200">{completedTasks}</p>
          <p className="text-xs text-zinc-600 mt-1">Terminées</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-extralight text-zinc-200">{Math.floor(focusMinutes / 60)}h</p>
          <p className="text-xs text-zinc-600 mt-1">Focus</p>
        </div>
        {size === 'large' && (
          <>
            <div className="text-center">
              <p className="text-3xl font-extralight text-zinc-200">{tasks.length - completedTasks}</p>
              <p className="text-xs text-zinc-600 mt-1">En cours</p>
            </div>
            <div className="text-center flex flex-col items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-500/60 mb-1" />
              <p className="text-xs text-zinc-600">+12% vs hier</p>
            </div>
          </>
        )}
      </div>
    </WidgetContainer>
  )
}

import { WidgetContainer } from './WidgetContainer'

interface StatsWidgetProps {
  id: string
  size: 'small' | 'medium' | 'large'
}

export function StatsWidget({ id, size }: StatsWidgetProps) {
  const { tasks, focusMinutes, setView } = useStore()
  const completedTasks = tasks.filter(t => t.completed).length

  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="Stats" currentSize={size}>
        <button
          onClick={() => setView('dashboard')}
          className="flex flex-col items-center justify-center h-full"
        >
          <p className="text-4xl font-extralight text-zinc-200 mb-1">{completedTasks}</p>
          <p className="text-xs text-zinc-600">terminées</p>
        </button>
      </WidgetContainer>
    )
  }

  return (
    <WidgetContainer id={id} title="Statistiques" currentSize={size}>
      <div className="grid grid-cols-2 gap-4 h-full">
        <div className="text-center">
          <p className="text-3xl font-extralight text-zinc-200">{completedTasks}</p>
          <p className="text-xs text-zinc-600 mt-1">Terminées</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-extralight text-zinc-200">{Math.floor(focusMinutes / 60)}h</p>
          <p className="text-xs text-zinc-600 mt-1">Focus</p>
        </div>
        {size === 'large' && (
          <>
            <div className="text-center">
              <p className="text-3xl font-extralight text-zinc-200">{tasks.length - completedTasks}</p>
              <p className="text-xs text-zinc-600 mt-1">En cours</p>
            </div>
            <div className="text-center flex flex-col items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-500/60 mb-1" />
              <p className="text-xs text-zinc-600">+12% vs hier</p>
            </div>
          </>
        )}
      </div>
    </WidgetContainer>
  )
}
