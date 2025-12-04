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
  const { setView, addPomodoroSession, tasks, pomodoroSessions } = useStore()
  
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [totalTime] = useState(25 * 60)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const incompleteTasks = tasks.filter(t => !t.completed)
  const nextTask = incompleteTasks[0]
  
  // Stats du jour
  const today = new Date().toISOString().split('T')[0]
  const todaySessions = pomodoroSessions?.filter(s => {
    const sessionDate = new Date(s.startedAt).toISOString().split('T')[0]
    return sessionDate === today && s.type === 'focus'
  }) || []
  
  const todayFocusTime = todaySessions.reduce((sum, s) => sum + s.duration, 0)

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
      <div className="h-full flex flex-col p-4 gap-2 overflow-hidden">
        {/* Header compact */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-orange-400 hover-glow" strokeWidth={1.5} />
            <div className="text-[10px] text-orange-400/80 uppercase tracking-wider font-semibold">
              POMODORO
            </div>
          </div>
          <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50' : 'bg-zinc-600'}`} />
        </div>

        {/* Timer Display - Plus compact */}
        <div className="text-center flex-shrink-0">
          <div className="text-4xl font-bold text-white tabular-nums leading-none mb-1.5 font-mono-display gradient-text">
            {formatTime(timeLeft)}
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-gradient-to-r from-rose-500 to-orange-500 transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Controls - Plus petits */}
          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={toggleTimer}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 
                         flex items-center justify-center transition-colors"
            >
              {isRunning ? (
                <Pause className="w-4 h-4 text-white" />
              ) : (
                <Play className="w-4 h-4 text-white ml-0.5" />
              )}
            </button>
            
            <button
              onClick={resetTimer}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 
                         flex items-center justify-center transition-colors"
            >
              <RotateCcw className="w-3 h-3 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Stats aujourd'hui */}
        <div className="flex-1 min-h-0 space-y-1.5">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            Aujourd'hui
          </div>
          
          <div className="grid grid-cols-2 gap-1.5">
            <div className="p-1.5 gradient-border-amber rounded-lg text-center">
              <div className="text-base font-bold text-white tabular-nums">{todaySessions.length}</div>
              <div className="text-[9px] text-zinc-600">Sessions</div>
            </div>
            <div className="p-1.5 gradient-border-rose rounded-lg text-center">
              <div className="text-base font-bold text-white tabular-nums">{todayFocusTime}</div>
              <div className="text-[9px] text-zinc-600">Minutes</div>
            </div>
          </div>

          {/* Task en cours */}
          {nextTask && (
            <div className="p-1.5 bg-rose-500/5 rounded-lg border border-rose-500/20">
              <div className="text-[9px] text-rose-400 font-medium mb-0.5">Focus sur:</div>
              <div className="text-[10px] text-zinc-300 truncate font-medium">
                {nextTask.title}
              </div>
            </div>
          )}
        </div>

        {/* Footer - Objectif */}
        <div className="pt-1.5 border-t border-white/10 text-center flex-shrink-0">
          <span className="text-[9px] text-zinc-600">
            Objectif: <span className="text-zinc-400 font-semibold">4 sessions</span>
          </span>
        </div>
      </div>
    </WidgetContainer>
  )
})
