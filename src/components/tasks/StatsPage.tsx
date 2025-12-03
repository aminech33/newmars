import { ArrowLeft, TrendingUp, Target, CheckCircle, Zap, Calendar } from 'lucide-react'
import { Task } from '../../store/useStore'
import { Sparkline } from '../ui/Sparkline'

interface StatsPageProps {
  onBack: () => void
  tasks: Task[]
  last7DaysStats: Array<{ date: string; tasksCompleted: number; focusMinutes: number }>
  completedToday: number
}

export function StatsPage({ onBack, tasks, last7DaysStats, completedToday }: StatsPageProps) {
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.completed).length
  const pendingTasks = totalTasks - completedTasks
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  
  const totalFocusMinutes = last7DaysStats.reduce((acc, day) => acc + day.focusMinutes, 0)
  const avgTasksPerDay = last7DaysStats.length > 0 
    ? Math.round(last7DaysStats.reduce((acc, day) => acc + day.tasksCompleted, 0) / last7DaysStats.length)
    : 0

  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && !t.completed).length
  const tasksWithDueDate = tasks.filter(t => t.dueDate && !t.completed).length

  return (
    <div className="min-h-screen w-full bg-mars-bg overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="p-2 hover:bg-zinc-900/50 rounded-xl transition-colors"
            aria-label="Retour aux tâches"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
              <TrendingUp className="w-7 h-7 text-indigo-400" />
              Statistiques
            </h1>
            <p className="text-sm text-zinc-600 mt-1">
              Vue d'ensemble de votre productivité
            </p>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Tasks */}
          <div className="p-6 bg-zinc-900/30 backdrop-blur-xl rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
              <span className="text-xs text-zinc-600 uppercase tracking-wide">Total</span>
            </div>
            <div className="text-4xl font-bold text-white mb-1">{totalTasks}</div>
            <div className="text-sm text-zinc-500">Tâches créées</div>
          </div>

          {/* Completed Today */}
          <div className="p-6 bg-zinc-900/30 backdrop-blur-xl rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8 text-blue-400" />
              <span className="text-xs text-zinc-600 uppercase tracking-wide">Aujourd'hui</span>
            </div>
            <div className="text-4xl font-bold text-white mb-1">{completedToday}</div>
            <div className="text-sm text-zinc-500">Complétées aujourd'hui</div>
          </div>

          {/* Completion Rate */}
          <div className="p-6 bg-zinc-900/30 backdrop-blur-xl rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <Zap className="w-8 h-8 text-amber-400" />
              <span className="text-xs text-zinc-600 uppercase tracking-wide">Taux</span>
            </div>
            <div className="text-4xl font-bold text-white mb-1">{completionRate}%</div>
            <div className="text-sm text-zinc-500">Taux de complétion</div>
          </div>

          {/* Focus Time */}
          <div className="p-6 bg-zinc-900/30 backdrop-blur-xl rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8 text-rose-400" />
              <span className="text-xs text-zinc-600 uppercase tracking-wide">Focus</span>
            </div>
            <div className="text-4xl font-bold text-white mb-1">
              {Math.floor(totalFocusMinutes / 60)}h
            </div>
            <div className="text-sm text-zinc-500">Temps focus 7j</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Tasks Trend */}
          <div className="p-6 bg-zinc-900/30 backdrop-blur-xl rounded-2xl border border-white/10">
            <h3 className="text-lg font-semibold text-zinc-200 mb-4">Tâches complétées (7 derniers jours)</h3>
            <div className="h-32">
              <Sparkline 
                data={last7DaysStats.map(d => d.tasksCompleted)}
                color="#10b981"
              />
            </div>
            <div className="mt-4 text-center">
              <span className="text-2xl font-bold text-emerald-400">{avgTasksPerDay}</span>
              <span className="text-sm text-zinc-500 ml-2">tâches/jour en moyenne</span>
            </div>
          </div>

          {/* Focus Time Trend */}
          <div className="p-6 bg-zinc-900/30 backdrop-blur-xl rounded-2xl border border-white/10">
            <h3 className="text-lg font-semibold text-zinc-200 mb-4">Temps de focus (7 derniers jours)</h3>
            <div className="h-32">
              <Sparkline 
                data={last7DaysStats.map(d => d.focusMinutes)}
                color="#6366f1"
              />
            </div>
            <div className="mt-4 text-center">
              <span className="text-2xl font-bold text-indigo-400">
                {Math.round(totalFocusMinutes / last7DaysStats.length || 0)}min
              </span>
              <span className="text-sm text-zinc-500 ml-2">par jour en moyenne</span>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pending Tasks */}
          <div className="p-6 bg-zinc-900/30 backdrop-blur-xl rounded-2xl border border-white/10">
            <div className="text-center">
              <div className="text-3xl font-bold text-zinc-400 mb-2">{pendingTasks}</div>
              <div className="text-sm text-zinc-600">Tâches en attente</div>
            </div>
          </div>

          {/* Urgent Tasks */}
          <div className="p-6 bg-zinc-900/30 backdrop-blur-xl rounded-2xl border border-white/10">
            <div className="text-center">
              <div className="text-3xl font-bold text-rose-400 mb-2">{urgentTasks}</div>
              <div className="text-sm text-zinc-600">Tâches urgentes</div>
            </div>
          </div>

          {/* Tasks with Due Date */}
          <div className="p-6 bg-zinc-900/30 backdrop-blur-xl rounded-2xl border border-white/10">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">{tasksWithDueDate}</div>
              <div className="text-sm text-zinc-600">Avec échéance</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

