import { memo, useState } from 'react'
import { Plus, X, BookOpen, MessageSquare, Brain } from 'lucide-react'

interface LearningFABProps {
  onNewCourse: () => void
  onQuickChat: () => void
  onFlashcards: () => void
}

export const LearningFAB = memo(function LearningFAB({
  onNewCourse,
  onQuickChat,
  onFlashcards
}: LearningFABProps) {
  const [isOpen, setIsOpen] = useState(false)

  const actions = [
    { icon: BookOpen, label: 'Nouveau cours', onClick: onNewCourse, color: 'indigo' },
    { icon: MessageSquare, label: 'Chat rapide', onClick: onQuickChat, color: 'emerald' },
    { icon: Brain, label: 'Flashcards', onClick: onFlashcards, color: 'violet' }
  ]

  const colorClasses: Record<string, string> = {
    indigo: 'bg-indigo-500 hover:bg-indigo-600 text-white',
    emerald: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    violet: 'bg-violet-500 hover:bg-violet-600 text-white'
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 lg:hidden">
      {/* Action Buttons */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 flex flex-col gap-3 animate-fade-in">
          {actions.map((action, index) => (
            <button
              key={action.label}
              onClick={() => {
                action.onClick()
                setIsOpen(false)
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg transition-[background-color] duration-200 ${colorClasses[action.color]}`}
              style={{
                animationDelay: `${index * 50}ms`,
                transform: `translateY(${isOpen ? 0 : 20}px)`,
                opacity: isOpen ? 1 : 0
              }}
              aria-label={action.label}
            >
              <action.icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 rounded-2xl shadow-xl transition-[background-color,transform] duration-200 ${
          isOpen 
            ? 'bg-zinc-700 text-zinc-300 rotate-45' 
            : 'bg-indigo-500 text-white hover:bg-indigo-600'
        }`}
        aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Plus className="w-6 h-6" aria-hidden="true" />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 -z-10"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  )
})

