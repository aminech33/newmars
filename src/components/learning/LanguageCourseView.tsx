/**
 * 🗣️ LanguageCourseView - Vue dédiée pour cours de langue
 * Intègre VocabularyReview, conversation et exercices
 */

import { memo, useState, useCallback, useEffect } from 'react'
import { Course } from '../../types/learning'
import { ChatPanel } from './ChatPanel'
import { VocabularyReview } from './VocabularyReview'
import { LanguageExercises } from './LanguageExercises'
import { useStore } from '../../store/useStore'
import { useLanguageArchiving } from '../../hooks/useLanguageArchiving'

interface LanguageCourseViewProps {
  course: Course
  onSendMessage: (content: string) => void
  onCopyMessage: (messageId: string) => void
}

type ViewMode = 'conversation' | 'vocabulary' | 'exercises'

export const LanguageCourseView = memo(function LanguageCourseView({
  course,
  onSendMessage,
  onCopyMessage
}: LanguageCourseViewProps) {
  const { addToast } = useStore()
  const [isTyping] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('conversation')
  
  // 📦 Archivage automatique des messages de langue
  const { needsArchiving, stats: archiveStats } = useLanguageArchiving(course.id)
  
  // 📦 Notification si archivage nécessaire
  useEffect(() => {
    if (needsArchiving && archiveStats) {
      console.log(`⚠️ [LANGUE] ${archiveStats.active} messages - Archivage recommandé`)
    }
  }, [needsArchiving, archiveStats])
  
  const handleSendMessage = useCallback((content: string) => {
    onSendMessage(content)
  }, [onSendMessage])

  return (
    <div className="h-full flex flex-col bg-black">
      {/* 🔧 Onglets : Conversation | Vocabulaire | Exercices */}
      <div className="flex-shrink-0 border-b border-zinc-800/50 bg-zinc-950/50">
        <div className="flex gap-1 p-2">
          <button
            onClick={() => setViewMode('conversation')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'conversation'
                ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            💬 Conversation
          </button>
          <button
            onClick={() => setViewMode('vocabulary')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'vocabulary'
                ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            📚 Vocabulaire
          </button>
          <button
            onClick={() => setViewMode('exercises')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'exercises'
                ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            ✍️ Exercices
          </button>
        </div>
      </div>

      {/* Contenu selon le mode */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'conversation' && (
          <ChatPanel
            course={course}
            isTyping={isTyping}
            includeCode={false}
            showSuggestions={course.messages.length === 0}
            onSendMessage={handleSendMessage}
            onCopyMessage={onCopyMessage}
            onToggleCode={() => {}}
          />
        )}

        {viewMode === 'vocabulary' && (
          <VocabularyReview courseId={course.id} />
        )}

        {viewMode === 'exercises' && (
          <LanguageExercises 
            courseId={course.id}
            level={course.metadata?.languageLevel || 'A1'}
          />
        )}
      </div>
    </div>
  )
})

