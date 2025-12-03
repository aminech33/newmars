import { useState, useEffect, useRef, memo } from 'react'
import { Play, Pause, RotateCcw, Timer } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'
import { formatTime } from '../../utils/pomodoroUtils'

interface PomodoroWidgetProps {
  widget: Widget
}

export const PomodoroWidget = memo(function PomodoroWidget({ widget }: PomodoroWidgetProps) {
  const { id } = widget
  const { setView, addPomodoroSession, tasks } = useStore()
  
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [totalTime] = useState(25 * 60)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const incompleteTasks = tasks.filter(t => !t.completed)
  const nextTask = incompleteTasks[0]

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning])

  const handleComplete = () => {
    setIsRunning(false)
    const duration = Math.round(totalTime / 60)
    
    addPomodoroSession({
      taskId: nextTask?.id,
      taskTitle: nextTask?.title,
      duration,
      type: 'focus',
      startedAt: Date.now() - totalTime * 1000
    })

    setTimeLeft(25 * 60)
  }

  const toggleTimer = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsRunning(!isRunning)
  }

  const resetTimer = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsRunning(false)
    setTimeLeft(25 * 60)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const progress = ((totalTime - timeLeft) / totalTime) * 100

  return (
    <WidgetContainer id={id} title="" currentSize="notification" onClick={() => setView('pomodoro')}>
      <div className="h-full flex flex-col p-6 gap-4">
        {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <Timer className="w-12 h-12 text-rose-400" strokeWidth={1.5} />
              </div>
          <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50' : 'bg-zinc-600'}`} />
        </div>

        {/* Timer Display */}
        <div className="text-center flex-1 flex flex-col justify-center">
          <div className="text-7xl font-bold text-white tabular-nums leading-none mb-4">
            {formatTime(timeLeft)}
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-6">
            <div 
              className="h-full bg-gradient-to-r from-rose-500 to-orange-500 transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={toggleTimer}
              className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 
                         flex items-center justify-center transition-colors"
            >
              {isRunning ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white ml-1" />
              )}
            </button>
            
            <button
              onClick={resetTimer}
              className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 
                         flex items-center justify-center transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Task info */}
        {nextTask && (
          <div className="text-center pt-2 border-t border-white/10">
            <div className="text-[10px] text-zinc-600 uppercase mb-1">Focus sur</div>
            <div className="text-xs text-zinc-400 truncate">
              {nextTask.title}
            </div>
          </div>
        )}
      </div>
    </WidgetContainer>
  )
})
