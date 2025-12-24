import { useState } from 'react'
import { useStore } from '../store/useStore'
import { 
  CheckSquare, 
  CalendarDays,
  Timer, 
  Library, 
  Heart, 
  GraduationCap, 
  Settings,
  Home,
  MoreHorizontal,
  X,
  FolderKanban
} from 'lucide-react'

const apps = [
  { icon: CheckSquare, label: 'Tâches', view: 'tasks', color: 'emerald', shortcut: '⌘T' },
  { icon: FolderKanban, label: 'Projets', view: 'projects', color: 'blue', shortcut: '⌘P' },
  { icon: CalendarDays, label: 'Ma Journée', view: 'myday', color: 'violet', shortcut: '⌘J' },
  { icon: Library, label: 'Bibliothèque', view: 'library', color: 'indigo', shortcut: '⌘L' },
  { icon: Heart, label: 'Santé', view: 'health', color: 'pink', shortcut: '' },
  { icon: GraduationCap, label: 'Apprentissage', view: 'learning', color: 'purple', shortcut: '' },
  { icon: Settings, label: 'Paramètres', view: 'settings', color: 'zinc', shortcut: '⌘,' },
]

// Apps prioritaires pour la barre mobile (5 max)
const mobileApps = [
  { icon: Home, label: 'Hub', view: 'hub', color: 'indigo' },
  { icon: CheckSquare, label: 'Tâches', view: 'tasks', color: 'emerald' },
  { icon: FolderKanban, label: 'Projets', view: 'projects', color: 'blue' },
  { icon: CalendarDays, label: 'Journée', view: 'myday', color: 'violet' },
  { icon: Library, label: 'Livres', view: 'library', color: 'indigo' },
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
  zinc: 'text-zinc-400 group-hover:text-zinc-300',
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
  zinc: 'bg-zinc-500/20 border-zinc-500/40 shadow-zinc-500/20',
}

export function AppBar() {
  const { setView, currentView } = useStore()
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  
  return (
    <>
      {/* Desktop Dock - Hidden on mobile */}
      <div className="hidden md:flex items-center justify-center">
        <div className="inline-flex gap-1.5 px-3 py-2 
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
                <div className={`w-10 h-10 rounded-xl 
                                flex items-center justify-center
                                transition-colors duration-200
                                relative
                                ${isActive 
                                  ? `${activeColorClasses[app.color as keyof typeof activeColorClasses]} border scale-105 shadow-lg` 
                                  : 'bg-white/5 border border-transparent group-hover:bg-white/10 group-hover:scale-110 group-hover:border-white/10'
                                }`}>
                  <Icon 
                    className={`w-5 h-5 transition-colors ${colorClasses[app.color as keyof typeof colorClasses]}`} 
                    strokeWidth={isActive ? 2 : 1.5} 
                  />
                  <div className={`absolute inset-0 blur-lg transition-opacity ${colorClasses[app.color as keyof typeof colorClasses]} ${isActive ? 'opacity-40' : 'opacity-0 group-hover:opacity-30'}`} />
                </div>
                
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
                    app.color === 'zinc' ? 'bg-zinc-400' :
                    'bg-teal-400'
                  }`} />
                )}
                
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

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 mobile-nav">
        <div className="flex items-center justify-around px-2 py-2">
          {mobileApps.map((app) => {
            const Icon = app.icon
            const isActive = currentView === app.view
            
            return (
              <button
                key={app.view}
                onClick={() => setView(app.view as any)}
                className="flex flex-col items-center justify-center min-w-[64px] py-1"
                aria-current={isActive ? 'page' : undefined}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200
                  ${isActive 
                    ? `${activeColorClasses[app.color as keyof typeof activeColorClasses]} border shadow-lg scale-105` 
                    : 'bg-transparent'
                  }`}>
                  <Icon 
                    className={`w-6 h-6 transition-colors ${
                      isActive 
                        ? colorClasses[app.color as keyof typeof colorClasses]
                        : 'text-zinc-500'
                    }`} 
                    strokeWidth={isActive ? 2 : 1.5} 
                  />
                </div>
                <span className={`text-[10px] mt-1 transition-colors ${
                  isActive ? 'text-zinc-200' : 'text-zinc-600'
                }`}>
                  {app.label}
                </span>
              </button>
            )
          })}
          
          {/* More button */}
          <button
            onClick={() => setShowMoreMenu(true)}
            className="flex flex-col items-center justify-center min-w-[64px] py-1"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center">
              <MoreHorizontal className="w-6 h-6 text-zinc-500" strokeWidth={1.5} />
            </div>
            <span className="text-[10px] mt-1 text-zinc-600">Plus</span>
          </button>
        </div>
      </div>

      {/* Mobile More Menu - Full screen overlay */}
      {showMoreMenu && (
        <div className="md:hidden fixed inset-0 z-[60] bg-mars-bg/98 backdrop-blur-xl animate-fade-in">
          <div className="safe-area-inset h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-lg font-medium text-zinc-200">Applications</h2>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            
            {/* Apps Grid */}
            <div className="flex-1 overflow-y-auto scroll-touch p-6">
              <div className="grid grid-cols-4 gap-4">
                {/* Hub first */}
                <button
                  onClick={() => {
                    setView('hub')
                    setShowMoreMenu(false)
                  }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all
                    ${currentView === 'hub' 
                      ? 'bg-indigo-500/20 border border-indigo-500/40' 
                      : 'bg-white/5 border border-white/10'
                    }`}>
                    <Home className={`w-7 h-7 ${currentView === 'hub' ? 'text-indigo-400' : 'text-zinc-400'}`} />
                  </div>
                  <span className="text-xs text-zinc-400">Hub</span>
                </button>
                
                {apps.map((app) => {
                  const Icon = app.icon
                  const isActive = currentView === app.view
                  
                  return (
                    <button
                      key={app.view}
                      onClick={() => {
                        setView(app.view as any)
                        setShowMoreMenu(false)
                      }}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all
                        ${isActive 
                          ? `${activeColorClasses[app.color as keyof typeof activeColorClasses]} border` 
                          : 'bg-white/5 border border-white/10'
                        }`}>
                        <Icon className={`w-7 h-7 ${
                          isActive 
                            ? colorClasses[app.color as keyof typeof colorClasses]
                            : 'text-zinc-400'
                        }`} />
                      </div>
                      <span className="text-xs text-zinc-400">{app.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

