import { useState, useEffect, useRef, memo } from 'react'
import { useStore } from '../../store/useStore'
import { Timer, Play, Pause, RotateCcw, Zap, TrendingUp, ArrowRight } from 'lucide-react'
import { Widget } from '../../types/widgets'
import { WidgetContainer } from './WidgetContainer'
import { formatTime, calculatePomodoroStats } from '../../utils/pomodoroUtils'

interface PomodoroWidgetTileProps {
  widget: Widget
}

export const PomodoroWidgetTile = memo(function PomodoroWidgetTile({ widget }: PomodoroWidgetTileProps) {
  const { id, size = 'medium' } = widget
  const { 
    pomodoroSessions, 
    tasks,
    setView,
    addPomodoroSession,
  } = useStore()

  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes en secondes
  const [totalTime, setTotalTime] = useState(25 * 60)
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const stats = calculatePomodoroStats(pomodoroSessions)
  const incompleteTasks = tasks.filter(t => !t.completed)
  const selectedTask = tasks.find(t => t.id === selectedTaskId)

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
      taskId: selectedTaskId,
      taskTitle: selectedTask?.title,
      projectId: selectedTask?.projectId,
      duration,
      type: 'focus',
      startedAt: Date.now() - totalTime * 1000
    })

    // Play sound
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTO9')
    audio.volume = 0.5
    audio.play().catch(() => {})

    // Reset
    setTimeLeft(25 * 60)
    setTotalTime(25 * 60)
  }

  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(25 * 60)
    setTotalTime(25 * 60)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const progress = ((totalTime - timeLeft) / totalTime) * 100

  // SMALL - Timer only (Apple style)
  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="" currentSize={size} onClick={() => setView('pomodoro')}>
        <div className="h-full flex flex-col items-center justify-center p-4">
          {/* Circular timer */}
          <div className="relative w-28 h-28 mb-3">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="52"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-white/10"
              />
              <circle
                cx="56"
                cy="56"
                r="52"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                className="text-orange-400"
                style={{
                  strokeDasharray: `${2 * Math.PI * 52}`,
                  strokeDashoffset: `${2 * Math.PI * 52 * (1 - progress / 100)}`,
                  transition: 'stroke-dashoffset 1s linear'
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-2xl font-bold text-white tabular-nums">{formatTime(timeLeft)}</div>
            </div>
          </div>

          {/* Simple controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleTimer()
              }}
              className="p-2 bg-white/10 hover:bg-white/15 rounded-lg transition-colors border border-white/10"
            >
              {isRunning ? (
                <Pause className="w-4 h-4 text-white" />
              ) : (
                <Play className="w-4 h-4 text-white" />
              )}
            </button>
            {timeLeft !== totalTime && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  resetTimer()
                }}
                className="p-2 bg-white/10 hover:bg-white/15 rounded-lg transition-colors border border-white/10"
              >
                <RotateCcw className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        </div>
      </WidgetContainer>
    )
  }

  // MEDIUM - Timer + Task selection
  if (size === 'medium') {
    return (
      <WidgetContainer 
        id={id} 
        title="Pomodoro" 
        currentSize={size}
        onClick={() => setView('pomodoro')}
        actions={
          <button
            onClick={(e) => {
              e.stopPropagation()
              setView('pomodoro')
            }}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        }
      >
        <div className="h-full flex flex-col gap-3">
          {/* Timer section */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
            {/* Circular progress - smaller */}
            <div className="relative w-20 h-20">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-white/10"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className="text-orange-400"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 36}`,
                    strokeDashoffset: `${2 * Math.PI * 36 * (1 - progress / 100)}`,
                    transition: 'stroke-dashoffset 1s linear'
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-lg font-bold text-white tabular-nums">{formatTime(timeLeft)}</div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleTimer()
                }}
                className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition-colors border border-orange-500/20 font-medium text-sm flex items-center gap-2"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Démarrer
                  </>
                )}
              </button>
              {timeLeft !== totalTime && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    resetTimer()
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-lg transition-colors border border-white/10 text-sm"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>

          {/* Task selection */}
          <div className="flex-1">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-2 block">
              Tâche en cours
            </label>
            <select
              value={selectedTaskId || ''}
              onChange={(e) => setSelectedTaskId(e.target.value || undefined)}
              onClick={(e) => e.stopPropagation()}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-orange-500/50 transition-colors"
            >
              <option value="">Aucune tâche</option>
              {incompleteTasks.map(task => (
                <option key={task.id} value={task.id} className="bg-zinc-900">
                  {task.title}
                </option>
              ))}
            </select>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-white/5 rounded-lg border border-white/10 text-center">
              <div className="text-lg font-bold text-white tabular-nums">{stats.todaySessions}</div>
              <div className="text-[9px] text-zinc-600 uppercase tracking-wide">Aujourd'hui</div>
            </div>
            <div className="p-2 bg-white/5 rounded-lg border border-white/10 text-center">
              <div className="text-lg font-bold text-white tabular-nums">{stats.currentStreak}</div>
              <div className="text-[9px] text-zinc-600 uppercase tracking-wide">Série</div>
            </div>
          </div>
        </div>
      </WidgetContainer>
    )
  }

  // LARGE - Full dashboard with stats
  return (
    <WidgetContainer 
      id={id} 
      title="Pomodoro" 
      currentSize={size}
      onClick={() => setView('pomodoro')}
      actions={
        <button
          onClick={(e) => {
            e.stopPropagation()
            setView('pomodoro')
          }}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      }
    >
      <div className="h-full flex flex-col gap-3">
        {/* Timer + Controls */}
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
          {/* Circular progress */}
          <div className="relative w-24 h-24">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="44"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                className="text-white/10"
              />
              <circle
                cx="48"
                cy="48"
                r="44"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                className="text-orange-400"
                style={{
                  strokeDasharray: `${2 * Math.PI * 44}`,
                  strokeDashoffset: `${2 * Math.PI * 44 * (1 - progress / 100)}`,
                  transition: 'stroke-dashoffset 1s linear'
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-xl font-bold text-white tabular-nums">{formatTime(timeLeft)}</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-2 flex-1 ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleTimer()
              }}
              className="px-4 py-2.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition-colors border border-orange-500/20 font-semibold text-sm flex items-center justify-center gap-2"
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Démarrer
                </>
              )}
            </button>
            {timeLeft !== totalTime && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  resetTimer()
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-lg transition-colors border border-white/10 text-sm flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Task selection */}
        <div>
          <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-2 block">
            Tâche en cours
          </label>
          <select
            value={selectedTaskId || ''}
            onChange={(e) => setSelectedTaskId(e.target.value || undefined)}
            onClick={(e) => e.stopPropagation()}
            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-orange-500/50 transition-colors"
          >
            <option value="">Aucune tâche sélectionnée</option>
            {incompleteTasks.map(task => (
              <option key={task.id} value={task.id} className="bg-zinc-900">
                {task.title}
              </option>
            ))}
          </select>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-center">
            <Zap className="w-4 h-4 text-orange-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-white tabular-nums">{stats.todaySessions}</div>
            <div className="text-[9px] text-zinc-600 uppercase tracking-wide">Aujourd'hui</div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-center">
            <TrendingUp className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-white tabular-nums">{stats.totalSessions}</div>
            <div className="text-[9px] text-zinc-600 uppercase tracking-wide">Total</div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-center">
            <Timer className="w-4 h-4 text-orange-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-white tabular-nums">{stats.currentStreak}</div>
            <div className="text-[9px] text-zinc-600 uppercase tracking-wide">Série</div>
          </div>
        </div>

        {/* Today's focus time */}
        <div className="p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1">
            Temps de focus aujourd'hui
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {Math.floor(stats.todayFocusMinutes / 60)}h {stats.todayFocusMinutes % 60}m
          </div>
        </div>
      </div>
    </WidgetContainer>
  )
})
