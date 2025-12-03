import { useStore } from '../store/useStore'
import { 
  CheckSquare, 
  Calendar, 
  BookOpen, 
  Timer, 
  Flame, 
  Library, 
  Heart, 
  GraduationCap, 
  Sparkles, 
  BarChart3 
} from 'lucide-react'

const apps = [
  { icon: CheckSquare, label: 'Tâches', view: 'tasks', color: 'emerald' },
  { icon: Calendar, label: 'Calendrier', view: 'calendar', color: 'blue' },
  { icon: BookOpen, label: 'Journal', view: 'journal', color: 'violet' },
  { icon: Timer, label: 'Pomodoro', view: 'pomodoro', color: 'rose' },
  { icon: Flame, label: 'Habitudes', view: 'habits', color: 'amber' },
  { icon: Library, label: 'Bibliothèque', view: 'library', color: 'indigo' },
  { icon: Heart, label: 'Santé', view: 'health', color: 'pink' },
  { icon: GraduationCap, label: 'Apprentissage', view: 'learning', color: 'purple' },
  { icon: Sparkles, label: 'IA', view: 'ai', color: 'cyan' },
  { icon: BarChart3, label: 'Stats', view: 'dashboard', color: 'teal' },
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

export function AppBar() {
  const { setView } = useStore()
  
  return (
    <div className="flex items-center justify-center">
      {/* Dock style macOS */}
      <div className="inline-flex gap-2 px-4 py-3 
                      bg-white/5 backdrop-blur-xl 
                      border border-white/10 rounded-2xl
                      shadow-2xl shadow-black/20">
        {apps.map((app) => {
          const Icon = app.icon
          return (
            <button
              key={app.view}
              onClick={() => setView(app.view as any)}
              className="group relative flex flex-col items-center"
              title={app.label}
            >
              {/* Icône */}
              <div className="w-12 h-12 rounded-xl bg-white/5 
                              flex items-center justify-center
                              group-hover:bg-white/10
                              group-hover:scale-110 
                              transition-all duration-200
                              border border-transparent
                              group-hover:border-white/10
                              relative">
                <Icon className={`w-6 h-6 ${colorClasses[app.color as keyof typeof colorClasses]} transition-colors`} strokeWidth={1.5} />
                <div className={`absolute inset-0 blur-lg opacity-0 group-hover:opacity-30 transition-opacity ${colorClasses[app.color as keyof typeof colorClasses]}`} />
              </div>
              
              {/* Tooltip au survol */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2
                              px-3 py-1.5 bg-zinc-900 border border-white/10 
                              rounded-lg text-xs text-zinc-300 whitespace-nowrap
                              opacity-0 group-hover:opacity-100
                              pointer-events-none transition-opacity
                              shadow-lg z-50">
                {app.label}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

