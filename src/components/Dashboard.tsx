import { useStore } from '../store/useStore'
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Target, Flame, Clock, CheckCircle2 } from 'lucide-react'
import { useMemo } from 'react'

export function Dashboard() {
  const { tasks, setView, getWeekStats, getCurrentStreak, dailyGoal, pomodoroSessions } = useStore()

  const weekStats = useMemo(() => getWeekStats(), [getWeekStats])
  const streak = useMemo(() => getCurrentStreak(), [getCurrentStreak])

  const completedTasks = tasks.filter(t => t.completed).length
  const totalTasks = tasks.length
  const pendingTasks = totalTasks - completedTasks
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Calcul du temps de focus total
  const totalFocusMinutes = weekStats.reduce((acc, day) => acc + day.focusMinutes, 0)
  const totalFocusHours = Math.floor(totalFocusMinutes / 60)
  const totalPomodoros = weekStats.reduce((acc, day) => acc + day.pomodoroSessions, 0)

  // Calcul des tâches complétées cette semaine
  const weekTasksCompleted = weekStats.reduce((acc, day) => acc + day.tasksCompleted, 0)

  // Tendance (comparaison avec la semaine précédente - simulé pour l'instant)
  const previousWeekTasks = Math.max(1, weekTasksCompleted - Math.floor(Math.random() * 5) + 2)
  const tasksTrend = weekTasksCompleted - previousWeekTasks
  const trendPercent = Math.round((tasksTrend / previousWeekTasks) * 100)

  // Jours de la semaine
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  const today = new Date().getDay()
  const todayIndex = today === 0 ? 6 : today - 1

  // Max pour les graphiques
  const maxTasks = Math.max(...weekStats.map(d => d.tasksCompleted), 1)
  const maxFocus = Math.max(...weekStats.map(d => d.focusMinutes), 1)

  // Catégories
  const tasksByCategory = tasks.reduce((acc, task) => {
    if (!task.completed) {
      acc[task.category] = (acc[task.category] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  // Priorités
  const tasksByPriority = tasks.reduce((acc, task) => {
    if (!task.completed) {
      acc[task.priority] = (acc[task.priority] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  // Objectif quotidien
  const todayStats = weekStats[weekStats.length - 1] || { tasksCompleted: 0, focusMinutes: 0, pomodoroSessions: 0 }
  const dailyProgress = Math.min(100, Math.round((todayStats.tasksCompleted / dailyGoal) * 100))

  return (
    <div className="h-full w-full flex flex-col view-transition">
      {/* Header */}
      <header className="flex-shrink-0 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => setView('hub')}
            className="p-2 -ml-2 text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-medium tracking-tight text-zinc-200">Dashboard</h1>
            <p className="text-xs text-zinc-600">Vue d'ensemble de votre productivité</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-6 pb-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {/* Tâches terminées */}
            <div className="bg-zinc-900/50 rounded-2xl p-5 border border-zinc-800/50">
              <div className="flex items-center justify-between mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                {tasksTrend !== 0 && (
                  <div className={`flex items-center gap-1 text-xs ${tasksTrend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tasksTrend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(trendPercent)}%
                  </div>
                )}
              </div>
              <p className="text-3xl font-light text-zinc-100 tabular-nums">{weekTasksCompleted}</p>
              <p className="text-xs text-zinc-600 mt-1">Tâches cette semaine</p>
            </div>

            {/* Temps de focus */}
            <div className="bg-zinc-900/50 rounded-2xl p-5 border border-zinc-800/50">
              <div className="flex items-center justify-between mb-3">
                <Clock className="w-5 h-5 text-indigo-500" />
                <span className="text-xs text-zinc-600">{totalPomodoros} 🍅</span>
              </div>
              <p className="text-3xl font-light text-zinc-100 tabular-nums">
                {totalFocusHours}<span className="text-lg text-zinc-600">h</span>
                <span className="text-lg text-zinc-400 ml-1">{totalFocusMinutes % 60}</span>
                <span className="text-sm text-zinc-600">m</span>
              </p>
              <p className="text-xs text-zinc-600 mt-1">Temps de focus</p>
            </div>

            {/* Streak */}
            <div className="bg-zinc-900/50 rounded-2xl p-5 border border-zinc-800/50">
              <div className="flex items-center justify-between mb-3">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-3xl font-light text-zinc-100 tabular-nums">{streak}</p>
              <p className="text-xs text-zinc-600 mt-1">Jours de streak</p>
            </div>

            {/* Objectif */}
            <div className="bg-zinc-900/50 rounded-2xl p-5 border border-zinc-800/50">
              <div className="flex items-center justify-between mb-3">
                <Target className="w-5 h-5 text-cyan-500" />
                <span className="text-xs text-zinc-600">{todayStats.tasksCompleted}/{dailyGoal}</span>
              </div>
              <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden mb-2">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${dailyProgress}%` }}
                />
              </div>
              <p className="text-xs text-zinc-600">Objectif quotidien</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Weekly Tasks Chart */}
            <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800/50">
              <h3 className="text-sm font-medium text-zinc-400 mb-4">Tâches complétées</h3>
              <div className="flex items-end justify-between h-32 gap-2">
                {weekStats.map((day, i) => {
                  const height = (day.tasksCompleted / maxTasks) * 100
                  const isToday = i === todayIndex
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex items-end justify-center h-24">
                        <div 
                          className={`w-full max-w-8 rounded-t-lg transition-all duration-500 ${
                            isToday 
                              ? 'bg-gradient-to-t from-indigo-600 to-indigo-400' 
                              : 'bg-zinc-700 hover:bg-zinc-600'
                          }`}
                          style={{ height: `${Math.max(4, height)}%` }}
                        />
                      </div>
                      <span className={`text-[10px] ${isToday ? 'text-indigo-400 font-medium' : 'text-zinc-600'}`}>
                        {weekDays[i]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Focus Time Chart */}
            <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800/50">
              <h3 className="text-sm font-medium text-zinc-400 mb-4">Temps de focus (minutes)</h3>
              <div className="flex items-end justify-between h-32 gap-2">
                {weekStats.map((day, i) => {
                  const height = (day.focusMinutes / maxFocus) * 100
                  const isToday = i === todayIndex
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex items-end justify-center h-24">
                        <div 
                          className={`w-full max-w-8 rounded-t-lg transition-all duration-500 ${
                            isToday 
                              ? 'bg-gradient-to-t from-emerald-600 to-emerald-400' 
                              : 'bg-zinc-700 hover:bg-zinc-600'
                          }`}
                          style={{ height: `${Math.max(4, height)}%` }}
                        />
                      </div>
                      <span className={`text-[10px] ${isToday ? 'text-emerald-400 font-medium' : 'text-zinc-600'}`}>
                        {weekDays[i]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Categories & Priorities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Par catégorie */}
            <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800/50">
              <h3 className="text-sm font-medium text-zinc-400 mb-4">Par catégorie</h3>
              <div className="space-y-3">
                {[
                  { key: 'dev', label: 'Développement', color: 'bg-indigo-500' },
                  { key: 'design', label: 'Design', color: 'bg-cyan-500' },
                  { key: 'work', label: 'Travail', color: 'bg-amber-500' },
                  { key: 'personal', label: 'Personnel', color: 'bg-emerald-500' },
                  { key: 'urgent', label: 'Urgent', color: 'bg-rose-500' },
                ].map((cat) => {
                  const count = tasksByCategory[cat.key] || 0
                  const percent = pendingTasks > 0 ? (count / pendingTasks) * 100 : 0
                  return (
                    <div key={cat.key} className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${cat.color}`} />
                      <span className="text-xs text-zinc-500 w-24">{cat.label}</span>
                      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${cat.color} opacity-60 rounded-full transition-all duration-500`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-500 w-8 text-right tabular-nums">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Par priorité */}
            <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800/50">
              <h3 className="text-sm font-medium text-zinc-400 mb-4">Par priorité</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'urgent', label: 'Urgent', color: 'text-rose-400', bg: 'bg-rose-500/10', icon: '🔥' },
                  { key: 'high', label: 'Haute', color: 'text-orange-400', bg: 'bg-orange-500/10', icon: '⚡' },
                  { key: 'medium', label: 'Moyenne', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: '📌' },
                  { key: 'low', label: 'Basse', color: 'text-zinc-400', bg: 'bg-zinc-500/10', icon: '📋' },
                ].map((priority) => (
                  <div 
                    key={priority.key}
                    className={`${priority.bg} rounded-xl p-4 border border-zinc-800/30`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span>{priority.icon}</span>
                      <span className={`text-xs ${priority.color}`}>{priority.label}</span>
                    </div>
                    <p className={`text-2xl font-light ${priority.color} tabular-nums`}>
                      {tasksByPriority[priority.key] || 0}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Pomodoro Sessions */}
          {pomodoroSessions.length > 0 && (
            <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800/50">
              <h3 className="text-sm font-medium text-zinc-400 mb-4">Sessions récentes</h3>
              <div className="space-y-2">
                {pomodoroSessions.slice(-5).reverse().map((session) => (
                  <div key={session.id} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{session.type === 'focus' ? '🍅' : '☕'}</span>
                      <div>
                        <p className="text-sm text-zinc-300">{session.taskTitle || 'Session libre'}</p>
                        <p className="text-xs text-zinc-600">
                          {new Date(session.completedAt).toLocaleString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            day: 'numeric',
                            month: 'short'
                          })}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-zinc-500">{session.duration} min</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Motivation */}
          <div className="text-center py-8 text-zinc-700">
            <p className="text-sm">
              {streak >= 7 ? '🔥 Incroyable ! Tu es en feu !' : 
               streak >= 3 ? '💪 Continue comme ça !' : 
               '🚀 Chaque jour compte !'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
