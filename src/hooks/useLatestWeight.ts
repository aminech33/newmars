import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { WeightEntry } from '../types/health'

/**
 * Récupère le dernier poids enregistré
 * 
 * @param entries - Tableau d'entrées de poids
 * @returns L'entrée de poids la plus récente
 */
export function getLatestWeight(entries: WeightEntry[]): WeightEntry | null {
  if (entries.length === 0) return null
  
  return [...entries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
}

/**
 * Hook personnalisé pour récupérer automatiquement le dernier poids
 * 
 * Met à jour automatiquement le poids actuel à l'ouverture du modal
 * 
 * @param isOpen - État d'ouverture du modal
 * @returns Le poids actuel (0 si aucun poids enregistré)
 */
export function useLatestWeight(isOpen: boolean): number {
  const { weightEntries } = useStore()
  const [currentWeight, setCurrentWeight] = useState(0)

  useEffect(() => {
    if (isOpen && weightEntries.length > 0) {
      const latest = getLatestWeight(weightEntries)
      if (latest) {
        setCurrentWeight(latest.weight)
      }
    }
  }, [isOpen, weightEntries])

  return currentWeight
}

