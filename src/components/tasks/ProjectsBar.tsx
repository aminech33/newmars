import { Plus, FolderKanban } from 'lucide-react'
import { Project, PROJECT_COLORS, PROJECT_ICONS } from '../../store/useStore'

interface ProjectsBarProps {
  projects: Project[]
  selectedProjectId: string | 'all'
  onSelectProject: (id: string | 'all') => void
  onDeleteProject: (id: string) => void
  projectStats: Record<string, { total: number; completed: number }>
  showNewProject: boolean
  onToggleNewProject: () => void
  newProjectName: string
  onNewProjectNameChange: (name: string) => void
  newProjectColor: string
  onNewProjectColorChange: (color: string) => void
  newProjectIcon: string
  onNewProjectIconChange: (icon: string) => void
  onCreateProject: () => void
}

export function ProjectsBar({
  projects,
  selectedProjectId,
  onSelectProject,
  onDeleteProject,
  projectStats,
  showNewProject,
  onToggleNewProject,
  newProjectName,
  onNewProjectNameChange,
  newProjectColor,
  onNewProjectColorChange,
  newProjectIcon,
  onNewProjectIconChange,
  onCreateProject
}: ProjectsBarProps) {
  const selectedProject = projects.find(p => p.id === selectedProjectId)
  const stats = selectedProjectId !== 'all' ? projectStats[selectedProjectId] : null
  const progress = stats && stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  return (
    <div className="mb-6 p-4 bg-zinc-900/30 backdrop-blur-xl rounded-2xl"
      style={{ border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-zinc-600" />
          <span className="text-sm font-medium text-zinc-400">Projets</span>
        </div>
        <button
          onClick={onToggleNewProject}
          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Nouveau projet
        </button>
      </div>
      
      {/* New Project Form */}
      {showNewProject && (
        <div className="mb-4 p-3 bg-zinc-800/50 rounded-xl animate-slide-up">
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => onNewProjectNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCreateProject()
              if (e.key === 'Escape') onToggleNewProject()
            }}
            placeholder="Nom du projet..."
            className="w-full bg-transparent text-zinc-300 placeholder:text-zinc-700 focus:outline-none text-sm mb-3"
            autoFocus
          />
          
          {/* Color picker */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-zinc-600">Couleur:</span>
            {PROJECT_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => onNewProjectColorChange(color)}
                className={`w-5 h-5 rounded-full transition-all ${
                  newProjectColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          
          {/* Icon picker */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs text-zinc-600">Icône:</span>
            {PROJECT_ICONS.map((icon) => (
              <button
                key={icon}
                onClick={() => onNewProjectIconChange(icon)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  newProjectIcon === icon ? 'bg-zinc-700' : 'hover:bg-zinc-800'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onCreateProject}
              className="flex-1 px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg text-sm hover:bg-indigo-500/30 transition-colors"
            >
              Créer
            </button>
            <button
              onClick={onToggleNewProject}
              className="px-3 py-1.5 text-zinc-500 rounded-lg text-sm hover:bg-zinc-800/50 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => onSelectProject('all')}
          className={`
            px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-300
            ${selectedProjectId === 'all'
              ? 'bg-indigo-500/20 text-indigo-400 shadow-[0_2px_8px_rgba(91,127,255,0.2)]'
              : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/30'
            }
          `}
          style={selectedProjectId === 'all' ? { border: '1px solid rgba(91,127,255,0.2)' } : {}}
        >
          Tous
        </button>
        
        {projects.map((project) => {
          const stats = projectStats[project.id]
          return (
            <div key={project.id} className="group relative">
              <button
                onClick={() => onSelectProject(project.id)}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-300
                  ${selectedProjectId === project.id
                    ? 'bg-zinc-800/50 shadow-[0_2px_8px_rgba(0,0,0,0.2)]'
                    : 'hover:bg-zinc-800/30'
                  }
                `}
                style={{
                  border: selectedProjectId === project.id ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  color: selectedProjectId === project.id ? project.color : '#71717a'
                }}
              >
                <span>{project.icon}</span>
                <span>{project.name}</span>
                {stats && (
                  <span className="text-zinc-600">
                    ({stats.completed}/{stats.total})
                  </span>
                )}
              </button>
              
              {/* Delete button on hover */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteProject(project.id)
                }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px]"
                title="Supprimer le projet"
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
      
      {selectedProjectId !== 'all' && selectedProject && stats && (
        <div className="mt-3 pt-3 border-t border-zinc-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-xs text-zinc-600">
                Progression: <span className="text-zinc-400 font-medium">{progress}%</span>
              </div>
              <div className="text-xs text-zinc-600">
                Tâches: <span className="text-zinc-400 font-medium">{stats.completed}/{stats.total}</span>
              </div>
              {/* Progress bar */}
              <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-500"
                  style={{ 
                    width: `${progress}%`,
                    backgroundColor: selectedProject.color
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

