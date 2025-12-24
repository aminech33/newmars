import { BookOpen, Plus, Sparkles } from 'lucide-react'

interface EmptyStateProps {
  onCreateCourse: () => void
}

export function EmptyState({ onCreateCourse }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 flex items-center justify-center border border-indigo-500/20">
          <BookOpen className="w-10 h-10 text-indigo-400" />
        </div>
        
        {/* Title */}
        <h2 className="text-2xl font-semibold text-zinc-100 mb-3">
          Commencez à apprendre
        </h2>
        
        {/* Description */}
        <p className="text-zinc-400 mb-8 leading-relaxed">
          Créez votre premier cours pour démarrer votre parcours d'apprentissage. 
          L'IA vous accompagnera tout au long de votre progression.
        </p>
        
        {/* CTA Button */}
        <button
          onClick={onCreateCourse}
          className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          Créer un cours
        </button>
        
        {/* Features hint */}
        <div className="mt-10 pt-8 border-t border-zinc-800/50">
          <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Propulsé par l'IA Gemini</span>
          </div>
        </div>
      </div>
    </div>
  )
}





