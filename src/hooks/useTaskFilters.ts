import { useMemo } from 'react'
import { Task, TaskCategory } from '../store/useStore'
import { TaskFilterState } from '../components/tasks/TaskFilters'

export type QuickFilter = 'all' | 'today' | 'week' | 'overdue'

interface UseTaskFiltersProps {
  tasks: Task[]
  selectedCategory: TaskCategory | 'all'
  selectedProjectId: string | 'all'
  searchQuery: string
  quickFilter: QuickFilter
  advancedFilters: TaskFilterState
}

export function useTaskFilters({
  tasks,
  selectedCategory,
  selectedProjectId,
  searchQuery,
  quickFilter,
  advancedFilters
}: UseTaskFiltersProps) {
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Quick filters
      if (quickFilter === 'today') {
        const today = new Date().setHours(0, 0, 0, 0)
        const taskDate = new Date(task.createdAt).setHours(0, 0, 0, 0)
        if (taskDate !== today) return false
      }
      if (quickFilter === 'week') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        if (new Date(task.createdAt) < weekAgo) return false
      }
      if (quickFilter === 'overdue') {
        if (!task.dueDate || task.completed) return false
        if (new Date(task.dueDate) >= new Date()) return false
      }

      // Project filter
      if (selectedProjectId !== 'all' && task.projectId !== selectedProjectId) return false
      
      // Basic category filter
      if (selectedCategory !== 'all' && task.category !== selectedCategory) return false
      
      // Search filter (debounced)
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      
      // Advanced filters
      if (advancedFilters.categories.length > 0 && !advancedFilters.categories.includes(task.category)) return false
      if (advancedFilters.priorities.length > 0 && !advancedFilters.priorities.includes(task.priority)) return false
      if (advancedFilters.statuses.length > 0 && !advancedFilters.statuses.includes(task.status)) return false
      if (!advancedFilters.showCompleted && task.completed) return false
      if (advancedFilters.hasSubtasks === true && (!task.subtasks || task.subtasks.length === 0)) return false
      if (advancedFilters.hasDueDate === true && !task.dueDate) return false
      
      return true
    })
  }, [tasks, selectedCategory, selectedProjectId, searchQuery, advancedFilters, quickFilter])

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (selectedCategory !== 'all') count++
    if (selectedProjectId !== 'all') count++
    if (searchQuery) count++
    if (quickFilter !== 'all') count++
    if (advancedFilters.categories.length > 0) count++
    if (advancedFilters.priorities.length > 0) count++
    if (advancedFilters.statuses.length > 0) count++
    if (!advancedFilters.showCompleted) count++
    return count
  }, [selectedCategory, selectedProjectId, searchQuery, quickFilter, advancedFilters])

  return {
    filteredTasks,
    activeFiltersCount
  }
}

