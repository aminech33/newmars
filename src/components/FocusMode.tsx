import { useEffect, useState } from 'react'
import { X, Play, Pause, RotateCcw } from 'lucide-react'
import { useStore } from '../store/useStore'

export function FocusMode() {
  const { isFocusMode, focusTaskId, pomodoroTimeLeft, setFocusMode, setPomodoroTime, tasks, toggleTask } = useStore()
  const [isRunning, setIsRunning] = useState(false)

  const task = tasks.find(t => t.id === focusTaskId)

  useEffect(() => {
    if (!isRunning || !isFocusMode) return

    const interval = setInterval(() => {
      setPomodoroTime(Math.max(0, pomodoroTimeLeft - 1))
      
      if (pomodoroTimeLeft <= 1) {
        setIsRunning(false)
        // Notification sound would go here
        alert('Pomodoro terminé ! Prenez une pause de 5 minutes.')
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, isFocusMode, pomodoroTimeLeft, setPomodoroTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleReset = () => {
    setIsRunning(false)
    setPomodoroTime(25 * 60)
  }

  const handleComplete = () => {
    if (task) {
      toggleTask(task.id)
      setFocusMode(false)
    }
  }

  if (!isFocusMode || !task) return null

  return (
    <div className="fixed inset-0 z-50 bg-mars-bg flex items-center justify-center animate-fade-in">
      <button
        onClick={() => setFocusMode(false)}
        className="absolute top-6 right-6 p-2 text-zinc-600 hover:text-zinc-400 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="max-w-2xl w-full px-6 text-center">
        {/* Timer */}
        <div className="mb-12">
          <div className="text-9xl font-extralight tracking-tighter text-zinc-100 tabular-nums mb-4">
            {formatTime(pomodoroTimeLeft)}
          </div>
          <p className="text-zinc-600 text-sm">
            {isRunning ? 'Focus en cours...' : 'Prêt à commencer'}
          </p>
        </div>

        {/* Task */}
        <div className="mb-12">
          <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Tâche en cours</p>
          <h2 className="text-2xl text-zinc-200 font-medium tracking-tight">{task.title}</h2>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleReset}
            className="p-3 text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="w-16 h-16 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          >
            {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </button>

          <button
            onClick={handleComplete}
            className="px-4 py-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Marquer terminée
          </button>
        </div>

        {/* Tips */}
        <div className="mt-16 text-xs text-zinc-700">
          <p>Concentrez-vous sur cette tâche pendant 25 minutes</p>
          <p className="mt-1">Appuyez sur <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">ESC</kbd> pour quitter</p>
        </div>
      </div>
    </div>
  )
}

import { X, Play, Pause, RotateCcw } from 'lucide-react'
import { useStore } from '../store/useStore'

export function FocusMode() {
  const { isFocusMode, focusTaskId, pomodoroTimeLeft, setFocusMode, setPomodoroTime, tasks, toggleTask } = useStore()
  const [isRunning, setIsRunning] = useState(false)

  const task = tasks.find(t => t.id === focusTaskId)

  useEffect(() => {
    if (!isRunning || !isFocusMode) return

    const interval = setInterval(() => {
      setPomodoroTime(Math.max(0, pomodoroTimeLeft - 1))
      
      if (pomodoroTimeLeft <= 1) {
        setIsRunning(false)
        // Notification sound would go here
        alert('Pomodoro terminé ! Prenez une pause de 5 minutes.')
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, isFocusMode, pomodoroTimeLeft, setPomodoroTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleReset = () => {
    setIsRunning(false)
    setPomodoroTime(25 * 60)
  }

  const handleComplete = () => {
    if (task) {
      toggleTask(task.id)
      setFocusMode(false)
    }
  }

  if (!isFocusMode || !task) return null

  return (
    <div className="fixed inset-0 z-50 bg-mars-bg flex items-center justify-center animate-fade-in">
      <button
        onClick={() => setFocusMode(false)}
        className="absolute top-6 right-6 p-2 text-zinc-600 hover:text-zinc-400 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="max-w-2xl w-full px-6 text-center">
        {/* Timer */}
        <div className="mb-12">
          <div className="text-9xl font-extralight tracking-tighter text-zinc-100 tabular-nums mb-4">
            {formatTime(pomodoroTimeLeft)}
          </div>
          <p className="text-zinc-600 text-sm">
            {isRunning ? 'Focus en cours...' : 'Prêt à commencer'}
          </p>
        </div>

        {/* Task */}
        <div className="mb-12">
          <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Tâche en cours</p>
          <h2 className="text-2xl text-zinc-200 font-medium tracking-tight">{task.title}</h2>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleReset}
            className="p-3 text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="w-16 h-16 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          >
            {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </button>

          <button
            onClick={handleComplete}
            className="px-4 py-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Marquer terminée
          </button>
        </div>

        {/* Tips */}
        <div className="mt-16 text-xs text-zinc-700">
          <p>Concentrez-vous sur cette tâche pendant 25 minutes</p>
          <p className="mt-1">Appuyez sur <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">ESC</kbd> pour quitter</p>
        </div>
      </div>
    </div>
  )
}


