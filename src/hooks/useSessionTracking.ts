import { useRef, useEffect } from 'react'
import { useStore } from '../store/useStore'

/**
 * Hook pour tracker les sessions d'apprentissage
 * et auto-toggle l'habitude "Apprentissage" après 30min
 */
export function useSessionTracking(activeCourseId: string | null) {
  const { habits, addHabit, toggleHabitToday, addToast } = useStore()
  
  const sessionStartRef = useRef<number | null>(null)
  const habitToggledRef = useRef<boolean>(false)

  // Start session when course is active
  useEffect(() => {
    if (activeCourseId && !sessionStartRef.current) {
      sessionStartRef.current = Date.now()
      habitToggledRef.current = false
    } else if (!activeCourseId) {
      sessionStartRef.current = null
      habitToggledRef.current = false
    }
  }, [activeCourseId])

  // Check for 30min threshold
  useEffect(() => {
    if (!activeCourseId || habitToggledRef.current) return

    const interval = setInterval(() => {
      if (!sessionStartRef.current || habitToggledRef.current) return
      
      const elapsed = Date.now() - sessionStartRef.current
      const thirtyMinutes = 30 * 60 * 1000
      
      if (elapsed >= thirtyMinutes) {
        const today = new Date().toISOString().split('T')[0]
        let learningHabit = habits.find(h => 
          h.name.toLowerCase().includes('apprentissage') || 
          h.name.toLowerCase().includes('cours') ||
          h.name.toLowerCase().includes('learning')
        )
        
        if (!learningHabit) {
          addHabit('Apprentissage')
          setTimeout(() => {
            const newHabit = useStore.getState().habits.find(h => h.name === 'Apprentissage')
            if (newHabit && !newHabit.completedDates.includes(today)) {
              toggleHabitToday(newHabit.id)
              addToast('✅ Habitude "Apprentissage" validée (30min)', 'success')
            }
          }, 100)
        } else if (!learningHabit.completedDates.includes(today)) {
          toggleHabitToday(learningHabit.id)
          addToast('✅ Habitude "Apprentissage" validée (30min)', 'success')
        }
        
        habitToggledRef.current = true
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [activeCourseId, habits, addHabit, toggleHabitToday, addToast])
}

