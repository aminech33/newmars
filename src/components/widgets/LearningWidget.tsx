import { memo } from 'react'
import { GraduationCap, Flame, BookOpen, Zap } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'

interface LearningWidgetProps {
  widget: Widget
}

export const LearningWidget = memo(function LearningWidget({ widget }: LearningWidgetProps) {
  const { id } = widget
  const { learningCourses, setView } = useStore()
  
  // Stats
  const activeCourses = learningCourses.filter(c => c.status === 'active')
  const totalMessages = learningCourses.reduce((sum, c) => sum + c.messagesCount, 0)
  const totalFlashcards = learningCourses.reduce((sum, c) => sum + c.flashcards.length, 0)
  
  // Recent courses (last 2 active)
  const recentCourses = [...activeCourses]
    .sort((a, b) => b.lastActiveAt - a.lastActiveAt)
    .slice(0, 2)

  // Calculate global streak
  const today = new Date().setHours(0, 0, 0, 0)
  let streak = 0
  let checkDate = today
  while (streak < 30) {
    const hasActivity = learningCourses.some(c => {
      const lastActive = new Date(c.lastActiveAt).setHours(0, 0, 0, 0)
      return lastActive === checkDate
    })
    if (hasActivity) {
      streak++
      checkDate -= 24 * 60 * 60 * 1000
    } else {
      break
    }
  }

  return (
    <WidgetContainer id={id} title="" currentSize="notification" onClick={() => setView('learning')}>
      <div className="h-full flex flex-col p-5 gap-2.5">
        {/* Header compact */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-violet-400 hover-glow" strokeWidth={1.5} />
            <div className="text-3xl font-bold text-white tabular-nums leading-none font-mono-display number-glow">
              {activeCourses.length}
            </div>
            <div className="text-[10px] text-violet-400/80 uppercase tracking-wider font-semibold">
              COURS
            </div>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-br from-violet-500 to-purple-500 rounded-full shadow-lg shadow-violet-500/30">
              <Flame className="w-3 h-3 text-white" />
              <span className="text-[10px] font-bold text-white">{streak}j</span>
            </div>
          )}
        </div>

        {/* Courses List - Top 3 */}
        <div className="flex-1 space-y-1.5 overflow-hidden">
          {learningCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center h-full">
              <BookOpen className="w-10 h-10 text-zinc-600 mb-2" />
              <span className="text-xs text-zinc-500">Aucun cours</span>
            </div>
          ) : recentCourses.length === 0 ? (
            <div className="text-center text-zinc-500 text-xs py-4">
              Tous les cours terminés ✓
            </div>
          ) : (
            recentCourses.map((course) => {
              const progress = course.lessonsCompleted > 0 && course.totalLessons > 0
                ? Math.round((course.lessonsCompleted / course.totalLessons) * 100)
                : 0
              
              return (
                <div
                  key={course.id}
                  className="flex items-start gap-2 p-2 bg-white/5 rounded-lg hover:bg-white/8 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 
                                  flex items-center justify-center flex-shrink-0 border border-violet-500/20">
                    <BookOpen className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-zinc-300 font-medium truncate">
                      {course.name}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate">
                      {course.subject}
                    </div>
                    {progress > 0 && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-zinc-600 tabular-nums">{progress}%</span>
                      </div>
                    )}
                  </div>
                  {course.messagesCount > 0 && (
                    <Zap className="w-3 h-3 text-violet-400/60 flex-shrink-0 mt-0.5" />
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer Stats Grid */}
        {learningCourses.length > 0 && (
          <div className="pt-2 border-t border-white/10">
            <div className="grid grid-cols-3 gap-1.5">
              <div className="text-center p-1.5 gradient-border-violet rounded">
                <div className="text-sm font-bold text-white tabular-nums">{totalMessages}</div>
                <div className="text-[9px] text-zinc-600">Messages</div>
              </div>
              <div className="text-center p-1.5 gradient-border-violet rounded">
                <div className="text-sm font-bold text-white tabular-nums">{totalFlashcards}</div>
                <div className="text-[9px] text-zinc-600">Cartes</div>
              </div>
              <div className="text-center p-1.5 gradient-border-violet rounded">
                <div className="text-sm font-bold text-violet-400 tabular-nums">{streak}</div>
                <div className="text-[9px] text-zinc-600">Jours</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </WidgetContainer>
  )
})
