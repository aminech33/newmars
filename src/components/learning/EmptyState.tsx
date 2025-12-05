import { memo } from 'react'
import { Plus, Sparkles, GraduationCap, Brain, Target } from 'lucide-react'

interface EmptyStateProps {
  onCreateCourse: () => void
}

const FEATURES = [
  {
    icon: Brain,
    title: 'IA Personnalisée',
    description: 'Un tuteur qui s\'adapte à ton niveau'
  },
  {
    icon: Target,
    title: 'Objectifs Clairs',
    description: 'Progression structurée par sujets'
  },
  {
    icon: GraduationCap,
    title: 'Flashcards Auto',
    description: 'Mémorisation par répétition espacée'
  }
]

const TEMPLATES = [
  { icon: '💻', name: 'Programmation', color: 'indigo' },
  { icon: '🇬🇧', name: 'Anglais', color: 'emerald' },
  { icon: '📊', name: 'Data Science', color: 'cyan' },
  { icon: '🎨', name: 'Design', color: 'rose' },
  { icon: '📈', name: 'Marketing', color: 'amber' },
  { icon: '🧮', name: 'Mathématiques', color: 'violet' }
]

export const EmptyState = memo(function EmptyState({ onCreateCourse }: EmptyStateProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      {/* Hero */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-cyan-500/20 blur-3xl" />
        <div className="relative p-6 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-3xl border border-indigo-500/20">
          <Sparkles className="w-16 h-16 text-indigo-400 mx-auto" aria-hidden="true" />
        </div>
      </div>

      <h2 className="text-3xl font-bold text-zinc-100 mb-3">
        Apprends avec l'IA
      </h2>
      <p className="text-zinc-400 max-w-md mb-8">
        Crée tes cours personnalisés et apprends n'importe quel sujet avec un tuteur IA 
        qui s'adapte à ton rythme et tes objectifs.
      </p>

      {/* CTA */}
      <button
        onClick={onCreateCourse}
        className="flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-2xl font-medium hover:bg-indigo-600 transition-[background-color] duration-200 shadow-lg shadow-indigo-500/20 mb-12"
      >
        <Plus className="w-5 h-5" aria-hidden="true" />
        Créer mon premier cours
      </button>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 max-w-2xl">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="p-4 bg-zinc-800/30 rounded-2xl border border-zinc-800/50"
          >
            <feature.icon className="w-8 h-8 text-indigo-400 mb-3 mx-auto" aria-hidden="true" />
            <h3 className="font-medium text-zinc-200 mb-1">{feature.title}</h3>
            <p className="text-xs text-zinc-500">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Templates */}
      <div>
        <p className="text-sm text-zinc-600 mb-3">Ou commence avec un template</p>
        <div className="flex flex-wrap justify-center gap-2">
          {TEMPLATES.map((template) => (
            <button
              key={template.name}
              onClick={onCreateCourse}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 transition-[background-color,border-color] duration-200 border border-zinc-800/50 hover:border-zinc-600"
            >
              <span>{template.icon}</span>
              {template.name}
            </button>
          ))}
        </div>
      </div>

      {/* Keyboard Shortcut Hint */}
      <div className="mt-12 text-xs text-zinc-600">
        <kbd className="px-2 py-1 bg-zinc-800 rounded text-[10px]">Ctrl</kbd>
        {' + '}
        <kbd className="px-2 py-1 bg-zinc-800 rounded text-[10px]">N</kbd>
        {' pour créer un cours rapidement'}
      </div>
    </div>
  )
})

