import { useState, useCallback, useMemo } from 'react'

/**
 * Hook personnalisé pour la navigation entre les mois
 * 
 * Gère automatiquement :
 * - État du mois actuel
 * - Navigation mois précédent/suivant
 * - Retour au mois actuel
 * - Formatage du mois en français
 * 
 * @returns { currentMonth, formattedMonth, handlePrevMonth, handleNextMonth, handleToday }
 * 
 * @example
 * const { currentMonth, formattedMonth, handlePrevMonth, handleNextMonth } = useMonthNavigation()
 */
export function useMonthNavigation() {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))
  }, [])

  const handleNextMonth = useCallback(() => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))
  }, [])

  const handleToday = useCallback(() => {
    setCurrentMonth(new Date())
  }, [])

  // Format: "Janvier 2026"
  const formattedMonth = useMemo(() => {
    const monthName = currentMonth.toLocaleDateString('fr-FR', { 
      month: 'long', 
      year: 'numeric' 
    })
    return monthName.charAt(0).toUpperCase() + monthName.slice(1)
  }, [currentMonth])

  return {
    currentMonth,
    formattedMonth,
    handlePrevMonth,
    handleNextMonth,
    handleToday
  }
}


