import { useState, useEffect, useRef } from 'react'
import { X, Play, Pause, RotateCcw, Check } from 'lucide-react'
import { useStore, Task } from '../../store/useStore'

interface PomodoroOverlayProps {
  task: Task
  onClose: () => void
  onComplete?: () => void
}

const DEFAULT_DURATION = 25 // minutes

// Local format time helper
const formatTime = (minutes: number, seconds: number): string => {
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export function PomodoroOverlay({ task, onClose, onComplete }: PomodoroOverlayProps) {
  const { addPomodoroSession, updateTask, addToast } = useStore()
  
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATION * 60) // secondes
  const [totalTime] = useState(DEFAULT_DURATION * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Démarrer automatiquement
  useEffect(() => {
    // Marquer la tâche "En cours" au montage
    if (task.status !== 'in-progress') {
      updateTask(task.id, { status: 'in-progress' })
    }
  }, [task.id, task.status, updateTask])

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false)
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRunning, timeLeft])

  const handleTimerComplete = () => {
    // Jouer un son
    try {
      audioRef.current = new Audio('/sounds/bell.mp3')
      audioRef.current.play().catch(() => {}) // Ignore errors
    } catch {}

    // Enregistrer la session
    const now = Date.now()
    const actualDuration = startedAt ? Math.round((now - startedAt) / 60000) : DEFAULT_DURATION
    
    addPomodoroSession({
      taskId: task.id,
      taskTitle: task.title,
      projectId: task.projectId,
      duration: DEFAULT_DURATION,
      actualDuration,
      completedAt: now,
      startedAt: startedAt || now,
      date: new Date().toISOString().split('T')[0],
      type: 'focus',
      interrupted: false
    })

    addToast('🎉 Pomodoro terminé !', 'success')
    
    // Afficher le dialog de complétion
    setShowCompleteDialog(true)
  }

  const handleStart = () => {
    if (!isRunning && !startedAt) {
      setStartedAt(Date.now())
    }
    setIsRunning(true)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setTimeLeft(totalTime)
    setStartedAt(null)
  }

  const handleClose = () => {
    // Si une session est en cours et qu'elle a duré au moins 5 minutes, l'enregistrer comme interrompue
    if (startedAt && timeLeft < totalTime) {
      const now = Date.now()
      const actualDuration = Math.round((now - startedAt) / 60000)
      
      // Seulement si la session a duré au moins 5 minutes
      if (actualDuration >= 5) {
        addPomodoroSession({
          taskId: task.id,
          taskTitle: task.title,
          projectId: task.projectId,
          duration: DEFAULT_DURATION,
          actualDuration,
          completedAt: now,
          startedAt,
          date: new Date().toISOString().split('T')[0],
          type: 'focus',
          interrupted: true // ⚠️ Marqué comme interrompu
        })
        
        addToast(`⏸️ Session interrompue (${actualDuration}min enregistrées)`, 'info')
      }
    }
    
    onClose()
  }

  const handleMarkComplete = () => {
    updateTask(task.id, { completed: true, status: 'done' })
    addToast('✅ Tâche terminée', 'success')
    onComplete?.()
    onClose()
  }

  const handleContinue = () => {
    setShowCompleteDialog(false)
    onClose()
  }

  const progress = ((totalTime - timeLeft) / totalTime) * 100
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-100">Focus Session</h2>
          <button
            onClick={handleClose}
            className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Task title */}
          <div className="mb-8 text-center">
            <p className="text-sm text-zinc-500 mb-2">Tâche en focus</p>
            <h3 className="text-xl font-medium text-zinc-100">{task.title}</h3>
          </div>

          {/* Timer display */}
          <div className="relative mb-8">
            {/* Progress ring */}
            <svg className="w-64 h-64 mx-auto transform -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-zinc-800"
              />
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 120}`}
                strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                className="text-red-500 transition-all duration-1000"
                strokeLinecap="round"
              />
            </svg>

            {/* Time */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl font-bold text-zinc-100 tabular-nums">
                {formatTime(minutes, seconds)}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleReset}
              className="p-4 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition-all"
              title="Reset"
            >
              <RotateCcw className="w-6 h-6" />
            </button>

            {!isRunning ? (
              <button
                onClick={handleStart}
                className="p-6 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all hover:scale-105 shadow-lg shadow-red-500/20"
              >
                <Play className="w-8 h-8" fill="white" />
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="p-6 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all hover:scale-105 shadow-lg shadow-red-500/20"
              >
                <Pause className="w-8 h-8" fill="white" />
              </button>
            )}

            <div className="w-14" /> {/* Spacer for symmetry */}
          </div>
        </div>
      </div>

      {/* Complete dialog */}
      {showCompleteDialog && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 max-w-sm mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                Pomodoro terminé !
              </h3>
              <p className="text-sm text-zinc-400">
                Avez-vous terminé cette tâche ?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleContinue}
                className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors"
              >
                Pas encore
              </button>
              <button
                onClick={handleMarkComplete}
                className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium"
              >
                ✓ Terminer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

