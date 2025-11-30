import { useStore } from '../store/useStore'
import { ArrowLeft, TrendingUp, TrendingDown, Target, Flame, Clock, CheckCircle2, Lightbulb, Calendar } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  calculateProductivityScore,
  analyzeProductiveHours,
  getPeakHours,
  compareDays,
  compareWeeks,
  calculateWeeklyGoals,
  generateInsights,
  generateYearHeatmap,
  formatDuration
} from '../utils/productivityUtils'

export function Dashboard() {
  const { tasks, setView, getWeekStats, getCurrentStreak, dailyGoal, focusMinutes } = useStore()
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'heatmap'>('overview')

  const weekStats = useMemo(() => getWeekStats(), [getWeekStats])
  const streak = useMemo(() => getCurrentStreak(), [getCurrentStreak])

  const completedTasks = tasks.filter(t => t.completed)
  const pendingTasks = tasks.filter(t => !t.completed)
  
  // Stats d'aujourd'hui et hier
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]
  
  const todayTasks = completedTasks.filter(t => 
    new Date(t.createdAt).toISOString().split('T')[0] === todayStr
  ).length
  
  const yesterdayTasks = completedTasks.filter(t => 
    new Date(t.createdAt).toISOString().split('T')[0] === yesterdayStr
  ).length

  // Calculs
  const totalFocusMinutes = weekStats.reduce((acc, day) => acc + day.focusMinutes, 0)
  const weekTasksCompleted = weekStats.reduce((acc, day) => acc + day.tasksCompleted, 0)
  
  // Score de productivité
  const productivityScore = useMemo(() => 
    calculateProductivityScore(todayTasks, focusMinutes, streak, 1, dailyGoal),
    [todayTasks, focusMinutes, streak, dailyGoal]
  )

  // Comparaison jour
  const dayComparison = useMemo(() => 
    compareDays(todayTasks, focusMinutes, yesterdayTasks, Math.floor(focusMinutes * 0.8)),
    [todayTasks, focusMinutes, yesterdayTasks]
  )

  // Comparaison semaine (simulé pour l'instant)
  const weekComparison = useMemo(() => 
    compareWeeks(weekTasksCompleted, totalFocusMinutes, Math.floor(weekTasksCompleted * 0.85), Math.floor(totalFocusMinutes * 0.9)),
    [weekTasksCompleted, totalFocusMinutes]
  )

  // Heures productives
  const hourlyData = useMemo(() => analyzeProductiveHours(tasks), [tasks])
  const peakHours = useMemo(() => getPeakHours(hourlyData), [hourlyData])

  // Objectifs hebdomadaires
  const weeklyGoals = useMemo(() => 
    calculateWeeklyGoals(weekTasksCompleted, totalFocusMinutes, streak),
    [weekTasksCompleted, totalFocusMinutes, streak]
  )

  // Insights
  const insights = useMemo(() => 
    generateInsights(tasks, weekComparison, peakHours, streak, weeklyGoals),
    [tasks, weekComparison, peakHours, streak, weeklyGoals]
  )

  // Heatmap
  const heatmapData = useMemo(() => generateYearHeatmap(tasks), [tasks])

  // Jours de la semaine
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  const todayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1

  // Max pour les graphiques
  const maxTasks = Math.max(...weekStats.map(d => d.tasksCompleted), 1)
  const maxHourlyTasks = Math.max(...hourlyData.map(h => h.tasksCompleted), 1)

  // Catégories
  const tasksByCategory = pendingTasks.reduce((acc, task) => {
    acc[task.category] = (acc[task.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Couleur du score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 60) return 'text-cyan-400'
    if (score >= 40) return 'text-amber-400'
    return 'text-rose-400'
  }

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-emerald-400'
    if (score >= 60) return 'from-cyan-500 to-cyan-400'
    if (score >= 40) return 'from-amber-500 to-amber-400'
    return 'from-rose-500 to-rose-400'
  }

  return (
    <div className="h-full w-full flex flex-col view-transition">
      {/* Header */}
      <header className="flex-shrink-0 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('hub')}
              className="p-2 -ml-2 text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-medium tracking-tight text-zinc-200">Dashboard</h1>
              <p className="text-xs text-zinc-600">Analyse de ta productivité</p>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-zinc-900/50 rounded-xl p-1">
            {[
              { id: 'overview', label: 'Vue d\'ensemble' },
              { id: 'insights', label: 'Insights' },
              { id: 'heatmap', label: 'Activité' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                  activeTab === tab.id 
                    ? 'bg-zinc-800 text-zinc-200' 
                    : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-6 pb-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Score de Productivité - Toujours visible */}
          <div className="mb-8">
            <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 rounded-3xl p-6 border border-zinc-800/50">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-medium text-zinc-200 mb-1">Score de Productivité</h2>
                  <p className="text-xs text-zinc-600">Basé sur tes performances d'aujourd'hui</p>
                </div>
                <div className="text-right">
                  <p className={`text-5xl font-light ${getScoreColor(productivityScore.score)}`}>
                    {productivityScore.score}
                  </p>
                  <p className="text-xs text-zinc-600">/ 100</p>
                </div>
              </div>
              
              {/* Breakdown */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Tâches', value: productivityScore.breakdown.tasksCompleted, max: 25, icon: '✅' },
                  { label: 'Focus', value: productivityScore.breakdown.focusTime, max: 25, icon: '🎯' },
                  { label: 'Régularité', value: productivityScore.breakdown.consistency, max: 25, icon: '🔥' },
                  { label: 'Efficacité', value: productivityScore.breakdown.efficiency, max: 25, icon: '⚡' },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div className="text-lg mb-1">{item.icon}</div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-2">
                      <div 
                        className={`h-full bg-gradient-to-r ${getScoreGradient(item.value * 4)} rounded-full transition-all duration-500`}
                        style={{ width: `${(item.value / item.max) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-500">{item.label}</p>
                    <p className="text-sm text-zinc-400">{item.value}/{item.max}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {activeTab === 'overview' && (
            <>
              {/* Comparaisons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {/* vs Hier */}
                <div className="bg-zinc-900/50 rounded-2xl p-5 border border-zinc-800/50">
                  <h3 className="text-sm font-medium text-zinc-400 mb-4">Aujourd'hui vs Hier</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-600">Tâches</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg text-zinc-200">{dayComparison.today.tasks}</span>
                        {dayComparison.tasksDiff !== 0 && (
                          <span className={`flex items-center gap-1 text-xs ${dayComparison.tasksDiff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {dayComparison.tasksDiff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {dayComparison.tasksDiff > 0 ? '+' : ''}{dayComparison.tasksDiff}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-600">Focus</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg text-zinc-200">{formatDuration(dayComparison.today.focus)}</span>
                        {dayComparison.focusDiff !== 0 && (
                          <span className={`flex items-center gap-1 text-xs ${dayComparison.focusDiff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {dayComparison.focusDiff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {dayComparison.focusDiff > 0 ? '+' : ''}{dayComparison.focusDiff}m
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* vs Semaine dernière */}
                <div className="bg-zinc-900/50 rounded-2xl p-5 border border-zinc-800/50">
                  <h3 className="text-sm font-medium text-zinc-400 mb-4">Cette semaine vs Semaine dernière</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-600">Tâches</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg text-zinc-200">{weekComparison.thisWeek.tasks}</span>
                        {weekComparison.tasksPercent !== 0 && (
                          <span className={`flex items-center gap-1 text-xs ${weekComparison.tasksPercent > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {weekComparison.tasksPercent > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {weekComparison.tasksPercent > 0 ? '+' : ''}{weekComparison.tasksPercent}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-600">Focus</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg text-zinc-200">{formatDuration(weekComparison.thisWeek.focus)}</span>
                        {weekComparison.focusPercent !== 0 && (
                          <span className={`flex items-center gap-1 text-xs ${weekComparison.focusPercent > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {weekComparison.focusPercent > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {weekComparison.focusPercent > 0 ? '+' : ''}{weekComparison.focusPercent}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Objectifs Hebdomadaires */}
              <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800/50 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-cyan-500" />
                  <h3 className="text-sm font-medium text-zinc-400">Objectifs de la semaine</h3>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Tâches', ...weeklyGoals.tasks, icon: '✅', color: 'emerald' },
                    { label: 'Focus', ...weeklyGoals.focus, icon: '🎯', color: 'indigo', format: (v: number) => formatDuration(v) },
                    { label: 'Streak', ...weeklyGoals.streak, icon: '🔥', color: 'orange', suffix: ' jours' },
                  ].map((goal) => (
                    <div key={goal.label}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span>{goal.icon}</span>
                          <span className="text-xs text-zinc-500">{goal.label}</span>
                        </div>
                        <span className="text-xs text-zinc-400">
                          {goal.format ? goal.format(goal.current) : goal.current}{goal.suffix || ''} / {goal.format ? goal.format(goal.target) : goal.target}{goal.suffix || ''}
                        </span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r from-${goal.color}-600 to-${goal.color}-400 rounded-full transition-all duration-500`}
                          style={{ width: `${goal.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Heures Productives */}
              <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800/50 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-sm font-medium text-zinc-400">Heures les plus productives</h3>
                  </div>
                  {peakHours[0]?.peak > 0 && (
                    <span className="text-xs text-indigo-400">
                      Peak: {peakHours[0].label}
                    </span>
                  )}
                </div>
                <div className="flex items-end justify-between h-24 gap-1">
                  {hourlyData.filter(h => h.hour >= 8 && h.hour <= 22).map((hour) => {
                    const height = maxHourlyTasks > 0 ? (hour.tasksCompleted / maxHourlyTasks) * 100 : 0
                    const isPeak = peakHours[0]?.label === hour.label
                    return (
                      <div key={hour.hour} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex items-end justify-center h-16">
                          <div 
                            className={`w-full max-w-4 rounded-t transition-all duration-300 ${
                              isPeak 
                                ? 'bg-gradient-to-t from-indigo-600 to-indigo-400' 
                                : 'bg-zinc-700 hover:bg-zinc-600'
                            }`}
                            style={{ height: `${Math.max(4, height)}%` }}
                            title={`${hour.tasksCompleted} tâches`}
                          />
                        </div>
                        <span className={`text-[9px] ${isPeak ? 'text-indigo-400' : 'text-zinc-700'}`}>
                          {hour.hour}h
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Graphique Semaine */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800/50">
                  <h3 className="text-sm font-medium text-zinc-400 mb-4">Tâches cette semaine</h3>
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

                {/* Par catégorie */}
                <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800/50">
                  <h3 className="text-sm font-medium text-zinc-400 mb-4">Par catégorie</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'dev', label: 'Dev', color: 'bg-indigo-500' },
                      { key: 'design', label: 'Design', color: 'bg-cyan-500' },
                      { key: 'work', label: 'Travail', color: 'bg-amber-500' },
                      { key: 'personal', label: 'Perso', color: 'bg-emerald-500' },
                      { key: 'urgent', label: 'Urgent', color: 'bg-rose-500' },
                    ].map((cat) => {
                      const count = tasksByCategory[cat.key] || 0
                      const percent = pendingTasks.length > 0 ? (count / pendingTasks.length) * 100 : 0
                      return (
                        <div key={cat.key} className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${cat.color}`} />
                          <span className="text-xs text-zinc-500 w-16">{cat.label}</span>
                          <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${cat.color} opacity-60 rounded-full transition-all duration-500`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-xs text-zinc-500 w-6 text-right">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-6">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-medium text-zinc-200">Insights Personnalisés</h2>
              </div>
              
              {insights.length > 0 ? (
                <div className="space-y-4">
                  {insights.map((insight, i) => (
                    <div 
                      key={i}
                      className={`p-5 rounded-2xl border ${
                        insight.type === 'positive' 
                          ? 'bg-emerald-500/5 border-emerald-500/20' 
                          : insight.type === 'warning'
                          ? 'bg-amber-500/5 border-amber-500/20'
                          : 'bg-indigo-500/5 border-indigo-500/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{insight.icon}</span>
                        <p className="text-sm text-zinc-300 leading-relaxed">{insight.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Lightbulb className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                  <p className="text-zinc-500">Pas assez de données pour générer des insights.</p>
                  <p className="text-zinc-600 text-sm mt-2">Continue à utiliser l'app pour obtenir des conseils personnalisés !</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'heatmap' && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-medium text-zinc-200">Activité sur l'année</h2>
              </div>
              
              <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800/50">
                {/* Heatmap Grid */}
                <div className="overflow-x-auto">
                  <div className="flex flex-wrap gap-1" style={{ maxWidth: '900px' }}>
                    {heatmapData.slice(-365).map((day, i) => {
                      const levelColors = [
                        'bg-zinc-800',
                        'bg-emerald-900/50',
                        'bg-emerald-700/60',
                        'bg-emerald-500/70',
                        'bg-emerald-400',
                      ]
                      return (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded-sm ${levelColors[day.level]} transition-colors hover:ring-1 hover:ring-zinc-600`}
                          title={`${day.date}: ${day.count} tâche(s)`}
                        />
                      )
                    })}
                  </div>
                </div>
                
                {/* Légende */}
                <div className="flex items-center justify-end gap-2 mt-4">
                  <span className="text-xs text-zinc-600">Moins</span>
                  {[0, 1, 2, 3, 4].map((level) => {
                    const levelColors = [
                      'bg-zinc-800',
                      'bg-emerald-900/50',
                      'bg-emerald-700/60',
                      'bg-emerald-500/70',
                      'bg-emerald-400',
                    ]
                    return (
                      <div key={level} className={`w-3 h-3 rounded-sm ${levelColors[level]}`} />
                    )
                  })}
                  <span className="text-xs text-zinc-600">Plus</span>
                </div>
                
                {/* Stats résumé */}
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-zinc-800">
                  <div className="text-center">
                    <p className="text-2xl font-light text-zinc-200">{completedTasks.length}</p>
                    <p className="text-xs text-zinc-600">Tâches totales</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-light text-zinc-200">{streak}</p>
                    <p className="text-xs text-zinc-600">Streak actuel</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-light text-zinc-200">
                      {heatmapData.filter(d => d.count > 0).length}
                    </p>
                    <p className="text-xs text-zinc-600">Jours actifs</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
