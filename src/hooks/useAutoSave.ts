import { useEffect, useRef } from 'react'

/**
 * Hook personnalisé pour l'auto-save avec debounce
 * 
 * Exécute automatiquement un callback après un délai si les dépendances changent
 * Annule le timer précédent si les dépendances changent avant la fin du délai
 * 
 * @param callback - Fonction à exécuter
 * @param dependencies - Dépendances à surveiller
 * @param enabled - Active/désactive l'auto-save
 * @param delay - Délai en millisecondes (défaut: 3000ms)
 * 
 * @example
 * useAutoSave(
 *   () => saveData(),
 *   [data],
 *   hasChanges && isValid,
 *   3000
 * )
 */
export function useAutoSave(
  callback: () => void,
  dependencies: any[],
  enabled: boolean,
  delay: number = 3000
) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!enabled) return
    
    // Clear previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    
    // Set new timer
    timerRef.current = setTimeout(callback, delay)
    
    // Cleanup on unmount or dependency change
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [...dependencies, enabled, callback, delay])
}

