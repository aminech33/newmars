// Types pour le système Pomodoro avancé

export interface PomodoroSession {
  id: string
  taskId?: string
  taskTitle?: string
  projectId?: string
  projectName?: string
  projectIcon?: string
  duration: number // durée prévue en minutes
  actualDuration?: number // durée réelle si interrompu
  completedAt: number
  startedAt?: number
  date: string // YYYY-MM-DD
  type: 'focus' | 'break'
  interrupted?: boolean
  interruptions?: number
  tags?: string[]
  notes?: string
}

export interface PomodoroSettings {
  defaultFocusDuration: number // 25 par défaut
  defaultShortBreak: number // 5
  defaultLongBreak: number // 15
  longBreakInterval: number // 4 (après combien de sessions)
  autoStartBreaks: boolean
  autoStartPomodoros: boolean
  soundEnabled: boolean
  soundVolume: number // 0-100
  notificationsEnabled: boolean
  tickingSound: boolean
}

export interface PomodoroStats {
  totalSessions: number
  totalMinutes: number
  todaySessions: number
  todayMinutes: number
  weekSessions: number
  weekMinutes: number
  monthSessions: number
  monthMinutes: number
  completionRate: number // % sessions non interrompues
  avgSessionDuration: number
  currentStreak: number // jours consécutifs
  longestStreak: number
}

export interface ProjectTimeStats {
  projectId: string
  projectName: string
  projectIcon?: string
  projectColor?: string
  totalSessions: number
  totalMinutes: number
  todaySessions: number
  todayMinutes: number
  weekSessions: number
  weekMinutes: number
  avgSessionDuration: number
  completionRate: number
  lastSessionDate?: string
}

export interface TaskTimeStats {
  taskId: string
  taskTitle: string
  projectId?: string
  projectName?: string
  totalSessions: number
  totalMinutes: number
  estimatedTime?: number // si défini dans la tâche
  progress: number // % basé sur estimatedTime
  lastSessionDate?: string
}

export interface DaySchedule {
  date: string
  sessions: PomodoroSession[]
  totalFocusMinutes: number
  totalBreakMinutes: number
  totalSessions: number
  productivityScore: number // 0-100
}

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed'
export type TimerMode = 'focus' | 'shortBreak' | 'longBreak'

export interface TimerState {
  mode: TimerMode
  status: TimerStatus
  timeLeft: number // secondes
  totalTime: number // secondes
  currentTaskId?: string
  currentProjectId?: string
  sessionsCompleted: number
  currentSessionStartedAt?: number
}

