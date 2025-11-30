import { useState, useEffect } from 'react'
import { Search, CheckSquare, BarChart3, Sparkles, ArrowRight, TrendingUp, Zap } from 'lucide-react'
import { useStore } from '../store/useStore'

export function Hub() {
  const { userName, tasks, setView, focusMinutes, dailyGoal, setFocusMode } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const pendingTasks = tasks.filter(t => !t.completed)
  const completedTasks = tasks.filter(t => t.completed)
  const completedToday = completedTasks.filter(t => {
    const today = new Date().setHours(0, 0, 0, 0)
    return new Date(t.createdAt).setHours(0, 0, 0, 0) >= today
  }).length

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      
      // Smart search with prefixes
      if (query.startsWith('/task') || query.startsWith('t:')) {
        setView('tasks')
      } else if (query.startsWith('/ai') || query.startsWith('?')) {
        setView('ai')
      } else if (query.includes('tâche') || query.includes('task')) {
        setView('tasks')
      } else if (query.includes('stats') || query.includes('dashboard')) {
        setView('dashboard')
      } else {
        setView('ai')
      }
      setSearchQuery('')
    }
  }

  const progressPercent = dailyGoal > 0 ? Math.min((completedToday / dailyGoal) * 100, 100) : 0

  // Contextual insights
  const getInsight = () => {
    const hour = new Date().getHours()
    const urgentTasks = pendingTasks.filter(t => t.category === 'urgent').length
    
    if (urgentTasks > 0) {
      return `⚠️ ${urgentTasks} tâche${urgentTasks > 1 ? 's' : ''} urgente${urgentTasks > 1 ? 's' : ''}`
    }
    if (completedToday >= dailyGoal && dailyGoal > 0) {
      return '🎉 Objectif du jour atteint !'
    }
    if (completedToday > 0) {
      return `📈 ${completedToday} tâche${completedToday > 1 ? 's' : ''} terminée${completedToday > 1 ? 's' : ''} aujourd'hui`
    }
    if (hour >= 14 && hour < 16) {
      return '⚡ Pic de productivité : 14h-16h'
    }
    return '💪 Prêt à être productif'
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center px-6 py-8">
      <div 
        className={`w-full max-w-4xl flex flex-col items-center transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        {/* Giant Clock */}
        <div className="text-center mb-2">
          <h1 className="text-8xl md:text-9xl font-extralight tracking-tighter text-zinc-100 tabular-nums">
            {formatTime(currentTime)}
          </h1>
          <p className="text-zinc-600 text-lg capitalize mt-1">{formatDate(currentTime)}</p>
        </div>

        {/* Subtle greeting with insight */}
        <div className="text-center mb-3">
          <p className="text-zinc-500 text-sm">
            Bonjour {userName} · {pendingTasks.length} tâches en attente
          </p>
          <p className="text-zinc-600 text-xs mt-1">{getInsight()}</p>
        </div>

        {/* Progress bar */}
        {dailyGoal > 0 && (
          <div className="w-full max-w-md mb-8">
            <div className="flex items-center justify-between text-xs text-zinc-700 mb-2">
              <span>Objectif du jour</span>
              <span>{completedToday} / {dailyGoal}</span>
            </div>
            <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500/60 to-indigo-400/40 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Search Bar - More subtle */}
        <div 
          className="relative w-full max-w-xl mb-12 group"
          style={{ animationDelay: '100ms' }}
        >
          <div className="relative flex items-center gap-3 px-5 py-4 border-b border-zinc-800 group-focus-within:border-zinc-600 transition-colors">
            <Search className="w-4 h-4 text-zinc-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Rechercher ou demander à l'IA..."
              className="flex-1 bg-transparent text-zinc-300 placeholder:text-zinc-700 focus:outline-none"
            />
            <kbd className="hidden md:block text-[10px] text-zinc-700 px-1.5 py-0.5 border border-zinc-800 rounded">⌘K</kbd>
          </div>
          <p className="absolute -bottom-6 left-0 text-xs text-zinc-800">
            Essayez : <span className="text-zinc-700">t:</span> pour tâches, <span className="text-zinc-700">?</span> pour l'IA
          </p>
        </div>

        {/* Asymmetric Cards Grid */}
        <div className="w-full max-w-3xl grid grid-cols-3 gap-3" style={{ animationDelay: '200ms' }}>
          {/* Tasks - Large card (2 cols) */}
          <button
            onClick={() => setView('tasks')}
            className="col-span-2 group text-left p-6 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/50 hover:border-zinc-700 transition-all duration-200 active:scale-[0.985]"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <CheckSquare className="w-5 h-5 text-zinc-600 mb-3" />
                <h3 className="text-zinc-200 font-medium tracking-tight text-lg">Tâches</h3>
                <p className="text-zinc-600 text-sm">{pendingTasks.length} en cours</p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-500 group-hover:translate-x-1 transition-all" />
            </div>
            
            {/* Task preview */}
            <div className="space-y-2">
              {pendingTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center gap-3 text-sm">
                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                  <span className="text-zinc-500 truncate">{task.title}</span>
                </div>
              ))}
              {pendingTasks.length === 0 && (
                <p className="text-zinc-700 text-sm">Aucune tâche en attente</p>
              )}
            </div>
          </button>

          {/* Right column - stacked */}
          <div className="flex flex-col gap-3">
            {/* Dashboard */}
            <button
              onClick={() => setView('dashboard')}
              className="group flex-1 text-left p-5 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/50 hover:border-zinc-700 transition-all duration-200 active:scale-[0.985]"
            >
              <BarChart3 className="w-5 h-5 text-zinc-600 mb-2" />
              <h3 className="text-zinc-300 font-medium tracking-tight">Dashboard</h3>
              <div className="flex items-center gap-2 mt-2">
                <TrendingUp className="w-3 h-3 text-emerald-500/60" />
                <p className="text-zinc-700 text-xs">{completedTasks.length} terminées</p>
              </div>
            </button>

            {/* AI */}
            <button
              onClick={() => setView('ai')}
              className="group flex-1 text-left p-5 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/50 hover:border-zinc-700 transition-all duration-200 active:scale-[0.985]"
            >
              <Sparkles className="w-5 h-5 text-zinc-600 mb-2" />
              <h3 className="text-zinc-300 font-medium tracking-tight">Assistant</h3>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 animate-pulse" />
                <span className="text-zinc-700 text-xs">Actif</span>
              </div>
            </button>
          </div>
        </div>

        {/* Focus Mode Quick Access */}
        {pendingTasks.length > 0 && (
          <button
            onClick={() => {
              const nextTask = pendingTasks[0]
              setFocusMode(true, nextTask.id)
            }}
            className="mt-6 flex items-center gap-2 px-4 py-2 text-xs text-zinc-600 hover:text-zinc-400 border border-zinc-900 hover:border-zinc-800 rounded-full transition-colors"
          >
            <Zap className="w-3 h-3" />
            <span>Mode Focus sur "{pendingTasks[0].title}"</span>
          </button>
        )}
      </div>

      {/* Floating Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 px-6 py-4 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-8 text-xs text-zinc-600">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60" />
            {pendingTasks.length} actives
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
            {completedTasks.length} terminées
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
            {Math.floor(focusMinutes / 60)}h focus
          </span>
        </div>
      </div>
    </div>
  )
}
