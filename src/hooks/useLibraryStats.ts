import { Book, ReadingGoal } from '../types/library'
import { useLibraryStatsHook } from './useGlobalStats'

/**
 * Hook optimisé pour calculer les stats de lecture avec cache
 * 
 * @deprecated Utiliser useLibraryStatsHook() de useGlobalStats à la place
 * Ce hook est conservé pour la rétrocompatibilité.
 */
export function useLibraryStats(_books: Book[], _readingGoal: ReadingGoal | null) {
  // Utilise le hook centralisé - les paramètres sont ignorés car
  // useLibraryStatsHook récupère les données directement depuis le store
  return useLibraryStatsHook()
}
