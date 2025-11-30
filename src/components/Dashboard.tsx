import { useStore } from '../store/useStore'
import { useWeekStats, useCurrentStreak, useCompletedTasks, usePendingTasks, useTasksByCategory } from '../store/selectors'
import { ArrowLeft, TrendingUp, TrendingDown, Target, Clock, Lightbulb, Calendar, Zap } from 'lucide-react'
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

// Constantes
const WORK_HOURS_START = 8
const WORK_HOURS_END = 22
const HEATMAP_DAYS = 365

export function Dashboard() {
  const { tasks, setView, dailyGoal, focusMinutes } = useStore()
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'heatmap'>('overview')

  // Sélecteurs optimisés (mémorisés)
  const weekStats = useWeekStats()
  const streak = useCurrentStreak()
  const completedTasks = useCompletedTasks()
  const pendingTasks = usePendingTasks()
  const tasksByCategory = useTasksByCategory()
  
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

  // Comparaison semaine
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

  // Système de couleurs selon le score (JIT-safe)
  const getScoreTheme = (score: number) => {
    if (score >= 80) return {
      gradient: 'from-emerald-400 via-emerald-500 to-emerald-600',
      glow: 'shadow-emerald-500/20',
      bg: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      text: 'text-emerald-400',
      bar: 'from-emerald-500 to-emerald-400',
      barShadow: 'shadow-emerald-500/30'
    }
    if (score >= 60) return {
      gradient: 'from-cyan-400 via-cyan-500 to-blue-500',
      glow: 'shadow-cyan-500/20',
      bg: 'from-cyan-500/10 via-cyan-500/5 to-transparent',
      text: 'text-cyan-400',
      bar: 'from-cyan-500 to-cyan-400',
      barShadow: 'shadow-cyan-500/30'
    }
    if (score >= 40) return {
      gradient: 'from-amber-400 via-amber-500 to-orange-500',
      glow: 'shadow-amber-500/20',
      bg: 'from-amber-500/10 via-amber-500/5 to-transparent',
      text: 'text-amber-400',
      bar: 'from-amber-500 to-amber-400',
      barShadow: 'shadow-amber-500/30'
    }
    return {
      gradient: 'from-rose-400 via-rose-500 to-red-500',
      glow: 'shadow-rose-500/20',
      bg: 'from-rose-500/10 via-rose-500/5 to-transparent',
      text: 'text-rose-400',
      bar: 'from-rose-500 to-rose-400',
      barShadow: 'shadow-rose-500/30'
    }
  }

  const scoreTheme = getScoreTheme(productivityScore.score)

  return (
    <div className="h-full w-full flex flex-col view-transition" role="main" aria-label="Dashboard de productivité">
      {/* Header */}
      <header className="flex-shrink-0 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('hub')}
              className="p-2 -ml-2 text-zinc-600 hover:text-zinc-400 transition-colors rounded-xl hover:bg-zinc-800/50"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Dashboard</h1>
              <p className="text-sm text-zinc-500">Analyse de ta productivité</p>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-zinc-900/50 rounded-xl p-1 border border-zinc-800/50" role="tablist" aria-label="Sections du dashboard">
            {[
              { id: 'overview', label: 'Vue d\'ensemble' },
              { id: 'insights', label: 'Insights' },
              { id: 'heatmap', label: 'Activité' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`${tab.id}-panel`}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                  activeTab === tab.id 
                    ? 'bg-zinc-800 text-zinc-100 shadow-lg' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
        <div className="max-w-7xl mx-auto">
          
          {/* HERO: Score de Productivité */}
          <section className="mb-8 sm:mb-12" aria-labelledby="productivity-score-heading">
            <div className="relative group">
              {/* Background gradient animé */}
              <div className={`absolute inset-0 bg-gradient-to-br ${scoreTheme.bg} rounded-3xl blur-2xl opacity-50 group-hover:opacity-70 transition-opacity duration-500`} />
              
              {/* Card principale */}
              <div className={`relative bg-gradient-to-br from-zinc-900/90 to-zinc-900/50 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 border border-zinc-800/50 shadow-2xl ${scoreTheme.glow} hover:shadow-3xl transition-all duration-500 motion-reduce:transition-none`}>
                <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6 sm:gap-8">
                  {/* Score */}
                  <div className="flex-1 text-center lg:text-left">
                    <p id="productivity-score-heading" className="text-xs sm:text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">Score de Productivité</p>
                    <div className="flex items-baseline justify-center lg:justify-start gap-3 mb-6">
                      <h2 className={`text-5xl sm:text-7xl lg:text-8xl font-extralight bg-gradient-to-br ${scoreTheme.gradient} bg-clip-text text-transparent animate-fade-in`}>
                        {productivityScore.score}
                      </h2>
                      <span className="text-2xl sm:text-3xl text-zinc-600 font-light">/100</span>
                    </div>
                    
                    {/* Tendance */}
                    {dayComparison.tasksDiff !== 0 && (
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                        dayComparison.tasksDiff > 0 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {dayComparison.tasksDiff > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span className="text-sm font-medium">
                          {dayComparison.tasksDiff > 0 ? '+' : ''}{dayComparison.tasksDiff} vs hier
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Breakdown avec animations */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    {[
                      { label: 'Tâches', value: productivityScore.breakdown.tasksCompleted, max: 25, icon: '✅', gradient: 'from-emerald-500 to-emerald-400' },
                      { label: 'Focus', value: productivityScore.breakdown.focusTime, max: 25, icon: '🎯', gradient: 'from-cyan-500 to-cyan-400' },
                      { label: 'Régularité', value: productivityScore.breakdown.consistency, max: 25, icon: '🔥', gradient: 'from-orange-500 to-orange-400' },
                      { label: 'Efficacité', value: productivityScore.breakdown.efficiency, max: 25, icon: '⚡', gradient: 'from-indigo-500 to-indigo-400' },
                    ].map((item) => (
                      <div key={item.label} className="text-center">
                        <div className="text-2xl mb-2" role="img" aria-label={item.label}>{item.icon}</div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-3">
                          <div 
                            className={`h-full bg-gradient-to-r ${item.gradient} rounded-full transition-all duration-1000 ease-out`}
                            style={{ width: `${(item.value / item.max) * 100}%` }}
                            role="progressbar"
                            aria-valuenow={item.value}
                            aria-valuemin={0}
                            aria-valuemax={item.max}
                          />
                        </div>
                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">{item.label}</p>
                        <p className="text-lg font-semibold text-zinc-300">{item.value}<span className="text-zinc-600">/{item.max}</span></p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {activeTab === 'overview' && (
            <div role="tabpanel" id="overview-panel" aria-labelledby="overview-tab">
              {/* Comparaisons */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
                {/* vs Hier */}
                <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-800/50 hover:border-zinc-700/50 transition-all duration-300 hover:shadow-xl">
                  <h3 className="text-base font-semibold text-zinc-300 mb-6 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-indigo-400" />
                    Aujourd'hui vs Hier
                  </h3>
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-500 font-medium">Tâches</span>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-light text-zinc-100">{dayComparison.today.tasks}</span>
                        {dayComparison.tasksDiff !== 0 && (
                          <span className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg ${
                            dayComparison.tasksDiff > 0 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {dayComparison.tasksDiff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            {dayComparison.tasksDiff > 0 ? '+' : ''}{dayComparison.tasksDiff}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-500 font-medium">Focus</span>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-light text-zinc-100">{formatDuration(dayComparison.today.focus)}</span>
                        {dayComparison.focusDiff !== 0 && (
                          <span className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg ${
                            dayComparison.focusDiff > 0 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {dayComparison.focusDiff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            {dayComparison.focusDiff > 0 ? '+' : ''}{dayComparison.focusDiff}m
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* vs Semaine dernière */}
                <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-800/50 hover:border-zinc-700/50 transition-all duration-300 hover:shadow-xl">
                  <h3 className="text-base font-semibold text-zinc-300 mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                    Cette semaine vs Semaine dernière
                  </h3>
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-500 font-medium">Tâches</span>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-light text-zinc-100">{weekComparison.thisWeek.tasks}</span>
                        {weekComparison.tasksPercent !== 0 && (
                          <span className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg ${
                            weekComparison.tasksPercent > 0 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {weekComparison.tasksPercent > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            {weekComparison.tasksPercent > 0 ? '+' : ''}{weekComparison.tasksPercent}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-500 font-medium">Focus</span>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-light text-zinc-100">{formatDuration(weekComparison.thisWeek.focus)}</span>
                        {weekComparison.focusPercent !== 0 && (
                          <span className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg ${
                            weekComparison.focusPercent > 0 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {weekComparison.focusPercent > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            {weekComparison.focusPercent > 0 ? '+' : ''}{weekComparison.focusPercent}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Objectifs Hebdomadaires */}
              <section className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-zinc-800/50 mb-8 sm:mb-12 hover:border-zinc-700/50 transition-all duration-300 motion-reduce:transition-none" aria-labelledby="weekly-goals-heading">
                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                  <div className="p-2 bg-cyan-500/10 rounded-xl">
                    <Target className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" aria-hidden="true" />
                  </div>
                  <h3 id="weekly-goals-heading" className="text-base sm:text-lg font-semibold text-zinc-200">Objectifs de la semaine</h3>
                </div>
                <div className="space-y-6">
                  {[
                    { label: 'Tâches complétées', ...weeklyGoals.tasks, icon: '✅', gradient: 'from-emerald-500 to-emerald-400', shadow: 'shadow-emerald-500/30', format: undefined },
                    { label: 'Temps de focus', ...weeklyGoals.focus, icon: '🎯', gradient: 'from-indigo-500 to-indigo-400', shadow: 'shadow-indigo-500/30', format: (v: number) => formatDuration(v) },
                    { label: 'Jours de streak', ...weeklyGoals.streak, icon: '🔥', gradient: 'from-orange-500 to-orange-400', shadow: 'shadow-orange-500/30', format: undefined },
                  ].map((goal) => (
                    <div key={goal.label}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl" role="img" aria-label={goal.label}>{goal.icon}</span>
                          <span className="text-sm font-medium text-zinc-400">{goal.label}</span>
                        </div>
                        <span className="text-sm font-semibold text-zinc-300">
                          {goal.format ? goal.format(goal.current) : goal.current} / {goal.format ? goal.format(goal.target) : goal.target}
                        </span>
                      </div>
                      <div className="relative h-3 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${goal.gradient} rounded-full transition-all duration-1000 ease-out shadow-lg ${goal.shadow} motion-reduce:transition-none`}
                          style={{ width: `${goal.percent}%` }}
                          role="progressbar"
                          aria-valuenow={goal.current}
                          aria-valuemin={0}
                          aria-valuemax={goal.target}
                          aria-label={`${goal.label}: ${goal.percent}% complété`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Heures Productives */}
              <section className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-zinc-800/50 mb-8 sm:mb-12 hover:border-zinc-700/50 transition-all duration-300 motion-reduce:transition-none" aria-labelledby="productive-hours-heading">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-xl">
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" aria-hidden="true" />
                    </div>
                    <h3 id="productive-hours-heading" className="text-base sm:text-lg font-semibold text-zinc-200">Heures les plus productives</h3>
                  </div>
                  {peakHours[0]?.peak > 0 && (
                    <span className="text-sm font-medium text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg">
                      Peak: {peakHours[0].label}
                    </span>
                  )}
                </div>
                <div className="flex items-end justify-between h-32 gap-1 sm:gap-1.5 overflow-x-auto">
                  {hourlyData.filter(h => h.hour >= WORK_HOURS_START && h.hour <= WORK_HOURS_END).map((hour) => {
                    const height = maxHourlyTasks > 0 ? (hour.tasksCompleted / maxHourlyTasks) * 100 : 0
                    const isPeak = peakHours[0]?.label === hour.label
                    return (
                      <div key={hour.hour} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className="w-full flex items-end justify-center h-24 relative">
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="bg-zinc-800 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap shadow-xl">
                              {hour.tasksCompleted} tâches
                            </div>
                          </div>
                          
                          <div 
                            className={`w-full rounded-t-lg transition-all duration-500 hover:scale-110 motion-reduce:transition-none motion-reduce:hover:scale-100 ${
                              isPeak 
                                ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-lg shadow-indigo-500/50' 
                                : 'bg-zinc-700 hover:bg-zinc-600'
                            }`}
                            style={{ height: `${Math.max(8, height)}%` }}
                            role="presentation"
                          />
                        </div>
                        <span className={`text-[10px] font-medium ${isPeak ? 'text-indigo-400' : 'text-zinc-600'}`}>
                          {hour.hour}h
                        </span>
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* Graphiques */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Tâches hebdo */}
                <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-800/50 hover:border-zinc-700/50 transition-all duration-300">
                  <h3 className="text-base font-semibold text-zinc-300 mb-6">Tâches cette semaine</h3>
                  <div className="flex items-end justify-between h-40 gap-3">
                    {weekStats.map((day, i) => {
                      const height = (day.tasksCompleted / maxTasks) * 100
                      const isToday = i === todayIndex
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                          <div className="w-full flex items-end justify-center h-32 relative">
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              <div className="bg-zinc-800 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap shadow-xl">
                                {day.tasksCompleted} tâches
                              </div>
                            </div>
                            
                            <div 
                              className={`w-full rounded-t-xl transition-all duration-700 hover:scale-105 motion-reduce:transition-none motion-reduce:hover:scale-100 ${
                                isToday 
                                  ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-lg shadow-indigo-500/30' 
                                  : 'bg-zinc-700 hover:bg-zinc-600'
                              }`}
                              style={{ height: `${Math.max(8, height)}%` }}
                              role="presentation"
                            />
                          </div>
                          <span className={`text-xs font-medium ${isToday ? 'text-indigo-400' : 'text-zinc-600'}`}>
                            {weekDays[i]}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Par catégorie */}
                <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-800/50 hover:border-zinc-700/50 transition-all duration-300">
                  <h3 className="text-base font-semibold text-zinc-300 mb-6">Par catégorie</h3>
                  <div className="space-y-4">
                    {[
                      { key: 'dev', label: 'Développement', color: 'bg-indigo-500' },
                      { key: 'design', label: 'Design', color: 'bg-cyan-500' },
                      { key: 'work', label: 'Travail', color: 'bg-amber-500' },
                      { key: 'personal', label: 'Personnel', color: 'bg-emerald-500' },
                      { key: 'urgent', label: 'Urgent', color: 'bg-rose-500' },
                    ].map((cat) => {
                      const count = tasksByCategory[cat.key] || 0
                      const percent = pendingTasks.length > 0 ? (count / pendingTasks.length) * 100 : 0
                      return (
                        <div key={cat.key} className="flex items-center gap-4">
                          <span className={`w-3 h-3 rounded-full ${cat.color} shadow-lg`} role="presentation" />
                          <span className="text-sm text-zinc-400 font-medium w-28">{cat.label}</span>
                          <div className="flex-1 h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${cat.color} rounded-full transition-all duration-1000 ease-out shadow-lg motion-reduce:transition-none`}
                              style={{ width: `${percent}%` }}
                              role="progressbar"
                              aria-valuenow={count}
                              aria-valuemin={0}
                              aria-valuemax={pendingTasks.length}
                              aria-label={`${cat.label}: ${count} tâches`}
                            />
                          </div>
                          <span className="text-sm text-zinc-400 font-semibold w-8 text-right">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div role="tabpanel" id="insights-panel" aria-labelledby="insights-tab" className="space-y-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-amber-500/10 rounded-xl">
                  <Lightbulb className="w-6 h-6 text-amber-400" />
                </div>
                <h2 className="text-xl font-semibold text-zinc-100">Insights Personnalisés</h2>
              </div>
              
              {insights.length > 0 ? (
                <div className="space-y-4">
                  {insights.map((insight, i) => {
                    const colors = {
                      positive: { bg: 'from-emerald-500/10 to-transparent', border: 'border-emerald-500/30', icon: 'bg-gradient-to-br from-emerald-500 to-emerald-600', text: 'text-emerald-400' },
                      warning: { bg: 'from-amber-500/10 to-transparent', border: 'border-amber-500/30', icon: 'bg-gradient-to-br from-amber-500 to-amber-600', text: 'text-amber-400' },
                      tip: { bg: 'from-indigo-500/10 to-transparent', border: 'border-indigo-500/30', icon: 'bg-gradient-to-br from-indigo-500 to-indigo-600', text: 'text-indigo-400' }
                    }[insight.type]
                    
                    return (
                      <div key={i} className="relative group">
                        {/* Icon circulaire */}
                        <div className={`absolute -left-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full ${colors.icon} flex items-center justify-center shadow-xl z-10`}>
                          <span className="text-2xl">{insight.icon}</span>
                        </div>
                        
                        {/* Card */}
                        <div className={`ml-6 pl-8 border-l-2 ${colors.border} bg-gradient-to-r ${colors.bg} rounded-r-2xl p-5 hover:shadow-lg transition-all duration-300`}>
                          <p className={`text-sm ${colors.text} font-medium leading-relaxed`}>{insight.message}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center">
                    <Lightbulb className="w-10 h-10 text-amber-400/60" />
                  </div>
                  <p className="text-zinc-400 mb-2">Pas assez de données pour générer des insights.</p>
                  <p className="text-zinc-600 text-sm">Continue à utiliser l'app pour obtenir des conseils personnalisés !</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'heatmap' && (
            <div role="tabpanel" id="heatmap-panel" aria-labelledby="heatmap-tab">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <Calendar className="w-6 h-6 text-emerald-400" />
                </div>
                <h2 className="text-xl font-semibold text-zinc-100">Activité sur l'année</h2>
              </div>
              
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-8 border border-zinc-800/50">
                {/* Heatmap Grid */}
                <div className="overflow-x-auto pb-4">
                  <div className="flex flex-wrap gap-1 sm:gap-1.5 min-w-[280px]">
                    {heatmapData.slice(-HEATMAP_DAYS).map((day, i) => {
                      const levelColors = [
                        'bg-zinc-800 hover:bg-zinc-700',
                        'bg-emerald-900/50 hover:bg-emerald-900/70',
                        'bg-emerald-700/60 hover:bg-emerald-700/80',
                        'bg-emerald-500/70 hover:bg-emerald-500/90',
                        'bg-emerald-400 hover:bg-emerald-300',
                      ]
                      return (
                        <div
                          key={i}
                          className={`w-3.5 h-3.5 rounded-sm ${levelColors[day.level]} transition-all duration-200 hover:scale-125 hover:ring-2 hover:ring-emerald-400/50 hover:shadow-lg hover:shadow-emerald-400/30 cursor-pointer`}
                          title={`${day.date}: ${day.count} tâche(s)`}
                        />
                      )
                    })}
                  </div>
                </div>
                
                {/* Légende */}
                <div className="flex items-center justify-end gap-2 mt-6 pt-6 border-t border-zinc-800">
                  <span className="text-xs font-medium text-zinc-600">Moins</span>
                  {[0, 1, 2, 3, 4].map((level) => {
                    const levelColors = [
                      'bg-zinc-800',
                      'bg-emerald-900/50',
                      'bg-emerald-700/60',
                      'bg-emerald-500/70',
                      'bg-emerald-400',
                    ]
                    return (
                      <div key={level} className={`w-4 h-4 rounded-sm ${levelColors[level]}`} />
                    )
                  })}
                  <span className="text-xs font-medium text-zinc-600">Plus</span>
                </div>
                
                {/* Stats résumé */}
                <div className="grid grid-cols-3 gap-6 mt-8 pt-8 border-t border-zinc-800">
                  <div className="text-center">
                    <p className="text-3xl font-light text-zinc-100 mb-1">{completedTasks.length}</p>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Tâches totales</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-light text-zinc-100 mb-1">{streak}</p>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Streak actuel</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-light text-zinc-100 mb-1">
                      {heatmapData.filter(d => d.count > 0).length}
                    </p>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Jours actifs</p>
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
