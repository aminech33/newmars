import { useState } from 'react'
import { ArrowLeft, Plus, FolderKanban, Trash2, Edit2, TrendingUp, Link, ListPlus } from 'lucide-react'
import { useStore, Project, PROJECT_COLORS, PROJECT_ICONS } from '../../store/useStore'
import { AddProjectModal } from './AddProjectModal'
import { CreateProjectWithTasksPage } from './CreateProjectWithTasksPage'
import { AssignTasksToProjectModal } from './AssignTasksToProjectModal'
import { ConfirmDialog } from '../ui/ConfirmDialog'

interface ProjectsManagementPageProps {
  onBack: () => void
}

export function ProjectsManagementPage({ onBack }: ProjectsManagementPageProps) {
  const { projects, tasks, addProject, updateProject, deleteProject, addTask } = useStore()
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCreateWithTasks, setShowCreateWithTasks] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [assigningProject, setAssigningProject] = useState<Project | null>(null)
  
  // Form states
  const [projectName, setProjectName] = useState('')
  const [projectColor, setProjectColor] = useState(PROJECT_COLORS[0])
  const [projectIcon, setProjectIcon] = useState(PROJECT_ICONS[0])

  // Calculate stats for each project
  const getProjectStats = (projectId: string) => {
    const projectTasks = tasks.filter(t => t.projectId === projectId)
    const completed = projectTasks.filter(t => t.completed).length
    const total = projectTasks.length
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0
    return { completed, total, progress }
  }

  const handleOpenAddModal = () => {
    setEditingProject(null)
    setProjectName('')
    setProjectColor(PROJECT_COLORS[0])
    setProjectIcon(PROJECT_ICONS[0])
    setShowAddModal(true)
  }

  const handleOpenEditModal = (project: Project) => {
    setEditingProject(project)
    setProjectName(project.name)
    setProjectColor(project.color)
    setProjectIcon(project.icon)
    setShowAddModal(true)
  }

  const handleCreateOrUpdate = () => {
    if (!projectName.trim()) return

    if (editingProject) {
      // Update
      updateProject(editingProject.id, {
        name: projectName,
        color: projectColor,
        icon: projectIcon
      })
    } else {
      // Create
      addProject({
        name: projectName,
        color: projectColor,
        icon: projectIcon
      })
    }

    setShowAddModal(false)
    setProjectName('')
    setProjectColor(PROJECT_COLORS[0])
    setProjectIcon(PROJECT_ICONS[0])
  }

  const handleDelete = () => {
    if (confirmDelete) {
      deleteProject(confirmDelete)
      setConfirmDelete(null)
    }
  }

  const handleCreateProjectWithTasks = (projectData: {
    name: string
    color: string
    icon: string
    tasks: Array<{
      title: string
      dueDate?: string
      estimatedTime?: number
      priority: any
      category: any
    }>
  }) => {
    // Create project first
    const projectId = Math.random().toString(36).substring(2, 9)
    addProject({
      name: projectData.name,
      color: projectData.color,
      icon: projectData.icon
    })
    
    // Then create all tasks with the project ID
    projectData.tasks.forEach((task) => {
      addTask({
        title: task.title,
        category: task.category,
        priority: task.priority,
        estimatedTime: task.estimatedTime,
        dueDate: task.dueDate,
        completed: false,
        status: 'todo',
        projectId: projectId
      })
    })
    
    setShowCreateWithTasks(false)
  }

  return (
    <div className="min-h-screen w-full bg-mars-bg overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-zinc-900/50 rounded-xl transition-colors"
              aria-label="Retour aux tâches"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
                <FolderKanban className="w-7 h-7 text-indigo-400" />
                Gestion des Projets
              </h1>
              <p className="text-sm text-zinc-600 mt-1">
                {projects.length} projet{projects.length > 1 ? 's' : ''} · {tasks.length} tâche{tasks.length > 1 ? 's' : ''} au total
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 text-zinc-400 rounded-xl hover:bg-zinc-700/50 border border-white/10 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Projet simple
            </button>
            <button
              onClick={() => setShowCreateWithTasks(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-xl hover:bg-indigo-500/30 transition-colors"
            >
              <ListPlus className="w-5 h-5" />
              Projet + Tâches
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FolderKanban className="w-16 h-16 text-zinc-700 mb-4" />
            <h3 className="text-xl font-semibold text-zinc-400 mb-2">Aucun projet</h3>
            <p className="text-zinc-600 mb-6">Créez votre premier projet pour organiser vos tâches</p>
            <div className="flex gap-3">
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 px-6 py-3 bg-zinc-800/50 text-zinc-400 rounded-xl hover:bg-zinc-700/50 border border-white/10 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Projet simple
              </button>
              <button
                onClick={() => setShowCreateWithTasks(true)}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-500/20 text-indigo-400 rounded-xl hover:bg-indigo-500/30 transition-colors"
              >
                <ListPlus className="w-5 h-5" />
                Projet + Tâches
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const stats = getProjectStats(project.id)
              return (
                <div
                  key={project.id}
                  className="group relative p-6 bg-zinc-900/30 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-white/20 transition-colors"
                >
                  {/* Project Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: `${project.color}20`, border: `2px solid ${project.color}40` }}
                      >
                        {project.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                        <p className="text-xs text-zinc-600">
                          {stats.total} tâche{stats.total > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setAssigningProject(project)}
                        className="p-2 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                        title="Assigner des tâches"
                      >
                        <Link className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(project)}
                        className="p-2 text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(project.id)}
                        className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-zinc-500">Progression</span>
                      <span className="font-bold text-white">{stats.progress}%</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-colors duration-500"
                        style={{
                          width: `${stats.progress}%`,
                          backgroundColor: project.color
                        }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4" style={{ color: project.color }} />
                      <span className="text-zinc-400">
                        {stats.completed}/{stats.total} complétées
                      </span>
                    </div>
                  </div>

                  {/* Assign Tasks Button */}
                  <button
                    onClick={() => setAssigningProject(project)}
                    className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors text-sm font-medium"
                  >
                    <Link className="w-4 h-4" />
                    Assigner des tâches
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Info card */}
        {projects.length > 0 && (
          <div className="mt-8 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
            <p className="text-sm text-indigo-300">
              💡 <strong>Astuce :</strong> Organisez vos tâches par projets pour mieux suivre votre progression. 
              Les projets apparaissent dans la barre de filtres de la page Tâches.
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Project Modal */}
      <AddProjectModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setEditingProject(null)
        }}
        projectName={projectName}
        onNameChange={setProjectName}
        projectColor={projectColor}
        onColorChange={setProjectColor}
        projectIcon={projectIcon}
        onIconChange={setProjectIcon}
        onCreate={handleCreateOrUpdate}
      />

      {/* Create Project With Tasks Page */}
      <CreateProjectWithTasksPage
        isOpen={showCreateWithTasks}
        onClose={() => setShowCreateWithTasks(false)}
        onCreate={handleCreateProjectWithTasks}
      />

      {/* Assign Tasks Modal */}
      {assigningProject && (
        <AssignTasksToProjectModal
          isOpen={!!assigningProject}
          onClose={() => setAssigningProject(null)}
          project={assigningProject}
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Supprimer le projet ?"
        message="Les tâches associées ne seront pas supprimées, mais elles ne seront plus liées à ce projet."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="warning"
      />
    </div>
  )
}

