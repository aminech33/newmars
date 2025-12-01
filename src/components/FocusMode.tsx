import { useEffect, useState, useCallback } from 'react'
import { X, Play, Pause, RotateCcw, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { useStore } from '../store/useStore'

type TimerMode = 'focus' | 'shortBreak' | 'longBreak'

const TIMER_DURATIONS = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60
}

export function FocusMode() {
  const { 
    isFocusMode, 
    focusTaskId, 
    setFocusMode, 
    tasks, 
    toggleTask,
    addPomodoroSession
  } = useStore()
  
  const [mode, setMode] = useState<TimerMode>('focus')
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATIONS.focus)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)

  const task = tasks.find(t => t.id === focusTaskId)

  const playSound = useCallback(() => {
    if (!soundEnabled) return
    // Simple beep using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch {
      // Audio not supported - silent fail
    }
  }, [soundEnabled])

  const handleTimerComplete = useCallback(() => {
    playSound()
    
    if (mode === 'focus') {
      // Enregistrer la session Pomodoro
      addPomodoroSession({
        taskId: focusTaskId || undefined,
        taskTitle: task?.title,
        duration: 25,
        type: 'focus'
      })
      
      const newSessionsCompleted = sessionsCompleted + 1
      setSessionsCompleted(newSessionsCompleted)
      
      // Après 4 sessions, pause longue
      if (newSessionsCompleted % 4 === 0) {
        setMode('longBreak')
        setTimeLeft(TIMER_DURATIONS.longBreak)
      } else {
        setMode('shortBreak')
        setTimeLeft(TIMER_DURATIONS.shortBreak)
      }
    } else {
      // Fin de pause, retour au focus
      setMode('focus')
      setTimeLeft(TIMER_DURATIONS.focus)
    }
    
    setIsRunning(false)
  }, [mode, sessionsCompleted, focusTaskId, task, addPomodoroSession, playSound])

  useEffect(() => {
    if (!isRunning || !isFocusMode) return

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleTimerComplete()
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, isFocusMode, handleTimerComplete])

  // Reset timer when mode changes manually
  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false)
    setMode(newMode)
    setTimeLeft(TIMER_DURATIONS[newMode])
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleReset = () => {
    setIsRunning(false)
    setTimeLeft(TIMER_DURATIONS[mode])
  }

  const handleComplete = () => {
    if (task) {
      toggleTask(task.id)
      window.dispatchEvent(new CustomEvent('task-completed'))
    }
    setFocusMode(false)
  }

  const handleSkip = () => {
    handleTimerComplete()
  }

  const progress = ((TIMER_DURATIONS[mode] - timeLeft) / TIMER_DURATIONS[mode]) * 100

  if (!isFocusMode) return null

  const modeColors = {
    focus: 'from-indigo-500 to-violet-500',
    shortBreak: 'from-emerald-500 to-teal-500',
    longBreak: 'from-amber-500 to-orange-500'
  }

  const modeLabels = {
    focus: 'Focus',
    shortBreak: 'Pause courte',
    longBreak: 'Pause longue'
  }

  return (
    <div className="fixed inset-0 z-50 bg-mars-bg flex items-center justify-center animate-fade-in">
      {/* Close button */}
      <button
        onClick={() => setFocusMode(false)}
        className="absolute top-6 right-6 p-2 text-zinc-600 hover:text-zinc-400 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Sound toggle */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="absolute top-6 left-6 p-2 text-zinc-600 hover:text-zinc-400 transition-colors"
      >
        {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      </button>

      <div className="max-w-2xl w-full px-6 text-center">
        {/* Mode Tabs */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {(['focus', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`px-4 py-2 text-sm rounded-full transition-all ${
                mode === m 
                  ? `bg-gradient-to-r ${modeColors[m]} text-white` 
                  : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              {m === 'focus' ? '🍅' : m === 'shortBreak' ? '☕' : '🌴'} {modeLabels[m]}
            </button>
          ))}
        </div>

        {/* Progress Ring */}
        <div className="relative w-72 h-72 mx-auto mb-8">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="144"
              cy="144"
              r="136"
              fill="none"
              stroke="#27272a"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="144"
              cy="144"
              r="136"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 136}`}
              strokeDashoffset={`${2 * Math.PI * 136 * (1 - progress / 100)}`}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={mode === 'focus' ? '#6366f1' : mode === 'shortBreak' ? '#10b981' : '#f59e0b'} />
                <stop offset="100%" stopColor={mode === 'focus' ? '#8b5cf6' : mode === 'shortBreak' ? '#14b8a6' : '#f97316'} />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Timer display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-7xl font-extralight tracking-tighter text-zinc-100 tabular-nums">
              {formatTime(timeLeft)}
            </div>
            <p className="text-zinc-600 text-sm mt-2">
              {isRunning ? (mode === 'focus' ? 'Focus en cours...' : 'Pause en cours...') : 'Prêt'}
            </p>
          </div>
        </div>

        {/* Task */}
        {task && mode === 'focus' && (
          <div className="mb-8">
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Tâche en cours</p>
            <h2 className="text-xl text-zinc-200 font-medium tracking-tight">{task.title}</h2>
          </div>
        )}

        {/* Sessions counter */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all ${
                i <= (sessionsCompleted % 4 || (sessionsCompleted > 0 && sessionsCompleted % 4 === 0 ? 4 : 0))
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-500'
                  : 'bg-zinc-800'
              }`}
            />
          ))}
          <span className="text-xs text-zinc-600 ml-2">{sessionsCompleted} sessions</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleReset}
            className="p-3 text-zinc-600 hover:text-zinc-400 transition-colors"
            title="Réinitialiser"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`w-16 h-16 bg-gradient-to-r ${modeColors[mode]} text-white rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg`}
          >
            {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </button>

          <button
            onClick={handleSkip}
            className="p-3 text-zinc-600 hover:text-zinc-400 transition-colors"
            title="Passer"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Complete task button */}
        {task && (
          <button
            onClick={handleComplete}
            className="mt-6 px-4 py-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            ✓ Marquer la tâche terminée
          </button>
        )}

        {/* Tips */}
        <div className="mt-12 text-xs text-zinc-700">
          {mode === 'focus' ? (
            <p>Concentrez-vous pendant 25 minutes • Après 4 sessions, pause longue</p>
          ) : (
            <p>Prenez une pause, éloignez-vous de l'écran</p>
          )}
          <p className="mt-1">
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">ESC</kbd> pour quitter • 
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded ml-2">Space</kbd> pour {isRunning ? 'pause' : 'démarrer'}
          </p>
        </div>
      </div>
    </div>
  )
}
