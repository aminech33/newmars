/**
 * 📁 ProjectsManagementPage - Gestion des projets en colonnes (comme Tâches)
 */

import { useState, useMemo, useEffect } from 'react'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import { useStore, Project, PROJECT_COLORS, PROJECT_ICONS, ProjectStatus } from '../../store/useStore'
import { AddProjectModal } from './AddProjectModal'
import { CreateProjectWithTasksPage } from './CreateProjectWithTasksPage'
import { AssignTasksToProjectModal } from './AssignTasksToProjectModal'
import { ProjectDetailsPage } from './ProjectDetailsPage'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { UndoToast } from '../ui/UndoToast'
import { ProjectsHeader } from './ProjectsHeader'
import { ProjectColumn } from './ProjectColumn'
import { PROJECT_COLUMNS, ARCHIVED_COLUMN, categorizeProject, sortProjectsInColumn } from './projectUtils'
import { Loader2 } from 'lucide-react'

interface ProjectsManagementPageProps {
  onBack: () => void
}

export function ProjectsManagementPage({ onBack }: ProjectsManagementPageProps) {
  const { projects, tasks, addProject, updateProject, deleteProject, addTask, addToast } = useStore()
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCreateWithTasks, setShowCreateWithTasks] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [assigningProject, setAssigningProject] = useState<Project | null>(null)
  const [viewingProject, setViewingProject] = useState<Project | null>(null)
  
  // Form states
  const [projectName, setProjectName] = useState('')
  const [projectColor, setProjectColor] = useState(PROJECT_COLORS[0])
  const [projectIcon, setProjectIcon] = useState(PROJECT_ICONS[0])
  
  // Undo system
  const [deletedProject, setDeletedProject] = useState<{ project: Project; tasks: typeof tasks } | null>(null)
  const [showUndo, setShowUndo] = useState(false)
  
  // Search & Filters - avec persistance
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('projects-search-query') || ''
    }
    return ''
  })
  const [showFilters, setShowFilters] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('projects-show-filters') === 'true'
    }
    return false
  })
  
  // Loading states
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
  // Toggle pour afficher les archivés
  const [showArchived, setShowArchived] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('projects-show-archived') === 'true'
    }
    return false
  })
  
  // Persist archived toggle
  useEffect(() => {
    localStorage.setItem('projects-show-archived', showArchived.toString())
  }, [showArchived])
  
  // Persist search query
  useEffect(() => {
    localStorage.setItem('projects-search-query', searchQuery)
  }, [searchQuery])
  
  // Persist filters state
  useEffect(() => {
    localStorage.setItem('projects-show-filters', showFilters.toString())
  }, [showFilters])

  // ═══════════════════════════════════════════════════════════════
  // ORGANISATION DES PROJETS PAR COLONNE (3 colonnes + archivés optionnel)
  // ═══════════════════════════════════════════════════════════════
  const projectsByColumn = useMemo(() => {
    const result: Record<ProjectStatus, Project[]> = {
      todo: [],
      inProgress: [],
      completed: [],
      archived: []
    }
    
    // Filtrer par recherche
    let filteredProjects = projects
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filteredProjects = projects.filter(p => 
        p.name.toLowerCase().includes(query)
      )
    }
    
    filteredProjects.forEach(project => {
      const status = categorizeProject(project, tasks)
      result[status].push(project)
    })
    
    // Trier les projets dans chaque colonne
    Object.keys(result).forEach(key => {
      result[key as ProjectStatus] = sortProjectsInColumn(result[key as ProjectStatus], tasks)
    })
    
    return result
  }, [projects, tasks, searchQuery])

  // ═══════════════════════════════════════════════════════════════
  // DRAG & DROP HANDLER
  // ═══════════════════════════════════════════════════════════════
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result
    
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return
    }
    
    const newStatus = destination.droppableId as ProjectStatus
    
    // Mettre à jour le statut du projet
    updateProject(draggableId, { 
      status: newStatus,
      archived: newStatus === 'archived'
    })
    
    addToast(`Projet déplacé vers ${PROJECT_COLUMNS.find(c => c.id === newStatus)?.label}`, 'success')
  }

  // ═══════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════
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

    setIsCreating(true)
    
    try {
      if (editingProject) {
        // Update
        updateProject(editingProject.id, {
          name: projectName,
          color: projectColor,
          icon: projectIcon
        })
        addToast('Projet modifié', 'success')
      } else {
        // Create
        addProject({
          name: projectName,
          color: projectColor,
          icon: projectIcon,
          status: 'todo' // Nouveau projet = à faire
        })
        addToast('Projet créé', 'success')
      }

      setShowAddModal(false)
      setProjectName('')
      setProjectColor(PROJECT_COLORS[0])
      setProjectIcon(PROJECT_ICONS[0])
    } catch (error) {
      addToast('Erreur lors de la sauvegarde', 'error')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = () => {
    if (confirmDelete) {
      setIsDeleting(true)
      
      try {
        const project = projects.find(p => p.id === confirmDelete)
        const projectTasks = tasks.filter(t => t.projectId === confirmDelete)
        
        if (project) {
          setDeletedProject({ project, tasks: projectTasks })
          deleteProject(confirmDelete)
          setShowUndo(true)
          setTimeout(() => {
            setShowUndo(false)
            setDeletedProject(null)
          }, 5000)
        }
        
        setConfirmDelete(null)
      } catch (error) {
        addToast('Erreur lors de la suppression', 'error')
      } finally {
        setIsDeleting(false)
      }
    }
  }
  
  const handleUndoDelete = () => {
    if (deletedProject) {
      addProject(deletedProject.project)
      deletedProject.tasks.forEach(task => {
        addTask(task)
      })
      setShowUndo(false)
      setDeletedProject(null)
      addToast('Projet restauré', 'success')
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
    // Create project first and get the generated ID
    const newProjectId = addProject({
      name: projectData.name,
      color: projectData.color,
      icon: projectData.icon,
      status: 'todo'
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
        projectId: newProjectId
      })
    })
    
    setShowCreateWithTasks(false)
  }

  return (
    <>
      {viewingProject ? (
        <ProjectDetailsPage
          project={viewingProject}
          onBack={() => setViewingProject(null)}
        />
      ) : (
        <div className="h-screen w-full flex flex-col overflow-hidden bg-zinc-950">
          {/* Header */}
          <ProjectsHeader
            totalProjects={projects.length}
            totalTasks={tasks.length}
            onAddSimple={handleOpenAddModal}
            onAddWithTasks={() => setShowCreateWithTasks(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            showArchived={showArchived}
            onToggleArchived={() => setShowArchived(!showArchived)}
            archivedCount={projectsByColumn.archived.length}
          />
          
          {/* Columns */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex-1 flex overflow-hidden relative">
              {/* 3 colonnes principales */}
              {PROJECT_COLUMNS.map((config) => (
                <ProjectColumn
                  key={config.id}
                  config={config}
                  projects={projectsByColumn[config.id]}
                  tasks={tasks}
                  onProjectClick={setViewingProject}
                  onProjectEdit={handleOpenEditModal}
                  onProjectDelete={setConfirmDelete}
                  onAssignTasks={setAssigningProject}
                />
              ))}
              
              {/* Colonne archivés (conditionnelle) */}
              {showArchived && (
                <ProjectColumn
                  key={ARCHIVED_COLUMN.id}
                  config={ARCHIVED_COLUMN}
                  projects={projectsByColumn.archived}
                  tasks={tasks}
                  onProjectClick={setViewingProject}
                  onProjectEdit={handleOpenEditModal}
                  onProjectDelete={setConfirmDelete}
                  onAssignTasks={setAssigningProject}
                />
              )}
              
              {/* Loading overlay */}
              {(isDeleting || isCreating) && (
                <div className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-zinc-400">
                      {isDeleting ? 'Suppression...' : 'Création...'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </DragDropContext>

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

          {/* Undo Toast */}
          {deletedProject && (
            <UndoToast
              message={`Projet "${deletedProject.project.name}" supprimé`}
              onUndo={handleUndoDelete}
              isVisible={showUndo}
            />
          )}
        </div>
      )}
    </>
  )
}
