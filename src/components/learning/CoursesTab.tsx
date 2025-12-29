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
  searchQuery: string
  filterStatus: CourseStatus | 'all'
  sortBy: CourseSortBy
  sidebarCollapsed: boolean
  sidebarHidden: boolean
  isTyping: boolean
  
  // Actions
  setActiveCourse: (courseId: string | null) => void
  setSearchQuery: (query: string) => void
  setFilterStatus: (status: CourseStatus | 'all') => void
  setSortBy: (sort: CourseSortBy) => void
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
  searchQuery,
  filterStatus,
  sortBy,
  sidebarCollapsed,
  sidebarHidden,
  isTyping,
  setActiveCourse,
  setSearchQuery,
  setFilterStatus,
  setSortBy,
  setSidebarHidden,
  onCreateCourse,
  onEditCourse,
  onDeleteCourse,
  onPinCourse,
  onArchiveCourse,
  onSendMessage,
  onCopyMessage
}: CoursesTabProps) {
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
            onSendMessage={onSendMessage}
            onCopyMessage={onCopyMessage}
          />
        ) : (
          <EmptyState onCreateCourse={onCreateCourse} />
        )}
      </main>
    </div>
  )
}

