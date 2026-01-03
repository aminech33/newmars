import { useState, useEffect } from 'react'

/**
 * Hook personnalisé pour faire tourner des prompts/messages
 * 
 * Change automatiquement le prompt à intervalle régulier
 * Ne tourne que si la condition est vraie
 * 
 * @param prompts - Tableau de prompts à faire tourner
 * @param condition - Condition pour activer la rotation (ex: champ vide)
 * @param interval - Intervalle en millisecondes (défaut: 8000ms)
 * @returns Le prompt actuel
 * 
 * @example
 * const prompt = useRotatingPrompt(
 *   ["Prompt 1", "Prompt 2", "Prompt 3"],
 *   text.length === 0,
 *   8000
 * )
 */
export function useRotatingPrompt(
  prompts: string[],
  condition: boolean,
  interval: number = 8000
): string {
  const [currentPrompt, setCurrentPrompt] = useState(prompts[0])

  useEffect(() => {
    if (!condition || prompts.length === 0) return

    const timer = setInterval(() => {
      setCurrentPrompt(prev => {
        const currentIndex = prompts.indexOf(prev)
        const nextIndex = (currentIndex + 1) % prompts.length
        return prompts[nextIndex]
      })
    }, interval)

    return () => clearInterval(timer)
  }, [condition, prompts, interval])

  return currentPrompt
}


