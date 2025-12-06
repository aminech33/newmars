/**
 * Dashboard - Hub Central des Statistiques
 * 
 * Ce composant est le "Hub d'affichage" de la Maison Mère (useGlobalStats).
 * Il affiche toutes les stats de l'application de manière centralisée.
 */

import { ArrowLeft, ChevronRight, Flame, Target, Clock, BookOpen, Brain, Heart, Zap, TrendingUp, TrendingDown, Award, Lightbulb, Sparkles, BarChart3, Activity, CheckCircle2, Timer, GraduationCap, BookMarked, Utensils, Scale, Smile, ListChecks, ExternalLink } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { useStore } from '../store/useStore'

type View = 'hub' | 'tasks' | 'dashboard' | 'ai' | 'calendar' | 'health' | 'myday' | 'learning' | 'library' | 'pomodoro'
import { useGlobalStats } from '../hooks/useGlobalStats'
import { Tooltip } from './ui/Tooltip'
import { ScrollToTop } from './ui/ScrollToTop'
import { Sparkline } from './ui/Sparkline'
import { CountUp } from './ui/CountUp'
import { formatDuration } from '../utils/productivityUtils'

type TabType = 'overview' | 'tasks' | 'habits' | 'journal' | 'pomodoro' | 'health' | 'library' | 'learning' | 'correlations'


