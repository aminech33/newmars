import { useMemo } from 'react'
import { Task, Project } from '../store/useStore'

export function useProjectManagement(tasks: Task[], projects: Project[]) {
  const projectStats = useMemo(() => {
    const stats: Record<string, { total: number; completed: number }> = {}
    
    projects.forEach(project => {
      const projectTasks = tasks.filter(t => t.projectId === project.id)
      stats[project.id] = {
        total: projectTasks.length,
        completed: projectTasks.filter(t => t.completed).length
      }
    })
    
    return stats
  }, [tasks, projects])

  const projectsInUse = useMemo(() => {
    const projectIds = new Set(tasks.map(t => t.projectId).filter(Boolean))
    return projects.filter(p => projectIds.has(p.id))
  }, [tasks, projects])

  const getProjectById = (id: string) => {
    return projects.find(p => p.id === id)
  }

  return {
    projectStats,
    projectsInUse,
    getProjectById
  }
}

