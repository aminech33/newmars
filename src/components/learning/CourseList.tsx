import { memo, useState, useEffect, useRef } from 'react'
import { Plus, Pin, MoreVertical, PanelLeftClose } from 'lucide-react'
import { Course } from '../../types/learning'
import { Tooltip } from '../ui/Tooltip'
import { CourseMenu } from './CourseMenu'

interface CourseListProps {
  courses: Course[]
  activeCourseId: string | null
  collapsed: boolean
  onSelectCourse: (courseId: string) => void
  onCreateCourse: () => void
  onEditCourse: (course: Course) => void
  onDeleteCourse: (courseId: string) => void
  onPinCourse: (courseId: string) => void
  onArchiveCourse: (courseId: string) => void
  onHideSidebar?: () => void
}

export const CourseList = memo(function CourseList({
  courses,
  activeCourseId,
  collapsed,
  onSelectCourse,
  onCreateCourse,
  onEditCourse,
  onDeleteCourse,
  onPinCourse,
  onArchiveCourse,
  onHideSidebar
}: CourseListProps) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpenId) return
    
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null)
      }
    }
    
    // Delay to avoid immediate close on open click
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 0)
    
    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [menuOpenId])

  if (collapsed) {
    return (
      <div className="w-16 bg-zinc-950 border-r border-zinc-800/50 flex flex-col items-center py-4 gap-1">
        <button
          onClick={onCreateCourse}
          className="p-2.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-all hover:scale-105 mb-3"
        >
          <Plus className="w-5 h-5" />
        </button>
        
        <div className="w-8 h-px bg-zinc-800 mb-3" />
        
        {courses.slice(0, 10).map((course) => (
          <Tooltip key={course.id} content={course.name} side="right">
            <button
              onClick={() => onSelectCourse(course.id)}
              className={`p-2.5 rounded-xl transition-all ${
                activeCourseId === course.id
                  ? 'bg-zinc-800 text-white ring-1 ring-zinc-700/50 scale-105'
                  : 'text-zinc-500 hover:text-white hover:bg-zinc-900 hover:scale-105'
              }`}
            >
              <span className="text-lg">{course.icon}</span>
            </button>
          </Tooltip>
        ))}
      </div>
    )
  }

  return (
    <aside className="w-72 bg-zinc-950 border-r border-zinc-800/50 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <span className="text-sm font-medium text-zinc-300">Mes cours</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onCreateCourse}
            className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all hover:scale-105"
            title="Nouveau cours"
          >
            <Plus className="w-4 h-4" />
          </button>
          {onHideSidebar && (
            <button
              onClick={onHideSidebar}
              className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all hover:scale-105"
              title="Masquer la sidebar (⌘B)"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto p-2">
        {courses.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto mb-4 ring-1 ring-zinc-800">
              <Plus className="w-5 h-5 text-zinc-600" />
            </div>
            <p className="text-zinc-500 text-sm mb-1">Aucun cours</p>
            <p className="text-zinc-600 text-xs mb-4">Créez votre premier cours pour commencer</p>
            <button
              onClick={onCreateCourse}
              className="px-4 py-2 text-sm bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors ring-1 ring-zinc-800"
            >
              Nouveau cours
            </button>
          </div>
        ) : (
          <div className="space-y-0.5">
            {courses.map((course) => (
              <div key={course.id} className="group relative">
                <button
                  onClick={() => onSelectCourse(course.id)}
                  className={`w-full px-3 py-2.5 text-left flex items-center gap-3 rounded-xl transition-all ${
                    activeCourseId === course.id
                      ? 'bg-zinc-800/80 text-white ring-1 ring-zinc-700/50'
                      : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
                  }`}
                >
                  <span className="text-lg flex-shrink-0">{course.icon}</span>
                  <span className="text-sm truncate flex-1 font-medium">{course.name}</span>
                  {course.pinnedAt && (
                    <Pin className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                  )}
                </button>

                {/* Menu */}
                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpenId(menuOpenId === course.id ? null : course.id)
                    }}
                    className="p-1 text-zinc-600 hover:text-white rounded transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {menuOpenId === course.id && (
                    <CourseMenu
                      course={course}
                      onEdit={onEditCourse}
                      onPin={onPinCourse}
                      onArchive={onArchiveCourse}
                      onDelete={onDeleteCourse}
                      onClose={() => setMenuOpenId(null)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
})

