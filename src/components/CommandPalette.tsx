import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import { Search, CheckSquare, BarChart3, Sparkles, Plus, Home, Zap, GraduationCap } from 'lucide-react'

interface Command {
  id: string
  label: string
  icon: any
  action: () => void
  category: string
}

export function CommandPalette() {
  const { isCommandPaletteOpen, setCommandPaletteOpen, setView, tasks, setFocusMode } = useStore()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const commands: Command[] = [
    { id: 'home', label: 'Aller au Hub', icon: Home, action: () => setView('hub'), category: 'Navigation' },
    { id: 'tasks', label: 'Voir les tâches', icon: CheckSquare, action: () => setView('tasks'), category: 'Navigation' },
    { id: 'dashboard', label: 'Voir le Dashboard', icon: BarChart3, action: () => setView('dashboard'), category: 'Navigation' },
    { id: 'ai', label: 'Ouvrir l\'Assistant IA', icon: Sparkles, action: () => setView('ai'), category: 'Navigation' },
    { id: 'learning', label: 'Apprentissage IA', icon: GraduationCap, action: () => setView('learning'), category: 'Navigation' },
    { 
      id: 'new-task', 
      label: 'Nouvelle tâche', 
      icon: Plus, 
      action: () => {
        setView('tasks')
        // The tasks page will handle showing the add form
      }, 
      category: 'Actions' 
    },
    {
      id: 'focus-mode',
      label: 'Activer le mode Focus',
      icon: Zap,
      action: () => {
        const nextTask = tasks.find(t => !t.completed)
        if (nextTask) {
          setFocusMode(true, nextTask.id)
        }
      },
      category: 'Actions'
    },
  ]

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    if (isCommandPaletteOpen) {
      inputRef.current?.focus()
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isCommandPaletteOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action()
        setCommandPaletteOpen(false)
      }
    } else if (e.key === 'Escape') {
      setCommandPaletteOpen(false)
    }
  }

  if (!isCommandPaletteOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-mars-surface border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-zinc-900">
          <Search className="w-4 h-4 text-zinc-600" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher une commande..."
            className="flex-1 bg-transparent text-zinc-200 placeholder:text-zinc-700 focus:outline-none"
          />
          <kbd className="text-[10px] text-zinc-700 px-1.5 py-0.5 border border-zinc-800 rounded">ESC</kbd>
        </div>

        {/* Commands List */}
        <div className="max-h-96 overflow-auto">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-zinc-600 text-sm">
              Aucune commande trouvée
            </div>
          ) : (
            <div className="py-2">
              {filteredCommands.map((cmd, index) => {
                const Icon = cmd.icon
                return (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      cmd.action()
                      setCommandPaletteOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      index === selectedIndex
                        ? 'bg-zinc-900 text-zinc-100'
                        : 'text-zinc-400 hover:bg-zinc-900/50'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-sm">{cmd.label}</span>
                    <span className="text-xs text-zinc-700">{cmd.category}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="px-4 py-3 border-t border-zinc-900 flex items-center gap-4 text-xs text-zinc-700">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-zinc-800 rounded">↑↓</kbd> Naviguer
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-zinc-800 rounded">⏎</kbd> Sélectionner
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-zinc-800 rounded">ESC</kbd> Fermer
          </span>
        </div>
      </div>
    </div>
  )
}
