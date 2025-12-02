import { useState, useEffect, useRef, useMemo } from 'react'
import { useStore } from '../../store/useStore'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  TrendingUp, 
  Clock, 
  Target,
  Coffee,
  Zap,
  Calendar,
  BarChart3,
  CheckSquare,
  Folder,
  ChevronLeft,
  ChevronRight,
  Timer,
  Award,
  Flame,
  Activity
} from 'lucide-react'
import { 
  formatTime, 
  formatDuration, 
  calculatePomodoroStats,
  calculateProjectStats,
  calculateTaskStats,
  getDaySchedule,
  analyzeProductivityPatterns
} from '../../utils/pomodoroUtils'
import { TimerState, TimerMode, PomodoroSettings } from '../../types/pomodoro'

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

export function PomodoroPage() {
  const {
    tasks,
    projects,
    pomodoroSessions,
    addPomodoroSession,
    addToast,
    setView
  } = useStore()

  const [activeTab, setActiveTab] = useState<TabView>('timer')
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS)
  
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

  // Task & Project selection
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>()
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>()
  const [customDuration, setCustomDuration] = useState<number>(25)
  const [showTaskSelector, setShowTaskSelector] = useState(false)
  const [showProjectSelector, setShowProjectSelector] = useState(false)

  // History view
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Timer interval ref
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const notificationShownRef = useRef(false)

  // Selected task & project
  const selectedTask = tasks.find(t => t.id === selectedTaskId)
  const selectedProject = projects.find(p => p.id === selectedProjectId) || 
                          (selectedTask?.projectId ? projects.find(p => p.id === selectedTask.projectId) : undefined)

  // Stats calculations
  const stats = useMemo(() => calculatePomodoroStats(pomodoroSessions), [pomodoroSessions])
  const projectStats = useMemo(() => calculateProjectStats(pomodoroSessions, projects), [pomodoroSessions, projects])
  const taskStats = useMemo(() => calculateTaskStats(pomodoroSessions, tasks), [pomodoroSessions, tasks])
  const daySchedule = useMemo(() => getDaySchedule(pomodoroSessions, selectedDate), [pomodoroSessions, selectedDate])
  const patterns = useMemo(() => analyzeProductivityPatterns(pomodoroSessions), [pomodoroSessions])

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
        duration,
        type: 'focus',
        startedAt: timerState.currentSessionStartedAt
      })
      
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

  // Progress percentage
  const progress = ((timerState.totalTime - timerState.timeLeft) / timerState.totalTime) * 100

  // Preset durations
  const presetDurations = [15, 25, 30, 45, 60]

  // Incomplete tasks for selection
  const incompleteTasks = tasks.filter(t => !t.completed)

  // Navigate dates
  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate)
    currentDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1))
    setSelectedDate(currentDate.toISOString().split('T')[0])
  }

  const isToday = selectedDate === new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                <Timer className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-100">Pomodoro</h1>
                <p className="text-sm text-zinc-500">Time tracking & focus sessions</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 bg-zinc-800/50 rounded-xl p-1">
              {[
                { id: 'timer' as const, label: 'Timer', icon: Timer },
                { id: 'stats' as const, label: 'Stats', icon: TrendingUp },
                { id: 'history' as const, label: 'History', icon: Calendar },
                { id: 'settings' as const, label: 'Settings', icon: Settings }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-zinc-700 text-zinc-100'
                      : 'text-zinc-400 hover:text-zinc-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* TIMER TAB */}
        {activeTab === 'timer' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Timer */}
            <div className="lg:col-span-2">
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-8">
                {/* Mode indicator */}
                <div className="flex items-center justify-center gap-3 mb-8">
                  {timerState.mode === 'focus' ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full">
                      <Zap className="w-4 h-4 text-red-400" />
                      <span className="text-sm font-medium text-red-400">Focus Session</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
                      <Coffee className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-medium text-green-400">
                        {timerState.mode === 'longBreak' ? 'Long Break' : 'Short Break'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Timer display */}
                <div className="relative mb-12">
                  {/* Circular progress */}
                  <svg className="w-full max-w-md mx-auto" viewBox="0 0 200 200">
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
                      <div className="text-7xl font-bold mb-2">{formatTime(timerState.timeLeft)}</div>
                      <div className="text-zinc-500 text-sm">
                        {timerState.status === 'running' && '⏱️ En cours...'}
                        {timerState.status === 'paused' && '⏸️ En pause'}
                        {timerState.status === 'idle' && '▶️ Prêt à démarrer'}
                        {timerState.status === 'completed' && '✅ Terminé !'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4 mb-8">
                  <button
                    onClick={toggleTimer}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                      timerState.mode === 'focus'
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {timerState.status === 'running' ? (
                      <Pause className="w-8 h-8" />
                    ) : (
                      <Play className="w-8 h-8 ml-1" />
                    )}
                  </button>

                  <button
                    onClick={resetTimer}
                    className="w-12 h-12 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>

                {/* Session info */}
                {timerState.mode === 'focus' && (
                  <div className="space-y-3">
                    {selectedTask && (
                      <div className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                        <CheckSquare className="w-5 h-5 text-red-400" />
                        <div className="flex-1">
                          <div className="text-sm text-zinc-400">Tâche en cours</div>
                          <div className="font-medium">{selectedTask.title}</div>
                        </div>
                      </div>
                    )}

                    {selectedProject && (
                      <div className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                        <Folder className="w-5 h-5" style={{ color: selectedProject.color }} />
                        <div className="flex-1">
                          <div className="text-sm text-zinc-400">Projet</div>
                          <div className="font-medium">{selectedProject.name}</div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                      <Award className="w-5 h-5 text-yellow-400" />
                      <div className="flex-1">
                        <div className="text-sm text-zinc-400">Sessions aujourd'hui</div>
                        <div className="font-medium">{stats.todaySessions} sessions • {formatDuration(stats.todayMinutes)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Duration presets */}
              {timerState.status === 'idle' && timerState.mode === 'focus' && (
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-zinc-400 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    DURÉE
                  </h3>
                  <div className="grid grid-cols-3 gap-2 mb-4">
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
                        className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                          customDuration === duration
                            ? 'bg-red-500 text-white'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                      >
                        {duration}min
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={customDuration}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 25
                      setCustomDuration(val)
                      setTimerState(prev => ({
                        ...prev,
                        timeLeft: val * 60,
                        totalTime: val * 60
                      }))
                    }}
                    min="1"
                    max="120"
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              )}

              {/* Task selector */}
              {timerState.mode === 'focus' && (
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-zinc-400 mb-4 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    ASSOCIER
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-zinc-500 mb-2 block">Tâche</label>
                      <select
                        value={selectedTaskId || ''}
                        onChange={(e) => setSelectedTaskId(e.target.value || undefined)}
                        disabled={timerState.status !== 'idle'}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        <option value="">Aucune tâche</option>
                        {incompleteTasks.map(task => (
                          <option key={task.id} value={task.id}>{task.title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-zinc-500 mb-2 block">Projet</label>
                      <select
                        value={selectedProjectId || ''}
                        onChange={(e) => setSelectedProjectId(e.target.value || undefined)}
                        disabled={timerState.status !== 'idle'}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        <option value="">Aucun projet</option>
                        {projects.map(project => (
                          <option key={project.id} value={project.id}>{project.icon} {project.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick stats */}
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-zinc-400 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  AUJOURD'HUI
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-zinc-500">Sessions</span>
                      <span className="text-2xl font-bold">{stats.todaySessions}</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all"
                        style={{ width: `${Math.min(100, (stats.todaySessions / 8) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-zinc-500">Focus time</span>
                      <span className="text-2xl font-bold">{formatDuration(stats.todayMinutes)}</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all"
                        style={{ width: `${Math.min(100, (stats.todayMinutes / 240) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span className="text-xs text-zinc-500">Streak actuel</span>
                    </div>
                    <div className="text-3xl font-bold text-orange-400">{stats.currentStreak} jours</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STATS TAB */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Global stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Timer className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500">Total sessions</div>
                    <div className="text-2xl font-bold">{stats.totalSessions}</div>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500">Total time</div>
                    <div className="text-2xl font-bold">{formatDuration(stats.totalMinutes)}</div>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500">Taux de complétion</div>
                    <div className="text-2xl font-bold">{stats.completionRate}%</div>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500">Record streak</div>
                    <div className="text-2xl font-bold">{stats.longestStreak} jours</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Project breakdown */}
            {projectStats.length > 0 && (
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-zinc-400 mb-6 flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  TEMPS PAR PROJET
                </h3>
                <div className="space-y-4">
                  {projectStats.slice(0, 10).map(proj => (
                    <div key={proj.projectId} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: proj.projectColor + '20' }}>
                        <span className="text-xl">{proj.projectIcon || '📁'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium truncate">{proj.projectName}</span>
                          <span className="text-sm text-zinc-400">{formatDuration(proj.totalMinutes)}</span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full transition-all"
                            style={{ 
                              width: `${(proj.totalMinutes / projectStats[0].totalMinutes) * 100}%`,
                              backgroundColor: proj.projectColor
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                          <span>{proj.totalSessions} sessions</span>
                          <span>Moy: {Math.round(proj.avgSessionDuration)}min</span>
                          <span>{proj.completionRate}% complété</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Task breakdown */}
            {taskStats.length > 0 && (
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-zinc-400 mb-6 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" />
                  TEMPS PAR TÂCHE
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {taskStats.slice(0, 10).map(task => (
                    <div key={task.taskId} className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{task.taskTitle}</div>
                          {task.projectName && (
                            <div className="text-xs text-zinc-500">{task.projectName}</div>
                          )}
                        </div>
                        <div className="text-right ml-3">
                          <div className="font-bold text-red-400">{formatDuration(task.totalMinutes)}</div>
                          <div className="text-xs text-zinc-500">{task.totalSessions} sessions</div>
                        </div>
                      </div>
                      {task.estimatedTime && (
                        <div>
                          <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                            <span>Progression</span>
                            <span>{task.progress}%</span>
                          </div>
                          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all"
                              style={{ width: `${Math.min(100, task.progress)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Productivity patterns */}
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-zinc-400 mb-6 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                PATTERNS DE PRODUCTIVITÉ
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { key: 'morning', label: 'Matin', icon: '🌅', time: '6h-12h' },
                  { key: 'afternoon', label: 'Après-midi', icon: '☀️', time: '12h-18h' },
                  { key: 'evening', label: 'Soir', icon: '🌆', time: '18h-22h' },
                  { key: 'night', label: 'Nuit', icon: '🌙', time: '22h-6h' }
                ].map(period => {
                  const minutes = patterns[period.key as keyof typeof patterns] as number
                  const isBest = patterns.bestTime === period.key
                  return (
                    <div 
                      key={period.key} 
                      className={`p-4 rounded-xl border ${
                        isBest 
                          ? 'bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20' 
                          : 'bg-zinc-800/50 border-zinc-700/50'
                      }`}
                    >
                      <div className="text-3xl mb-2">{period.icon}</div>
                      <div className="font-medium mb-1">{period.label}</div>
                      <div className="text-xs text-zinc-500 mb-2">{period.time}</div>
                      <div className="text-2xl font-bold text-red-400">{formatDuration(minutes)}</div>
                      {isBest && (
                        <div className="mt-2 text-xs text-red-400 font-medium">⭐ Meilleure période</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Date navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigateDate('prev')}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex items-center gap-2 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Jour précédent
              </button>

              <div className="text-center">
                <div className="text-2xl font-bold">
                  {isToday ? 'Aujourd\'hui' : new Date(selectedDate).toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="text-sm text-zinc-500">{selectedDate}</div>
              </div>

              <button
                onClick={() => navigateDate('next')}
                disabled={isToday}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Jour suivant
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
                <div className="text-xs text-zinc-500 mb-1">Sessions</div>
                <div className="text-3xl font-bold">{daySchedule.totalSessions}</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
                <div className="text-xs text-zinc-500 mb-1">Focus time</div>
                <div className="text-3xl font-bold text-red-400">{formatDuration(daySchedule.totalFocusMinutes)}</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
                <div className="text-xs text-zinc-500 mb-1">Break time</div>
                <div className="text-3xl font-bold text-green-400">{formatDuration(daySchedule.totalBreakMinutes)}</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
                <div className="text-xs text-zinc-500 mb-1">Productivité</div>
                <div className="text-3xl font-bold text-orange-400">{daySchedule.productivityScore}%</div>
              </div>
            </div>

            {/* Timeline */}
            {daySchedule.sessions.length > 0 ? (
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-zinc-400 mb-6 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  TIMELINE
                </h3>
                <div className="space-y-3">
                  {daySchedule.sessions.map((session, idx) => (
                    <div key={session.id} className="flex items-start gap-4">
                      {/* Time */}
                      <div className="text-sm text-zinc-500 w-20 pt-1">
                        {new Date(session.completedAt).toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>

                      {/* Timeline dot */}
                      <div className="relative">
                        <div className={`w-3 h-3 rounded-full ${
                          session.type === 'focus' ? 'bg-red-500' : 'bg-green-500'
                        }`} />
                        {idx < daySchedule.sessions.length - 1 && (
                          <div className="absolute left-1/2 top-3 w-px h-12 bg-zinc-800 -translate-x-1/2" />
                        )}
                      </div>

                      {/* Session info */}
                      <div className="flex-1 pb-12">
                        <div className={`p-4 rounded-xl border ${
                          session.type === 'focus'
                            ? 'bg-red-500/5 border-red-500/20'
                            : 'bg-green-500/5 border-green-500/20'
                        }`}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {session.type === 'focus' ? (
                                <Zap className="w-4 h-4 text-red-400" />
                              ) : (
                                <Coffee className="w-4 h-4 text-green-400" />
                              )}
                              <span className="font-medium">
                                {session.type === 'focus' ? 'Session de focus' : 'Pause'}
                              </span>
                            </div>
                            <span className="text-sm text-zinc-400">
                              {session.actualDuration || session.duration} min
                            </span>
                          </div>

                          {session.taskTitle && (
                            <div className="text-sm text-zinc-400 mb-1">
                              📋 {session.taskTitle}
                            </div>
                          )}

                          {session.projectName && (
                            <div className="text-sm text-zinc-400">
                              📁 {session.projectName}
                            </div>
                          )}

                          {session.interrupted && (
                            <div className="mt-2 text-xs text-orange-400 flex items-center gap-1">
                              ⚠️ Session interrompue
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-12 text-center">
                <Clock className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500">Aucune session ce jour-là</p>
              </div>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-zinc-400 mb-6 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                DURÉES PAR DÉFAUT
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-zinc-300 mb-2 block">Focus (minutes)</label>
                  <input
                    type="number"
                    value={settings.defaultFocusDuration}
                    onChange={(e) => setSettings({ ...settings, defaultFocusDuration: parseInt(e.target.value) || 25 })}
                    min="1"
                    max="120"
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
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
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
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
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-300 mb-2 block">Pause longue tous les (sessions)</label>
                  <input
                    type="number"
                    value={settings.longBreakInterval}
                    onChange={(e) => setSettings({ ...settings, longBreakInterval: parseInt(e.target.value) || 4 })}
                    min="2"
                    max="10"
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-zinc-400 mb-6 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                COMPORTEMENT
              </h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-zinc-300">Démarrer automatiquement les pauses</span>
                  <input
                    type="checkbox"
                    checked={settings.autoStartBreaks}
                    onChange={(e) => setSettings({ ...settings, autoStartBreaks: e.target.checked })}
                    className="w-5 h-5 rounded bg-zinc-800 border-zinc-700 text-red-500 focus:ring-2 focus:ring-red-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-zinc-300">Démarrer automatiquement les sessions</span>
                  <input
                    type="checkbox"
                    checked={settings.autoStartPomodoros}
                    onChange={(e) => setSettings({ ...settings, autoStartPomodoros: e.target.checked })}
                    className="w-5 h-5 rounded bg-zinc-800 border-zinc-700 text-red-500 focus:ring-2 focus:ring-red-500"
                  />
                </label>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-zinc-400 mb-6 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                SONS & NOTIFICATIONS
              </h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-zinc-300">Sons activés</span>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => setSettings({ ...settings, soundEnabled: e.target.checked })}
                    className="w-5 h-5 rounded bg-zinc-800 border-zinc-700 text-red-500 focus:ring-2 focus:ring-red-500"
                  />
                </label>

                {settings.soundEnabled && (
                  <div>
                    <label className="text-sm text-zinc-300 mb-2 block">Volume ({settings.soundVolume}%)</label>
                    <input
                      type="range"
                      value={settings.soundVolume}
                      onChange={(e) => setSettings({ ...settings, soundVolume: parseInt(e.target.value) })}
                      min="0"
                      max="100"
                      className="w-full"
                    />
                  </div>
                )}

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-zinc-300">Notifications activées</span>
                  <input
                    type="checkbox"
                    checked={settings.notificationsEnabled}
                    onChange={(e) => setSettings({ ...settings, notificationsEnabled: e.target.checked })}
                    className="w-5 h-5 rounded bg-zinc-800 border-zinc-700 text-red-500 focus:ring-2 focus:ring-red-500"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-zinc-300">Son de tick-tack</span>
                  <input
                    type="checkbox"
                    checked={settings.tickingSound}
                    onChange={(e) => setSettings({ ...settings, tickingSound: e.target.checked })}
                    className="w-5 h-5 rounded bg-zinc-800 border-zinc-700 text-red-500 focus:ring-2 focus:ring-red-500"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

