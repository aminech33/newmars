import { useState } from 'react'
import { Course, CourseStatus } from '../../types/learning'
import { CourseList } from './CourseList'
import { CourseChat } from './CourseChat'
import { EmptyState } from './EmptyState'

type CourseSortBy = 'recent' | 'name' | 'progress' | 'streak'

interface CoursesTabProps {
  // Courses data
  filteredCourses: Course[]
  activeCourse: Course | null

  // UI state
  activeCourseId: string | null
  sidebarCollapsed: boolean
  sidebarHidden: boolean

  // Actions
  setActiveCourse: (courseId: string | null) => void
  setSidebarHidden: (hidden: boolean) => void
  onCreateCourse: () => void
  onEditCourse: (course: Course) => void
  onDeleteCourse: (courseId: string) => void
  onPinCourse: (courseId: string) => void
  onArchiveCourse: (courseId: string) => void
  onSendMessage: (content: string, codeContext?: { code: string; language: string }) => Promise<void>
  onCopyMessage: () => void
}

export function CoursesTab({
  filteredCourses,
  activeCourse,
  activeCourseId,
  sidebarCollapsed,
  sidebarHidden,
  setActiveCourse,
  setSidebarHidden,
  onCreateCourse,
  onEditCourse,
  onDeleteCourse,
  onPinCourse,
  onArchiveCourse,
  onSendMessage,
  onCopyMessage
}: CoursesTabProps) {
  // Local state for search/filter/sort
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<CourseStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<CourseSortBy>('recent')
  const [isTyping, setIsTyping] = useState(false)

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar - Course List */}
      {!sidebarHidden && (
        <CourseList
          courses={filteredCourses}
          activeCourseId={activeCourseId}
          searchQuery={searchQuery}
          filterStatus={filterStatus}
          sortBy={sortBy}
          collapsed={sidebarCollapsed}
          onSelectCourse={setActiveCourse}
          onSearchChange={setSearchQuery}
          onFilterChange={setFilterStatus}
          onSortChange={setSortBy}
          onCreateCourse={onCreateCourse}
          onEditCourse={onEditCourse}
          onDeleteCourse={onDeleteCourse}
          onPinCourse={onPinCourse}
          onArchiveCourse={onArchiveCourse}
          onHideSidebar={() => setSidebarHidden(true)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full">
        {activeCourse ? (
          <CourseChat
            course={activeCourse}
            isTyping={isTyping}
            onSendMessage={async (content, codeContext) => {
              setIsTyping(true)
              try {
                await onSendMessage(content, codeContext)
              } finally {
                setIsTyping(false)
              }
            }}
            onCopyMessage={onCopyMessage}
          />
        ) : (
          <EmptyState onCreateCourse={onCreateCourse} />
        )}
      </main>
    </div>
  )
}

