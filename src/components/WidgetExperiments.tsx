import { useState } from 'react'
import { ArrowLeft, Flame, TrendingUp, TrendingDown, Activity, Zap, Target, BookOpen, Coffee, Brain } from 'lucide-react'
import { useStore } from '../store/useStore'

/**
 * 🧪 WIDGET EXPERIMENTS PAGE
 * 
 * Page d'expérimentation pour tester différents designs de widgets
 * Sans dépendances externes - juste du React + Tailwind + Lucide Icons
 */

export function WidgetExperiments() {
  const { setView } = useStore()
  const [activeSection, setActiveSection] = useState<'all' | 'cards' | 'charts' | 'minimal'>('all')

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <button
          onClick={() => setView('hub')}
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au Hub
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-zinc-100 mb-2">
              🧪 Widget Experiments
            </h1>
            <p className="text-zinc-500">
              Explore different widget designs and styles
            </p>
          </div>

          <div className="flex gap-3">
            {/* Bouton vers Advanced Widgets */}
            <button
              onClick={() => setView('advanced-widgets')}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20"
            >
              <Zap className="w-4 h-4" />
              🚀 Advanced Widgets
            </button>

            {/* Filter Tabs */}
            <div className="flex gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'cards', label: 'Cards' },
                { id: 'charts', label: 'Charts' },
                { id: 'minimal', label: 'Minimal' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === tab.id
                      ? 'bg-indigo-500 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Widgets Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* 1. Glass Morphism Streak Widget */}
          {(activeSection === 'all' || activeSection === 'cards') && (
            <div className="bg-gradient-to-br from-orange-500/10 to-rose-500/10 backdrop-blur-xl rounded-3xl p-6 border border-orange-500/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-500/20 rounded-2xl">
                    <Flame className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-sm text-zinc-400">Current Streak</h3>
                    <p className="text-3xl font-bold text-white">28 days</p>
                  </div>
                </div>
              </div>
              
              {/* Mini bar chart */}
              <div className="flex items-end gap-1 h-20 mt-4">
                {[65, 80, 90, 95, 100, 85, 100].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-orange-500 to-rose-500 rounded-t-lg transition-all hover:scale-105"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              
              <p className="text-xs text-zinc-400 mt-4">
                🔥 Best: 45 days • Avg: 12 days
              </p>
            </div>
          )}

          {/* 2. Neumorphic KPI Card */}
          {(activeSection === 'all' || activeSection === 'cards') && (
            <div className="bg-zinc-900 rounded-3xl p-6 shadow-[8px_8px_16px_#0a0a0a,-8px_-8px_16px_#1a1a1a]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Tasks Completed</span>
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl font-bold text-white">127</span>
                <span className="text-lg text-emerald-400">+23%</span>
              </div>
              
              <p className="text-sm text-zinc-500">vs last week</p>
              
              {/* Sparkline */}
              <svg className="w-full h-12 mt-4" viewBox="0 0 100 30">
                <polyline
                  points="0,25 20,20 40,15 60,18 80,10 100,5"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          )}

          {/* 3. Minimal Progress Widget */}
          {(activeSection === 'all' || activeSection === 'minimal') && (
            <div className="bg-zinc-900/50 rounded-3xl p-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-6">
                <Activity className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-semibold text-zinc-200">Daily Goals</h3>
              </div>
              
              <div className="space-y-4">
                {[
                  { label: 'Tasks', value: 75, color: 'bg-indigo-500' },
                  { label: 'Exercise', value: 100, color: 'bg-emerald-500' },
                  { label: 'Reading', value: 45, color: 'bg-amber-500' },
                  { label: 'Water', value: 60, color: 'bg-cyan-500' }
                ].map((goal) => (
                  <div key={goal.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-400">{goal.label}</span>
                      <span className="text-zinc-300 font-medium">{goal.value}%</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${goal.color} transition-all duration-500`}
                        style={{ width: `${goal.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Gradient Stat Card */}
          {(activeSection === 'all' || activeSection === 'cards') && (
            <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-3xl p-6">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }} />
              </div>
              
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <Zap className="w-8 h-8 text-white" />
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white">
                    This Week
                  </span>
                </div>
                
                <h3 className="text-sm text-white/80 mb-1">Focus Time</h3>
                <p className="text-4xl font-bold text-white mb-2">12h 34m</p>
                
                <div className="flex items-center gap-2 text-sm text-white/90">
                  <TrendingUp className="w-4 h-4" />
                  <span>2h 15m more than last week</span>
                </div>
              </div>
            </div>
          )}

          {/* 5. Compact Metric Grid */}
          {(activeSection === 'all' || activeSection === 'minimal') && (
            <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
              <h3 className="text-sm text-zinc-400 mb-4">Quick Stats</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Target, label: 'Goals', value: '12/15', color: 'text-rose-400' },
                  { icon: BookOpen, label: 'Books', value: '3', color: 'text-amber-400' },
                  { icon: Coffee, label: 'Pomodoros', value: '18', color: 'text-orange-400' },
                  { icon: Brain, label: 'Courses', value: '2', color: 'text-purple-400' }
                ].map((stat) => {
                  const Icon = stat.icon
                  return (
                    <div key={stat.label} className="bg-zinc-800/50 rounded-2xl p-4 hover:bg-zinc-800 transition-colors">
                      <Icon className={`w-5 h-5 ${stat.color} mb-2`} />
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-zinc-500">{stat.label}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 6. Circular Progress Widget */}
          {(activeSection === 'all' || activeSection === 'charts') && (
            <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
              <h3 className="text-sm text-zinc-400 mb-6">Weekly Progress</h3>
              
              <div className="flex items-center justify-center">
                <div className="relative w-40 h-40">
                  {/* Background circle */}
                  <svg className="transform -rotate-90 w-40 h-40">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="#27272a"
                      strokeWidth="12"
                      fill="none"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="url(#circleGradient)"
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${70 * 2 * Math.PI * 0.73} ${70 * 2 * Math.PI}`}
                    />
                    <defs>
                      <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* Center text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white">73%</span>
                    <span className="text-xs text-zinc-500">Completed</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mt-6">
                {[
                  { label: 'Mon-Wed', value: '100%', color: 'bg-emerald-500' },
                  { label: 'Thu-Fri', value: '80%', color: 'bg-indigo-500' },
                  { label: 'Weekend', value: '40%', color: 'bg-zinc-600' }
                ].map((day) => (
                  <div key={day.label} className="text-center">
                    <div className={`h-1.5 ${day.color} rounded-full mb-2`} />
                    <p className="text-xs text-zinc-500">{day.label}</p>
                    <p className="text-sm text-zinc-300 font-medium">{day.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. Timeline Widget */}
          {(activeSection === 'all' || activeSection === 'minimal') && (
            <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
              <h3 className="text-sm text-zinc-400 mb-4">Today's Activity</h3>
              
              <div className="space-y-4">
                {[
                  { time: '09:00', task: 'Morning standup', color: 'bg-blue-500', done: true },
                  { time: '10:30', task: 'Deep work session', color: 'bg-purple-500', done: true },
                  { time: '14:00', task: 'Client meeting', color: 'bg-rose-500', done: false },
                  { time: '16:30', task: 'Code review', color: 'bg-emerald-500', done: false }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${item.color} ${item.done ? 'opacity-100' : 'opacity-40'}`} />
                      {i < 3 && <div className="w-px h-8 bg-zinc-800 mt-1" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${item.done ? 'text-zinc-400 line-through' : 'text-zinc-200'}`}>
                        {item.task}
                      </p>
                      <p className="text-xs text-zinc-600">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. Heatmap Widget */}
          {(activeSection === 'all' || activeSection === 'charts') && (
            <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
              <h3 className="text-sm text-zinc-400 mb-4">Activity Heatmap</h3>
              
              <div className="space-y-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div key={day} className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 w-8">{day}</span>
                    <div className="flex gap-1 flex-1">
                      {Array.from({ length: 24 }, (_, i) => {
                        const intensity = Math.random()
                        return (
                          <div
                            key={i}
                            className={`flex-1 h-4 rounded-sm transition-all hover:scale-110 ${
                              intensity > 0.7 ? 'bg-emerald-500' :
                              intensity > 0.4 ? 'bg-emerald-500/50' :
                              intensity > 0.2 ? 'bg-emerald-500/25' :
                              'bg-zinc-800'
                            }`}
                            title={`${i}:00 - ${intensity > 0.2 ? 'Active' : 'Inactive'}`}
                          />
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-between mt-4 text-xs text-zinc-500">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="w-4 h-4 bg-zinc-800 rounded" />
                  <div className="w-4 h-4 bg-emerald-500/25 rounded" />
                  <div className="w-4 h-4 bg-emerald-500/50 rounded" />
                  <div className="w-4 h-4 bg-emerald-500 rounded" />
                </div>
                <span>More</span>
              </div>
            </div>
          )}

          {/* 9. Comparison Card */}
          {(activeSection === 'all' || activeSection === 'cards') && (
            <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
              <h3 className="text-sm text-zinc-400 mb-4">This Week vs Last Week</h3>
              
              <div className="space-y-4">
                {[
                  { metric: 'Tasks', current: 48, previous: 42, unit: '' },
                  { metric: 'Focus', current: 12.5, previous: 10.2, unit: 'h' },
                  { metric: 'Books', current: 145, previous: 128, unit: 'pages' }
                ].map((item) => {
                  const diff = item.current - item.previous
                  const percentChange = ((diff / item.previous) * 100).toFixed(0)
                  const isPositive = diff > 0
                  
                  return (
                    <div key={item.metric} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-zinc-400">{item.metric}</p>
                        <p className="text-2xl font-bold text-white">
                          {item.current}{item.unit}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <div className={`flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          <span className="text-sm font-medium">{percentChange}%</span>
                        </div>
                        <p className="text-xs text-zinc-600">
                          vs {item.previous}{item.unit}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>

        {/* Info Footer */}
        <div className="mt-12 text-center">
          <p className="text-zinc-500 text-sm">
            🎨 All designs use only <strong className="text-zinc-400">React + Tailwind + Lucide Icons</strong>
          </p>
          <p className="text-zinc-600 text-xs mt-2">
            No external widget libraries required • Ready to integrate
          </p>
        </div>
      </div>
    </div>
  )
}

