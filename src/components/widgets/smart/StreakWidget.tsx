/**
 * 🔥 StreakWidget — Streak le plus long
 * 
 * Affiche le chiffre concret du meilleur streak
 */

import { memo } from 'react'
import { SmartWidget } from '../SmartWidget'
import { useGlobalStats } from '../../../hooks/useGlobalStats'
import { useStore } from '../../../store/useStore'

export const StreakWidget = memo(function StreakWidget() {
  const stats = useGlobalStats()
  const { setView } = useStore()
  
  // Tous les streaks
  const streaks = [
    { name: 'tâches', value: stats.tasks.streak },
    { name: 'habitudes', value: stats.habits.globalStreak },
    { name: 'journal', value: stats.journal.currentStreak },
    { name: 'focus', value: stats.pomodoro.currentStreak },
    { name: 'lecture', value: stats.library.currentStreak },
  ]
  
  const activeStreaks = streaks.filter(s => s.value > 0)
  const longestStreak = streaks.reduce((max, s) => s.value > max.value ? s : max, streaks[0])
  const totalDays = activeStreaks.reduce((sum, s) => sum + s.value, 0)
  
  // Couleur basée sur le nombre de streaks actifs
  const getAccent = (): 'emerald' | 'amber' | 'zinc' => {
    if (activeStreaks.length >= 4) return 'emerald'
    if (activeStreaks.length >= 2) return 'zinc'
    return 'amber'
  }
  
  // Si aucun streak
  if (activeStreaks.length === 0) {
    return (
      <SmartWidget
        title="Continuité"
        main={<span className="text-2xl font-light">0 jour</span>}
        context="aucune série active"
        accent="zinc"
        onTap={() => setView('dashboard')}
      />
    )
  }
  
  return (
    <SmartWidget
      title="Continuité"
      main={<span className="text-2xl font-light">{longestStreak.value} jour{longestStreak.value > 1 ? 's' : ''}</span>}
      context={`${longestStreak.name} · ${activeStreaks.length} série${activeStreaks.length > 1 ? 's' : ''} active${activeStreaks.length > 1 ? 's' : ''}`}
      accent={getAccent()}
      onTap={() => setView('dashboard')}
    />
  )
})

