import { useState, useMemo } from 'react'
import { ArrowLeft, Plus, Briefcase, TrendingUp, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { ProjectCard } from './ProjectCard'
import { ProjectModal } from './ProjectModal'
import { ProjectDetailModal } from './ProjectDetailModal'
import { Project } from '../../types/project'
import { calculateGlobalProjectStats } from '../../utils/projectUtils'

export const ProjectsPage = () => {
  const { setView, projects, tasks } = useStore()
  const [activeTab, setActiveTab] = useState<'active' | 'all' | 'completed'>('active')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // Stats globales
  const globalStats = useMemo(() => calculateGlobalProjectStats(projects, tasks), [projects, tasks])

  // Filtrer les projets selon l'onglet
  const filteredProjects = useMemo(() => {
    switch (activeTab) {
      case 'active':
        return projects.filter(p => p.status === 'active')
      case 'completed':
        return projects.filter(p => p.status === 'completed')
      default:
        return projects
    }
  }, [projects, activeTab])

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project)
    setIsDetailModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mars-950 via-mars-900 to-mars-950 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <button
          onClick={() => setView('hub')}
          className="flex items-center gap-2 text-mars-400 hover:text-mars-300 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Retour au Hub</span>
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
              <Briefcase className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Projets</h1>
              <p className="text-mars-400">Organise tes projets et atteins tes objectifs</p>
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedProject(null)
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-2xl font-medium hover:shadow-lg hover:scale-105 transition-all"
          >
            <Plus className="w-5 h-5" />
            Nouveau projet
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-mars-900/50 backdrop-blur-sm rounded-2xl p-4 border border-mars-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-mars-400 text-sm">Projets actifs</p>
                <p className="text-2xl font-bold text-white">{globalStats.activeCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-mars-900/50 backdrop-blur-sm rounded-2xl p-4 border border-mars-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-mars-400 text-sm">Tâches complétées</p>
                <p className="text-2xl font-bold text-white">{globalStats.completedTasks}/{globalStats.totalTasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-mars-900/50 backdrop-blur-sm rounded-2xl p-4 border border-mars-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-mars-400 text-sm">Progression moyenne</p>
                <p className="text-2xl font-bold text-white">{globalStats.averageProgress}%</p>
              </div>
            </div>
          </div>

          <div className="bg-mars-900/50 backdrop-blur-sm rounded-2xl p-4 border border-mars-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-mars-400 text-sm">Projets à risque</p>
                <p className="text-2xl font-bold text-white">{globalStats.atRiskCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-mars-900/50 backdrop-blur-sm rounded-2xl p-1.5 border border-mars-800/50 mb-6 w-fit">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'active'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : 'text-mars-400 hover:text-white'
            }`}
          >
            Actifs ({projects.filter(p => p.status === 'active').length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : 'text-mars-400 hover:text-white'
            }`}
          >
            Tous ({projects.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'completed'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : 'text-mars-400 hover:text-white'
            }`}
          >
            Terminés ({projects.filter(p => p.status === 'completed').length})
          </button>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="bg-mars-900/50 backdrop-blur-sm rounded-3xl p-12 border border-mars-800/50 text-center">
            <Briefcase className="w-16 h-16 text-mars-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {activeTab === 'active' && 'Aucun projet actif'}
              {activeTab === 'completed' && 'Aucun projet terminé'}
              {activeTab === 'all' && 'Aucun projet'}
            </h3>
            <p className="text-mars-400 mb-6">
              {activeTab === 'active' && 'Commence un nouveau projet pour organiser tes tâches'}
              {activeTab === 'completed' && 'Les projets terminés apparaîtront ici'}
              {activeTab === 'all' && 'Crée ton premier projet pour commencer'}
            </p>
            <button
              onClick={() => {
                setSelectedProject(null)
                setIsModalOpen(true)
              }}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-2xl font-medium hover:shadow-lg hover:scale-105 transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Créer un projet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => handleProjectClick(project)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {isModalOpen && (
        <ProjectModal
          project={selectedProject}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedProject(null)
          }}
        />
      )}

      {isDetailModalOpen && selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => {
            setIsDetailModalOpen(false)
            setSelectedProject(null)
          }}
          onEdit={() => {
            setIsDetailModalOpen(false)
            setIsModalOpen(true)
          }}
        />
      )}
    </div>
  )
}


