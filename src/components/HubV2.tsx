/**
 * 🏠 HubV2 — Command Center (MINIMALISTE + ACCESSIBLE)
 *
 * Greeting + menu textuel + mini-dashboard avec stats du jour
 */

import { useStore } from '../store/useStore'
import { motion } from 'framer-motion'
import { useMemo, useEffect, useState } from 'react'
import { Settings, Clock, Database, CloudOff, CheckCircle2, XCircle } from 'lucide-react'
import { checkDatabasesHealth, DbHealthStatus } from '../services/api'

type View = 'tasks' | 'myday' | 'health' | 'library' | 'learning' | 'connections' | 'settings'

interface Module {
  id: View
  label: string
  shortcut: string
  getCount?: () => number
  priority?: number // Plus bas = plus prioritaire
}

export function HubV2() {
  const setView = useStore((state) => state.setView)
  const tasks = useStore((state) => state.tasks)
  const journalEntries = useStore((state) => state.journalEntries)
  const books = useStore((state) => state.books)
  const learningCourses = useStore((state) => state.learningCourses)
  const languageCourses = useStore((state) => state.languageCourses)
  const habits = useStore((state) => state.habits)

  // Heure en temps réel
  const [currentTime, setCurrentTime] = useState(new Date())

  // État de connexion backend + status des bases
  const [dbHealth, setDbHealth] = useState<DbHealthStatus | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Vérifier la connexion backend et l'état des bases
  useEffect(() => {
    const checkBackend = async () => {
      setIsChecking(true)
      const health = await checkDatabasesHealth()
      setDbHealth(health)
      setIsChecking(false)
    }
    checkBackend()
    // Re-vérifier toutes les 30 secondes
    const interval = setInterval(checkBackend, 30000)
    return () => clearInterval(interval)
  }, [])

  // Mémoïser la date pour éviter recalculs
  const { formattedDate, greeting, today } = useMemo(() => {
    const now = new Date()
    const dateStr = now.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long'
    })
    const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)
    const hour = now.getHours()
    const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
    const today = now.toISOString().split('T')[0]
    return { formattedDate, greeting, today }
  }, [])

  // Stats du jour pour le mini-dashboard
  const dayStats = useMemo(() => {
    const tasksCompleted = tasks.filter(t => t.completed && t.completedAt && new Date(t.completedAt).toISOString().split('T')[0] === today).length
    const tasksPending = tasks.filter(t => !t.completed).length

    // Streak habitudes
    const habitsCompletedToday = habits.filter(h => h.completedDates.includes(today)).length
    const totalHabits = habits.length

    // Calcul du streak global (jours consécutifs où toutes les habitudes sont faites)
    let streak = 0
    if (totalHabits > 0) {
      const checkDate = new Date()
      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0]
        const allDone = habits.every(h => h.completedDates.includes(dateStr))
        if (allDone) {
          streak++
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          break
        }
      }
    }

    // Livres en cours
    const booksReading = books.filter(b => b.status === 'reading').length

    // Cours actifs
    const activeCourses = (learningCourses?.filter(c => c.status === 'active').length || 0) + (languageCourses?.length || 0)

    // Journal rempli aujourd'hui
    const journalFilledToday = journalEntries.some(e => e.date === today)

    return { tasksCompleted, tasksPending, habitsCompletedToday, totalHabits, streak, booksReading, activeCourses, journalFilledToday }
  }, [tasks, habits, books, learningCourses, languageCourses, journalEntries, today])


  // Modules avec indicateurs, raccourcis et priorité
  const MODULES: Module[] = useMemo(() => {
    const journalFilledToday = journalEntries.some(e => e.date === today)
    const pendingTasks = tasks.filter(t => !t.completed).length

    return [
      {
        id: 'tasks',
        label: 'Tâches',
        shortcut: '1',
        getCount: () => pendingTasks,
        priority: pendingTasks > 5 ? 1 : pendingTasks > 0 ? 2 : 5
      },
      {
        id: 'myday',
        label: 'Ma Journée',
        shortcut: '2',
        getCount: () => journalFilledToday ? 0 : 1,
        priority: journalFilledToday ? 5 : 1 // Priorité haute si pas rempli
      },
      {
        id: 'health',
        label: 'Santé',
        shortcut: '3',
        getCount: () => 0, // Pas de count spécifique
        priority: 4
      },
      {
        id: 'library',
        label: 'Bibliothèque',
        shortcut: '4',
        getCount: () => books.filter(b => b.status === 'reading').length,
        priority: 5
      },
      {
        id: 'learning',
        label: 'Apprentissage',
        shortcut: '5',
        getCount: () => (learningCourses?.filter(c => c.status === 'active').length || 0) + (languageCourses?.length || 0),
        priority: 5
      },
      {
        id: 'connections',
        label: 'Connexions',
        shortcut: '6',
        getCount: () => 0,
        priority: 6
      },
    ]
  }, [tasks, journalEntries, books, learningCourses, languageCourses, today])

  // Trouver le module le plus urgent
  const urgentModule = useMemo(() => {
    return MODULES.reduce((prev, curr) =>
      (curr.priority || 5) < (prev.priority || 5) ? curr : prev
    )
  }, [MODULES])

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignorer si on est dans un input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (e.key >= '1' && e.key <= '6') {
        e.preventDefault()
        const index = parseInt(e.key) - 1
        if (index < MODULES.length) {
          setView(MODULES[index].id)
        }
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
    <div className="h-full w-full bg-black flex flex-col items-center justify-center p-6 md:p-8 relative">

      {/* Bouton Settings discret en haut à droite */}
      <motion.button
        onClick={() => setView('settings')}
        className="absolute top-6 right-6 p-2 text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900/50 rounded-lg transition-all"
        aria-label="Paramètres (touche S)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Settings className="w-5 h-5" />
      </motion.button>

      {/* Header — Greeting + Date + Heure */}
      <motion.div
        className="text-center mb-14 md:mb-16"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-center gap-4 mb-6">
          <p className="text-base md:text-lg uppercase tracking-[0.2em] text-zinc-400 font-medium">
            {formattedDate}
          </p>
          <span className="text-zinc-600">·</span>
          <p className="text-base md:text-lg tabular-nums text-zinc-400 font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 md:w-5 md:h-5" />
            {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <span className="text-zinc-600">·</span>
          <button
            onClick={() => setView('connections')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            title="Voir toutes les connexions"
          >
            {isChecking ? (
              <span className="text-zinc-500 flex items-center gap-2 text-sm md:text-base">
                <Database className="w-4 h-4 animate-pulse" />
              </span>
            ) : dbHealth?.connected ? (
              <span className="flex items-center gap-3 text-sm md:text-base">
                {/* Tasks */}
                <span className={`flex items-center gap-1 ${dbHealth.modules.tasks.ok ? 'text-emerald-500' : 'text-red-400'}`}>
                  {dbHealth.modules.tasks.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span className="text-zinc-400">Tasks</span>
                </span>
                {/* Health */}
                <span className={`flex items-center gap-1 ${dbHealth.modules.health.ok ? 'text-emerald-500' : 'text-red-400'}`}>
                  {dbHealth.modules.health.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span className="text-zinc-400">Health</span>
                </span>
                {/* Learning */}
                <span className={`flex items-center gap-1 ${dbHealth.modules.learning.ok ? 'text-emerald-500' : 'text-red-400'}`}>
                  {dbHealth.modules.learning.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span className="text-zinc-400">Learn</span>
                </span>
              </span>
            ) : (
              <span className="text-zinc-500 flex items-center gap-2 text-sm md:text-base">
                <CloudOff className="w-4 h-4" />
                <span>Hors-ligne</span>
              </span>
            )}
          </button>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white font-['Allura'] tracking-wide" style={{ textShadow: '0 0 40px rgba(255, 255, 255, 0.08)' }}>
          {greeting}, Amine
        </h1>
      </motion.div>

      {/* Menu — Liste de titres avec phrases dynamiques */}
      <motion.nav
        className="flex flex-col items-center gap-6 md:gap-8 font-['-apple-system,BlinkMacSystemFont,SF_Pro_Display,Segoe_UI,sans-serif']"
        role="navigation"
        aria-label="Navigation principale"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        {MODULES.map((module, index) => {
          const count = module.getCount ? module.getCount() : undefined
          const isUrgent = module.id === urgentModule.id && (module.priority || 5) <= 2

          // Phrases dynamiques riches et contextuelles
          const getIndicatorData = (): { text: string; color?: string } => {
            switch (module.id) {
              case 'tasks':
                if (dayStats.tasksCompleted > 0 && count === 0) {
                  return { text: `✓ ${dayStats.tasksCompleted} faite${dayStats.tasksCompleted > 1 ? 's' : ''} aujourd'hui`, color: 'text-emerald-400/80' }
                }
                if (count && count > 5) return { text: `${count} à traiter` }
                if (count && count > 0) return { text: `${count} en attente` }
                return { text: 'Tout est fait ✓', color: 'text-emerald-400/80' }
              case 'myday':
                // Cas avec rituels
                if (dayStats.totalHabits > 0) {
                  const allHabitsDone = dayStats.habitsCompletedToday === dayStats.totalHabits
                  const remaining = dayStats.totalHabits - dayStats.habitsCompletedToday

                  // Tout est fait (rituels + journal)
                  if (allHabitsDone && dayStats.journalFilledToday) {
                    return dayStats.streak > 1
                      ? { text: `🔥 ${dayStats.streak}j de streak`, color: 'text-amber-400/80' }
                      : { text: '✓ Journée complète', color: 'text-emerald-400/80' }
                  }
                  // Rituels faits mais journal pas rempli
                  if (allHabitsDone && !dayStats.journalFilledToday) {
                    return { text: '✓ Rituels · Journal à faire' }
                  }
                  // Rituels pas finis + journal pas rempli
                  if (!dayStats.journalFilledToday) {
                    return { text: `${remaining} rituel${remaining > 1 ? 's' : ''} + journal` }
                  }
                  // Rituels pas finis mais journal rempli
                  return { text: `${remaining} rituel${remaining > 1 ? 's' : ''} restant${remaining > 1 ? 's' : ''}` }
                }
                // Pas de rituels configurés
                if (!dayStats.journalFilledToday) return { text: 'Journal à remplir' }
                return { text: '✓ Journal rempli', color: 'text-emerald-400/80' }
              case 'health':
                return { text: 'Nutrition & poids', color: 'text-rose-400/70' }
              case 'library':
                if (count && count > 0) return { text: `${count} livre${count > 1 ? 's' : ''} en cours`, color: 'text-indigo-400/70' }
                return { text: 'Que lire ?' }
              case 'learning':
                if (count && count > 0) return { text: `${count} cours actif${count > 1 ? 's' : ''}`, color: 'text-purple-400/70' }
                return { text: 'Explorer' }
              case 'connections':
                return { text: 'APIs & intégrations', color: 'text-amber-400/70' }
              default:
                return { text: '' }
            }
          }

          const indicatorData = getIndicatorData()

          // Couleurs selon l'urgence
          const getColors = () => {
            if (isUrgent) {
              if (module.id === 'myday') {
                return 'text-amber-400 hover:text-amber-300'
              }
              if (module.id === 'tasks') {
                return 'text-rose-400 hover:text-rose-300'
              }
            }
            return 'text-zinc-300 hover:text-white'
          }

          return (
            <motion.button
              key={module.id}
              onClick={() => setView(module.id)}
              className={`group flex items-center gap-4 text-2xl md:text-3xl ${getColors()} hover:translate-x-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 rounded-xl px-5 py-3`}
              aria-label={`Accéder à ${module.label}${indicatorData.text ? ` · ${indicatorData.text}` : ''} (touche ${module.shortcut})`}
              tabIndex={0}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.2 + index * 0.03 }}
              whileHover={{ scale: 1.02 }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setView(module.id)
                }
              }}
            >
              {/* Indicateur d'urgence */}
              {isUrgent && (
                <span className="w-3 h-3 rounded-full bg-current animate-pulse" />
              )}
              {module.label}
              <span className={`text-xl md:text-2xl font-medium transition-opacity group-hover:opacity-100 ${
                indicatorData.color || (isUrgent ? 'opacity-90' : 'opacity-50')
              }`}>
                — {indicatorData.text}
              </span>
            </motion.button>
          )
        })}
      </motion.nav>

      {/* Raccourcis clavier — hint discret */}
      <motion.p
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-zinc-700 font-medium tracking-wide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <span className="hidden sm:inline">1-6 pour naviguer · S pour paramètres</span>
        <span className="sm:hidden">Appuie 1-6 ou S</span>
      </motion.p>


    </div>
  )
}
