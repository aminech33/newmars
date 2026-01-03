import { memo } from 'react'
import { Course } from '../../types/learning'
import { MasteryCard } from './stats/MasteryCard'
import { StreakCard } from './stats/StreakCard'
import { ReviewsCard } from './stats/ReviewsCard'
import { TimeCard } from './stats/TimeCard'

interface CourseStatsCardProps {
  course: Course
}

export const CourseStatsCard = memo(function CourseStatsCard({ course }: CourseStatsCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <MasteryCard 
        currentMastery={course.currentMastery ?? 0}
        masteryTrend={course.masteryHistory?.slice(-7) || []}
      />
      <StreakCard 
        streak={course.streak ?? 0}
        longestStreak={course.longestStreak ?? 0}
      />
      <ReviewsCard 
        totalReviews={course.totalReviews ?? 0}
        messagesCount={course.messages.length}
        notesCount={course.notes?.length || 0}
      />
      <TimeCard 
        totalTimeSpent={course.totalTimeSpent ?? 0}
        sessionsCount={course.sessionsCount ?? 0}
      />
    </div>
  )
})



