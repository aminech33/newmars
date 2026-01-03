import { useState, useMemo } from 'react'
import { JournalEntry } from '../types/journal'

type FilterMode = 'all' | 'favorites'

/**
 * Hook personnalisé pour la recherche et le filtrage d'entrées de journal
 * 
 * Gère automatiquement :
 * - Filtrage par mois
 * - Filtrage par favoris
 * - Recherche textuelle (intention, notes, objectif)
 * - Tri par date décroissante
 * 
 * @param entries - Toutes les entrées de journal
 * @param currentMonth - Mois actuel pour le filtrage
 * @returns { searchQuery, setSearchQuery, filterMode, setFilterMode, filteredEntries }
 * 
 * @example
 * const { searchQuery, setSearchQuery, filteredEntries } = useJournalSearch(entries, currentMonth)
 */
export function useJournalSearch(
  entries: JournalEntry[],
  currentMonth: Date
) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')

  const filteredEntries = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    // Filtre par mois
    let filtered = entries.filter(entry => {
      const entryDate = new Date(entry.date)
      return entryDate.getFullYear() === year && entryDate.getMonth() === month
    })

    // Filtre favoris
    if (filterMode === 'favorites') {
      filtered = filtered.filter(entry => entry.isFavorite)
    }

    // Recherche textuelle
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(entry => 
        (entry.intention?.toLowerCase().includes(query)) ||
        (entry.freeNotes?.toLowerCase().includes(query)) ||
        (entry.mainGoal?.toLowerCase().includes(query)) ||
        (entry.reflection?.toLowerCase().includes(query))
      )
    }
    
    // Tri par date décroissante
    return filtered.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [entries, currentMonth, searchQuery, filterMode])

  return {
    searchQuery,
    setSearchQuery,
    filterMode,
    setFilterMode,
    filteredEntries
  }
}


