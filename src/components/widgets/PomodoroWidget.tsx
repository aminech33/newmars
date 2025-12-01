import { memo, useEffect, useCallback, useMemo } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'

interface PomodoroWidgetProps {
  widget: Widget
}

export const PomodoroWidget = memo(function PomodoroWidget({ widget }: PomodoroWidgetProps) {
  const { id, size = 'small' } = widget
  const { 
    tasks, 
    setFocusMode, 
    pomodoroTimeLeft, 
    isPomodoroRunning, 
    setPomodoroTime,
    togglePomodoroRunning,
    resetPomodoro 
  } = useStore()

  // Timer global synchronisé
  useEffect(() => {
    if (!isPomodoroRunning) return
    const interval = setInterval(() => {
      if (pomodoroTimeLeft <= 1) {
        resetPomodoro()
      } else {
        setPomodoroTime(pomodoroTimeLeft - 1)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [isPomodoroRunning, pomodoroTimeLeft, setPomodoroTime, resetPomodoro])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  const nextTask = useMemo(() => tasks.find(t => !t.completed), [tasks])

  const handleFullFocus = useCallback(() => {
    if (nextTask) {
      setFocusMode(true, nextTask.id)
    }
  }, [nextTask, setFocusMode])

  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="Pomodoro" currentSize={size}>
        <button
          onClick={togglePomodoroRunning}
          className="flex flex-col items-center justify-center h-full"
          aria-label={isPomodoroRunning ? 'Pause timer' : 'Start timer'}
        >
          <p className="text-2xl font-extralight text-zinc-200 tabular-nums mb-1">{formatTime(pomodoroTimeLeft)}</p>
          {isPomodoroRunning ? (
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
        <p className="text-5xl font-extralight text-zinc-200 tabular-nums">{formatTime(pomodoroTimeLeft)}</p>
        <div className="flex items-center gap-3">
          <button
            onClick={togglePomodoroRunning}
            className="w-10 h-10 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-full flex items-center justify-center transition-all"
            aria-label={isPomodoroRunning ? 'Pause timer' : 'Start timer'}
          >
            {isPomodoroRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button
            onClick={resetPomodoro}
            className="w-10 h-10 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-full flex items-center justify-center transition-all"
            aria-label="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
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
})
