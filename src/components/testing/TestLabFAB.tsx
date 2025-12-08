import { useState, memo } from 'react'
import { Plus, FlaskConical, Play, FileText, Eye, Settings } from 'lucide-react'

interface TestLabFABProps {
  onOpenTestLab: () => void
  onQuickTest?: () => void
  onViewResults?: () => void
}

export const TestLabFAB = memo(function TestLabFAB({
  onOpenTestLab,
  onQuickTest,
  onViewResults
}: TestLabFABProps) {
  const [isOpen, setIsOpen] = useState(false)

  const actions = [
    { 
      icon: FlaskConical, 
      label: 'Test Lab', 
      onClick: () => {
        onOpenTestLab()
        setIsOpen(false)
      }, 
      color: 'indigo',
      description: 'Ouvrir le laboratoire de tests'
    },
    ...(onQuickTest ? [{
      icon: Play, 
      label: 'Test rapide', 
      onClick: () => {
        onQuickTest()
        setIsOpen(false)
      }, 
      color: 'emerald',
      description: 'Lancer un test rapide'
    }] : []),
    ...(onViewResults ? [{
      icon: Eye, 
      label: 'Résultats', 
      onClick: () => {
        onViewResults()
        setIsOpen(false)
      }, 
      color: 'violet',
      description: 'Voir les résultats'
    }] : [])
  ]

  const colorClasses: Record<string, string> = {
    indigo: 'bg-indigo-500 hover:bg-indigo-600 text-white',
    emerald: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    violet: 'bg-violet-500 hover:bg-violet-600 text-white',
    amber: 'bg-amber-500 hover:bg-amber-600 text-white'
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Action Buttons */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 flex flex-col gap-3 mb-2">
          {actions.map((action, index) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg transition-all duration-200 ${colorClasses[action.color]} animate-fade-in`}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
              aria-label={action.description}
              title={action.description}
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
        className={`p-4 rounded-full shadow-xl transition-all duration-300 ${
          isOpen 
            ? 'bg-zinc-700 rotate-45 scale-110' 
            : 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 hover:scale-110'
        }`}
        aria-label={isOpen ? 'Fermer le menu des tests' : 'Menu Test Lab'}
        aria-expanded={isOpen}
        title={isOpen ? 'Fermer' : 'Test Lab'}
      >
        {isOpen ? (
          <Plus className="w-6 h-6 text-white transition-transform" />
        ) : (
          <FlaskConical className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Badge de notification (optionnel) */}
      {!isOpen && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-900 animate-pulse" />
      )}
    </div>
  )
})

