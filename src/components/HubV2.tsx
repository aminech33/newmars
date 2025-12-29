/**
 * 🏠 HubV2 — Command Center (MINIMALISTE + ACCESSIBLE)
 * 
 * Greeting + menu textuel simple avec raccourcis clavier et indicateurs
 */

import { useStore } from '../store/useStore'
import { motion } from 'framer-motion'
import { useMemo, useEffect } from 'react'

type View = 'tasks' | 'projects' | 'myday' | 'library' | 'learning' | 'settings'

interface Module {
  id: View
  label: string
  shortcut: string
  getCount?: (state: any) => number
}

export function HubV2() {
  const setView = useStore((state) => state.setView)
  const userName = useStore((state) => state.userName)
  const tasks = useStore((state) => state.tasks)
  const projects = useStore((state) => state.projects)
  const journalEntries = useStore((state) => state.journalEntries)
  
  // Utiliser le vrai nom de l'utilisateur ou un nom par défaut
  const displayName = userName || 'Amine'
  
  // Mémoïser la date pour éviter recalculs
  const { formattedDate, greeting } = useMemo(() => {
    const today = new Date()
    const dateStr = today.toLocaleDateString('fr-FR', { 
      weekday: 'long', day: 'numeric', month: 'long' 
    })
    const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)
    const hour = today.getHours()
    const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
    return { formattedDate, greeting }
  }, [])

  // Modules avec indicateurs et raccourcis
  const MODULES: Module[] = useMemo(() => [
    { 
      id: 'tasks', 
      label: 'Tâches', 
      shortcut: '1',
      getCount: () => tasks.filter(t => !t.completed).length
    },
    { 
      id: 'projects', 
      label: 'Projets', 
      shortcut: '2',
      getCount: () => projects.length
    },
    { 
      id: 'myday', 
      label: 'Ma Journée', 
      shortcut: '3',
      getCount: () => {
        const today = new Date().toISOString().split('T')[0]
        return journalEntries.some(e => e.date === today) ? 0 : 1 // 1 si non rempli
      }
    },
    { 
      id: 'library', 
      label: 'Bibliothèque', 
      shortcut: '4'
    },
    { 
      id: 'learning', 
      label: 'Apprentissage', 
      shortcut: '5'
    },
  ], [tasks, projects, journalEntries])

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignorer si on est dans un input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (e.key >= '1' && e.key <= '5') {
        e.preventDefault()
        const index = parseInt(e.key) - 1
        setView(MODULES[index].id)
      }
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault()
        setView('settings')
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [setView, MODULES])

  return (
    <div className="h-full w-full bg-black flex flex-col items-center justify-center p-6 md:p-8">
      
      {/* Header — Greeting + Date */}
      <motion.div 
        className="text-center mb-16 md:mb-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 mb-3">
          {formattedDate}
        </p>
        <h1 className="text-4xl md:text-5xl lg:text-6xl text-zinc-100 font-['Allura'] tracking-wide">
          {greeting}, {displayName}
        </h1>
      </motion.div>
      
      {/* Menu — Liste de titres */}
      <motion.nav 
        className="flex flex-col items-center gap-4 md:gap-5"
        role="navigation"
        aria-label="Navigation principale"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {MODULES.map((module, index) => {
          const count = module.getCount ? module.getCount() : undefined
          const hasIndicator = count !== undefined && count > 0
          
          return (
            <motion.button
              key={module.id}
              onClick={() => setView(module.id)}
              className="group text-xl md:text-2xl text-zinc-400 hover:text-zinc-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 rounded-lg px-4 py-2"
              aria-label={`Accéder à ${module.label}${hasIndicator ? `, ${count} éléments` : ''} (touche ${module.shortcut})`}
              tabIndex={0}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setView(module.id)
                }
              }}
            >
              <span className="text-zinc-700 group-hover:text-zinc-600 text-sm mr-3 transition-colors" aria-hidden="true">
                {module.shortcut}.
              </span>
              {module.label}
              {hasIndicator && (
                <span className="text-zinc-500 group-hover:text-zinc-400 text-lg ml-3 transition-colors" aria-hidden="true">
                  ({count})
                </span>
              )}
            </motion.button>
          )
        })}
      </motion.nav>
      
      {/* Settings en bas */}
      <motion.button
        onClick={() => setView('settings')}
        className="group mt-16 md:mt-20 text-sm text-zinc-600 hover:text-zinc-400 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 rounded-lg px-4 py-2"
        aria-label="Accéder aux paramètres (touche S)"
        tabIndex={0}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setView('settings')
          }
        }}
      >
        <span className="text-zinc-700 group-hover:text-zinc-600 mr-2 transition-colors" aria-hidden="true">S.</span>
        Paramètres
      </motion.button>
      
    </div>
  )
}
