import { memo, useMemo } from 'react'
import { TrendingUp, TrendingDown, Flame, Target } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'
import { calculateProductivityScore, formatDuration } from '../../utils/productivityUtils'

interface StatsWidgetProps {
  widget: Widget
}

export const StatsWidget = memo(function StatsWidget({ widget }: StatsWidgetProps) {
  const { id, size = 'small' } = widget
  const { tasks, focusMinutes, setView, getCurrentStreak, dailyGoal, getWeekStats } = useStore()
  
  const streak = useMemo(() => getCurrentStreak(), [getCurrentStreak])
  const weekStats = useMemo(() => getWeekStats(), [getWeekStats])
  
  // Tâches d'aujourd'hui
  const today = new Date().toISOString().split('T')[0]
  const todayTasks = tasks.filter(t => 
    t.completed && new Date(t.createdAt).toISOString().split('T')[0] === today
  ).length
  
  // Hier
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]
  const yesterdayTasks = tasks.filter(t => 
    t.completed && new Date(t.createdAt).toISOString().split('T')[0] === yesterdayStr
  ).length
  
  // Différence
  const tasksDiff = todayTasks - yesterdayTasks
  
  // Score de productivité
  const productivityScore = useMemo(() => 
    calculateProductivityScore(todayTasks, focusMinutes, streak, 1, dailyGoal),
    [todayTasks, focusMinutes, streak, dailyGoal]
  )

  // Couleur du score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 60) return 'text-cyan-400'
    if (score >= 40) return 'text-amber-400'
    return 'text-rose-400'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'from-emerald-500/20 to-emerald-500/5'
    if (score >= 60) return 'from-cyan-500/20 to-cyan-500/5'
    if (score >= 40) return 'from-amber-500/20 to-amber-500/5'
    return 'from-rose-500/20 to-rose-500/5'
  }

  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="Stats" currentSize={size} onClick={() => setView('dashboard')}>
        <div className="flex flex-col items-center justify-center h-full">
          <div className={`text-4xl font-light ${getScoreColor(productivityScore.score)} mb-1`}>
            {productivityScore.score}
          </div>
          <p className="text-xs text-zinc-600">Score du jour</p>
          {tasksDiff !== 0 && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${tasksDiff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {tasksDiff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {tasksDiff > 0 ? '+' : ''}{tasksDiff} vs hier
            </div>
          )}
        </div>
      </WidgetContainer>
    )
  }

  if (size === 'medium') {
    return (
      <WidgetContainer id={id} title="Statistiques" currentSize={size} onClick={() => setView('dashboard')}>
        <div className="h-full flex flex-col">
          {/* Score */}
          <div className={`bg-gradient-to-br ${getScoreBg(productivityScore.score)} rounded-xl p-3 mb-3`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 mb-1">Score</p>
                <p className={`text-3xl font-light ${getScoreColor(productivityScore.score)}`}>
                  {productivityScore.score}
                </p>
              </div>
              <div className="text-right">
                {tasksDiff !== 0 && (
                  <div className={`flex items-center gap-1 text-xs ${tasksDiff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tasksDiff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {tasksDiff > 0 ? '+' : ''}{tasksDiff}
                  </div>
                )}
                <p className="text-xs text-zinc-600">vs hier</p>
              </div>
            </div>
          </div>
          
          {/* Mini stats */}
          <div className="grid grid-cols-2 gap-2 flex-1">
            <div className="bg-zinc-800/30 rounded-xl p-2 flex flex-col items-center justify-center">
              <p className="text-xl font-light text-zinc-200">{todayTasks}</p>
              <p className="text-[10px] text-zinc-600">Aujourd'hui</p>
            </div>
            <div className="bg-zinc-800/30 rounded-xl p-2 flex flex-col items-center justify-center">
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-500" />
                <p className="text-xl font-light text-zinc-200">{streak}</p>
              </div>
              <p className="text-[10px] text-zinc-600">Streak</p>
            </div>
          </div>
        </div>
      </WidgetContainer>
    )
  }

  // Large size
  const weekTasksCompleted = weekStats.reduce((acc, day) => acc + day.tasksCompleted, 0)
  const totalFocusMinutes = weekStats.reduce((acc, day) => acc + day.focusMinutes, 0)
  
  return (
    <WidgetContainer id={id} title="Statistiques" currentSize={size} onClick={() => setView('dashboard')}>
      <div className="h-full flex flex-col">
        {/* Score principal */}
        <div className={`bg-gradient-to-br ${getScoreBg(productivityScore.score)} rounded-xl p-4 mb-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 mb-1">Score de productivité</p>
              <p className={`text-4xl font-light ${getScoreColor(productivityScore.score)}`}>
                {productivityScore.score}
                <span className="text-lg text-zinc-600">/100</span>
              </p>
            </div>
            <div className="text-right">
              {tasksDiff !== 0 && (
                <div className={`flex items-center gap-1 text-sm ${tasksDiff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {tasksDiff > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {tasksDiff > 0 ? '+' : ''}{tasksDiff} tâches
                </div>
              )}
              <p className="text-xs text-zinc-600 mt-1">vs hier</p>
            </div>
          </div>
        </div>
        
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 flex-1">
          <div className="bg-zinc-800/30 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-cyan-500" />
              <span className="text-xs text-zinc-500">Aujourd'hui</span>
            </div>
            <p className="text-2xl font-light text-zinc-200">{todayTasks}</p>
            <p className="text-xs text-zinc-600">tâches</p>
          </div>
          
          <div className="bg-zinc-800/30 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-zinc-500">Streak</span>
            </div>
            <p className="text-2xl font-light text-zinc-200">{streak}</p>
            <p className="text-xs text-zinc-600">jours</p>
          </div>
          
          <div className="bg-zinc-800/30 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-zinc-500">Semaine</span>
            </div>
            <p className="text-2xl font-light text-zinc-200">{weekTasksCompleted}</p>
            <p className="text-xs text-zinc-600">tâches</p>
          </div>
          
          <div className="bg-zinc-800/30 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">🎯</span>
              <span className="text-xs text-zinc-500">Focus</span>
            </div>
            <p className="text-2xl font-light text-zinc-200">{formatDuration(totalFocusMinutes)}</p>
            <p className="text-xs text-zinc-600">cette semaine</p>
          </div>
        </div>
        
        {/* CTA */}
        <button 
          onClick={() => setView('dashboard')}
          className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Voir le dashboard complet →
        </button>
      </div>
    </WidgetContainer>
  )
})
