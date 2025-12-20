import { useState, useEffect, useRef, useMemo } from 'react'
import { useStore } from '../../store/useStore'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Clock, 
  Target,
  Coffee,
  Zap,
  Calendar,
  CheckSquare,
  Folder,
  Timer,
  ArrowLeft,
  BookOpen
} from 'lucide-react'
import { 
  formatTime, 
  formatDuration, 
  getDaySchedule
} from '../../utils/pomodoroUtils'
import { TimerState, PomodoroSettings } from '../../types/pomodoro'
import { Course } from '../../types/learning'
import { ConfirmDialog } from '../ui/ConfirmDialog'

type TabView = 'timer' | 'stats' | 'history' | 'settings'

const DEFAULT_SETTINGS: PomodoroSettings = {
  defaultFocusDuration: 25,
  defaultShortBreak: 5,
  defaultLongBreak: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  soundEnabled: true,
  soundVolume: 80,
  notificationsEnabled: true,
  tickingSound: false
}

const STORAGE_KEY = 'pomodoro-settings'

function loadSettings(): PomodoroSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
    }
  } catch {
    // Ignore parsing errors
  }
  return DEFAULT_SETTINGS
}

interface PomodoroPageProps {
  embedded?: boolean
}

export function PomodoroPage({ embedded = false }: PomodoroPageProps) {
  const {
    tasks,
    projects,
    books,
    learningCourses,
    pomodoroSessions,
    addPomodoroSession,
    updateBook,
    updateLearningCourse,
    addToast
  } = useStore()

  const [activeTab, setActiveTab] = useState<TabView>('timer')
  const [settings, setSettings] = useState<PomodoroSettings>(loadSettings)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  
  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])
  
  // Timer state
  const [timerState, setTimerState] = useState<TimerState>({
    mode: 'focus',
    status: 'idle',
    timeLeft: settings.defaultFocusDuration * 60,
    totalTime: settings.defaultFocusDuration * 60,
    currentTaskId: undefined,
    currentProjectId: undefined,
    sessionsCompleted: 0,
    currentSessionStartedAt: undefined
  })

  // Task & Project & Book & Course selection
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>()
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>()
  const [selectedBookId, setSelectedBookId] = useState<string | undefined>()
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>()
  const [customDuration, setCustomDuration] = useState<number>(25)

  // History view
  const [selectedDate] = useState(new Date().toISOString().split('T')[0])

  // Timer interval ref
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const notificationShownRef = useRef(false)

  // Selected task & project & book & course
  const selectedTask = tasks.find(t => t.id === selectedTaskId)
  const selectedProject = projects.find(p => p.id === selectedProjectId) || 
                          (selectedTask?.projectId ? projects.find(p => p.id === selectedTask.projectId) : undefined)
  const selectedBook = books.find(b => b.id === selectedBookId)
  const selectedCourse = learningCourses?.find((c: Course) => c.id === selectedCourseId)
  const readingBooks = books.filter(b => b.status === 'reading')
  const activeCourses = learningCourses?.filter((c: Course) => c.status === 'active') || []
  
  // Load preselected data from localStorage (from Learning page)
  useEffect(() => {
    const preselectData = localStorage.getItem('pomodoro-preselect')
    if (preselectData) {
      try {
        const data = JSON.parse(preselectData)
        if (data.projectId) setSelectedProjectId(data.projectId)
        if (data.courseId) setSelectedCourseId(data.courseId)
        localStorage.removeItem('pomodoro-preselect')
        addToast(`✅ Pomodoro configuré pour "${data.courseName || data.projectName}"`, 'success')
      } catch {
        // Ignore parsing errors
      }
    }
  }, [])

  // Stats calculations
  const daySchedule = useMemo(() => getDaySchedule(pomodoroSessions, selectedDate), [pomodoroSessions, selectedDate])

  // Timer logic
  useEffect(() => {
    if (timerState.status === 'running') {
      intervalRef.current = setInterval(() => {
        setTimerState(prev => {
          if (prev.timeLeft <= 1) {
            handleTimerComplete()
            return { ...prev, timeLeft: 0, status: 'completed' }
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 }
        })
      }, 1000)

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [timerState.status])

  // Auto-start logic
  useEffect(() => {
    if (timerState.status === 'completed') {
      if (timerState.mode === 'focus' && settings.autoStartBreaks) {
        setTimeout(() => startBreak(), 2000)
      } else if (timerState.mode !== 'focus' && settings.autoStartPomodoros) {
        setTimeout(() => startFocus(), 2000)
      }
    }
  }, [timerState.status])

  const handleTimerComplete = () => {
    // Play sound
    if (settings.soundEnabled) {
      playNotificationSound()
    }

    // Show notification
    if (settings.notificationsEnabled && !notificationShownRef.current) {
      showNotification()
      notificationShownRef.current = true
    }

    // Save session if focus mode
    if (timerState.mode === 'focus') {
      const duration = Math.round(timerState.totalTime / 60)
      addPomodoroSession({
        taskId: timerState.currentTaskId,
        taskTitle: selectedTask?.title,
        projectId: timerState.currentProjectId || selectedTask?.projectId,
        projectName: selectedProject?.name,
        bookId: selectedBookId,
        bookTitle: selectedBook?.title,
        courseId: selectedCourseId,
        courseName: selectedCourse?.name,
        duration,
        type: 'focus',
        startedAt: timerState.currentSessionStartedAt
      })
      
      // Si lié à un livre, mettre à jour le temps de lecture
      if (selectedBookId && selectedBook) {
        updateBook(selectedBookId, {
          totalReadingTime: (selectedBook.totalReadingTime || 0) + duration,
          sessionsCount: (selectedBook.sessionsCount || 0) + 1,
          updatedAt: Date.now()
        })
        addToast(`📚 ${duration}min ajoutées à "${selectedBook.title}"`, 'success')
      }
      
      // Si lié à un cours, mettre à jour le temps d'étude
      if (selectedCourseId && selectedCourse) {
        updateLearningCourse(selectedCourseId, {
          totalTimeSpent: (selectedCourse.totalTimeSpent || 0) + duration,
          sessionsCount: (selectedCourse.sessionsCount || 0) + 1,
          lastActiveAt: Date.now(),
          updatedAt: Date.now()
        })
        addToast(`🎓 ${duration}min ajoutées à "${selectedCourse.name}"`, 'success')
      }
      
      setTimerState(prev => ({ 
        ...prev, 
        sessionsCompleted: prev.sessionsCompleted + 1 
      }))
    }
  }

  const startFocus = () => {
    const duration = customDuration * 60
    setTimerState({
      mode: 'focus',
      status: 'running',
      timeLeft: duration,
      totalTime: duration,
      currentTaskId: selectedTaskId,
      currentProjectId: selectedProjectId,
      sessionsCompleted: timerState.sessionsCompleted,
      currentSessionStartedAt: Date.now()
    })
    notificationShownRef.current = false
  }

  const startBreak = () => {
    const isLongBreak = timerState.sessionsCompleted % settings.longBreakInterval === 0 && timerState.sessionsCompleted > 0
    const duration = (isLongBreak ? settings.defaultLongBreak : settings.defaultShortBreak) * 60
    
    setTimerState({
      mode: isLongBreak ? 'longBreak' : 'shortBreak',
      status: 'running',
      timeLeft: duration,
      totalTime: duration,
      currentTaskId: undefined,
      currentProjectId: undefined,
      sessionsCompleted: timerState.sessionsCompleted,
      currentSessionStartedAt: Date.now()
    })
    notificationShownRef.current = false
  }

  const toggleTimer = () => {
    if (timerState.status === 'idle' || timerState.status === 'completed') {
      if (timerState.mode === 'focus') {
        startFocus()
      } else {
        startBreak()
      }
    } else if (timerState.status === 'running') {
      setTimerState(prev => ({ ...prev, status: 'paused' }))
    } else {
      setTimerState(prev => ({ ...prev, status: 'running' }))
    }
  }

  const resetTimer = () => {
    // If timer is running or paused, ask for confirmation
    if (timerState.status === 'running' || timerState.status === 'paused') {
      setShowResetConfirm(true)
      return
    }
    doReset()
  }

  const doReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    
    const duration = timerState.mode === 'focus' 
      ? customDuration * 60 
      : (timerState.mode === 'longBreak' ? settings.defaultLongBreak : settings.defaultShortBreak) * 60
    
    setTimerState(prev => ({
      ...prev,
      status: 'idle',
      timeLeft: duration,
      totalTime: duration
    }))
    setShowResetConfirm(false)
  }

  const playNotificationSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTO9')
    audio.volume = settings.soundVolume / 100
    audio.play().catch(() => {})
  }

  const showNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = timerState.mode === 'focus' ? '🎯 Session terminée !' : '☕ Pause terminée !'
      const body = timerState.mode === 'focus' 
        ? 'Bravo ! Prends une pause bien méritée.' 
        : 'C\'est reparti ! Prêt pour une nouvelle session ?'
      
      new Notification(title, { body, icon: '/favicon.ico' })
    }
  }

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Dynamic title with timer
  useEffect(() => {
    if (timerState.status === 'running' || timerState.status === 'paused') {
      const mode = timerState.mode === 'focus' ? '🍅' : '☕'
      document.title = `${mode} ${formatTime(timerState.timeLeft)} - Pomodoro`
    } else {
      document.title = 'Pomodoro - IKU'
    }
    return () => { document.title = 'IKU' }
  }, [timerState.timeLeft, timerState.status, timerState.mode])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return
      
      if (e.code === 'Space' && activeTab === 'timer') {
        e.preventDefault()
        toggleTimer()
      }
      if (e.code === 'KeyR' && activeTab === 'timer' && timerState.status !== 'idle') {
        e.preventDefault()
        setShowResetConfirm(true)
      }
      // Tab navigation with 1-4
      if (e.key === '1') setActiveTab('timer')
      if (e.key === '2') setActiveTab('stats')
      if (e.key === '3') setActiveTab('history')
      if (e.key === '4') setActiveTab('settings')
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTab, timerState.status])

  // Progress percentage
  const progress = ((timerState.totalTime - timerState.timeLeft) / timerState.totalTime) * 100

  // Preset durations
  const presetDurations = [15, 25, 30, 45, 60]

  // Incomplete tasks for selection
  const incompleteTasks = tasks.filter(t => !t.completed)

  const { setView } = useStore()

  return (
    <div className={`${embedded ? 'h-full' : 'h-screen'} w-full flex flex-col overflow-hidden text-zinc-100`}>
      {/* Header - Masqué si embedded */}
      {!embedded && (
        <header className="flex-shrink-0 px-4 py-2 border-b border-zinc-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView('hub')}
                className="p-1.5 hover:bg-zinc-800/50 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-zinc-400" />
              </button>
              <Timer className="w-4 h-4 text-red-400" />
              <h1 className="text-lg font-semibold text-zinc-200">Pomodoro</h1>
            </div>

            {/* Tabs - Réduits pour focus sur l'action */}
            <div className="flex items-center gap-1 bg-zinc-800/50 rounded-lg p-0.5" role="tablist">
              {[
                { id: 'timer' as const, label: 'Focus', icon: Timer },
                { id: 'history' as const, label: 'Aujourd\'hui', icon: Calendar },
                { id: 'settings' as const, label: 'Réglages', icon: Settings }
              ].map(tab => (
                <button
                  key={tab.id}
                  role="tab"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'bg-zinc-700 text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </header>
      )}
      
      {/* Tabs internes quand embedded */}
      {embedded && (
        <div className="flex-shrink-0 px-4 py-2 border-b border-zinc-800/30">
          <div className="flex items-center gap-1 bg-zinc-800/40 rounded-lg p-0.5 w-fit" role="tablist">
            {[
              { id: 'timer' as const, label: 'Timer', icon: Timer },
              { id: 'history' as const, label: 'Historique', icon: Calendar },
              { id: 'settings' as const, label: 'Réglages', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                role="tab"
                onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-zinc-700 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 py-3">
          {/* TIMER TAB */}
        {activeTab === 'timer' && (
          <div 
            role="tabpanel" 
            id="panel-timer" 
            aria-labelledby="tab-timer"
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Main Timer */}
            <div className="lg:col-span-2">
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
                {/* Mode indicator */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  {timerState.mode === 'focus' ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
                      <Zap className="w-3 h-3 text-red-400" />
                      <span className="text-xs font-medium text-red-400">Focus</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                      <Coffee className="w-3 h-3 text-green-400" />
                      <span className="text-xs font-medium text-green-400">
                        {timerState.mode === 'longBreak' ? 'Long Break' : 'Break'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Timer display */}
                <div className="relative mb-6">
                  {/* Circular progress */}
                  <svg className="w-full max-w-[220px] mx-auto" viewBox="0 0 200 200">
                    <circle
                      cx="100"
                      cy="100"
                      r="90"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-zinc-800"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="90"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeLinecap="round"
                      className={timerState.mode === 'focus' ? 'text-red-500' : 'text-green-500'}
                      style={{
                        strokeDasharray: `${2 * Math.PI * 90}`,
                        strokeDashoffset: `${2 * Math.PI * 90 * (1 - progress / 100)}`,
                        transform: 'rotate(-90deg)',
                        transformOrigin: '100px 100px',
                        transition: 'stroke-dashoffset 1s linear'
                      }}
                    />
                  </svg>

                  {/* Time text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-5xl font-bold mb-1">{formatTime(timerState.timeLeft)}</div>
                      {/* État masqué à l'idle - le bouton Play parle de lui-même */}
                      {timerState.status !== 'idle' && (
                        <div className="text-zinc-500 text-xs">
                          {timerState.status === 'running' && 'En cours...'}
                          {timerState.status === 'paused' && 'En pause'}
                          {timerState.status === 'completed' && 'Terminé !'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Controls - Bouton Play agrandi à l'état idle */}
                <div className="flex items-center justify-center gap-3 mb-4">
                  <button
                    onClick={toggleTimer}
                    className={`rounded-full flex items-center justify-center transition-all duration-200 ${
                      timerState.status === 'idle' || timerState.status === 'completed'
                        ? 'w-20 h-20 shadow-2xl shadow-red-500/20' // 2x plus gros à l'idle
                        : 'w-12 h-12'
                    } ${
                      timerState.mode === 'focus'
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {timerState.status === 'running' ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className={`${timerState.status === 'idle' ? 'w-10 h-10 ml-1' : 'w-6 h-6 ml-0.5'}`} />
                    )}
                  </button>

                  {/* Reset button - Seulement visible si timer actif */}
                  {timerState.status !== 'idle' && timerState.status !== 'completed' && (
                    <button
                      onClick={resetTimer}
                      className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Session info - Compact */}
                {timerState.mode === 'focus' && (selectedTask || selectedProject || selectedBook || selectedCourse) && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {selectedTask && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800/50 rounded-lg text-xs">
                        <CheckSquare className="w-3 h-3 text-red-400" />
                        <span className="text-zinc-300 truncate max-w-[120px]">{selectedTask.title}</span>
                      </div>
                    )}
                    {selectedProject && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800/50 rounded-lg text-xs">
                        <Folder className="w-3 h-3" style={{ color: selectedProject.color }} />
                        <span className="text-zinc-300">{selectedProject.name}</span>
                      </div>
                    )}
                    {selectedBook && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800/50 rounded-lg text-xs">
                        <BookOpen className="w-3 h-3 text-amber-400" />
                        <span className="text-zinc-300 truncate max-w-[120px]">{selectedBook.title}</span>
                      </div>
                    )}
                    {selectedCourse && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800/50 rounded-lg text-xs">
                        <span className="text-sm">{selectedCourse.icon}</span>
                        <span className="text-zinc-300 truncate max-w-[120px]">{selectedCourse.name}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar - Apparaît SEULEMENT si timer actif ou en pause */}
            {(timerState.status === 'running' || timerState.status === 'paused') && (
              <div className="space-y-3 animate-fade-in">
                {/* Duration presets - Visible en pause uniquement */}
                {timerState.status === 'paused' && timerState.mode === 'focus' && (
                  <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-3">
                    <h3 className="text-xs font-semibold text-zinc-500 mb-2 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      AJUSTER DURÉE
                    </h3>
                    <div className="grid grid-cols-5 gap-1.5 mb-2">
                      {presetDurations.map(duration => (
                        <button
                          key={duration}
                          onClick={() => {
                            setCustomDuration(duration)
                            setTimerState(prev => ({
                              ...prev,
                              timeLeft: duration * 60,
                              totalTime: duration * 60
                            }))
                          }}
                          className={`py-1.5 px-2 rounded-md font-medium text-xs transition-colors ${
                            customDuration === duration
                              ? 'bg-red-500 text-white'
                              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                          }`}
                        >
                          {duration}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Task selector - Accessible pendant la session */}
                {timerState.mode === 'focus' && (
                  <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-3">
                    <h3 className="text-xs font-semibold text-zinc-500 mb-2 flex items-center gap-1.5">
                      <Target className="w-3 h-3" />
                      LIER (OPTIONNEL)
                    </h3>
                    
                    <div className="space-y-2">
                      <select
                        value={selectedTaskId || ''}
                        onChange={(e) => setSelectedTaskId(e.target.value || undefined)}
                        className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-800/50 rounded-md text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
                      >
                        <option value="">Tâche...</option>
                        {incompleteTasks.map(task => (
                          <option key={task.id} value={task.id}>{task.title}</option>
                        ))}
                      </select>

                      <select
                        value={selectedProjectId || ''}
                        onChange={(e) => setSelectedProjectId(e.target.value || undefined)}
                        className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-800/50 rounded-md text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
                      >
                        <option value="">Projet...</option>
                        {projects.map(project => (
                          <option key={project.id} value={project.id}>{project.icon} {project.name}</option>
                        ))}
                      </select>

                      <select
                        value={selectedBookId || ''}
                        onChange={(e) => setSelectedBookId(e.target.value || undefined)}
                        className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-800/50 rounded-md text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="">📖 Livre...</option>
                        {readingBooks.map(book => (
                          <option key={book.id} value={book.id}>{book.title}</option>
                        ))}
                      </select>

                      <select
                        value={selectedCourseId || ''}
                        onChange={(e) => setSelectedCourseId(e.target.value || undefined)}
                        className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-800/50 rounded-md text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">🎓 Cours...</option>
                        {activeCourses.map(course => (
                          <option key={course.id} value={course.id}>{course.icon} {course.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <p className="text-[10px] text-zinc-600 mt-2">
                      Vous pouvez lier cette session pendant ou après
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Message à l'état idle - Focus sur l'action */}
            {timerState.status === 'idle' && timerState.mode === 'focus' && (
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 text-center">
                <p className="text-sm text-zinc-500 mb-2">
                  Cliquez sur Play pour commencer
                </p>
                <p className="text-xs text-zinc-600">
                  Durée : {customDuration} minutes
                </p>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="text-xs text-zinc-700 hover:text-zinc-500 mt-2 transition-colors"
                >
                  Changer les réglages par défaut
                </button>
              </div>
            )}
          </div>
        )}


        {/* HISTORY TAB - Simplifié : Aujourd'hui uniquement */}
        {activeTab === 'history' && (
          <div 
            role="tabpanel" 
            id="panel-history" 
            aria-labelledby="tab-history"
            className="space-y-4 max-w-2xl mx-auto"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-lg font-medium text-zinc-300 mb-1">Aujourd'hui</h2>
              <p className="text-xs text-zinc-600">
                {new Date().toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric',
                  month: 'long'
                })}
              </p>
            </div>

            {/* Stats du jour - Minimal */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-red-400 mb-1">
                  {daySchedule.totalSessions}
                </div>
                <div className="text-xs text-zinc-500">Sessions focus</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-red-400 mb-1">
                  {formatDuration(daySchedule.totalFocusMinutes)}
                </div>
                <div className="text-xs text-zinc-500">Temps de focus</div>
              </div>
            </div>

            {/* Timeline simple */}
            {daySchedule.sessions.length > 0 ? (
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-zinc-500 mb-3">SESSIONS</h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {daySchedule.sessions.filter(s => s.type === 'focus').map((session) => (
                    <div 
                      key={session.id} 
                      className="p-3 bg-zinc-800/30 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Zap className="w-4 h-4 text-red-400" />
                        <div>
                          <div className="text-sm font-medium text-zinc-300">
                            {session.actualDuration || session.duration} min
                          </div>
                          <div className="text-xs text-zinc-600">
                            {new Date(session.completedAt).toLocaleTimeString('fr-FR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </div>
                      {session.taskTitle && (
                        <div className="text-xs text-zinc-500 truncate max-w-[150px]">
                          {session.taskTitle}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-8 text-center">
                <p className="text-sm text-zinc-500">Aucune session aujourd'hui</p>
              </div>
            )}

            {/* Lien vers Dashboard */}
            <div className="text-center pt-4 border-t border-zinc-800/50">
              <button
                onClick={() => setView('dashboard')}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                Voir les statistiques complètes dans le Dashboard →
              </button>
            </div>
          </div>
        )}

        {/* SETTINGS TAB - Simplifié */}
        {activeTab === 'settings' && (
          <div 
            role="tabpanel" 
            id="panel-settings" 
            aria-labelledby="tab-settings"
            className="max-w-xl mx-auto space-y-6"
          >
            {/* Durées */}
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-zinc-400 mb-4">Durées</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-zinc-300 mb-2 block">Focus (minutes)</label>
                  <input
                    type="number"
                    value={settings.defaultFocusDuration}
                    onChange={(e) => setSettings({ ...settings, defaultFocusDuration: parseInt(e.target.value) || 25 })}
                    min="1"
                    max="120"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-800/50 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-300 mb-2 block">Pause courte (minutes)</label>
                  <input
                    type="number"
                    value={settings.defaultShortBreak}
                    onChange={(e) => setSettings({ ...settings, defaultShortBreak: parseInt(e.target.value) || 5 })}
                    min="1"
                    max="30"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-800/50 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-300 mb-2 block">Pause longue (minutes)</label>
                  <input
                    type="number"
                    value={settings.defaultLongBreak}
                    onChange={(e) => setSettings({ ...settings, defaultLongBreak: parseInt(e.target.value) || 15 })}
                    min="1"
                    max="60"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-800/50 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-300 mb-2 block">Pause longue tous les X sessions</label>
                  <input
                    type="number"
                    value={settings.longBreakInterval}
                    onChange={(e) => setSettings({ ...settings, longBreakInterval: parseInt(e.target.value) || 4 })}
                    min="2"
                    max="10"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-800/50 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Automatisation & Sons */}
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-zinc-400 mb-4">Automatisation & Sons</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-sm text-zinc-300">Auto-démarrer les pauses</div>
                    <div className="text-xs text-zinc-600">Lancer automatiquement les pauses</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoStartBreaks}
                    onChange={(e) => setSettings({ ...settings, autoStartBreaks: e.target.checked })}
                    className="w-5 h-5 rounded bg-zinc-800 border-zinc-800 text-red-500 focus:ring-2 focus:ring-red-500"
                  />
                </label>
                
                <label className="flex items-center justify-between cursor-pointer opacity-50">
                  <div>
                    <div className="text-sm text-zinc-300">Auto-démarrer les sessions</div>
                    <div className="text-xs text-zinc-600">Désactivé par défaut (calme)</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoStartPomodoros}
                    onChange={(e) => setSettings({ ...settings, autoStartPomodoros: e.target.checked })}
                    className="w-5 h-5 rounded bg-zinc-800 border-zinc-800 text-red-500 focus:ring-2 focus:ring-red-500"
                  />
                </label>

                <div className="border-t border-zinc-800/50 pt-3 mt-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-zinc-300">Sons de fin</span>
                    <input
                      type="checkbox"
                      checked={settings.soundEnabled}
                      onChange={(e) => setSettings({ ...settings, soundEnabled: e.target.checked })}
                      className="w-5 h-5 rounded bg-zinc-800 border-zinc-800 text-red-500 focus:ring-2 focus:ring-red-500"
                    />
                  </label>

                  {settings.soundEnabled && (
                    <div className="mt-3">
                      <label className="text-sm text-zinc-400 mb-2 block">Volume ({settings.soundVolume}%)</label>
                      <input
                        type="range"
                        value={settings.soundVolume}
                        onChange={(e) => setSettings({ ...settings, soundVolume: parseInt(e.target.value) })}
                        min="0"
                        max="100"
                        className="w-full accent-red-500"
                      />
                    </div>
                  )}
                </div>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-zinc-300">Notifications</span>
                  <input
                    type="checkbox"
                    checked={settings.notificationsEnabled}
                    onChange={(e) => setSettings({ ...settings, notificationsEnabled: e.target.checked })}
                    className="w-5 h-5 rounded bg-zinc-800 border-zinc-800 text-red-500 focus:ring-2 focus:ring-red-500"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer opacity-50">
                  <div>
                    <div className="text-sm text-zinc-300">Tick-tack</div>
                    <div className="text-xs text-zinc-600">Désactivé par défaut (non intrusif)</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.tickingSound}
                    onChange={(e) => setSettings({ ...settings, tickingSound: e.target.checked })}
                    className="w-5 h-5 rounded bg-zinc-800 border-zinc-800 text-red-500 focus:ring-2 focus:ring-red-500"
                  />
                </label>
              </div>
            </div>

            {/* Note */}
            <div className="text-center text-xs text-zinc-600 pt-2">
              Le Pomodoro reste calme et non intrusif par défaut
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Reset confirmation dialog */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={doReset}
        title="Réinitialiser le timer ?"
        message="Le temps écoulé ne sera pas enregistré. Voulez-vous vraiment réinitialiser ?"
        confirmText="Réinitialiser"
        cancelText="Annuler"
        variant="warning"
      />
    </div>
  )
}

