import { useStore } from '../store/useStore'
import { ArrowLeft } from 'lucide-react'

export function Dashboard() {
  const { tasks, focusMinutes, setView } = useStore()

  const completedTasks = tasks.filter(t => t.completed).length
  const totalTasks = tasks.length
  const pendingTasks = totalTasks - completedTasks
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Mock weekly data for sparkline
  const weekData = [4, 7, 5, 8, 6, 3, 5]
  const maxWeek = Math.max(...weekData)
  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

  // Generate sparkline path
  const generateSparkline = (data: number[], width: number, height: number) => {
    const max = Math.max(...data)
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - (val / max) * height
      return `${x},${y}`
    })
    return `M ${points.join(' L ')}`
  }

  const tasksByCategory = tasks.reduce((acc, task) => {
    if (!task.completed) {
      acc[task.category] = (acc[task.category] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="h-full w-full flex flex-col view-transition">
      {/* Minimal Header */}
      <header className="flex-shrink-0 px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => setView('hub')}
            className="p-2 -ml-2 text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-medium tracking-tight text-zinc-200">Dashboard</h1>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-6 pb-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Giant Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-b border-zinc-900">
            <div className="text-center animate-fade-in" style={{ animationDelay: '0ms' }}>
              <p className="text-6xl md:text-7xl font-extralight tracking-tighter text-zinc-100 tabular-nums">
                {completedTasks}
              </p>
              <p className="text-zinc-600 text-xs mt-2 uppercase tracking-wider">Terminées</p>
            </div>
            <div className="text-center animate-fade-in" style={{ animationDelay: '50ms' }}>
              <p className="text-6xl md:text-7xl font-extralight tracking-tighter text-zinc-100 tabular-nums">
                {pendingTasks}
              </p>
              <p className="text-zinc-600 text-xs mt-2 uppercase tracking-wider">En cours</p>
            </div>
            <div className="text-center animate-fade-in" style={{ animationDelay: '100ms' }}>
              <p className="text-6xl md:text-7xl font-extralight tracking-tighter text-zinc-100 tabular-nums">
                {Math.floor(focusMinutes / 60)}<span className="text-3xl text-zinc-600">h</span>
              </p>
              <p className="text-zinc-600 text-xs mt-2 uppercase tracking-wider">Focus</p>
            </div>
            <div className="text-center animate-fade-in" style={{ animationDelay: '150ms' }}>
              <p className="text-6xl md:text-7xl font-extralight tracking-tighter text-zinc-100 tabular-nums">
                {completionRate}<span className="text-3xl text-zinc-600">%</span>
              </p>
              <p className="text-zinc-600 text-xs mt-2 uppercase tracking-wider">Complétion</p>
            </div>
          </div>

          {/* Sparkline Section */}
          <div className="py-12 border-b border-zinc-900 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="flex items-end justify-between mb-6">
              <div>
                <h3 className="text-zinc-400 text-sm font-medium">Activité cette semaine</h3>
                <p className="text-zinc-700 text-xs mt-1">Tâches complétées par jour</p>
              </div>
              <p className="text-2xl font-light text-zinc-300 tabular-nums">
                {weekData.reduce((a, b) => a + b, 0)} <span className="text-sm text-zinc-600">total</span>
              </p>
            </div>
            
            {/* Sparkline Chart */}
            <div className="relative h-24">
              <svg className="w-full h-full" preserveAspectRatio="none">
                {/* Grid lines */}
                <line x1="0" y1="100%" x2="100%" y2="100%" stroke="#27272a" strokeWidth="1" />
                
                {/* Sparkline */}
                <path
                  d={generateSparkline(weekData, 100, 100)}
                  fill="none"
                  stroke="#52525b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  className="transition-all duration-500"
                />
                
                {/* Data points */}
                {weekData.map((val, i) => {
                  const x = (i / (weekData.length - 1)) * 100
                  const y = 100 - (val / maxWeek) * 100
                  return (
                    <circle
                      key={i}
                      cx={`${x}%`}
                      cy={`${y}%`}
                      r="3"
                      fill="#09090b"
                      stroke="#71717a"
                      strokeWidth="2"
                      className="transition-all duration-300"
                    />
                  )
                })}
              </svg>
              
              {/* Day labels */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between translate-y-6">
                {weekDays.map((day, i) => (
                  <span key={i} className="text-[10px] text-zinc-700">{day}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="py-12 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <h3 className="text-zinc-400 text-sm font-medium mb-6">Par catégorie</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { key: 'dev', label: 'Dev', color: 'bg-indigo-500' },
                { key: 'design', label: 'Design', color: 'bg-cyan-500' },
                { key: 'work', label: 'Travail', color: 'bg-amber-500' },
                { key: 'personal', label: 'Perso', color: 'bg-emerald-500' },
                { key: 'urgent', label: 'Urgent', color: 'bg-rose-500' },
              ].map((cat) => (
                <div 
                  key={cat.key}
                  className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-900"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2 h-2 rounded-full ${cat.color} opacity-60`} />
                    <span className="text-xs text-zinc-600">{cat.label}</span>
                  </div>
                  <p className="text-2xl font-light text-zinc-300 tabular-nums">
                    {tasksByCategory[cat.key] || 0}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Streak indicator */}
          <div className="flex items-center justify-center gap-2 py-8 text-zinc-700 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <span className="text-lg">🔥</span>
            <span className="text-sm">7 jours de streak</span>
          </div>
        </div>
      </div>
    </div>
  )
}
