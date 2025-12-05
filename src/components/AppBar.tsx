import { useStore } from '../store/useStore'
import { 
  CheckSquare, 
  Calendar, 
  CalendarDays,
  Timer, 
  Library, 
  Heart, 
  GraduationCap, 
  Sparkles, 
  BarChart3 
} from 'lucide-react'

const apps = [
  { icon: CheckSquare, label: 'Tâches', view: 'tasks', color: 'emerald', shortcut: '⌘T' },
  { icon: Calendar, label: 'Calendrier', view: 'calendar', color: 'blue', shortcut: '' },
  { icon: CalendarDays, label: 'Ma Journée', view: 'myday', color: 'violet', shortcut: '⌘J' },
  { icon: Timer, label: 'Pomodoro', view: 'pomodoro', color: 'rose', shortcut: '⌘P' },
  { icon: Library, label: 'Bibliothèque', view: 'library', color: 'indigo', shortcut: '⌘L' },
  { icon: Heart, label: 'Santé', view: 'health', color: 'pink', shortcut: '' },
  { icon: GraduationCap, label: 'Apprentissage', view: 'learning', color: 'purple', shortcut: '' },
  { icon: Sparkles, label: 'IA', view: 'ai', color: 'cyan', shortcut: '⌘I' },
  { icon: BarChart3, label: 'Stats', view: 'dashboard', color: 'teal', shortcut: '⌘D' },
]

const colorClasses = {
  emerald: 'text-emerald-400 group-hover:text-emerald-300',
  blue: 'text-blue-400 group-hover:text-blue-300',
  violet: 'text-violet-400 group-hover:text-violet-300',
  rose: 'text-rose-400 group-hover:text-rose-300',
  amber: 'text-amber-400 group-hover:text-amber-300',
  cyan: 'text-cyan-400 group-hover:text-cyan-300',
  indigo: 'text-indigo-400 group-hover:text-indigo-300',
  pink: 'text-pink-400 group-hover:text-pink-300',
  purple: 'text-purple-400 group-hover:text-purple-300',
  teal: 'text-teal-400 group-hover:text-teal-300',
}

const activeColorClasses = {
  emerald: 'bg-emerald-500/20 border-emerald-500/40 shadow-emerald-500/20',
  blue: 'bg-blue-500/20 border-blue-500/40 shadow-blue-500/20',
  violet: 'bg-violet-500/20 border-violet-500/40 shadow-violet-500/20',
  rose: 'bg-rose-500/20 border-rose-500/40 shadow-rose-500/20',
  amber: 'bg-amber-500/20 border-amber-500/40 shadow-amber-500/20',
  cyan: 'bg-cyan-500/20 border-cyan-500/40 shadow-cyan-500/20',
  indigo: 'bg-indigo-500/20 border-indigo-500/40 shadow-indigo-500/20',
  pink: 'bg-pink-500/20 border-pink-500/40 shadow-pink-500/20',
  purple: 'bg-purple-500/20 border-purple-500/40 shadow-purple-500/20',
  teal: 'bg-teal-500/20 border-teal-500/40 shadow-teal-500/20',
}

export function AppBar() {
  const { setView, currentView } = useStore()
  
  return (
    <div className="flex items-center justify-center">
      {/* Dock style macOS */}
      <div className="inline-flex gap-2 px-4 py-3 
                      bg-white/5 backdrop-blur-xl 
                      border border-white/10 rounded-2xl
                      shadow-2xl shadow-black/20">
        {apps.map((app) => {
          const Icon = app.icon
          const isActive = currentView === app.view
          
          return (
            <button
              key={app.view}
              onClick={() => setView(app.view as any)}
              className="group relative flex flex-col items-center"
              title={app.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Icône */}
              <div className={`w-12 h-12 rounded-xl 
                              flex items-center justify-center
                              transition-colors duration-200
                              relative
                              ${isActive 
                                ? `${activeColorClasses[app.color as keyof typeof activeColorClasses]} border scale-105 shadow-lg` 
                                : 'bg-white/5 border border-transparent group-hover:bg-white/10 group-hover:scale-110 group-hover:border-white/10'
                              }`}>
                <Icon 
                  className={`w-6 h-6 transition-colors ${colorClasses[app.color as keyof typeof colorClasses]}`} 
                  strokeWidth={isActive ? 2 : 1.5} 
                />
                <div className={`absolute inset-0 blur-lg transition-opacity ${colorClasses[app.color as keyof typeof colorClasses]} ${isActive ? 'opacity-40' : 'opacity-0 group-hover:opacity-30'}`} />
              </div>
              
              {/* Indicateur actif (point sous l'icône) */}
              {isActive && (
                <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                  app.color === 'emerald' ? 'bg-emerald-400' :
                  app.color === 'blue' ? 'bg-blue-400' :
                  app.color === 'violet' ? 'bg-violet-400' :
                  app.color === 'rose' ? 'bg-rose-400' :
                  app.color === 'amber' ? 'bg-amber-400' :
                  app.color === 'cyan' ? 'bg-cyan-400' :
                  app.color === 'indigo' ? 'bg-indigo-400' :
                  app.color === 'pink' ? 'bg-pink-400' :
                  app.color === 'purple' ? 'bg-purple-400' :
                  'bg-teal-400'
                }`} />
              )}
              
              {/* Tooltip au survol */}
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2
                              px-3 py-1.5 bg-zinc-900 border border-white/10 
                              rounded-lg text-xs whitespace-nowrap
                              opacity-0 group-hover:opacity-100
                              pointer-events-none transition-opacity
                              shadow-lg z-50 flex flex-col items-center gap-0.5">
                <span className="text-zinc-300">{app.label}</span>
                {app.shortcut && (
                  <span className="text-zinc-500 text-[10px]">{app.shortcut}</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

