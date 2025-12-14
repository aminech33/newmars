import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '../store/useStore'
import { Search, CheckSquare, Heart, BookOpen, BookMarked, X, ArrowRight, Sparkles, Timer, GraduationCap, BarChart3, Keyboard } from 'lucide-react'

interface SearchResult {
  id: string
  type: 'task' | 'journal' | 'book' | 'note' | 'project' | 'page' | 'action'
  title: string
  subtitle?: string
  icon: any
  action: () => void
}

export function SearchWidget() {
  const { 
    isCommandPaletteOpen: isSearchOpen, 
    setCommandPaletteOpen: setSearchOpen,
    tasks, 
    journalEntries, 
    books, 
    notes,
    projects,
    setView,
    setSelectedTaskId,
    setSelectedBookId
  } = useStore()
  
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fonction de recherche intelligente avec scoring
  const searchItems = (): SearchResult[] => {
    if (!query.trim()) {
      // Si pas de recherche, montrer des suggestions récentes + actions rapides
      return [
        // Actions rapides
        {
          id: 'action-shortcuts',
          type: 'action' as const,
          title: 'Voir les raccourcis clavier',
          subtitle: 'Appuyez sur ? pour afficher',
          icon: Keyboard,
          action: () => {
            setSearchOpen(false)
            // Simuler la touche ?
            window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))
          }
        },
        // Tâches récentes
        ...tasks.filter(t => !t.completed).slice(0, 3).map(task => ({
          id: `task-${task.id}`,
          type: 'task' as const,
          title: task.title,
          subtitle: `Tâche ${task.completed ? 'terminée' : 'en cours'}`,
          icon: CheckSquare,
          action: () => {
            setSelectedTaskId(task.id)
            setView('tasks')
            setSearchOpen(false)
          }
        }))
      ]
    }

    const results: SearchResult[] = []
    const lowerQuery = query.toLowerCase()

    // Recherche dans les pages/fonctionnalités (toutes les pages)
    const pages = [
      { id: 'hub', name: 'Hub', desc: 'Accueil, widgets', icon: Sparkles, view: 'hub' as const },
      { id: 'tasks', name: 'Tâches', desc: 'Gestion des tâches, Kanban', icon: CheckSquare, view: 'tasks' as const },
      { id: 'myday', name: 'Ma Journée', desc: 'Habitudes, journal, réflexion, gratitude', icon: BookOpen, view: 'myday' as const },
      { id: 'pomodoro', name: 'Pomodoro', desc: 'Timer, focus, productivité', icon: Timer, view: 'pomodoro' as const },
      { id: 'library', name: 'Bibliothèque', desc: 'Lectures, livres, citations', icon: BookMarked, view: 'library' as const },
      { id: 'health', name: 'Santé', desc: 'Poids, nutrition, bien-être', icon: Heart, view: 'health' as const },
      { id: 'learning', name: 'Apprentissage', desc: 'Cours, IA, flashcards', icon: GraduationCap, view: 'learning' as const },
      { id: 'dashboard', name: 'Dashboard', desc: 'Statistiques, productivité', icon: BarChart3, view: 'dashboard' as const },
    ]

    pages.forEach(page => {
      if (page.name.toLowerCase().includes(lowerQuery) || 
          page.desc.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: `page-${page.id}`,
          type: 'page',
          title: page.name,
          subtitle: page.desc,
          icon: page.icon,
          action: () => {
            setView(page.view)
            setSearchOpen(false)
          }
        })
      }
    })

    // Recherche dans les tâches - AVEC DEEP LINKING
    tasks.forEach(task => {
      if (task.title.toLowerCase().includes(lowerQuery) || 
          task.description?.toLowerCase().includes(lowerQuery)) {
        const project = projects.find(p => p.id === task.projectId)
        results.push({
          id: `task-${task.id}`,
          type: 'task',
          title: task.title,
          subtitle: project ? `${project.icon} ${project.name}` : (task.completed ? '✓ Terminée' : 'En cours'),
          icon: CheckSquare,
          action: () => {
            setSelectedTaskId(task.id) // Deep link!
            setView('tasks')
            setSearchOpen(false)
          }
        })
      }
    })

    // Recherche dans le journal
    journalEntries.forEach(entry => {
      const searchableContent = [
        entry.reflection,
        entry.mainGoal,
        entry.learned,
        entry.victory,
        ...(entry.gratitude || [])
      ].filter(Boolean).join(' ').toLowerCase()
      
      if (searchableContent.includes(lowerQuery)) {
        results.push({
          id: `journal-${entry.id}`,
          type: 'journal',
          title: entry.reflection?.slice(0, 50) || `Journal du ${entry.date}`,
          subtitle: new Date(entry.createdAt).toLocaleDateString('fr-FR'),
          icon: BookOpen,
          action: () => {
            setView('myday')
            setSearchOpen(false)
          }
        })
      }
    })

    // Recherche dans les livres - AVEC DEEP LINKING
    books.forEach(book => {
      if (book.title.toLowerCase().includes(lowerQuery) ||
          book.author.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: `book-${book.id}`,
          type: 'book',
          title: book.title,
          subtitle: `par ${book.author}`,
          icon: BookMarked,
          action: () => {
            setSelectedBookId(book.id) // Deep link!
            setView('library')
            setSearchOpen(false)
          }
        })
      }
    })

    // Recherche dans les notes
    notes.forEach(note => {
      if (note.title.toLowerCase().includes(lowerQuery) ||
          note.content.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: `note-${note.id}`,
          type: 'note',
          title: note.title,
          subtitle: 'Note',
          icon: BookOpen,
          action: () => {
            setView('hub')
            setSearchOpen(false)
          }
        })
      }
    })

    // Recherche dans les projets
    projects.forEach(project => {
      if (project.name.toLowerCase().includes(lowerQuery)) {
        const projectTasks = tasks.filter(t => t.projectId === project.id)
        results.push({
          id: `project-${project.id}`,
          type: 'project',
          title: `${project.icon} ${project.name}`,
          subtitle: `${projectTasks.length} tâche${projectTasks.length > 1 ? 's' : ''}`,
          icon: Sparkles,
          action: () => {
            setView('tasks')
            setSearchOpen(false)
          }
        })
      }
    })

    return results
  }

  const results = searchItems()

  useEffect(() => {
    if (isSearchOpen) {
      inputRef.current?.focus()
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isSearchOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIndex]) {
        results[selectedIndex].action()
      }
    } else if (e.key === 'Escape') {
      setSearchOpen(false)
    }
  }

  if (!isSearchOpen) return null

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={() => setSearchOpen(false)}
    >
      <div 
        className="w-full max-w-2xl bg-zinc-900/95 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800">
          <Search className="w-5 h-5 text-zinc-600" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher des tâches, événements, notes, livres..."
            className="flex-1 bg-transparent text-zinc-200 placeholder-zinc-600 outline-none text-base"
          />
          <button
            onClick={() => setSearchOpen(false)}
            className="text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-800/50 mb-3">
                <Search className="w-5 h-5 text-zinc-600" />
              </div>
              <p className="text-zinc-500 text-sm">
                {query ? 'Aucun résultat trouvé' : 'Commencez à taper pour rechercher'}
              </p>
            </div>
          ) : (
            <div className="py-2">
              {results.map((result, index) => {
                const Icon = result.icon
                const isSelected = index === selectedIndex
                
                return (
                  <button
                    key={result.id}
                    onClick={result.action}
                    className={`
                      w-full flex items-center gap-3 px-5 py-3 text-left transition-colors
                      ${isSelected ? 'bg-zinc-800/50' : 'hover:bg-zinc-800/30'}
                    `}
                  >
                    <div className={`
                      flex items-center justify-center w-9 h-9 rounded-lg
                      ${result.type === 'task' ? 'bg-blue-500/10 text-blue-400' : ''}
                      ${result.type === 'event' ? 'bg-purple-500/10 text-purple-400' : ''}
                      ${result.type === 'journal' ? 'bg-amber-500/10 text-amber-400' : ''}
                      ${result.type === 'book' ? 'bg-emerald-500/10 text-emerald-400' : ''}
                      ${result.type === 'note' ? 'bg-cyan-500/10 text-cyan-400' : ''}
                      ${result.type === 'project' ? 'bg-violet-500/10 text-violet-400' : ''}
                      ${result.type === 'page' ? 'bg-indigo-500/10 text-indigo-400' : ''}
                      ${result.type === 'action' ? 'bg-zinc-500/10 text-zinc-400' : ''}
                    `}>
                      <Icon className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-zinc-200 text-sm font-medium truncate">
                        {result.title}
                      </div>
                      {result.subtitle && (
                        <div className="text-zinc-600 text-xs truncate">
                          {result.subtitle}
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <ArrowRight className="w-4 h-4 text-zinc-600" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer with hints */}
        <div className="px-5 py-3 border-t border-zinc-800 flex items-center gap-4 text-xs text-zinc-600">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">↑↓</kbd> Naviguer
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">⏎</kbd> Ouvrir
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">Esc</kbd> Fermer
          </span>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

