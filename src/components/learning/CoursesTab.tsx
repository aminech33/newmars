import { Course } from '../../types/learning'
import { CourseList } from './CourseList'
import { CourseChat } from './CourseChat'
import { LanguageCourseView } from './LanguageCourseView'
import { EmptyState } from './EmptyState'

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
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar - Course List */}
      {!sidebarHidden && (
        <CourseList
          courses={filteredCourses}
          activeCourseId={activeCourseId}
          collapsed={sidebarCollapsed}
          onSelectCourse={setActiveCourse}
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
          // 🔥 Détection : Si c'est un cours de langue, afficher LanguageCourseView
          activeCourse.metadata?.isLanguageCourse ? (
            <LanguageCourseView
              course={activeCourse}
              onSendMessage={onSendMessage}
              onCopyMessage={onCopyMessage}
            />
          ) : (
            <CourseChat
              course={activeCourse}
              onSendMessage={onSendMessage}
              onCopyMessage={onCopyMessage}
            />
          )
        ) : (
          <EmptyState onCreateCourse={onCreateCourse} />
        )}
      </main>
    </div>
  )
}

