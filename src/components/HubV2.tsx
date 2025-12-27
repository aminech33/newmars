/**
 * 🏠 HubV2 — Command Center (MINIMALISTE)
 * 
 * Greeting + menu textuel simple
 */

import { useStore } from '../store/useStore'
import { motion } from 'framer-motion'

// Modules de l'app
const MODULES = [
  { id: 'tasks', label: 'Tâches' },
  { id: 'projects', label: 'Projets' },
  { id: 'myday', label: 'Ma Journée' },
  { id: 'library', label: 'Bibliothèque' },
  { id: 'health', label: 'Santé' },
  { id: 'learning', label: 'Apprentissage' },
]

export function HubV2() {
  const setView = useStore((state) => state.setView)
  const userName = useStore((state) => state.userName) || 'Amine'
  
  const today = new Date()
  const dateStr = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)
  const hour = today.getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

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
          {greeting}, {userName}
        </h1>
      </motion.div>
      
      {/* Menu — Liste de titres */}
      <motion.nav 
        className="flex flex-col items-center gap-4 md:gap-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {MODULES.map((module, index) => (
          <motion.button
            key={module.id}
            onClick={() => setView(module.id as any)}
            className="text-xl md:text-2xl text-zinc-400 hover:text-zinc-100 transition-colors duration-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
            whileHover={{ scale: 1.02 }}
          >
            {module.label}
          </motion.button>
        ))}
      </motion.nav>
      
      {/* Settings en bas */}
      <motion.button
        onClick={() => setView('settings')}
        className="mt-16 md:mt-20 text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        Paramètres
      </motion.button>
      
    </div>
  )
}
