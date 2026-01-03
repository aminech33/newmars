/**
 * 🏠 HubV2 — Command Center (MINIMALISTE + ACCESSIBLE)
 * 
 * Greeting + menu textuel simple avec raccourcis clavier et indicateurs
 */

import { useStore } from '../store/useStore'
import { motion } from 'framer-motion'
import { useMemo, useEffect } from 'react'

type View = 'tasks' | 'myday' | 'library' | 'learning' | 'settings'

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
  const journalEntries = useStore((state) => state.journalEntries)
  const books = useStore((state) => state.books)
  const learningCourses = useStore((state) => state.learningCourses)
  const languageCourses = useStore((state) => state.languageCourses)
  
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
      id: 'myday', 
      label: 'Ma Journée', 
      shortcut: '2',
      getCount: () => {
        const today = new Date().toISOString().split('T')[0]
        return journalEntries.some(e => e.date === today) ? 0 : 1 // 1 si non rempli
      }
    },
    { 
      id: 'library', 
      label: 'Bibliothèque', 
      shortcut: '3',
      getCount: () => books.filter(b => b.status === 'reading').length
    },
    { 
      id: 'learning', 
      label: 'Apprentissage', 
      shortcut: '4',
      getCount: () => (learningCourses?.filter(c => c.status === 'active').length || 0) + (languageCourses?.length || 0)
    },
  ], [tasks, journalEntries, books, learningCourses, languageCourses])

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignorer si on est dans un input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (e.key >= '1' && e.key <= '4') {
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
        transition={{ duration: 0.3 }}
      >
        <p className="text-sm uppercase tracking-[0.25em] text-zinc-400 mb-4 font-['-apple-system,BlinkMacSystemFont,SF_Pro_Display,Segoe_UI,sans-serif']">
          {formattedDate}
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white font-['Allura'] tracking-wide" style={{ textShadow: '0 0 40px rgba(255, 255, 255, 0.08)' }}>
          {greeting}, {displayName}
        </h1>
      </motion.div>
      
      {/* Menu — Liste de titres */}
      <motion.nav 
        className="flex flex-col items-center gap-5 md:gap-6 font-['-apple-system,BlinkMacSystemFont,SF_Pro_Display,Segoe_UI,sans-serif']"
        role="navigation"
        aria-label="Navigation principale"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        {MODULES.map((module, index) => {
          const count = module.getCount ? module.getCount() : undefined
          const hasIndicator = count !== undefined && count > 0
          
          // Texte contextuel pour l'indicateur
          const getIndicatorText = () => {
            if (!hasIndicator) return null
            
            switch (module.id) {
              case 'tasks':
                return count === 1 ? '1 en attente' : `${count} en attente`
              case 'projects':
                return count === 1 ? '1 actif' : `${count} actifs`
              case 'myday':
                return 'À remplir'
              default:
                return null
            }
          }
          
          // Couleur contextuelle pour indicateur "Ma Journée"
          const indicatorColor = module.id === 'myday' && count > 0
            ? 'text-amber-400 group-hover:text-amber-300'
            : 'text-zinc-400 group-hover:text-zinc-300'
          
          const indicatorText = getIndicatorText()
          
          return (
            <motion.button
              key={module.id}
              onClick={() => setView(module.id)}
              className="group text-xl md:text-2xl text-zinc-400 hover:text-white hover:translate-x-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 rounded-lg px-4 py-2"
              aria-label={`Accéder à ${module.label}${indicatorText ? ` · ${indicatorText}` : ''} (touche ${module.shortcut})`}
              tabIndex={0}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.1 + index * 0.03 }}
              whileHover={{ scale: 1.02 }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setView(module.id)
                }
              }}
            >
              {module.label}
              {indicatorText && (
                <span className={`text-sm ml-3 transition-colors ${indicatorColor}`} aria-hidden="true">
                  · {indicatorText}
                </span>
              )}
            </motion.button>
          )
        })}
      </motion.nav>
      
      {/* Settings en bas */}
      <motion.button
        onClick={() => setView('settings')}
        className="group mt-16 md:mt-20 text-base text-zinc-500 hover:text-zinc-300 hover:translate-x-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 rounded-lg px-4 py-2 font-['-apple-system,BlinkMacSystemFont,SF_Pro_Display,Segoe_UI,sans-serif']"
        aria-label="Accéder aux paramètres (touche S)"
        tabIndex={0}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.25 }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setView('settings')
          }
        }}
      >
        Paramètres
      </motion.button>
      
    </div>
  )
}
