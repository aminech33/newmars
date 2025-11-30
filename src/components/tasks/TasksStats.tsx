import { LayoutList, Zap, TrendingUp, LayoutGrid } from 'lucide-react'
import { StatCard } from './StatCard'
import { Task } from '../../store/useStore'
import { analyzeProductivityPatterns } from '../../utils/taskIntelligence'

interface TasksStatsProps {
  tasks: Task[]
  last7DaysStats: { total: number; completed: number }[]
  completedToday: number
  onStatClick: (stat: 'total' | 'today' | 'completed' | 'productivity') => void
}

export function TasksStats({ tasks, last7DaysStats, completedToday, onStatClick }: TasksStatsProps) {
  const analytics = analyzeProductivityPatterns(tasks)

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Total"
        value={tasks.length}
        icon={LayoutList}
        iconColor="text-indigo-400"
        iconBg="bg-indigo-500/20"
        trend={{
          data: last7DaysStats.map(d => d.total),
          color: 'rgb(99, 102, 241)'
        }}
        comparison={{
          value: last7DaysStats[6].total - last7DaysStats[5].total,
          label: 'vs hier',
          isPositive: last7DaysStats[6].total >= last7DaysStats[5].total
        }}
        onClick={() => onStatClick('total')}
      />
      
      <StatCard
        title="Aujourd'hui"
        value={completedToday}
        icon={Zap}
        iconColor="text-emerald-400"
        iconBg="bg-emerald-500/20"
        trend={{
          data: last7DaysStats.map(d => d.completed),
          color: 'rgb(16, 185, 129)'
        }}
        onClick={() => onStatClick('today')}
      />
      
      <StatCard
        title="Taux"
        value={`${analytics.completionRate}%`}
        icon={TrendingUp}
        iconColor="text-cyan-400"
        iconBg="bg-cyan-500/20"
        comparison={{
          value: analytics.completionRate - 75,
          label: 'objectif 75%',
          isPositive: analytics.completionRate >= 75
        }}
        onClick={() => onStatClick('completed')}
      />
      
      <StatCard
        title="Productivité"
        value={analytics.tasksPerDay}
        icon={LayoutGrid}
        iconColor="text-amber-400"
        iconBg="bg-amber-500/20"
        onClick={() => onStatClick('productivity')}
      />
    </div>
  )
}

