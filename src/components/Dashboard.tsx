/**
 * Dashboard Simplifié - Résumé calme et non prescriptif
 * 
 * Indicateurs de continuité et tendance uniquement (streaks, états, tendances)
 * Métriques techniques accessibles dans les vues dédiées de chaque module
 */

import { 
  ArrowLeft,
  BarChart3, 
  CheckCircle2, 
  Flame, 
  BookOpen, 
  Timer, 
  Activity,
  Smile
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { useGlobalStats } from '../hooks/useGlobalStats'

// ========== COMPOSANTS RÉUTILISABLES ==========

interface SectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}

function Section({ title, icon, children }: SectionProps) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-zinc-900/50 text-zinc-500">
          {icon}
        </div>
        <h3 className="text-base font-medium text-zinc-400">{title}</h3>
      </div>
      {children}
    </section>
  )
}


interface BarChartProps {
  data: { label: string; value: number }[]
  color?: 'emerald' | 'rose' | 'orange' | 'amber'
}

function SimpleBarChart({ data, color = 'emerald' }: BarChartProps) {
  const max = Math.max(...data.map(d => d.value), 1)
  
  const colorClasses = {
    emerald: 'from-emerald-600 to-emerald-400',
    rose: 'from-rose-600 to-rose-400',
    orange: 'from-orange-600 to-orange-400',
    amber: 'from-amber-600 to-amber-400'
  }

  return (
    <div className="flex items-end justify-between h-32 gap-2">
      {data.map((item, i) => {
        const height = (item.value / max) * 100
        const isLast = i === data.length - 1
        
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex items-end justify-center h-24">
              <div 
                className={`w-full rounded-t-lg ${
                  isLast 
                    ? `bg-gradient-to-t ${colorClasses[color]}` 
                    : 'bg-zinc-700'
                }`}
                style={{ height: `${Math.max(8, height)}%` }}
              />
            </div>
            <span className={`text-xs ${isLast ? 'text-zinc-400 font-medium' : 'text-zinc-500'}`}>
              {item.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ========== COMPOSANT PRINCIPAL ==========

export function Dashboard() {
  const { setView } = useStore()
  const stats = useGlobalStats()

  // Indicateur de continuité globale (basé sur les streaks actifs)
  const activeStreaks = [
    stats.tasks.streak > 0,
    stats.habits.globalStreak > 0,
    stats.journal.currentStreak > 0,
    stats.pomodoro.currentStreak > 0,
    stats.health.streak > 0,
    stats.library.currentStreak > 0
  ].filter(Boolean).length
  
  const continuityStatus = activeStreaks >= 4 ? 'Forte continuité' : 
                          activeStreaks >= 2 ? 'Continuité partielle' : 
                          'Continuité faible'

  // Données pour graphiques 7 jours
  const tasksLast7Days = stats.tasks.last7Days.map((day: any) => ({
    label: new Date(day.date).toLocaleDateString('fr', { weekday: 'short' }).slice(0, 3),
    value: day.completed
  }))

  const pomodoroLast7Days = stats.pomodoro.last7Days.map((day: any) => ({
    label: new Date(day.date).toLocaleDateString('fr', { weekday: 'short' }).slice(0, 3),
    value: day.minutes
  }))

  return (
    <div className="min-h-screen w-full bg-black text-white">
      {/* ========== HEADER ========== */}
      <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-800/50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('hub')}
              className="p-1.5 hover:bg-zinc-800/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-400" />
            </button>
            <BarChart3 className="w-5 h-5 text-zinc-500" />
            <h1 className="text-lg font-medium text-zinc-400">Dashboard • Vue d'ensemble</h1>
          </div>
          
          {/* Indicateur de continuité */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
            <div className={`w-2 h-2 rounded-full ${
              activeStreaks >= 4 ? 'bg-emerald-500' : 
              activeStreaks >= 2 ? 'bg-amber-500' : 
              'bg-zinc-600'
            }`} />
            <span className="text-sm font-medium text-zinc-400">{continuityStatus}</span>
          </div>
        </div>
      </header>

      {/* ========== CONTENU PRINCIPAL ========== */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        
        {/* ========== VUE D'ENSEMBLE ========== */}
        <Section title="Vue d'ensemble" icon={<BarChart3 className="w-5 h-5" />}>
          {/* États du jour - Oui/Non simple */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className={`p-4 rounded-xl border ${stats.tasks.todayCompleted > 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-zinc-900/30 border-zinc-800/50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className={`w-4 h-4 ${stats.tasks.todayCompleted > 0 ? 'text-emerald-400' : 'text-zinc-600'}`} />
                <span className="text-xs text-zinc-500">Tâches</span>
              </div>
              <p className={`text-sm font-medium ${stats.tasks.todayCompleted > 0 ? 'text-emerald-300' : 'text-zinc-600'}`}>
                {stats.tasks.todayCompleted > 0 ? 'Actif' : 'Inactif'}
              </p>
            </div>

            <div className={`p-4 rounded-xl border ${stats.habits.todayCompleted > 0 ? 'bg-orange-500/5 border-orange-500/20' : 'bg-zinc-900/30 border-zinc-800/50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Flame className={`w-4 h-4 ${stats.habits.todayCompleted > 0 ? 'text-orange-400' : 'text-zinc-600'}`} />
                <span className="text-xs text-zinc-500">Habitudes</span>
              </div>
              <p className={`text-sm font-medium ${stats.habits.todayCompleted > 0 ? 'text-orange-300' : 'text-zinc-600'}`}>
                {stats.habits.todayCompleted > 0 ? 'Actif' : 'Inactif'}
              </p>
            </div>

            <div className={`p-4 rounded-xl border ${stats.journal.hasTodayEntry ? 'bg-violet-500/5 border-violet-500/20' : 'bg-zinc-900/30 border-zinc-800/50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className={`w-4 h-4 ${stats.journal.hasTodayEntry ? 'text-violet-400' : 'text-zinc-600'}`} />
                <span className="text-xs text-zinc-500">Journal</span>
              </div>
              <p className={`text-sm font-medium ${stats.journal.hasTodayEntry ? 'text-violet-300' : 'text-zinc-600'}`}>
                {stats.journal.hasTodayEntry ? 'Entrée faite' : 'Pas d\'entrée'}
              </p>
            </div>

            <div className={`p-4 rounded-xl border ${stats.pomodoro.todaySessions > 0 ? 'bg-rose-500/5 border-rose-500/20' : 'bg-zinc-900/30 border-zinc-800/50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Timer className={`w-4 h-4 ${stats.pomodoro.todaySessions > 0 ? 'text-rose-400' : 'text-zinc-600'}`} />
                <span className="text-xs text-zinc-500">Focus</span>
              </div>
              <p className={`text-sm font-medium ${stats.pomodoro.todaySessions > 0 ? 'text-rose-300' : 'text-zinc-600'}`}>
                {stats.pomodoro.todaySessions > 0 ? 'Session faite' : 'Pas de session'}
              </p>
            </div>
          </div>

          {/* Séries de consistance (6) */}
          <div className="mb-6">
            <h4 className="text-sm text-zinc-500 mb-3">Séries de consistance</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Tâches', value: stats.tasks.streak },
                { label: 'Habitudes', value: stats.habits.globalStreak },
                { label: 'Journal', value: stats.journal.currentStreak },
                { label: 'Pomodoro', value: stats.pomodoro.currentStreak },
                { label: 'Santé', value: stats.health.streak },
                { label: 'Lecture', value: stats.library.currentStreak }
              ].map((streak) => (
                <div key={streak.label} className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-xl text-center">
                  <p className="text-3xl font-bold text-zinc-400 mb-1">{streak.value}</p>
                  <p className="text-xs text-zinc-600">{streak.label}</p>
                  <p className="text-[10px] text-zinc-700 mt-1">{streak.value} jours</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tendances hebdomadaires - Visualisation simple */}
          <div className="mb-6">
            <h4 className="text-sm text-zinc-500 mb-3">Activité de la semaine</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-zinc-500">Tâches</span>
                  <span className={`text-xs ${stats.tasks.streak > 0 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                    {stats.tasks.streak > 0 ? 'En continuité' : 'Interrompu'}
                  </span>
                </div>
                <SimpleBarChart data={tasksLast7Days} color="emerald" />
              </div>
              <div className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-zinc-500">Focus</span>
                  <span className={`text-xs ${stats.pomodoro.currentStreak > 0 ? 'text-rose-400' : 'text-zinc-600'}`}>
                    {stats.pomodoro.currentStreak > 0 ? 'En continuité' : 'Interrompu'}
                  </span>
                </div>
                <SimpleBarChart data={pomodoroLast7Days} color="rose" />
              </div>
            </div>
          </div>

          {/* Corrélations */}
          {(stats.correlations.moodVsHabitsRate !== null || stats.correlations.productivityVsPomodoro !== null) && (
            <div>
              <h4 className="text-sm text-zinc-500 mb-3">Corrélations observées</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stats.correlations.moodVsHabitsRate !== null && (
                  <div className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-500">Humeur ↔ Habitudes</span>
                      <span className="text-lg font-medium text-zinc-400">
                        {stats.correlations.moodVsHabitsRate > 0 ? '+' : ''}{stats.correlations.moodVsHabitsRate.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600">
                      {stats.correlations.moodVsHabitsRate > 0.5 
                        ? 'Corrélation positive forte détectée.'
                        : stats.correlations.moodVsHabitsRate > 0
                        ? 'Corrélation positive modérée.'
                        : 'Corrélation faible ou négative.'}
                    </p>
                  </div>
                )}
                {stats.correlations.productivityVsPomodoro !== null && (
                  <div className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-500">Productivité ↔ Pomodoro</span>
                      <span className="text-lg font-medium text-zinc-400">
                        {stats.correlations.productivityVsPomodoro > 0 ? '+' : ''}{stats.correlations.productivityVsPomodoro.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600">
                      {stats.correlations.productivityVsPomodoro > 0.5 
                        ? 'Corrélation positive forte détectée.'
                        : stats.correlations.productivityVsPomodoro > 0
                        ? 'Corrélation positive modérée.'
                        : 'Corrélation faible ou négative.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Section>


        {/* ========== CORRÉLATIONS FINALES ========== */}
        <Section title="Corrélations statistiques" icon={<Activity className="w-5 h-5" />}>
          <div className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-xl mb-4">
            <p className="text-sm text-zinc-500">
              Les corrélations mesurent la relation entre deux variables. Une valeur proche de <strong className="text-zinc-400">+1</strong> indique une forte corrélation positive, 
              proche de <strong className="text-zinc-400">-1</strong> une corrélation négative, et proche de <strong className="text-zinc-500">0</strong> aucune corrélation.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Humeur vs Habitudes */}
            {stats.correlations.moodVsHabitsRate !== null && (
              <div className="p-6 bg-zinc-900/30 border border-zinc-800/50 rounded-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Smile className="w-5 h-5 text-zinc-500" />
                    <span className="text-sm text-zinc-500">Humeur</span>
                  </div>
                  <Activity className="w-4 h-4 text-zinc-600" />
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-zinc-500" />
                    <span className="text-sm text-zinc-500">Habitudes</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <span className="text-4xl font-bold text-zinc-400">
                    {stats.correlations.moodVsHabitsRate > 0 ? '+' : ''}{stats.correlations.moodVsHabitsRate.toFixed(2)}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-800/50 text-zinc-500">
                    {stats.correlations.moodVsHabitsRate > 0.5 ? 'Forte' :
                     stats.correlations.moodVsHabitsRate > 0 ? 'Modérée' :
                     stats.correlations.moodVsHabitsRate > -0.5 ? 'Faible' : 'Négative'}
                  </span>
                </div>
                <p className="text-sm text-zinc-600">
                  Corrélation {stats.correlations.moodVsHabitsRate > 0.5 ? 'positive forte' : stats.correlations.moodVsHabitsRate > 0 ? 'positive modérée' : 'faible'} entre l'humeur et le taux de complétion des habitudes.
                </p>
              </div>
            )}

            {/* Productivité vs Pomodoro */}
            {stats.correlations.productivityVsPomodoro !== null && (
              <div className="p-6 bg-zinc-900/30 border border-zinc-800/50 rounded-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-zinc-500" />
                    <span className="text-sm text-zinc-500">Productivité</span>
                  </div>
                  <Activity className="w-4 h-4 text-zinc-600" />
                  <div className="flex items-center gap-2">
                    <Timer className="w-5 h-5 text-zinc-500" />
                    <span className="text-sm text-zinc-500">Pomodoro</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <span className="text-4xl font-bold text-zinc-400">
                    {stats.correlations.productivityVsPomodoro > 0 ? '+' : ''}{stats.correlations.productivityVsPomodoro.toFixed(2)}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-800/50 text-zinc-500">
                    {stats.correlations.productivityVsPomodoro > 0.5 ? 'Forte' :
                     stats.correlations.productivityVsPomodoro > 0 ? 'Modérée' :
                     stats.correlations.productivityVsPomodoro > -0.5 ? 'Faible' : 'Négative'}
                  </span>
                </div>
                <p className="text-sm text-zinc-600">
                  Corrélation {stats.correlations.productivityVsPomodoro > 0.5 ? 'positive forte' : stats.correlations.productivityVsPomodoro > 0 ? 'positive modérée' : 'faible'} entre le temps de focus et les tâches complétées.
                </p>
              </div>
            )}
          </div>
        </Section>

      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-xs text-zinc-600">
            Vue d'ensemble • Continuité et tendances
          </p>
          <p className="text-center text-[10px] text-zinc-700 mt-1">
            Métriques détaillées disponibles dans chaque module
          </p>
        </div>
      </footer>
    </div>
  )
}
