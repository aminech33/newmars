import { Play, Pause } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'

interface PomodoroWidgetProps {
  id: string
  size: 'small' | 'medium' | 'large'
}

export function PomodoroWidget({ id, size }: PomodoroWidgetProps) {
  const { tasks, setFocusMode } = useStore()
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setIsRunning(false)
          return 25 * 60
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isRunning])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleFullFocus = () => {
    const nextTask = tasks.find(t => !t.completed)
    if (nextTask) {
      setFocusMode(true, nextTask.id)
    }
  }

  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="Pomodoro" currentSize={size}>
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="flex flex-col items-center justify-center h-full"
        >
          <p className="text-2xl font-extralight text-zinc-200 tabular-nums mb-1">{formatTime(timeLeft)}</p>
          {isRunning ? (
            <Pause className="w-4 h-4 text-zinc-600" />
          ) : (
            <Play className="w-4 h-4 text-zinc-600" />
          )}
        </button>
      </WidgetContainer>
    )
  }

  return (
    <WidgetContainer id={id} title="Timer Focus" currentSize={size}>
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-5xl font-extralight text-zinc-200 tabular-nums">{formatTime(timeLeft)}</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="w-10 h-10 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-full flex items-center justify-center transition-all"
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          {size === 'large' && (
            <button
              onClick={handleFullFocus}
              className="px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-400 border border-zinc-800 rounded-full transition-colors"
            >
              Mode Focus
            </button>
          )}
        </div>
      </div>
    </WidgetContainer>
  )
}


import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'

interface PomodoroWidgetProps {
  id: string
  size: 'small' | 'medium' | 'large'
}

export function PomodoroWidget({ id, size }: PomodoroWidgetProps) {
  const { tasks, setFocusMode } = useStore()
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setIsRunning(false)
          return 25 * 60
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isRunning])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleFullFocus = () => {
    const nextTask = tasks.find(t => !t.completed)
    if (nextTask) {
      setFocusMode(true, nextTask.id)
    }
  }

  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="Pomodoro" currentSize={size}>
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="flex flex-col items-center justify-center h-full"
        >
          <p className="text-2xl font-extralight text-zinc-200 tabular-nums mb-1">{formatTime(timeLeft)}</p>
          {isRunning ? (
            <Pause className="w-4 h-4 text-zinc-600" />
          ) : (
            <Play className="w-4 h-4 text-zinc-600" />
          )}
        </button>
      </WidgetContainer>
    )
  }

  return (
    <WidgetContainer id={id} title="Timer Focus" currentSize={size}>
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-5xl font-extralight text-zinc-200 tabular-nums">{formatTime(timeLeft)}</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="w-10 h-10 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-full flex items-center justify-center transition-all"
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          {size === 'large' && (
            <button
              onClick={handleFullFocus}
              className="px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-400 border border-zinc-800 rounded-full transition-colors"
            >
              Mode Focus
            </button>
          )}
        </div>
      </div>
    </WidgetContainer>
  )
}

