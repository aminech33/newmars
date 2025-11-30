import React, { memo } from 'react'
import { GraduationCap, BookOpen, Flame, Plus, ChevronRight } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { WidgetContainer } from './WidgetContainer'
import { Widget } from '../../types/widgets'

interface LearningWidgetProps {
  widget: Widget
}

export const LearningWidget = memo(function LearningWidget({ widget }: LearningWidgetProps) {
  const { learningCourses, setView } = useStore()
  
  // Stats
  const activeCourses = learningCourses.filter(c => c.status === 'active')
  const totalMessages = learningCourses.reduce((sum, c) => sum + c.messagesCount, 0)
  const totalFlashcards = learningCourses.reduce((sum, c) => sum + c.flashcards.length, 0)
  
  // Recent courses (last 3 active)
  const recentCourses = [...activeCourses]
    .sort((a, b) => b.lastActiveAt - a.lastActiveAt)
    .slice(0, 3)

  // Calculate global streak
  const today = new Date().setHours(0, 0, 0, 0)
  let streak = 0
  let checkDate = today
  while (true) {
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

  const isCompact = widget.size === 'small'

  const handleClick = () => setView('learning')

  return (
    <WidgetContainer
      widget={widget}
      title="Apprentissage"
      icon={<GraduationCap className="w-4 h-4" />}
      accentColor="violet"
      onClick={handleClick}
    >
      {learningCourses.length === 0 ? (
        // Empty State
        <div className="h-full flex flex-col items-center justify-center text-center p-4">
          <div className="p-3 bg-violet-500/10 rounded-2xl mb-3">
            <GraduationCap className="w-8 h-8 text-violet-400" />
          </div>
          <p className="text-sm text-zinc-400 mb-2">Aucun cours</p>
          <p className="text-xs text-zinc-600 mb-3">
            Apprends avec un tuteur IA
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setView('learning')
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/20 text-violet-400 rounded-xl text-xs hover:bg-violet-500/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Créer un cours
          </button>
        </div>
      ) : isCompact ? (
        // Compact View
        <div className="h-full flex flex-col justify-between p-1">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-zinc-200">{activeCourses.length}</span>
            {streak > 0 && (
              <div className="flex items-center gap-1 text-amber-400">
                <Flame className="w-4 h-4" />
                <span className="text-sm font-medium">{streak}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-zinc-600">cours actifs</p>
        </div>
      ) : (
        // Full View
        <div className="h-full flex flex-col">
          {/* Stats Row */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-zinc-400">{activeCourses.length} cours</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">💬</span>
              <span className="text-sm text-zinc-400">{totalMessages}</span>
            </div>
            {totalFlashcards > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm">📇</span>
                <span className="text-sm text-zinc-400">{totalFlashcards}</span>
              </div>
            )}
            {streak > 0 && (
              <div className="flex items-center gap-1.5 text-amber-400 ml-auto">
                <Flame className="w-4 h-4" />
                <span className="text-sm font-medium">{streak}j</span>
              </div>
            )}
          </div>

          {/* Recent Courses */}
          <div className="flex-1 space-y-2 overflow-y-auto">
            {recentCourses.map((course) => (
              <button
                key={course.id}
                onClick={(e) => {
                  e.stopPropagation()
                  setView('learning')
                }}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-800/50 transition-all text-left group"
              >
                <div className={`p-2 rounded-xl bg-${course.color}-500/20`}>
                  <span className="text-lg">{course.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300 truncate">{course.name}</p>
                  <p className="text-xs text-zinc-600">{course.messagesCount} messages</p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
              </button>
            ))}
          </div>

          {/* Footer */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setView('learning')
            }}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouveau cours
          </button>
        </div>
      )}
    </WidgetContainer>
  )
})

