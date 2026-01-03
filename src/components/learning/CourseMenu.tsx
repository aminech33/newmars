import { Pin, Archive, Trash2, Edit2 } from 'lucide-react'
import { Course } from '../../types/learning'

interface CourseMenuProps {
  course: Course
  onEdit: (course: Course) => void
  onPin: (courseId: string) => void
  onArchive: (courseId: string) => void
  onDelete: (courseId: string) => void
  onClose: () => void
}

/**
 * Menu dropdown pour les actions sur un cours
 */
export function CourseMenu({
  course,
  onEdit,
  onPin,
  onArchive,
  onDelete,
  onClose
}: CourseMenuProps) {
  const handleAction = (action: () => void) => {
    action()
    onClose()
  }

  return (
    <div className="absolute right-0 top-8 w-40 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 z-50">
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleAction(() => onEdit(course))
        }}
        className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
      >
        <Edit2 className="w-4 h-4" />
        Modifier
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleAction(() => onPin(course.id))
        }}
        className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
      >
        <Pin className="w-4 h-4" />
        {course.pinnedAt ? 'Désépingler' : 'Épingler'}
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleAction(() => onArchive(course.id))
        }}
        className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
      >
        <Archive className="w-4 h-4" />
        Archiver
      </button>
      
      <div className="h-px bg-zinc-800 my-1" />
      
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleAction(() => onDelete(course.id))
        }}
        className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
      >
        <Trash2 className="w-4 h-4" />
        Supprimer
      </button>
    </div>
  )
}