// Composant StatCard réutilisable
function StatCard({ 
  icon, 
  label, 
  value, 
  subValue, 
  trend, 
  color = 'zinc',
  onClick 
}: { 
  icon: React.ReactNode
  label: string
  value: string | number
  subValue?: string
  trend?: { value: number; label: string }
  color?: 'emerald' | 'cyan' | 'amber' | 'rose' | 'indigo' | 'violet' | 'orange' | 'zinc'
  onClick?: () => void
}) {
  const colorClasses = {
    emerald: 'from-emerald-500/10 to-transparent border-emerald-500/20 hover:border-emerald-500/40',
    cyan: 'from-cyan-500/10 to-transparent border-cyan-500/20 hover:border-cyan-500/40',
    amber: 'from-amber-500/10 to-transparent border-amber-500/20 hover:border-amber-500/40',
    rose: 'from-rose-500/10 to-transparent border-rose-500/20 hover:border-rose-500/40',
    indigo: 'from-indigo-500/10 to-transparent border-indigo-500/20 hover:border-indigo-500/40',
    violet: 'from-violet-500/10 to-transparent border-violet-500/20 hover:border-violet-500/40',
    orange: 'from-orange-500/10 to-transparent border-orange-500/20 hover:border-orange-500/40',
    zinc: 'from-zinc-500/10 to-transparent border-zinc-800 hover:border-zinc-700'
  }

  const iconColors = {
    emerald: 'text-emerald-400',
    cyan: 'text-cyan-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
    indigo: 'text-indigo-400',
    violet: 'text-violet-400',
    orange: 'text-orange-400',
    zinc: 'text-zinc-400'
  }

  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-2xl bg-gradient-to-br ${colorClasses[color]} border transition-colors duration-200 group w-full`}
      aria-label={`${label}: ${value}${subValue ? `, ${subValue}` : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl bg-zinc-800/50 ${iconColors[color]}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${
            trend.value > 0 
              ? 'bg-emerald-500/10 text-emerald-400' 
              : trend.value < 0
              ? 'bg-rose-500/10 text-rose-400'
              : 'bg-zinc-800/50 text-zinc-400'
          }`}>
            {trend.value > 0 ? <TrendingUp className="w-3 h-3" /> : trend.value < 0 ? <TrendingDown className="w-3 h-3" /> : null}
            {trend.label}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-zinc-100 mb-1 group-hover:text-white transition-colors">
        {typeof value === 'number' ? <CountUp end={value} duration={800} /> : value}
      </p>
      <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
      {subValue && <p className="text-sm text-zinc-400 mt-1">{subValue}</p>}
    </button>
  )
}

// Composant Section avec lien vers l'app
function Section({ title, icon, children, color = 'zinc', viewLink, onNavigate }: { 
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  color?: string
  viewLink?: View
  onNavigate?: (view: View) => void
}) {
  const bgColors: Record<string, string> = {
    emerald: 'bg-emerald-500/10',
    cyan: 'bg-cyan-500/10',
    amber: 'bg-amber-500/10',
    rose: 'bg-rose-500/10',
    indigo: 'bg-indigo-500/10',
    violet: 'bg-violet-500/10',
    orange: 'bg-orange-500/10',
    zinc: 'bg-zinc-800/50'
  }

  return (
    <section className="mb-8" aria-labelledby={title.replace(/\s/g, '-').toLowerCase()}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${bgColors[color] || bgColors.zinc}`}>
            {icon}
          </div>
          <h3 id={title.replace(/\s/g, '-').toLowerCase()} className="text-lg font-semibold text-zinc-200">{title}</h3>
        </div>
        {viewLink && onNavigate && (
          <button
            onClick={() => onNavigate(viewLink)}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-800/50"
          >
            Voir l'app
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>
      {children}
    </section>
  )
}

// Composant ProgressBar avec accessibilité
function ProgressBar({ value, max, color = 'indigo', label, ariaLabel }: {
  value: number
  max: number
  color?: string
  label?: string
  ariaLabel?: string
}) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0
  
  const gradients: Record<string, string> = {
    emerald: 'from-emerald-500 to-emerald-400',
    cyan: 'from-cyan-500 to-cyan-400',
    amber: 'from-amber-500 to-amber-400',
    rose: 'from-rose-500 to-rose-400',
    indigo: 'from-indigo-500 to-indigo-400',
    violet: 'from-violet-500 to-violet-400',
    orange: 'from-orange-500 to-orange-400'
  }

  return (
    <div>
      {label && (
        <div className="flex justify-between text-xs text-zinc-500 mb-1">
          <span>{label}</span>
          <span>{Math.round(percent)}%</span>
        </div>
      )}
      <div 
        className="h-2 bg-zinc-800 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={ariaLabel || label || `${value} sur ${max}`}
      >
        <div 
          className={`h-full bg-gradient-to-r ${gradients[color] || gradients.indigo} rounded-full transition-[width] duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

// Composant BarChart avec tooltips
function BarChart({ 
  data, 
  getHeight, 
  getLabel, 
  getValue,
  highlightLast = true,
  color = 'emerald',
  ariaLabel
}: {
  data: unknown[]
  getHeight: (item: unknown, max: number) => number
  getLabel: (item: unknown, index: number) => string
  getValue: (item: unknown) => number
  highlightLast?: boolean
  color?: 'emerald' | 'rose' | 'orange' | 'amber'
  ariaLabel: string
}) {
  const values = data.map(getValue)
  const max = Math.max(...values, 1)
  
  const colorClasses = {
    emerald: { gradient: 'from-emerald-600 to-emerald-400', shadow: 'shadow-emerald-500/30', text: 'text-emerald-400' },
    rose: { gradient: 'from-rose-600 to-rose-400', shadow: 'shadow-rose-500/30', text: 'text-rose-400' },
    orange: { gradient: 'from-orange-600 to-orange-400', shadow: 'shadow-orange-500/30', text: 'text-orange-400' },
    amber: { gradient: 'from-amber-600 to-amber-400', shadow: 'shadow-amber-500/30', text: 'text-amber-400' }
  }

  return (
    <div 
      className="flex items-end justify-between h-32 gap-2" 
      role="img" 
      aria-label={ariaLabel}
    >
      {data.map((item, i) => {
        const height = getHeight(item, max)
        const isHighlighted = highlightLast && i === data.length - 1
        const value = getValue(item)
        const label = getLabel(item, i)
        
        return (
          <Tooltip key={i} content={`${label}: ${value}`} side="top">
            <div className="flex-1 flex flex-col items-center gap-2 group cursor-default">
              <div className="w-full flex items-end justify-center h-24">
                <div 
                  className={`w-full rounded-t-lg transition-[height,background-color] duration-500 ${
                    isHighlighted 
                      ? `bg-gradient-to-t ${colorClasses[color].gradient} shadow-lg ${colorClasses[color].shadow}` 
                      : 'bg-zinc-700 group-hover:bg-zinc-600'
                  }`}
                  style={{ height: `${Math.max(8, height)}%` }}
                  role="presentation"
                />
              </div>
              <span className={`text-xs ${isHighlighted ? `${colorClasses[color].text} font-medium` : 'text-zinc-500'}`}>
                {label}
              </span>
            </div>
          </Tooltip>
        )
      })}
    </div>
  )
}

export function Dashboard() {
  const { setView } = useStore()
  const stats = useGlobalStats()
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setView('hub')
      if (e.key === '1' && !e.metaKey && !e.ctrlKey) setActiveTab('overview')
      if (e.key === '2' && !e.metaKey && !e.ctrlKey) setActiveTab('tasks')
      if (e.key === '3' && !e.metaKey && !e.ctrlKey) setActiveTab('habits')
      if (e.key === '4' && !e.metaKey && !e.ctrlKey) setActiveTab('journal')
      if (e.key === '5' && !e.metaKey && !e.ctrlKey) setActiveTab('pomodoro')
      if (e.key === '6' && !e.metaKey && !e.ctrlKey) setActiveTab('health')
      if (e.key === '7' && !e.metaKey && !e.ctrlKey) setActiveTab('library')
      if (e.key === '8' && !e.metaKey && !e.ctrlKey) setActiveTab('learning')
      if (e.key === '9' && !e.metaKey && !e.ctrlKey) setActiveTab('correlations')
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [setView])

  // Score global (moyenne pondérée) avec détails
  const { globalScore, scoreDetails } = useMemo(() => {
    const details = [
      { label: 'Tâches', value: stats.tasks.completionRate, weight: 1 },
      { label: 'Habitudes', value: stats.habits.todayRate, weight: 1 },
      { label: 'Journal', value: stats.journal.hasTodayEntry ? 100 : 0, weight: 0.5 },
      { label: 'Focus', value: stats.pomodoro.todaySessions > 0 ? Math.min(stats.pomodoro.todayMinutes / 60 * 100, 100) : 0, weight: 1 },
      { label: 'Santé', value: stats.health.caloriesRate > 0 ? Math.min(stats.health.caloriesRate, 100) : 50, weight: 0.5 },
      { label: 'Lecture', value: stats.library.goalProgress, weight: 0.5 },
      { label: 'Cours', value: stats.learning.averageProgress, weight: 0.5 }
    ]
    const totalWeight = details.reduce((sum, d) => sum + d.weight, 0)
    const weightedSum = details.reduce((sum, d) => sum + d.value * d.weight, 0)
    return {
      globalScore: Math.round(weightedSum / totalWeight),
      scoreDetails: details
    }
  }, [stats])

  const tabs: { id: TabType; label: string; key: string; icon: React.ReactNode; color: string }[] = [
    { id: 'overview', label: 'Vue d\'ensemble', key: '1', icon: <BarChart3 className="w-4 h-4" />, color: 'indigo' },
    { id: 'tasks', label: 'Tâches', key: '2', icon: <CheckCircle2 className="w-4 h-4" />, color: 'emerald' },
    { id: 'habits', label: 'Habitudes', key: '3', icon: <Flame className="w-4 h-4" />, color: 'orange' },
    { id: 'journal', label: 'Journal', key: '4', icon: <BookOpen className="w-4 h-4" />, color: 'violet' },
    { id: 'pomodoro', label: 'Pomodoro', key: '5', icon: <Timer className="w-4 h-4" />, color: 'rose' },
    { id: 'health', label: 'Santé', key: '6', icon: <Heart className="w-4 h-4" />, color: 'cyan' },
    { id: 'library', label: 'Livres', key: '7', icon: <BookMarked className="w-4 h-4" />, color: 'amber' },
    { id: 'learning', label: 'Cours', key: '8', icon: <GraduationCap className="w-4 h-4" />, color: 'indigo' },
    { id: 'correlations', label: 'Corrélations', key: '9', icon: <Activity className="w-4 h-4" />, color: 'violet' },
  ]

  // Tooltip content pour le score global (texte simple car Tooltip n'accepte que string)
  const scoreTooltipContent = scoreDetails.map(d => `${d.label}: ${Math.round(d.value)}%`).join(' • ')

  return (
    <div className="h-screen w-full flex flex-col view-transition overflow-hidden" role="main" aria-label="Dashboard - Hub des Statistiques">
      {/* Header - Standard */}
      <header className="flex-shrink-0 px-4 py-2 border-b border-zinc-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('hub')}
              className="p-1.5 hover:bg-zinc-800/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-400" />
            </button>
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <h1 className="text-lg font-semibold text-zinc-200">Dashboard</h1>
            
            {/* Score Global inline */}
            <Tooltip content={scoreTooltipContent} side="bottom">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800/50 rounded-lg cursor-help ml-2">
                <div className={`text-sm font-bold ${
                  globalScore >= 70 ? 'text-emerald-400' : 
                  globalScore >= 40 ? 'text-amber-400' : 
                  'text-rose-400'
                }`}>
                  {globalScore}
                </div>
                <span className="text-[10px] text-zinc-500">/100</span>
              </div>
            </Tooltip>
          </div>

          {/* Tabs inline */}
          <div className="flex items-center gap-0.5 bg-zinc-800/50 rounded-lg p-0.5 overflow-x-auto scrollbar-hide" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`px-2 py-1 rounded-md text-xs flex items-center gap-1 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-zinc-700 text-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-4 py-3">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div 
              role="tabpanel" 
              id="panel-overview" 
              aria-labelledby="tab-overview"
              className="space-y-4"
            >
              {/* Hero Stats - Résumé rapide - Responsive amélioré */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                <StatCard
                  icon={<CheckCircle2 className="w-5 h-5" />}
                  label="Tâches"
                  value={stats.tasks.todayCompleted}
                  subValue={`${stats.tasks.completionRate}% complétées`}
                  color="emerald"
                  onClick={() => setActiveTab('tasks')}
                />
                <StatCard
                  icon={<Flame className="w-5 h-5" />}
                  label="Habitudes"
                  value={`${stats.habits.todayRate}%`}
                  subValue={`${stats.habits.todayCompleted}/${stats.habits.total} aujourd'hui`}
                  color="orange"
                  onClick={() => setActiveTab('habits')}
                />
                <StatCard
                  icon={<Smile className="w-5 h-5" />}
                  label="Humeur"
                  value={stats.journal.averageMood.toFixed(1)}
                  subValue={stats.journal.hasTodayEntry ? '✓ Entrée du jour' : 'Pas d\'entrée'}
                  color="violet"
                  onClick={() => setActiveTab('journal')}
                />
                <StatCard
                  icon={<Timer className="w-5 h-5" />}
                  label="Focus"
                  value={formatDuration(stats.pomodoro.todayMinutes)}
                  subValue={`${stats.pomodoro.todaySessions} sessions`}
                  color="rose"
                  onClick={() => setActiveTab('pomodoro')}
                />
                <StatCard
                  icon={<Utensils className="w-5 h-5" />}
                  label="Calories"
                  value={stats.health.todayCalories}
                  subValue={`/${stats.health.targetCalories} kcal`}
                  color="cyan"
                  onClick={() => setActiveTab('health')}
                />
                <StatCard
                  icon={<BookMarked className="w-5 h-5" />}
                  label="Livres"
                  value={stats.library.completedThisYear}
                  subValue={`${stats.library.goalProgress}% objectif`}
                  color="amber"
                  onClick={() => setActiveTab('library')}
                />
                <StatCard
                  icon={<GraduationCap className="w-5 h-5" />}
                  label="Cours"
                  value={stats.learning.activeCourses}
                  subValue={`${stats.learning.averageProgress}% progression`}
                  color="indigo"
                  onClick={() => setActiveTab('learning')}
                />
              </div>

              {/* Streaks */}
              <Section title="🔥 Séries en cours" icon={<Flame className="w-5 h-5 text-orange-400" />} color="orange">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { label: 'Tâches', value: stats.tasks.streak, color: 'emerald' },
                    { label: 'Habitudes', value: stats.habits.globalStreak, color: 'orange' },
                    { label: 'Journal', value: stats.journal.currentStreak, color: 'violet' },
                    { label: 'Pomodoro', value: stats.pomodoro.currentStreak, color: 'rose' },
                    { label: 'Santé', value: stats.health.streak, color: 'cyan' },
                    { label: 'Lecture', value: stats.library.currentStreak, color: 'amber' },
                  ].map((streak) => (
                    <div key={streak.label} className="glass-widget p-4 text-center">
                      <p className="text-3xl font-bold text-zinc-100 mb-1">
                        <CountUp end={streak.value} duration={600} />
                      </p>
                      <p className="text-xs text-zinc-500">{streak.label}</p>
                      <div className="mt-2 flex justify-center" aria-hidden="true">
                        {streak.value >= 7 && <span className="text-xl">🔥</span>}
                        {streak.value >= 30 && <span className="text-xl">⚡</span>}
                        {streak.value >= 100 && <span className="text-xl">🏆</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Graphiques 7 jours */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Section 
                  title="📈 Tâches (7 jours)" 
                  icon={<BarChart3 className="w-5 h-5 text-emerald-400" />} 
                  color="emerald"
                  viewLink="tasks"
                  onNavigate={setView}
                >
                  <div className="glass-widget p-6">
                    <BarChart
                      data={stats.tasks.last7Days}
                      getHeight={(item, max) => ((item as { completed: number }).completed / max) * 100}
                      getLabel={(item) => new Date((item as { date: string }).date).toLocaleDateString('fr', { weekday: 'short' }).slice(0, 3)}
                      getValue={(item) => (item as { completed: number }).completed}
                      color="emerald"
                      ariaLabel="Graphique des tâches complétées sur les 7 derniers jours"
                    />
                  </div>
                </Section>

                <Section 
                  title="🍅 Focus (7 jours)" 
                  icon={<Timer className="w-5 h-5 text-rose-400" />} 
                  color="rose"
                  viewLink="pomodoro"
                  onNavigate={setView}
                >
                  <div className="glass-widget p-6">
                    <BarChart
                      data={stats.pomodoro.last7Days}
                      getHeight={(item, max) => ((item as { minutes: number }).minutes / max) * 100}
                      getLabel={(item) => new Date((item as { date: string }).date).toLocaleDateString('fr', { weekday: 'short' }).slice(0, 3)}
                      getValue={(item) => (item as { minutes: number }).minutes}
                      color="rose"
                      ariaLabel="Graphique du temps de focus sur les 7 derniers jours"
                    />
                  </div>
                </Section>
              </div>

              {/* Corrélations rapides */}
              {(stats.correlations.moodVsHabitsRate !== null || stats.correlations.productivityVsPomodoro !== null) && (
                <Section title="🔗 Corrélations" icon={<Activity className="w-5 h-5 text-violet-400" />} color="violet">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {stats.correlations.moodVsHabitsRate !== null && (
                      <div className="glass-widget p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-zinc-400">Humeur ↔ Habitudes</span>
                          <span className={`text-lg font-bold ${
                            stats.correlations.moodVsHabitsRate > 0.5 ? 'text-emerald-400' :
                            stats.correlations.moodVsHabitsRate > 0 ? 'text-amber-400' :
                            'text-rose-400'
                          }`}>
                            {stats.correlations.moodVsHabitsRate > 0 ? '+' : ''}{stats.correlations.moodVsHabitsRate.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500">
                          {stats.correlations.moodVsHabitsRate > 0.5 
                            ? '🎯 Forte corrélation ! Tes habitudes améliorent ton humeur.'
                            : stats.correlations.moodVsHabitsRate > 0
                            ? '📊 Corrélation positive modérée.'
                            : '⚠️ Pas de corrélation claire.'}
                        </p>
                      </div>
                    )}
                    {stats.correlations.productivityVsPomodoro !== null && (
                      <div className="glass-widget p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-zinc-400">Productivité ↔ Pomodoro</span>
                          <span className={`text-lg font-bold ${
                            stats.correlations.productivityVsPomodoro > 0.5 ? 'text-emerald-400' :
                            stats.correlations.productivityVsPomodoro > 0 ? 'text-amber-400' :
                            'text-rose-400'
                          }`}>
                            {stats.correlations.productivityVsPomodoro > 0 ? '+' : ''}{stats.correlations.productivityVsPomodoro.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500">
                          {stats.correlations.productivityVsPomodoro > 0.5 
                            ? '🍅 Le Pomodoro booste ta productivité !'
                            : stats.correlations.productivityVsPomodoro > 0
                            ? '📊 Impact positif modéré du Pomodoro.'
                            : '⚠️ Essaie plus de sessions Pomodoro.'}
                        </p>
                      </div>
                    )}
                  </div>
                </Section>
              )}
            </div>
          )}

          {/* TASKS TAB */}
          {activeTab === 'tasks' && (
            <div 
              role="tabpanel" 
              id="panel-tasks" 
              aria-labelledby="tab-tasks"
              className="space-y-8"
            >
              <Section 
                title="✅ Statistiques des Tâches" 
                icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />} 
                color="emerald"
                viewLink="tasks"
                onNavigate={setView}
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <StatCard icon={<ListChecks className="w-5 h-5" />} label="Total" value={stats.tasks.total} color="zinc" />
                  <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Complétées" value={stats.tasks.completed} color="emerald" />
                  <StatCard icon={<Clock className="w-5 h-5" />} label="En attente" value={stats.tasks.pending} color="amber" />
                  <StatCard icon={<Zap className="w-5 h-5" />} label="En retard" value={stats.tasks.overdue} color="rose" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Par catégorie */}
                  <div className="glass-widget p-6">
                    <h4 className="text-sm font-semibold text-zinc-300 mb-4">Par catégorie</h4>
                    <div className="space-y-3">
                      {[
                        { key: 'dev', label: 'Développement', color: 'indigo' },
                        { key: 'design', label: 'Design', color: 'cyan' },
                        { key: 'work', label: 'Travail', color: 'amber' },
                        { key: 'personal', label: 'Personnel', color: 'emerald' },
                        { key: 'urgent', label: 'Urgent', color: 'rose' },
                      ].map((cat) => (
                        <div key={cat.key} className="flex items-center gap-3">
                          <span className="text-xs text-zinc-400 w-24">{cat.label}</span>
                          <div className="flex-1">
                            <ProgressBar 
                              value={stats.tasks.byCategory[cat.key as keyof typeof stats.tasks.byCategory] || 0} 
                              max={stats.tasks.total || 1} 
                              color={cat.color}
                              ariaLabel={`${cat.label}: ${stats.tasks.byCategory[cat.key as keyof typeof stats.tasks.byCategory] || 0} tâches`}
                            />
                          </div>
                          <span className="text-sm font-medium text-zinc-300 w-8 text-right">
                            {stats.tasks.byCategory[cat.key as keyof typeof stats.tasks.byCategory] || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Par priorité */}
                  <div className="glass-widget p-6">
                    <h4 className="text-sm font-semibold text-zinc-300 mb-4">Par priorité</h4>
                    <div className="space-y-3">
                      {[
                        { key: 'urgent', label: 'Urgente', color: 'rose' },
                        { key: 'high', label: 'Haute', color: 'orange' },
                        { key: 'medium', label: 'Moyenne', color: 'amber' },
                        { key: 'low', label: 'Basse', color: 'emerald' },
                      ].map((priority) => (
                        <div key={priority.key} className="flex items-center gap-3">
                          <span className="text-xs text-zinc-400 w-24">{priority.label}</span>
                          <div className="flex-1">
                            <ProgressBar 
                              value={stats.tasks.byPriority[priority.key as keyof typeof stats.tasks.byPriority] || 0} 
                              max={stats.tasks.total || 1} 
                              color={priority.color}
                              ariaLabel={`Priorité ${priority.label}: ${stats.tasks.byPriority[priority.key as keyof typeof stats.tasks.byPriority] || 0} tâches`}
                            />
                          </div>
                          <span className="text-sm font-medium text-zinc-300 w-8 text-right">
                            {stats.tasks.byPriority[priority.key as keyof typeof stats.tasks.byPriority] || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>

              {/* Stats supplémentaires */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard 
                  icon={<Flame className="w-5 h-5" />} 
                  label="Série actuelle" 
                  value={`${stats.tasks.streak}j`} 
                  color="orange" 
                />
                <StatCard 
                  icon={<TrendingUp className="w-5 h-5" />} 
                  label="Taux de complétion" 
                  value={`${stats.tasks.completionRate}%`} 
                  color="emerald" 
                />
                <StatCard 
                  icon={<Clock className="w-5 h-5" />} 
                  label="Temps moyen" 
                  value={formatDuration(stats.tasks.averageCompletionTime)} 
                  color="cyan" 
                />
                <StatCard 
                  icon={<Target className="w-5 h-5" />} 
                  label="Tâches/jour" 
                  value={stats.tasks.tasksPerDay.toFixed(1)} 
                  color="indigo" 
                />
              </div>
            </div>
          )}

          {/* HABITS TAB */}
          {activeTab === 'habits' && (
            <div 
              role="tabpanel" 
              id="panel-habits" 
              aria-labelledby="tab-habits"
              className="space-y-8"
            >
              <Section 
                title="🔥 Statistiques des Habitudes" 
                icon={<Flame className="w-5 h-5 text-orange-400" />} 
                color="orange"
                viewLink="myday"
                onNavigate={setView}
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <StatCard icon={<ListChecks className="w-5 h-5" />} label="Total habitudes" value={stats.habits.total} color="zinc" />
                  <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Aujourd'hui" value={`${stats.habits.todayCompleted}/${stats.habits.total}`} color="emerald" />
                  <StatCard icon={<Flame className="w-5 h-5" />} label="Série globale" value={`${stats.habits.globalStreak}j`} color="orange" />
                  <StatCard icon={<Award className="w-5 h-5" />} label="Record" value={`${stats.habits.longestStreak}j`} color="amber" />
                </div>

                {/* Graphique 7 jours */}
                <div className="glass-widget p-6">
                  <h4 className="text-sm font-semibold text-zinc-300 mb-4">Complétion (7 jours)</h4>
                  <BarChart
                    data={stats.habits.last7Days}
                    getHeight={(item) => {
                      const day = item as { completed: number; total: number }
                      return day.total > 0 ? (day.completed / day.total) * 100 : 0
                    }}
                    getLabel={(item) => new Date((item as { date: string }).date).toLocaleDateString('fr', { weekday: 'short' }).slice(0, 3)}
                    getValue={(item) => {
                      const day = item as { completed: number; total: number }
                      return day.total > 0 ? Math.round((day.completed / day.total) * 100) : 0
                    }}
                    color="orange"
                    ariaLabel="Graphique du taux de complétion des habitudes sur les 7 derniers jours"
                  />
                </div>
              </Section>

              {/* Habitude la plus consistante */}
              {stats.habits.mostConsistentHabit && (
                <div className="glass-widget p-6">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl" aria-hidden="true">🏆</div>
                    <div>
                      <p className="text-lg font-semibold text-zinc-200">{stats.habits.mostConsistentHabit.name}</p>
                      <p className="text-sm text-zinc-500">
                        Habitude la plus consistante • {stats.habits.mostConsistentHabit.completedDates.length} completions
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* JOURNAL TAB */}
          {activeTab === 'journal' && (
            <div 
              role="tabpanel" 
              id="panel-journal" 
              aria-labelledby="tab-journal"
              className="space-y-8"
            >
              <Section 
                title="📝 Statistiques du Journal" 
                icon={<BookOpen className="w-5 h-5 text-violet-400" />} 
                color="violet"
                viewLink="myday"
                onNavigate={setView}
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <StatCard icon={<BookOpen className="w-5 h-5" />} label="Total entrées" value={stats.journal.totalEntries} color="violet" />
                  <StatCard icon={<Flame className="w-5 h-5" />} label="Série actuelle" value={`${stats.journal.currentStreak}j`} color="orange" />
                  <StatCard icon={<Award className="w-5 h-5" />} label="Record" value={`${stats.journal.longestStreak}j`} color="amber" />
                  <StatCard icon={<Smile className="w-5 h-5" />} label="Humeur moyenne" value={stats.journal.averageMood.toFixed(1)} color="cyan" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Tendance humeur */}
                  <div className="glass-widget p-6">
                    <h4 className="text-sm font-semibold text-zinc-300 mb-4">Tendance de l'humeur (14 jours)</h4>
                    <div className="h-24">
                      <Sparkline 
                        data={stats.journal.moodTrend.filter(m => m > 0)} 
                        color="rgb(139, 92, 246)"
                        height={96}
                      />
                    </div>
                  </div>

                  {/* Top tags */}
                  <div className="glass-widget p-6">
                    <h4 className="text-sm font-semibold text-zinc-300 mb-4">Tags les plus utilisés</h4>
                    <div className="flex flex-wrap gap-2">
                      {stats.journal.topTags.length > 0 ? (
                        stats.journal.topTags.map((tag) => (
                          <span key={tag.tag} className="px-3 py-1.5 bg-violet-500/10 text-violet-400 rounded-full text-sm">
                            #{tag.tag} <span className="text-violet-400/60">({tag.count})</span>
                          </span>
                        ))
                      ) : (
                        <p className="text-zinc-500 text-sm">Aucun tag utilisé</p>
                      )}
                    </div>
                  </div>
                </div>
              </Section>
            </div>
          )}

          {/* POMODORO TAB */}
          {activeTab === 'pomodoro' && (
            <div 
              role="tabpanel" 
              id="panel-pomodoro" 
              aria-labelledby="tab-pomodoro"
              className="space-y-8"
            >
              <Section 
                title="🍅 Statistiques Pomodoro" 
                icon={<Timer className="w-5 h-5 text-rose-400" />} 
                color="rose"
                viewLink="pomodoro"
                onNavigate={setView}
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <StatCard icon={<Timer className="w-5 h-5" />} label="Sessions totales" value={stats.pomodoro.totalSessions} color="rose" />
                  <StatCard icon={<Clock className="w-5 h-5" />} label="Temps total" value={formatDuration(stats.pomodoro.totalMinutes)} color="cyan" />
                  <StatCard icon={<Flame className="w-5 h-5" />} label="Série actuelle" value={`${stats.pomodoro.currentStreak}j`} color="orange" />
                  <StatCard icon={<Target className="w-5 h-5" />} label="Durée moyenne" value={`${stats.pomodoro.averageSessionLength}min`} color="indigo" />
                </div>

                {/* Par projet */}
                {Object.keys(stats.pomodoro.byProject).length > 0 && (
                  <div className="glass-widget p-6">
                    <h4 className="text-sm font-semibold text-zinc-300 mb-4">Sessions par projet</h4>
                    <div className="space-y-3">
                      {Object.entries(stats.pomodoro.byProject)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([project, count]) => (
                          <div key={project} className="flex items-center gap-3">
                            <span className="text-xs text-zinc-400 flex-1 truncate">{project}</span>
                            <div className="w-32">
                              <ProgressBar 
                                value={count} 
                                max={Math.max(...Object.values(stats.pomodoro.byProject))} 
                                color="rose"
                                ariaLabel={`${project}: ${count} sessions`}
                              />
                            </div>
                            <span className="text-sm font-medium text-zinc-300 w-8 text-right">{count}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </Section>
            </div>
          )}

          {/* HEALTH TAB */}
          {activeTab === 'health' && (
            <div 
              role="tabpanel" 
              id="panel-health" 
              aria-labelledby="tab-health"
              className="space-y-8"
            >
              <Section 
                title="💚 Statistiques Santé" 
                icon={<Heart className="w-5 h-5 text-cyan-400" />} 
                color="cyan"
                viewLink="health"
                onNavigate={setView}
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <StatCard 
                    icon={<Scale className="w-5 h-5" />} 
                    label="Poids actuel" 
                    value={stats.health.latestWeight > 0 ? `${stats.health.latestWeight}kg` : '-'} 
                    trend={stats.health.weeklyWeightChange !== 0 ? { 
                      value: -stats.health.weeklyWeightChange,
                      label: `${stats.health.weeklyWeightChange > 0 ? '+' : ''}${stats.health.weeklyWeightChange}kg/sem`
                    } : undefined}
                    color="cyan" 
                  />
                  <StatCard 
                    icon={<Target className="w-5 h-5" />} 
                    label="IMC" 
                    value={stats.health.bmi > 0 ? stats.health.bmi.toFixed(1) : '-'} 
                    subValue={stats.health.bmiCategory || ''}
                    color={stats.health.bmiCategory === 'normal' ? 'emerald' : stats.health.bmiCategory === 'overweight' ? 'amber' : 'zinc'} 
                  />
                  <StatCard 
                    icon={<Utensils className="w-5 h-5" />} 
                    label="Calories aujourd'hui" 
                    value={stats.health.todayCalories} 
                    subValue={`/${stats.health.targetCalories} kcal`}
                    color="amber" 
                  />
                  <StatCard 
                    icon={<Flame className="w-5 h-5" />} 
                    label="Série suivi" 
                    value={`${stats.health.streak}j`} 
                    color="orange" 
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Poids 7 jours */}
                  <div className="glass-widget p-6">
                    <h4 className="text-sm font-semibold text-zinc-300 mb-4">Évolution du poids (7 jours)</h4>
                    <div className="h-24">
                      <Sparkline 
                        data={stats.health.last7DaysWeight.filter(w => w > 0)} 
                        color="rgb(34, 211, 238)"
                        height={96}
                      />
                    </div>
                  </div>

                  {/* Calories 7 jours */}
                  <div className="glass-widget p-6">
                    <h4 className="text-sm font-semibold text-zinc-300 mb-4">Calories (7 jours)</h4>
                    <div className="h-24">
                      <Sparkline 
                        data={stats.health.last7DaysCalories} 
                        color="rgb(251, 191, 36)"
                        height={96}
                      />
                    </div>
                  </div>
                </div>
              </Section>
            </div>
          )}

          {/* LIBRARY TAB */}
          {activeTab === 'library' && (
            <div 
              role="tabpanel" 
              id="panel-library" 
              aria-labelledby="tab-library"
              className="space-y-8"
            >
              <Section 
                title="📚 Statistiques Bibliothèque" 
                icon={<BookMarked className="w-5 h-5 text-amber-400" />} 
                color="amber"
                viewLink="library"
                onNavigate={setView}
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <StatCard icon={<BookMarked className="w-5 h-5" />} label="Livres totaux" value={stats.library.totalBooks} color="amber" />
                  <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Terminés" value={stats.library.completedBooks} color="emerald" />
                  <StatCard icon={<BookOpen className="w-5 h-5" />} label="En lecture" value={stats.library.currentlyReading} color="cyan" />
                  <StatCard icon={<Target className="w-5 h-5" />} label="Objectif annuel" value={`${stats.library.goalProgress}%`} color="indigo" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <StatCard icon={<Clock className="w-5 h-5" />} label="Temps de lecture" value={formatDuration(stats.library.totalReadingTime)} color="zinc" />
                  <StatCard icon={<Award className="w-5 h-5" />} label="Note moyenne" value={stats.library.averageRating > 0 ? `${stats.library.averageRating}★` : '-'} color="amber" />
                  <StatCard icon={<Flame className="w-5 h-5" />} label="Série lecture" value={`${stats.library.currentStreak}j`} color="orange" />
                  <StatCard icon={<BookOpen className="w-5 h-5" />} label="Genre favori" value={stats.library.favoriteGenre || '-'} color="violet" />
                </div>

                {/* Livres par mois - Responsive : 6 mois sur mobile, 12 sur desktop */}
                <div className="glass-widget p-6">
                  <h4 className="text-sm font-semibold text-zinc-300 mb-4">
                    Livres terminés par mois 
                    <span className="sm:hidden"> (6 derniers mois)</span>
                    <span className="hidden sm:inline"> (12 mois)</span>
                  </h4>
                  {/* Version mobile : 6 mois */}
                  <div className="sm:hidden">
                    <BarChart
                      data={stats.library.booksPerMonth.slice(-6)}
                      getHeight={(item, max) => ((item as number) / max) * 100}
                      getLabel={(_, i) => {
                        const monthName = new Date(new Date().setMonth(new Date().getMonth() - (5 - i))).toLocaleDateString('fr', { month: 'short' })
                        return monthName.slice(0, 3)
                      }}
                      getValue={(item) => item as number}
                      color="amber"
                      ariaLabel="Graphique des livres terminés par mois sur les 6 derniers mois"
                    />
                  </div>
                  {/* Version desktop : 12 mois */}
                  <div className="hidden sm:block">
                    <BarChart
                      data={stats.library.booksPerMonth}
                      getHeight={(item, max) => ((item as number) / max) * 100}
                      getLabel={(_, i) => {
                        const monthName = new Date(new Date().setMonth(new Date().getMonth() - (11 - i))).toLocaleDateString('fr', { month: 'short' })
                        return monthName.slice(0, 3)
                      }}
                      getValue={(item) => item as number}
                      color="amber"
                      ariaLabel="Graphique des livres terminés par mois sur les 12 derniers mois"
                    />
                  </div>
                </div>
              </Section>
            </div>
          )}

          {/* LEARNING TAB */}
          {activeTab === 'learning' && (
            <div 
              role="tabpanel" 
              id="panel-learning" 
              aria-labelledby="tab-learning"
              className="space-y-8"
            >
              <Section 
                title="🎓 Statistiques Apprentissage" 
                icon={<GraduationCap className="w-5 h-5 text-indigo-400" />} 
                color="indigo"
                viewLink="learning"
                onNavigate={setView}
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <StatCard icon={<GraduationCap className="w-5 h-5" />} label="Cours totaux" value={stats.learning.totalCourses} color="indigo" />
                  <StatCard icon={<Zap className="w-5 h-5" />} label="Cours actifs" value={stats.learning.activeCourses} color="amber" />
                  <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Terminés" value={stats.learning.completedCourses} color="emerald" />
                  <StatCard icon={<Target className="w-5 h-5" />} label="Progression moy." value={`${stats.learning.averageProgress}%`} color="cyan" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <StatCard icon={<Brain className="w-5 h-5" />} label="Flashcards" value={stats.learning.totalFlashcards} color="violet" />
                  <StatCard icon={<BookOpen className="w-5 h-5" />} label="Notes" value={stats.learning.totalNotes} color="zinc" />
                  <StatCard icon={<Clock className="w-5 h-5" />} label="Temps d'étude" value={formatDuration(stats.learning.totalStudyTime)} color="rose" />
                </div>
              </Section>
            </div>
          )}

          {/* CORRELATIONS TAB */}
          {activeTab === 'correlations' && (
            <div 
              role="tabpanel" 
              id="panel-correlations" 
              aria-labelledby="tab-correlations"
              className="space-y-8"
            >
              <Section title="🔗 Corrélations entre tes données" icon={<Activity className="w-5 h-5 text-violet-400" />} color="violet">
                <div className="glass-widget p-6 mb-6">
                  <p className="text-sm text-zinc-400 mb-4">
                    Les corrélations mesurent la relation entre deux variables. Une valeur proche de <strong className="text-emerald-400">+1</strong> indique une forte corrélation positive, 
                    proche de <strong className="text-rose-400">-1</strong> une corrélation négative, et proche de <strong className="text-zinc-400">0</strong> aucune corrélation.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Humeur vs Habitudes */}
                  <div className="glass-widget p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Smile className="w-5 h-5 text-violet-400" aria-hidden="true" />
                        <span className="text-sm text-zinc-400">Humeur</span>
                      </div>
                      <Activity className="w-4 h-4 text-zinc-600" aria-hidden="true" />
                      <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-400" aria-hidden="true" />
                        <span className="text-sm text-zinc-400">Habitudes</span>
                      </div>
                    </div>
                    
                    {stats.correlations.moodVsHabitsRate !== null ? (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-4xl font-bold text-zinc-100">
                            {stats.correlations.moodVsHabitsRate > 0 ? '+' : ''}{stats.correlations.moodVsHabitsRate.toFixed(2)}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            stats.correlations.moodVsHabitsRate > 0.5 ? 'bg-emerald-500/20 text-emerald-400' :
                            stats.correlations.moodVsHabitsRate > 0 ? 'bg-amber-500/20 text-amber-400' :
                            stats.correlations.moodVsHabitsRate > -0.5 ? 'bg-zinc-500/20 text-zinc-400' :
                            'bg-rose-500/20 text-rose-400'
                          }`}>
                            {stats.correlations.moodVsHabitsRate > 0.5 ? 'Forte' :
                             stats.correlations.moodVsHabitsRate > 0 ? 'Modérée' :
                             stats.correlations.moodVsHabitsRate > -0.5 ? 'Faible' : 'Négative'}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-500">
                          {stats.correlations.moodVsHabitsRate > 0.5 
                            ? '🎯 Tes habitudes ont un impact très positif sur ton humeur ! Continue comme ça.'
                            : stats.correlations.moodVsHabitsRate > 0
                            ? '📊 Il y a une corrélation positive. Plus tu complètes tes habitudes, meilleure est ton humeur.'
                            : '⚠️ Pas de corrélation claire. Continue à collecter des données.'}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-zinc-500">
                        📊 Pas assez de données. Continue à utiliser le journal et les habitudes pour voir les corrélations.
                      </p>
                    )}
                  </div>

                  {/* Productivité vs Pomodoro */}
                  <div className="glass-widget p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                        <span className="text-sm text-zinc-400">Productivité</span>
                      </div>
                      <Activity className="w-4 h-4 text-zinc-600" aria-hidden="true" />
                      <div className="flex items-center gap-2">
                        <Timer className="w-5 h-5 text-rose-400" aria-hidden="true" />
                        <span className="text-sm text-zinc-400">Pomodoro</span>
                      </div>
                    </div>
                    
                    {stats.correlations.productivityVsPomodoro !== null ? (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-4xl font-bold text-zinc-100">
                            {stats.correlations.productivityVsPomodoro > 0 ? '+' : ''}{stats.correlations.productivityVsPomodoro.toFixed(2)}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            stats.correlations.productivityVsPomodoro > 0.5 ? 'bg-emerald-500/20 text-emerald-400' :
                            stats.correlations.productivityVsPomodoro > 0 ? 'bg-amber-500/20 text-amber-400' :
                            stats.correlations.productivityVsPomodoro > -0.5 ? 'bg-zinc-500/20 text-zinc-400' :
                            'bg-rose-500/20 text-rose-400'
                          }`}>
                            {stats.correlations.productivityVsPomodoro > 0.5 ? 'Forte' :
                             stats.correlations.productivityVsPomodoro > 0 ? 'Modérée' :
                             stats.correlations.productivityVsPomodoro > -0.5 ? 'Faible' : 'Négative'}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-500">
                          {stats.correlations.productivityVsPomodoro > 0.5 
                            ? '🍅 Le Pomodoro booste significativement ta productivité ! Utilise-le plus souvent.'
                            : stats.correlations.productivityVsPomodoro > 0
                            ? '📊 Le Pomodoro a un impact positif. Les jours avec plus de sessions = plus de tâches.'
                            : '⚠️ Pas de corrélation claire. Essaie d\'utiliser le Pomodoro plus régulièrement.'}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-zinc-500">
                        📊 Pas assez de données. Utilise le Pomodoro et complète des tâches pour voir les corrélations.
                      </p>
                    )}
                  </div>
                </div>

                {/* Insights basés sur les corrélations */}
                <div className="glass-widget p-6 mt-6">
                  <h4 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400" aria-hidden="true" />
                    Insights
                  </h4>
                  <div className="space-y-3">
                    {stats.correlations.moodVsHabitsRate !== null && stats.correlations.moodVsHabitsRate > 0.3 && (
                      <div className="flex items-start gap-3 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <Sparkles className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                        <p className="text-sm text-emerald-400">
                          Tes habitudes sont liées à ton bien-être ! Les jours où tu complètes tes habitudes, tu te sens mieux.
                        </p>
                      </div>
                    )}
                    {stats.correlations.productivityVsPomodoro !== null && stats.correlations.productivityVsPomodoro > 0.3 && (
                      <div className="flex items-start gap-3 p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                        <Sparkles className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                        <p className="text-sm text-rose-400">
                          Le Pomodoro améliore ta productivité ! Planifie des sessions régulières pour maximiser ton efficacité.
                        </p>
                      </div>
                    )}
                    {(stats.correlations.moodVsHabitsRate === null || stats.correlations.productivityVsPomodoro === null) && (
                      <div className="flex items-start gap-3 p-3 bg-zinc-500/10 rounded-xl border border-zinc-500/20">
                        <Lightbulb className="w-5 h-5 text-zinc-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                        <p className="text-sm text-zinc-400">
                          Continue à utiliser l'app quotidiennement pour découvrir les patterns entre tes différentes activités.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Section>
            </div>
          )}

      </div>

      <ScrollToTop />
    </div>
  )
}
