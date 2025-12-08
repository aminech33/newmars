import { memo } from 'react'
import { Settings, Trash2, Archive, BarChart3, BookOpen, Clock, Flame, ChevronLeft, Timer, PanelLeftClose, PanelLeft } from 'lucide-react'
import { Course, COURSE_LEVELS } from '../../types/learning'
import { Tooltip } from '../ui/Tooltip'
import { useStore } from '../../store/useStore'

interface CourseHeaderProps {
  course: Course
  onBack: () => void
  onSettings: () => void
  onArchive: () => void
  onDelete: () => void
  onToggleSidebar: () => void
  sidebarCollapsed: boolean
}

const COLOR_CLASSES: Record<string, string> = {
  indigo: 'bg-indigo-500/20 text-indigo-400',
  emerald: 'bg-emerald-500/20 text-emerald-400',
  rose: 'bg-rose-500/20 text-rose-400',
  amber: 'bg-amber-500/20 text-amber-400',
  cyan: 'bg-cyan-500/20 text-cyan-400',
  violet: 'bg-violet-500/20 text-violet-400',
  orange: 'bg-orange-500/20 text-orange-400',
  teal: 'bg-teal-500/20 text-teal-400'
}

export const CourseHeader = memo(function CourseHeader({
  course,
  onBack,
  onSettings,
  onArchive,
  onDelete,
  onToggleSidebar,
  sidebarCollapsed
}: CourseHeaderProps) {
  const { setView, projects, addToast } = useStore()
  const levelInfo = COURSE_LEVELS.find(l => l.value === course.level)
  const linkedProject = projects.find(p => p.id === course.linkedProjectId)
  
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h${mins}` : `${hours}h`
  }

  const lastActiveText = (): string => {
    const now = Date.now()
    const diff = now - course.lastActiveAt
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "À l'instant"
    if (minutes < 60) return `Il y a ${minutes}min`
    if (hours < 24) return `Il y a ${hours}h`
    if (days === 1) return 'Hier'
    return `Il y a ${days}j`
  }

  const startPomodoroForCourse = () => {
    if (!linkedProject) {
      addToast('⚠️ Aucun projet lié à ce cours', 'warning')
      return
    }
    
    // Naviguer vers Pomodoro avec le projet pré-sélectionné
    // Le store devrait sauvegarder ces infos pour la page Pomodoro
    localStorage.setItem('pomodoro-preselect', JSON.stringify({
      projectId: course.linkedProjectId,
      projectName: linkedProject.name,
      taskTitle: `Étudier ${course.name}`,
      courseId: course.id,
      courseName: course.name
    }))
    
    addToast(`🍅 Pomodoro prêt pour "${course.name}"`, 'success')
    setView('pomodoro')
  }

  return (
    <header className="border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-10">
      <div className="px-4 lg:px-6 py-1.5">
        <div className="flex items-center justify-between">
          {/* Left: Back + Course Info */}
          <div className="flex items-center gap-1.5">
            {/* Toggle Sidebar (desktop) */}
            <Tooltip content={sidebarCollapsed ? 'Ouvrir la sidebar' : 'Réduire la sidebar'}>
              <button
                onClick={onToggleSidebar}
                className="hidden lg:flex p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-xl transition-[background-color] duration-200"
                aria-label={sidebarCollapsed ? 'Ouvrir la sidebar' : 'Réduire la sidebar'}
              >
                {sidebarCollapsed ? (
                  <PanelLeft className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <PanelLeftClose className="w-5 h-5" aria-hidden="true" />
                )}
              </button>
            </Tooltip>

            {/* Toggle Sidebar (mobile) / Back button */}
            <button
              onClick={sidebarCollapsed ? onToggleSidebar : onBack}
              className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-xl transition-[background-color] duration-200 lg:hidden"
              aria-label={sidebarCollapsed ? 'Ouvrir la sidebar' : 'Retour'}
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>

            {/* Course Icon */}
            <div className={`p-1.5 rounded-lg ${COLOR_CLASSES[course.color] || COLOR_CLASSES.indigo}`}>
              <span className="text-base">{course.icon}</span>
            </div>

            {/* Course Info */}
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-semibold text-zinc-100">{course.name}</h1>
                {levelInfo && (
                  <span className="text-xs px-1.5 py-0.5 bg-zinc-800 rounded-full text-zinc-500">
                    {levelInfo.emoji} {levelInfo.label}
                  </span>
                )}
              </div>
              {course.description && (
                <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{course.description}</p>
              )}
            </div>
          </div>

          {/* Right: Stats + Actions */}
          <div className="flex items-center gap-2">
            {/* Stats (hidden on mobile) */}
            <div className="hidden md:flex items-center gap-2">
              <Tooltip content="Temps total d'étude">
                <div className="flex items-center gap-1 text-zinc-500">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="text-xs">{formatDuration(course.totalTimeSpent)}</span>
                </div>
              </Tooltip>

              <Tooltip content="Messages échangés">
                <div className="flex items-center gap-1 text-zinc-500">
                  <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="text-xs">{course.messagesCount}</span>
                </div>
              </Tooltip>

              {course.streak > 0 && (
                <Tooltip content={`${course.streak} jours consécutifs`}>
                  <div className="flex items-center gap-1 text-amber-400">
                    <Flame className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="text-xs font-medium">{course.streak}</span>
                  </div>
                </Tooltip>
              )}
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-4 bg-zinc-800" />

            {/* Actions */}
            <div className="flex items-center gap-0.5">
              {/* Pomodoro Button - NEW */}
              <Tooltip content={`Étudier ${course.name} (25min)`}>
                <button
                  onClick={startPomodoroForCourse}
                  className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-[background-color,color] duration-200 group"
                  aria-label="Démarrer un Pomodoro"
                >
                  <Timer className="w-3.5 h-3.5 group-hover:animate-pulse" aria-hidden="true" />
                </button>
              </Tooltip>

              <Tooltip content="Statistiques">
                <button
                  className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-[background-color,color] duration-200"
                  aria-label="Statistiques du cours"
                >
                  <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </Tooltip>

              <Tooltip content="Paramètres">
                <button
                  onClick={onSettings}
                  className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-[background-color,color] duration-200"
                  aria-label="Paramètres du cours"
                >
                  <Settings className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </Tooltip>

              <Tooltip content="Archiver">
                <button
                  onClick={onArchive}
                  className="p-1.5 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-[background-color,color] duration-200"
                  aria-label="Archiver le cours"
                >
                  <Archive className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </Tooltip>

              <Tooltip content="Supprimer">
                <button
                  onClick={onDelete}
                  className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-[background-color,color] duration-200"
                  aria-label="Supprimer le cours"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {course.progress > 0 && (
          <div className="mt-1.5">
            <div className="flex items-center justify-between text-[10px] text-zinc-600 mb-0.5">
              <span>Progression</span>
              <span>{course.progress}%</span>
            </div>
            <div 
              className="h-1 bg-zinc-800 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={course.progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progression du cours"
            >
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-[width] duration-500"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Last Active (mobile) */}
        <div className="mt-2 text-xs text-zinc-600 md:hidden">
          {lastActiveText()}
        </div>
      </div>
    </header>
  )
})

