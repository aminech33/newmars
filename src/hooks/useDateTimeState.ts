import { useState, useEffect } from 'react'

/**
 * Hook personnalisé pour gérer l'état date/heure avec reset automatique
 * 
 * Initialise automatiquement date et heure à la date actuelle
 * Reset automatiquement à l'ouverture du modal
 * 
 * @param isOpen - État d'ouverture du modal
 * @returns { date, setDate, time, setTime }
 */
export function useDateTimeState(isOpen: boolean) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5))

  // Reset à la date/heure actuelle à l'ouverture
  useEffect(() => {
    if (isOpen) {
      const now = new Date()
      setDate(now.toISOString().split('T')[0])
      setTime(now.toTimeString().slice(0, 5))
    }
  }, [isOpen])

  return { date, setDate, time, setTime }
}

