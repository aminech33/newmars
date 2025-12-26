/**
 * 🏠 HubV2 — Command Center (VERSION SIMPLE QUI MARCHE)
 */

import { useStore } from '../store/useStore'
import { useBrain, getScoreDescription, getScoreColor } from '../brain'
import { useState, useMemo } from 'react'
import { Timer, CheckCircle, Heart, Flame, TrendingUp, Brain, Lightbulb } from 'lucide-react'
import { PomodoroOverlay } from './pomodoro/PomodoroOverlay'
import { ProjectsMiniView } from './ProjectsMiniView'
import { motion } from 'framer-motion'

const fontStack = 'font-[Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,SF_Pro_Display,Segoe_UI,Roboto,sans-serif]'

const PILLARS = [
  { key: 'productivity' as const, label: 'Productivité', Icon: CheckCircle, color: 'text-emerald-400' },
  { key: 'mental' as const, label: 'Mental', Icon: Heart, color: 'text-blue-400' },
  { key: 'consistency' as const, label: 'Constance', Icon: Flame, color: 'text-amber-400' },
]

export function HubV2() {
  const setView = useStore((state) => state.setView)
  const tasks = useStore((state) => state.tasks)
  const habits = useStore((state) => state.habits)
  const toggleTask = useStore((state) => state.toggleTask)
  const toggleHabitToday = useStore((state) => state.toggleHabitToday)
  const { wellbeing, patterns, scoreHistory, quickStats, memory } = useBrain()
  
  const [activePomodoroTask, setActivePomodoroTask] = useState<any>(null)
  const [optimisticTaskStates, setOptimisticTaskStates] = useState<Record<string, boolean>>({})
  const [optimisticHabitStates, setOptimisticHabitStates] = useState<Record<string, boolean>>({})
  
  const today = new Date()
  const dateStr = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)
  const hour = today.getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const todayStr = today.toISOString().split('T')[0]
  
  const topTasks = useMemo(() => {
    const now = new Date()
    return tasks
      .filter(t => !t.completed)
      .sort((a, b) => {
        // 1. Tâches prioritaires d'abord
        if (a.isPriority && !b.isPriority) return -1
        if (!a.isPriority && b.isPriority) return 1
        
        // 2. Tâches en retard
        const aOverdue = a.dueDate && new Date(a.dueDate) < now
        const bOverdue = b.dueDate && new Date(b.dueDate) < now
        if (aOverdue && !bOverdue) return -1
        if (!aOverdue && bOverdue) return 1
        
        // 3. Par focusScore (si disponible)
        if (a.focusScore && b.focusScore) {
          return b.focusScore - a.focusScore
        }
        
        // 4. Par date de création (plus récent)
        return (b.createdAt || 0) - (a.createdAt || 0)
      })
      .slice(0, 3)
  }, [tasks])
  
  const todayHabits = useMemo(() => {
    return habits.map(h => {
      const done = h.completedDates?.includes(todayStr) || false
      
      // Calculer le streak
      let streak = 0
      if (h.completedDates && h.completedDates.length > 0) {
        const sorted = [...h.completedDates].sort().reverse()
        const today = new Date(todayStr)
        
        for (let i = 0; i < sorted.length; i++) {
          const date = new Date(sorted[i])
          const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
          
          if (daysDiff === i) {
            streak++
          } else {
            break
          }
        }
      }
      
      return { ...h, done, streak }
    }).slice(0, 3)
  }, [habits, todayStr])
  
  // Stats de la semaine pour insights
  const weekStats = useMemo(() => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    // Tâches complétées cette semaine
    const tasksThisWeek = tasks.filter(t => 
      t.completed && t.createdAt && t.createdAt >= weekAgo.getTime()
    ).length
    
    // Habitudes complétées cette semaine (au moins une fois)
    const habitsThisWeek = habits.filter(h => 
      h.completedDates?.some(d => new Date(d) >= weekAgo)
    ).length
    
    return { tasksThisWeek, habitsThisWeek }
  }, [tasks, habits])
  
  // Utiliser les helpers du Brain
  const scoreDescription = getScoreDescription(wellbeing.overall)
  const scoreColorClass = getScoreColor(wellbeing.overall)
  
  // Insight actionnable basé sur les corrélations
  const insight = useMemo(() => {
    const correlation = patterns.correlations?.moodProductivity || 0
    const eventsCount = memory.recentEvents.length
    
    // Pas assez de données
    if (eventsCount < 10) {
      return {
        icon: Brain,
        text: `Utilise l'app pour débloquer les insights ! (${eventsCount}/10 événements)`,
        color: 'text-zinc-500',
        type: 'empty' as const,
        action: null
      }
    }
    
    // Corrélation mood/productivité (besoin de ≥5 jours)
    if (patterns.journalFrequency > 0 && correlation > 0.3) {
      const increase = Math.round(correlation * 100)
      return {
        icon: Lightbulb,
        text: `Quand tu écris dans ton journal, tu complètes ${increase}% de tâches en plus !`,
        color: 'text-emerald-400',
        type: 'insight' as const,
        action: {
          label: 'Écrire maintenant',
          onClick: () => setView('journal'),
          color: 'emerald'
        }
      }
    }
    
    // Focus
    if (patterns.avgFocusDuration > 0 && patterns.avgFocusDuration !== 25) {
      const nextTask = topTasks[0]
      return {
        icon: Timer,
        text: `Ta durée de focus moyenne est de ${Math.round(patterns.avgFocusDuration)}min. Continue !`,
        color: 'text-blue-400',
        type: 'insight' as const,
        action: nextTask ? {
          label: 'Lancer Pomodoro',
          onClick: () => setActivePomodoroTask(nextTask),
          color: 'blue'
        } : null
      }
    }
    
    // Habitudes
    if (patterns.habitCompletionRate >= 0.8) {
      return {
        icon: Flame,
        text: `${Math.round(patterns.habitCompletionRate * 100)}% de tes habitudes complétées. Excellent !`,
        color: 'text-amber-400',
        type: 'insight' as const,
        action: null
      }
    }
    
    // Encouragement générique avec action
    const incompleteTasks = tasks.filter(t => !t.completed).length
    if (incompleteTasks > 0) {
      return {
        icon: Brain,
        text: `Tu as ${incompleteTasks} tâche${incompleteTasks > 1 ? 's' : ''} en attente. Commence maintenant !`,
        color: 'text-zinc-400',
        type: 'empty' as const,
        action: {
          label: 'Voir les tâches',
          onClick: () => setView('tasks'),
          color: 'zinc'
        }
      }
    }
    
    return {
      icon: Brain,
      text: `Continue d'utiliser l'app pour débloquer plus d'insights !`,
      color: 'text-zinc-500',
      type: 'empty' as const,
      action: null
    }
  }, [patterns, memory.recentEvents.length, topTasks, tasks, setView, setActivePomodoroTask])
  
  // Mini sparkline pour l'évolution (7 derniers jours)
  const sparklineData = useMemo(() => {
    const last7Days = scoreHistory.slice(-7)
    if (last7Days.length < 2) return null
    
    const min = Math.min(...last7Days.map(d => d.score))
    const max = Math.max(...last7Days.map(d => d.score))
    const range = max - min || 1
    
    return last7Days.map(d => ({
      score: d.score,
      height: ((d.score - min) / range) * 100
    }))
  }, [scoreHistory])
  
  // Smart patterns display : n'affiche que les patterns avec données
  const activePatterns = useMemo(() => {
    const list = []
    
    if (patterns.avgTasksPerDay > 0) {
      list.push({
        label: 'Tâches par jour',
        value: patterns.avgTasksPerDay.toFixed(1),
        raw: patterns.avgTasksPerDay
      })
    }
    
    if (patterns.avgFocusDuration > 0 && patterns.avgFocusDuration !== 25) {
      list.push({
        label: 'Focus moyen',
        value: `${Math.round(patterns.avgFocusDuration)}min`,
        raw: patterns.avgFocusDuration
      })
    }
    
    if (patterns.taskCompletionRate > 0) {
      list.push({
        label: 'Taux complétion',
        value: `${Math.round(patterns.taskCompletionRate * 100)}%`,
        raw: patterns.taskCompletionRate * 100
      })
    }
    
    if (patterns.journalFrequency > 0) {
      list.push({
        label: 'Journal',
        value: `${patterns.journalFrequency.toFixed(1)}j/sem`,
        raw: patterns.journalFrequency
      })
    }
    
    if (patterns.avgMood > 0 && patterns.avgMood !== 6) {
      list.push({
        label: 'Humeur moyenne',
        value: `${patterns.avgMood.toFixed(1)}/10`,
        raw: patterns.avgMood
      })
    }
    
    return list
  }, [patterns])
  
  const scoreLabel = wellbeing.overall >= 80 ? { text: 'Excellent', color: 'text-emerald-500' }
    : wellbeing.overall >= 65 ? { text: 'Très bien', color: 'text-emerald-400' }
    : { text: 'Bien', color: 'text-zinc-400' }
  
  // Objectif pour le score
  const scoreGoal = useMemo(() => {
    const current = wellbeing.overall
    let target = 0
    let label = ''
    
    if (current < 65) {
      target = 65
      label = 'Bien'
    } else if (current < 80) {
      target = 80
      label = 'Excellent'
    } else if (current < 90) {
      target = 90
      label = 'Exceptionnel'
    } else {
      return null // Déjà au max
    }
    
    const remaining = target - current
    const progress = (current / target) * 100
    
    return { target, label, remaining, progress }
  }, [wellbeing.overall])
  
  // Alerte si performance en baisse
  const performanceAlert = useMemo(() => {
    const alerts = []
    
    // Tâches en dessous de la moyenne
    if (patterns.avgTasksPerDay > 0 && quickStats.todayTaskCount < patterns.avgTasksPerDay * 0.7) {
      alerts.push({
        metric: 'Tâches',
        current: quickStats.todayTaskCount,
        average: patterns.avgTasksPerDay.toFixed(1),
        diff: Math.round(((quickStats.todayTaskCount / patterns.avgTasksPerDay) - 1) * 100)
      })
    }
    
    // Humeur en baisse
    if (quickStats.lastMood !== null && patterns.avgMood > 0 && patterns.avgMood !== 6 && quickStats.lastMood < patterns.avgMood - 1) {
      alerts.push({
        metric: 'Humeur',
        current: quickStats.lastMood,
        average: patterns.avgMood.toFixed(1),
        diff: Math.round(((quickStats.lastMood / patterns.avgMood) - 1) * 100)
      })
    }
    
    return alerts.length > 0 ? alerts : null
  }, [patterns, quickStats])
  
  // Plan d'action intelligent
  const nextAction = useMemo(() => {
    const incompleteTasks = tasks.filter(t => !t.completed)
    const todayHabitsIncomplete = todayHabits.filter(h => !h.done)
    
    // Si des tâches prioritaires ou en retard
    if (topTasks.length > 0) {
      const urgentTask = topTasks[0]
      return {
        type: 'task',
        title: 'Prochaine action',
        description: `Commence par "${urgentTask.title.substring(0, 30)}${urgentTask.title.length > 30 ? '...' : ''}"`,
        action: {
          label: 'Démarrer',
          onClick: () => setActivePomodoroTask(urgentTask)
        }
      }
    }
    
    // Si des habitudes non faites
    if (todayHabitsIncomplete.length > 0) {
      return {
        type: 'habit',
        title: 'Prochaine action',
        description: `Complète tes ${todayHabitsIncomplete.length} habitude${todayHabitsIncomplete.length > 1 ? 's' : ''} du jour`,
        action: {
          label: 'Voir',
          onClick: () => {} // Scroll vers habitudes
        }
      }
    }
    
    // Si rien d'urgent, suggestion selon patterns
    if (patterns.journalFrequency > 0 && patterns.correlations?.moodProductivity > 0.3) {
      return {
        type: 'boost',
        title: 'Conseil du Brain',
        description: 'Écris dans ton journal pour booster ta productivité (+42%)',
        action: {
          label: 'Écrire',
          onClick: () => setView('journal')
        }
      }
    }
    
    return null
  }, [topTasks, todayHabits, patterns, tasks, setView, setActivePomodoroTask])
  
  // Badges et milestones
  const achievements = useMemo(() => {
    const badges = []
    const completedTasks = tasks.filter(t => t.completed).length
    const maxStreak = Math.max(...todayHabits.map(h => h.streak || 0), 0)
    
    // Badge 100 tâches
    if (completedTasks >= 100) {
      badges.push({ icon: '💯', label: 'Centurion', unlocked: true })
    } else if (completedTasks >= 50) {
      badges.push({ icon: '🎯', label: `${completedTasks}/100 tâches`, unlocked: false, progress: completedTasks })
    }
    
    // Badge streak 7 jours
    if (maxStreak >= 7) {
      badges.push({ icon: '🔥', label: 'Semaine parfaite', unlocked: true })
    } else if (maxStreak >= 3) {
      badges.push({ icon: '⚡', label: `${maxStreak}/7 jours`, unlocked: false, progress: maxStreak })
    }
    
    // Badge score ≥80
    if (wellbeing.overall >= 80) {
      badges.push({ icon: '⭐', label: 'Excellence', unlocked: true })
    }
    
    return badges.length > 0 ? badges : null
  }, [tasks, todayHabits, wellbeing.overall])
  
  const handleToggleTask = (taskId: string) => {
    setOptimisticTaskStates(prev => ({ ...prev, [taskId]: true }))
    toggleTask(taskId)
    setTimeout(() => setOptimisticTaskStates(prev => {
      const newState = { ...prev }
      delete newState[taskId]
      return newState
    }), 300)
  }
  
  const handleToggleHabit = (habitId: string) => {
    const current = optimisticHabitStates[habitId] !== undefined ? optimisticHabitStates[habitId] : todayHabits.find(h => h.id === habitId)?.done
    setOptimisticHabitStates(prev => ({ ...prev, [habitId]: !current }))
    toggleHabitToday(habitId)
    setTimeout(() => setOptimisticHabitStates(prev => {
      const newState = { ...prev }
      delete newState[habitId]
      return newState
    }), 300)
  }

  return (
    <div className="min-h-screen bg-black p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-12">
          <p className={`text-[15px] uppercase tracking-[0.2em] text-zinc-500 mb-3 font-medium ${fontStack}`}>
            {formattedDate}
          </p>
          <div className="grid grid-cols-2 gap-12 items-start">
            <h1 className="text-[5rem] leading-tight text-zinc-100 font-['Allura'] tracking-wide">
              {greeting}, Amine
            </h1>
            
            {/* Score aligné avec greeting */}
            <div className="flex justify-center">
              <motion.div className="flex flex-col items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-[72px] leading-none font-extralight tracking-[-0.03em] text-zinc-300 ${fontStack}`}>
                    {wellbeing.overall}
                  </span>
                  {wellbeing.trend !== 'stable' && (
                    <span className={`text-[24px] ${wellbeing.trend === 'improving' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {wellbeing.trend === 'improving' ? '↗' : '↘'}
                    </span>
                  )}
                </div>
                <span className={`text-[17px] font-medium tracking-wide ${scoreLabel.color} ${fontStack}`}>
                  {scoreLabel.text}
                </span>
                {wellbeing.trendPercent !== 0 && (
                  <span className={`text-[13px] mt-1 ${wellbeing.trend === 'improving' ? 'text-emerald-500/60' : 'text-rose-500/60'} ${fontStack}`}>
                    {wellbeing.trend === 'improving' ? '+' : ''}{wellbeing.trendPercent}% vs semaine dernière
                  </span>
                )}
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* Layout 2 colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* COLONNE GAUCHE */}
          <div className="space-y-7">
            
            {/* Tâches */}
            {topTasks.length > 0 && (
              <div>
                <p className={`text-[18px] uppercase tracking-[0.1em] text-zinc-400 mb-3 ml-0.5 font-bold ${fontStack}`}>
                  Aujourd'hui
                </p>
                <div className="space-y-2">
                  {topTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => handleToggleTask(task.id)}
                      className={`
                        group w-full h-14 px-5 flex items-center justify-between
                        bg-zinc-950/30 hover:bg-zinc-900/30
                        border border-zinc-800/30
                        rounded-lg transition-all
                        ${optimisticTaskStates[task.id] ? 'opacity-50' : ''}
                        ${fontStack}
                      `}
                    >
                      <span className="text-[16px] text-zinc-400 truncate">{task.title}</span>
                      <div className={`w-4 h-4 rounded-full border-[1.5px] border-zinc-700 ${optimisticTaskStates[task.id] ? 'bg-emerald-400 border-emerald-400' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Plan d'action suggéré */}
            {nextAction && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/30 rounded-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className={`text-[13px] uppercase tracking-[0.1em] text-emerald-400 mb-2 font-semibold ${fontStack}`}>
                      {nextAction.title}
                    </p>
                    <p className={`text-[15px] text-zinc-300 ${fontStack}`}>
                      {nextAction.description}
                    </p>
                  </div>
                  <button
                    onClick={nextAction.action.onClick}
                    className={`
                      px-4 py-2 rounded-md text-[14px] font-medium
                      bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30
                      border border-emerald-500/30 transition-all
                      ${fontStack}
                    `}
                  >
                    {nextAction.action.label} →
                  </button>
                </div>
              </motion.div>
            )}
            
            {/* Projets Mini View */}
            <ProjectsMiniView />
            
            {/* Habitudes */}
            {todayHabits.length > 0 && (
              <div>
                <p className={`text-[16px] uppercase tracking-[0.1em] text-zinc-400 mb-3 ml-0.5 font-bold ${fontStack}`}>
                  Habitudes
                </p>
                <div className="flex gap-2">
                  {todayHabits.map((habit) => {
                    const isOptimisticallyDone = optimisticHabitStates[habit.id] !== undefined ? optimisticHabitStates[habit.id] : habit.done
                    return (
                      <button
                        key={habit.id}
                        onClick={() => handleToggleHabit(habit.id)}
                        className={`
                          relative flex-1 h-12 px-3 flex items-center justify-center rounded-lg transition-all
                          ${isOptimisticallyDone 
                            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' 
                            : 'bg-zinc-950/30 border border-zinc-800/30 text-zinc-500'
                          }
                          ${fontStack}
                        `}
                        title={habit.streak >= 3 ? `${habit.streak} jours d'affilée !` : ''}
                      >
                        {habit.icon || '•'}
                        {habit.streak >= 3 && (
                          <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded-full flex items-center gap-0.5">
                            <Flame className="w-2.5 h-2.5" />
                            {habit.streak}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            
          </div>
          
          {/* COLONNE DROITE - Score + Insights */}
          <div className="flex flex-col items-center justify-start">
            
            {/* Objectif (après le score qui est dans le header) */}
            {scoreGoal && (
              <div className="w-full max-w-md mb-6 text-center">
                <p className={`text-[13px] text-zinc-500 mb-2 ${fontStack}`}>
                  Prochain objectif : <span className="text-zinc-400 font-medium">{scoreGoal.label}</span>
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500/50 rounded-full transition-all duration-300"
                      style={{ width: `${scoreGoal.progress}%` }}
                    />
                  </div>
                  <span className={`text-[12px] text-zinc-600 font-medium ${fontStack}`}>
                    +{scoreGoal.remaining}
                  </span>
                </div>
              </div>
            )}
              
              {/* Breakdown horizontal */}
              <div className="flex items-center justify-center gap-5 mb-6 p-3 bg-zinc-950/30 border border-zinc-800/30 rounded-lg w-full max-w-md">
                {PILLARS.map((pillar) => {
                  const value = wellbeing.breakdown[pillar.key]
                  const pct = (value / 33) * 100
                  return (
                    <div key={pillar.key} className="flex flex-col items-center gap-1 flex-1">
                      <div className="flex items-center gap-1.5">
                        <pillar.Icon className={`w-3.5 h-3.5 ${pillar.color}`} />
                        <span className={`text-[13px] text-zinc-400 tabular-nums font-semibold ${fontStack}`}>{value}</span>
                      </div>
                      <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300`} style={{ width: `${pct}%`, backgroundColor: pillar.color.replace('text-', 'rgb(var(--')}} />
                      </div>
                      <span className={`text-[9px] uppercase tracking-[0.1em] text-zinc-600 font-medium ${fontStack}`}>{pillar.label}</span>
                    </div>
                  )
                })}
              </div>
            
            {/* Stats de la semaine */}
            <div className="w-full max-w-md space-y-4 mt-6">
              
              {/* Stats Aujourd'hui (quickAnalyze) avec comparaison */}
              <div>
                <p className={`text-[15px] uppercase tracking-[0.1em] text-zinc-500 mb-3 font-semibold ${fontStack}`}>
                  Aujourd'hui
                </p>
                
                {/* Alerte si performance en baisse */}
                {performanceAlert && (
                  <div className="mb-2 p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="text-rose-400 text-[14px]">⚠️</span>
                      <div>
                        <p className={`text-[11px] text-rose-400 font-semibold ${fontStack}`}>
                          Performance en baisse
                        </p>
                        <div className="mt-1 space-y-0.5">
                          {performanceAlert.map((alert, i) => (
                            <p key={i} className={`text-[10px] text-rose-300/80 ${fontStack}`}>
                              {alert.metric}: {alert.current} (moy. {alert.average}) {alert.diff}%
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 px-4 bg-zinc-950/30 border border-zinc-800/30 rounded-lg">
                    <span className={`text-[15px] text-zinc-500 ${fontStack}`}>Tâches complétées</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[15px] text-zinc-300 font-semibold tabular-nums ${fontStack}`}>
                        {quickStats.todayTaskCount}
                      </span>
                      {patterns.avgTasksPerDay > 0 && (
                        <span className={`text-[11px] ${quickStats.todayTaskCount > patterns.avgTasksPerDay ? 'text-emerald-400' : quickStats.todayTaskCount < patterns.avgTasksPerDay ? 'text-rose-400' : 'text-zinc-600'} font-medium ${fontStack}`}>
                          {quickStats.todayTaskCount > patterns.avgTasksPerDay ? '↗' : quickStats.todayTaskCount < patterns.avgTasksPerDay ? '↘' : '→'}
                        </span>
                      )}
                    </div>
                  </div>
                  {quickStats.lastMood !== null && (
                    <div className="flex items-center justify-between py-1.5 px-3 bg-zinc-950/30 border border-zinc-800/30 rounded-lg">
                      <span className={`text-[13px] text-zinc-500 ${fontStack}`}>Humeur actuelle</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[15px] text-zinc-300 font-semibold tabular-nums ${fontStack}`}>
                          {quickStats.lastMood}/10
                        </span>
                        {patterns.avgMood > 0 && patterns.avgMood !== 6 && (
                          <span className={`text-[11px] ${quickStats.lastMood > patterns.avgMood ? 'text-emerald-400' : quickStats.lastMood < patterns.avgMood ? 'text-rose-400' : 'text-zinc-600'} font-medium ${fontStack}`}>
                            {quickStats.lastMood > patterns.avgMood ? '↗' : quickStats.lastMood < patterns.avgMood ? '↘' : '→'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Patterns détectés (smart display) */}
              <div>
                <p className={`text-[13px] uppercase tracking-[0.1em] text-zinc-500 mb-2 font-semibold ${fontStack}`}>
                  Patterns (7 jours)
                </p>
                {activePatterns.length >= 3 ? (
                  <div className="space-y-1.5">
                    {activePatterns.map((pattern, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 px-3 bg-zinc-950/30 border border-zinc-800/30 rounded-lg">
                        <span className={`text-[13px] text-zinc-500 ${fontStack}`}>{pattern.label}</span>
                        <span className={`text-[15px] text-zinc-300 font-semibold tabular-nums ${fontStack}`}>
                          {pattern.value}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-zinc-950/30 border border-zinc-800/30 rounded-lg">
                    <div className="flex items-start gap-2.5">
                      <Brain className="w-4 h-4 text-zinc-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className={`text-[13px] text-zinc-500 leading-relaxed ${fontStack}`}>
                          Utilise l'app pendant 3 jours pour débloquer tes patterns !
                        </p>
                        {activePatterns.length > 0 && (
                          <p className={`text-[11px] text-zinc-600 mt-1 ${fontStack}`}>
                            {activePatterns.length}/5 patterns actifs
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Insight actionnable (toujours affiché) */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 ${insight.type === 'empty' ? 'bg-zinc-950/30 border border-zinc-800/30' : 'bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 border border-zinc-800/50'} rounded-lg`}
              >
                <div className="flex items-start gap-2.5">
                  <insight.icon className={`w-4 h-4 ${insight.color} mt-0.5 flex-shrink-0`} />
                  <div className="flex-1">
                    <p className={`text-[11px] uppercase tracking-[0.1em] text-zinc-500 mb-1 font-semibold ${fontStack}`}>
                      {insight.type === 'empty' ? 'En attente' : 'Insight découvert'}
                    </p>
                    <p className={`text-[13px] ${insight.type === 'empty' ? 'text-zinc-500' : 'text-zinc-300'} leading-relaxed ${fontStack}`}>
                      {insight.text}
                    </p>
                    {insight.action && (
                      <button
                        onClick={insight.action.onClick}
                        className={`
                          mt-2 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all
                          ${insight.action.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30' : ''}
                          ${insight.action.color === 'blue' ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30' : ''}
                          ${insight.action.color === 'zinc' ? 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50 border border-zinc-700/50' : ''}
                          ${fontStack}
                        `}
                      >
                        {insight.action.label} →
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
              
              {/* Mini sparkline évolution */}
              {sparklineData && sparklineData.length > 0 && (
                <div>
                  <p className={`text-[13px] uppercase tracking-[0.1em] text-zinc-500 mb-2 font-semibold ${fontStack}`}>
                    Évolution 7 jours
                  </p>
                  <div className="p-3 bg-zinc-950/30 border border-zinc-800/30 rounded-lg">
                    <div className="flex items-end justify-between gap-1.5 h-10">
                      {sparklineData.map((point, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${point.height}%` }}
                          transition={{ delay: i * 0.05, duration: 0.3 }}
                          className="flex-1 bg-gradient-to-t from-emerald-500/50 to-emerald-400/50 rounded-sm"
                          style={{ minHeight: '8%' }}
                          title={`${point.score}/100`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
            </div>
            
          </div>
          
        </div>
        
        {/* Badges et succès */}
        {achievements && (
          <div className="mt-6 flex items-center justify-center gap-3">
            {achievements.map((badge, i) => (
              <div
                key={i}
                className={`
                  px-3 py-2 rounded-lg flex items-center gap-2
                  ${badge.unlocked 
                    ? 'bg-amber-500/20 border border-amber-500/40' 
                    : 'bg-zinc-900/50 border border-zinc-800/50'
                  }
                  transition-all
                `}
                title={badge.unlocked ? 'Succès débloqué !' : `Progression : ${badge.progress}`}
              >
                <span className="text-[16px]">{badge.icon}</span>
                <span className={`text-[11px] font-medium ${badge.unlocked ? 'text-amber-400' : 'text-zinc-500'} ${fontStack}`}>
                  {badge.label}
                </span>
              </div>
            ))}
          </div>
        )}
        
        {/* Navigation */}
        <div className="mt-8 flex gap-2 justify-center">
          <button onClick={() => setView('tasks')} className={`px-4 py-2 text-zinc-400 hover:text-zinc-300 transition-colors ${fontStack}`}>
            Toutes les tâches
          </button>
          <button onClick={() => setView('myday')} className={`px-4 py-2 text-zinc-400 hover:text-zinc-300 transition-colors ${fontStack}`}>
            Ma journée
          </button>
        </div>
        
      </div>
      
      {activePomodoroTask && (
        <PomodoroOverlay
          task={activePomodoroTask}
          onClose={() => setActivePomodoroTask(null)}
          onComplete={() => {
            toggleTask(activePomodoroTask.id)
            setActivePomodoroTask(null)
          }}
        />
      )}
    </div>
  )
}
