/**
 * 🗂️ Store Slices - Barrel export
 */

// Types
export * from './types'

// Slices
export { createTasksSlice, type TasksSlice } from './tasksSlice'
export { createHealthSlice, type HealthSlice } from './healthSlice'
export { createJournalSlice, type JournalSlice } from './journalSlice'
export { createLearningSlice, type LearningSlice } from './learningSlice'
export { createLibrarySlice, type LibrarySlice } from './librarySlice'
export { createUISlice, type UISlice } from './uiSlice'

// Re-export task types for backward compatibility
export {
  DEFAULT_CATEGORIES,
  PROJECT_COLORS,
  PROJECT_ICONS,
  type Task,
  type Project,
  type SubTask,
  type CustomCategory,
  type TaskStatus,
  type TaskPriority,
  type HistoryAction
} from './tasksSlice'
