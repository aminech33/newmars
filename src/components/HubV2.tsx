/**
 * 🏠 HubV2 — Command Center
 * 
 * Design : Dashboard actionnable, beau et pratique
 */

import { useStore } from '../store/useStore'
import { useBrain } from '../brain'
import { useState, useMemo } from 'react'
import { Timer, CheckCircle, Heart, Flame, Info } from 'lucide-react'
import { PomodoroOverlay } from './pomodoro/PomodoroOverlay'
import { motion } from 'framer-motion'

const fontStack = 'font-[Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,SF_Pro_Display,Segoe_UI,Roboto,sans-serif]'

// Configuration des piliers avec icônes SVG
const PILLARS = [
  { 
    key: 'productivity' as const, 
    label: 'Productivité', 
    Icon: CheckCircle, 
    color: 'text-emerald-400' 
  },
  { 
    key: 'mental' as const, 
    label: 'Mental', 
    Icon: Heart, 
    color: 'text-blue-400' 
  },
  { 
    key: 'consistency' as const, 
    label: 'Constance', 
    Icon: Flame, 
    color: 'text-amber-400' 
  },
]

export function HubV2() {
  const setView = useStore((state) => state.setView)
  const tasks = useStore((state) => state.tasks)
  const habits = useStore((state) => state.habits)
  const toggleTask = useStore((state) => state.toggleTask)
  const toggleHabitToday = useStore((state) => state.toggleHabitToday)
  const { wellbeing } = useBrain()
  
  // État pour le Pomodoro Overlay
  const [activePomodoroTask, setActivePomodoroTask] = useState<any>(null)
  
  // États locaux pour Optimistic UI (feedback immédiat)
  const [optimisticTaskStates, setOptimisticTaskStates] = useState<Record<string, boolean>>({})
  const [optimisticHabitStates, setOptimisticHabitStates] = useState<Record<string, boolean>>({})
  
  const today = new Date()
  const dateStr = today.toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  })
  const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)
  
  const hour = today.getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  
  const todayStr = today.toISOString().split('T')[0]
  
  // Top 3 tâches non terminées (INTELLIGENT : priorité + urgence + focusScore)
  // Memoïsé pour éviter le re-calcul à chaque render
  const topTasks = useMemo(() => {
    const allPendingTasks = tasks.filter(t => !t.completed)
    
    // Tri intelligent
    const sortedTasks = [...allPendingTasks].sort((a, b) => {
      // 1. Tâches prioritaires (isPriority) d'abord
      if (a.isPriority && !b.isPriority) return -1
      if (!a.isPriority && b.isPriority) return 1
      
      // 2. Tâches en retard (dueDate dépassée)
      const now = new Date()
      const aOverdue = a.dueDate && new Date(a.dueDate) < now
      const bOverdue = b.dueDate && new Date(b.dueDate) < now
      if (aOverdue && !bOverdue) return -1
      if (!aOverdue && bOverdue) return 1
      
      // 3. Focus Score (calculé par taskIntelligence.ts)
      const aScore = a.focusScore || 0
      const bScore = b.focusScore || 0
      if (aScore !== bScore) return bScore - aScore
      
      // 4. Date de création (plus ancien = plus prioritaire)
      return a.createdAt - b.createdAt
    })
    
    return sortedTasks.slice(0, 3)
  }, [tasks])
  
  const allPendingTasks = tasks.filter(t => !t.completed)
  const nextTask = topTasks[0] // La tâche VRAIMENT la plus importante
  const otherTasks = topTasks.slice(1)
  
  // Habitudes du jour (Memoïsées)
  const todayHabits = useMemo(() => {
    return habits.map(h => ({
      ...h,
      done: h.completedDates?.includes(todayStr) || false
    })).slice(0, 3)
  }, [habits, todayStr])
  
  const pendingCount = allPendingTasks.length
  
  // Stats quotidiennes pour mini compteur
  const completedTasksToday = useMemo(() => {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    return tasks.filter(t => 
      t.completed && t.createdAt && t.createdAt >= startOfDay.getTime()
    ).length
  }, [tasks])
  
  const totalTasksToday = tasks.filter(t => {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    return t.createdAt && t.createdAt >= startOfDay.getTime()
  }).length
  
  const completedHabitsToday = todayHabits.filter(h => h.done).length
  const totalHabitsToday = todayHabits.length
  
  // Contexte du score (qualificatif + conseil)
  const getScoreLabel = (score: number) => {
    if (score >= 80) return { 
      text: 'Excellent', 
      color: 'text-emerald-500',
      advice: 'Tu es au top ! Continue comme ça 🔥'
    }
    if (score >= 65) return { 
      text: 'Très bien', 
      color: 'text-emerald-400',
      advice: 'Excellent rythme, maintiens-le !'
    }
    if (score >= 50) return { 
      text: 'Bien', 
      color: 'text-zinc-400',
      advice: 'Bon équilibre, continue tes efforts'
    }
    if (score >= 35) return { 
      text: 'Correct', 
      color: 'text-amber-400',
      advice: 'Focalise-toi sur une tâche prioritaire'
    }
    return { 
      text: 'Fragile', 
      color: 'text-amber-500',
      advice: 'Prends une pause, fais une habitude simple'
    }
  }
  
  const scoreLabel = getScoreLabel(wellbeing.overall)
  
  // Handlers avec Optimistic UI
  const handleToggleTask = (taskId: string) => {
    setOptimisticTaskStates(prev => ({ ...prev, [taskId]: true }))
    toggleTask(taskId)
    // Reset après animation
    setTimeout(() => {
      setOptimisticTaskStates(prev => {
        const newState = { ...prev }
        delete newState[taskId]
        return newState
      })
    }, 300)
  }
  
  const handleToggleHabit = (habitId: string) => {
    setOptimisticHabitStates(prev => ({ ...prev, [habitId]: !prev[habitId] }))
    toggleHabitToday(habitId)
    // Reset après animation
    setTimeout(() => {
      setOptimisticHabitStates(prev => {
        const newState = { ...prev }
        delete newState[habitId]
        return newState
      })
    }, 300)
  }

  return (
    <div className="min-h-screen bg-black p-6">
      
      {/* Container principal */}
      <div className="max-w-5xl mx-auto relative">
        
        {/* Mini compteur progrès quotidien - COIN SUPÉRIEUR DROIT */}
        {(totalTasksToday > 0 || totalHabitsToday > 0) && (
          <div className={`absolute top-0 right-0 text-right space-y-0.5 ${fontStack}`}>
            {totalTasksToday > 0 && (
              <p className="text-[11px] text-zinc-600">
                <span className="text-emerald-400 font-medium">{completedTasksToday}</span>
                <span className="text-zinc-700">/</span>
                <span className="font-medium">{totalTasksToday}</span>
                <span className="ml-1">tâches</span>
              </p>
            )}
            {totalHabitsToday > 0 && (
              <p className="text-[11px] text-zinc-600">
                <span className="text-emerald-400 font-medium">{completedHabitsToday}</span>
                <span className="text-zinc-700">/</span>
                <span className="font-medium">{totalHabitsToday}</span>
                <span className="ml-1">habitudes</span>
              </p>
            )}
          </div>
        )}
        
        {/* Date & Greeting - COIN SUPÉRIEUR GAUCHE */}
        <div className="mb-10">
          <p className={`text-[11px] uppercase tracking-[0.2em] text-zinc-600 mb-1.5 font-medium ${fontStack}`}>
            {formattedDate}
          </p>
          <h1 className={`text-[32px] leading-tight text-zinc-400 font-light tracking-[-0.01em] ${fontStack}`}>
            {greeting}, Amine
          </h1>
        </div>
        
        {/* Score + Label - CENTRE (focal point) */}
        <motion.div 
          className="flex flex-col items-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <motion.span 
              className={`text-[96px] leading-none font-extralight tracking-[-0.03em] text-zinc-300 ${fontStack}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            >
              {wellbeing.overall}
            </motion.span>
            {wellbeing.trend !== 'stable' && (
              <motion.span 
                className={`text-[24px] ${
                  wellbeing.trend === 'improving' ? 'text-emerald-400' : 'text-rose-400'
                }`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                {wellbeing.trend === 'improving' ? '↗' : '↘'}
              </motion.span>
            )}
          </div>
          <motion.div 
            className="flex items-center gap-2 mb-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <span className={`text-[18px] font-medium tracking-wide ${scoreLabel.color} ${fontStack}`}>
              {scoreLabel.text}
            </span>
            <button
              className="text-zinc-600 hover:text-zinc-500 transition-colors"
              title="Détails du score ci-dessous"
              aria-label="Voir les détails du score dans la section breakdown"
            >
              <Info className="w-4 h-4" />
            </button>
          </motion.div>
          {scoreLabel.advice && (
            <motion.p 
              className={`text-[13px] text-zinc-600 mt-1 text-center ${fontStack}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              💡 {scoreLabel.advice}
            </motion.p>
          )}
        </motion.div>
        
        {/* Breakdown - CENTRE (compact) */}
        <div className="flex gap-10 items-end justify-center mb-9">
          {PILLARS.map((pillar, index) => {
            const value = wellbeing.breakdown[pillar.key]
            const pct = (value / 33) * 100
            
            return (
              <motion.button
                key={pillar.key} 
                className="flex flex-col items-center gap-2 group cursor-help focus:outline-none focus:ring-2 focus:ring-zinc-500/50 focus:ring-offset-2 focus:ring-offset-black rounded-lg p-2 -m-2"
                title={`${pillar.label}: ${value}/33`}
                role="button"
                aria-label={`${pillar.label}: ${value} sur 33`}
                tabIndex={0}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 + index * 0.1, ease: 'easeOut' }}
              >
                <pillar.Icon className={`w-5 h-5 ${pillar.color} group-hover:scale-110 transition-transform`} />
                
                <div className="w-24 h-2 bg-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-zinc-600/50 group-hover:bg-zinc-500/60 rounded-full transition-all duration-200"
                    style={{ width: `${pct}%` }}
                    role="progressbar"
                    aria-valuenow={value}
                    aria-valuemin={0}
                    aria-valuemax={33}
                  />
                </div>
                
                <span className={`text-[16px] text-zinc-500 group-hover:text-zinc-400 tabular-nums font-medium transition-colors ${fontStack}`}>
                  {value}
                </span>
                
                <span className={`text-[12px] uppercase tracking-[0.1em] text-zinc-600 font-medium ${fontStack}`}>
                  {pillar.label}
                </span>
              </motion.button>
            )
          })}
        </div>
        
        {/* Actions - CENTRE (max-width élargie) */}
        <div className="max-w-2xl mx-auto space-y-4">
        
        {/* Tâches du jour */}
        {topTasks.length > 0 ? (
          <div>
            <p className={`text-[12px] uppercase tracking-[0.15em] text-zinc-600 mb-2 ml-1 font-medium ${fontStack}`}>
              Aujourd'hui
            </p>
            <div className="space-y-1.5">
              
              {/* Tâche principale mise en avant */}
              {nextTask && (
                <div className="relative group">
                  <button
                    onClick={() => handleToggleTask(nextTask.id)}
                    className={`
                      w-full h-14 px-4 flex items-center justify-between
                      bg-emerald-500/10 hover:bg-emerald-500/15
                      border border-emerald-500/30
                      rounded-lg
                      transition-all duration-150 ease-out
                      focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-black
                      ${optimisticTaskStates[nextTask.id] ? 'opacity-50 scale-[0.98]' : ''}
                      ${fontStack}
                    `}
                    aria-label={`Marquer "${nextTask.title}" comme complétée`}
                    title={nextTask.title}
                    disabled={optimisticTaskStates[nextTask.id]}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-[17px] text-emerald-300 group-hover:text-emerald-200 transition-colors truncate font-medium pr-12">
                        {nextTask.title}
                      </span>
                      {nextTask.dueDate && new Date(nextTask.dueDate) < new Date() && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-medium whitespace-nowrap">
                          ⚠️ En retard
                        </span>
                      )}
                    </div>
                    <div 
                      className={`
                        w-5 h-5 rounded-full border-[1.5px] flex-shrink-0 border-emerald-400 group-hover:scale-110 transition-all
                        ${optimisticTaskStates[nextTask.id] ? 'bg-emerald-400 scale-110' : ''}
                      `}
                      role="checkbox"
                      aria-checked={optimisticTaskStates[nextTask.id] || false}
                      aria-hidden="true"
                    />
                  </button>
                  
                  {/* Bouton Pomodoro (toujours visible) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setActivePomodoroTask(nextTask)
                    }}
                    className="
                      absolute right-12 top-1/2 -translate-y-1/2
                      opacity-70 group-hover:opacity-100
                      w-9 h-9 rounded-full
                      bg-emerald-500/15 hover:bg-emerald-500/25
                      flex items-center justify-center
                      transition-all duration-150
                      focus:outline-none focus:ring-2 focus:ring-emerald-500/50
                    "
                    aria-label="Lancer un Pomodoro de 25 minutes"
                    title="Lancer un Pomodoro (25min)"
                  >
                    <Timer className="w-4 h-4 text-emerald-400" />
                  </button>
                </div>
              )}
              
              {/* Autres tâches (secondaires) */}
              {otherTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  className={`
                    group w-full h-11 px-4 flex items-center justify-between
                    bg-zinc-950/30 hover:bg-zinc-900/30
                    border border-zinc-800/30
                    rounded-lg
                    transition-all duration-150 ease-out
                    focus:outline-none focus:ring-2 focus:ring-zinc-500/50 focus:ring-offset-2 focus:ring-offset-black
                    ${optimisticTaskStates[task.id] ? 'opacity-50 scale-[0.98]' : ''}
                    ${fontStack}
                  `}
                  aria-label={`Marquer "${task.title}" comme complétée`}
                  title={task.title}
                  disabled={optimisticTaskStates[task.id]}
                >
                  <span className="text-[15px] text-zinc-500 group-hover:text-zinc-400 transition-colors truncate">
                    {task.title}
                  </span>
                  <div 
                    className={`
                      w-4 h-4 rounded-full border-[1.5px] flex-shrink-0
                      ${task.isPriority ? 'border-amber-500/40' : 'border-zinc-700'}
                      group-hover:scale-110 transition-all
                      ${optimisticTaskStates[task.id] ? 'bg-emerald-400 border-emerald-400 scale-110' : ''}
                    `}
                    role="checkbox"
                    aria-checked={optimisticTaskStates[task.id] || false}
                    aria-hidden="true"
                  />
                </button>
              ))}
              
            </div>
          </div>
        ) : (
          // État vide élégant
          <div className="text-center py-8">
            <p className={`text-[16px] text-zinc-500 mb-1 font-medium ${fontStack}`}>
              Aucune tâche aujourd'hui
            </p>
            <p className={`text-[14px] text-zinc-600 ${fontStack}`}>
              Profite de ta journée libre ✨
            </p>
          </div>
        )}
        
        {/* Habitudes */}
        {todayHabits.length > 0 && (
          <div>
            <p className={`text-[12px] uppercase tracking-[0.15em] text-zinc-600 mb-2 ml-1 font-medium ${fontStack}`}>
              Habitudes
            </p>
            <div className="flex gap-2">
              {todayHabits.map((habit) => {
                // Calculer le streak (jours consécutifs)
                const streak = habit.completedDates?.length || 0
                
                // Calculer les jours depuis dernière completion
                const lastDate = habit.completedDates?.[habit.completedDates.length - 1]
                const daysSinceLastCompletion = lastDate 
                  ? Math.floor((new Date().getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24))
                  : 999
                
                const isOptimisticallyDone = optimisticHabitStates[habit.id] !== undefined 
                  ? optimisticHabitStates[habit.id] 
                  : habit.done
                
                return (
                  <button
                    key={habit.id}
                    onClick={() => handleToggleHabit(habit.id)}
                    title={`${habit.name || 'Habitude'} (${streak} jour${streak > 1 ? 's' : ''})`}
                    aria-label={`${habit.name || 'Habitude'}: ${isOptimisticallyDone ? 'complétée' : 'non complétée'}. ${streak} jours consécutifs.`}
                    className={`
                      relative flex-1 h-12 px-3 flex items-center justify-center
                      rounded-lg
                      transition-all duration-150
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black
                      ${isOptimisticallyDone 
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 focus:ring-emerald-500/50' 
                        : 'bg-zinc-950/30 border border-zinc-800/30 text-zinc-500 hover:text-zinc-400 focus:ring-zinc-500/50'
                      }
                      text-[15px] ${fontStack}
                    `}
                    role="checkbox"
                    aria-checked={isOptimisticallyDone}
                  >
                    {habit.icon || '•'}
                    
                    {/* Badge streak si >= 3 jours */}
                    {streak >= 3 && (
                      <span 
                        className="absolute -top-1 -right-1 min-w-[18px] h-5 text-[10px] font-bold bg-amber-500 text-black px-1.5 rounded-full flex items-center justify-center"
                        aria-label={`${streak} jours de suite`}
                      >
                        {streak}
                      </span>
                    )}
                    
                    {/* Badge négatif si > 3 jours sans complétion */}
                    {!isOptimisticallyDone && daysSinceLastCompletion > 3 && daysSinceLastCompletion < 999 && (
                      <span 
                        className="absolute -top-1 -right-1 min-w-[18px] h-5 text-[10px] font-bold bg-rose-500/30 text-rose-400 px-1.5 rounded-full flex items-center justify-center border border-rose-500/50"
                        aria-label={`${daysSinceLastCompletion} jours sans complétion`}
                      >
                        {daysSinceLastCompletion}j
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
        
        </div>
        
        {/* Navigation secondaire */}
        <div className="max-w-2xl mx-auto pt-6 space-y-1">
          {pendingCount > 3 && (
            <button
              onClick={() => setView('tasks')}
              className={`
                w-full h-11 px-4 flex items-center justify-between
                text-zinc-500 hover:text-zinc-400
                text-[15px]
                transition-colors duration-150
                focus:outline-none focus:ring-2 focus:ring-zinc-500/50 focus:ring-offset-2 focus:ring-offset-black
                rounded-lg
                ${fontStack}
              `}
              aria-label={`Voir toutes les ${pendingCount} tâches`}
            >
              <span>Voir toutes les tâches</span>
              <span className="text-[13px] text-zinc-600 font-medium">
                {pendingCount}
              </span>
            </button>
          )}
          <button
            onClick={() => setView('myday')}
            className={`
              w-full h-11 px-4 flex items-center
              text-zinc-500 hover:text-zinc-400
              text-[15px] text-left
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-zinc-500/50 focus:ring-offset-2 focus:ring-offset-black
              rounded-lg
              ${fontStack}
            `}
          >
            Ma journée
          </button>
          <button
            onClick={() => setView('learning')}
            className={`
              w-full h-11 px-4 flex items-center
              text-zinc-500 hover:text-zinc-400
              text-[15px] text-left
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-zinc-500/50 focus:ring-offset-2 focus:ring-offset-black
              rounded-lg
              ${fontStack}
            `}
          >
            Apprentissage
          </button>
        </div>
      </div>
      
      {/* Pomodoro Overlay */}
      {activePomodoroTask && (
        <PomodoroOverlay
          task={activePomodoroTask}
          onClose={() => setActivePomodoroTask(null)}
          onComplete={() => {
            toggleTask(activePomodoroTask.id)
            setActivePomodoroTask(null)
          }}
        />
      )}
      
    </div>
  )
}
