import { useMemo } from 'react'
import { Task } from '../store/useStore'
import { TaskFilterState } from '../components/tasks/UnifiedFilters'

export type QuickFilter = 'all' | 'today' | 'this-week' | 'next-week' | 'this-month' | 'no-deadline' | 'overdue'

interface UseTaskFiltersProps {
  tasks: Task[]
  selectedProjectId: string | 'all'
  searchQuery: string
  quickFilter: QuickFilter
  advancedFilters: TaskFilterState
}

// Helper functions for date calculations
const getEndOfThisWeek = () => {
  const d = new Date()
  d.setDate(d.getDate() + (7 - d.getDay()))
  d.setHours(23, 59, 59, 999)
  return d
}

const getEndOfNextWeek = () => {
  const d = new Date()
  d.setDate(d.getDate() + (14 - d.getDay()))
  d.setHours(23, 59, 59, 999)
  return d
}

const getStartOfNextWeek = () => {
  const d = new Date()
  d.setDate(d.getDate() + (8 - d.getDay()))
  d.setHours(0, 0, 0, 0)
  return d
}

const getEndOfThisMonth = () => {
  const d = new Date()
  d.setMonth(d.getMonth() + 1, 0)
  d.setHours(23, 59, 59, 999)
  return d
}

export function useTaskFilters({
  tasks,
  selectedProjectId,
  searchQuery,
  quickFilter,
  advancedFilters
}: UseTaskFiltersProps) {
  const filteredTasks = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    
    return tasks.filter(task => {
      // Quick filters (by date)
      if (quickFilter === 'today') {
        if (!task.dueDate) return false
        const today = new Date().toDateString()
        const taskDate = new Date(task.dueDate).toDateString()
        if (taskDate !== today) return false
      }
      
      if (quickFilter === 'this-week') {
        if (!task.dueDate) return false
        const taskDate = new Date(task.dueDate)
        const endOfWeek = getEndOfThisWeek()
        if (taskDate < now || taskDate > endOfWeek) return false
      }
      
      if (quickFilter === 'next-week') {
        if (!task.dueDate) return false
        const taskDate = new Date(task.dueDate)
        const startOfNextWeek = getStartOfNextWeek()
        const endOfNextWeek = getEndOfNextWeek()
        if (taskDate < startOfNextWeek || taskDate > endOfNextWeek) return false
      }
      
      if (quickFilter === 'this-month') {
        if (!task.dueDate) return false
        const taskDate = new Date(task.dueDate)
        const endOfMonth = getEndOfThisMonth()
        if (taskDate < now || taskDate > endOfMonth) return false
      }
      
      if (quickFilter === 'no-deadline') {
        if (task.dueDate) return false
      }
      
      if (quickFilter === 'overdue') {
        if (!task.dueDate || task.completed) return false
        if (new Date(task.dueDate) >= now) return false
      }

      // Project filter
      if (selectedProjectId !== 'all' && task.projectId !== selectedProjectId) return false
      
      // Search filter
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      
      // Advanced filters (from TaskFilters popup)
      if (advancedFilters.categories.length > 0 && !advancedFilters.categories.includes(task.category)) return false
      if (advancedFilters.priorities.length > 0 && !advancedFilters.priorities.includes(task.priority)) return false
      if (advancedFilters.statuses.length > 0 && !advancedFilters.statuses.includes(task.status)) return false
      if (!advancedFilters.showCompleted && task.completed) return false
      if (advancedFilters.hasSubtasks === true && (!task.subtasks || task.subtasks.length === 0)) return false
      if (advancedFilters.hasDueDate === true && !task.dueDate) return false
      
      return true
    })
  }, [tasks, selectedProjectId, searchQuery, advancedFilters, quickFilter])

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (selectedProjectId !== 'all') count++
    if (searchQuery) count++
    if (quickFilter !== 'all') count++
    if (advancedFilters.categories.length > 0) count++
    if (advancedFilters.priorities.length > 0) count++
    if (advancedFilters.statuses.length > 0) count++
    if (!advancedFilters.showCompleted) count++
    if (advancedFilters.hasSubtasks !== null) count++
    if (advancedFilters.hasDueDate !== null) count++
    return count
  }, [selectedProjectId, searchQuery, quickFilter, advancedFilters])

  return {
    filteredTasks,
    activeFiltersCount
  }
}
