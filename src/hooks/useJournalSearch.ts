import { useState, useMemo } from 'react'
import { JournalEntry } from '../types/journal'
import { useDebounce } from './useDebounce'

type FilterMode = 'all' | 'favorites'

/**
 * Hook personnalisé pour la recherche et le filtrage d'entrées de journal
 *
 * Gère automatiquement :
 * - Filtrage par mois
 * - Filtrage par favoris
 * - Recherche textuelle avec debounce (300ms)
 * - Tri par date décroissante
 *
 * @param entries - Toutes les entrées de journal
 * @param currentMonth - Mois actuel pour le filtrage
 * @returns { searchQuery, setSearchQuery, filterMode, setFilterMode, filteredEntries, isSearching }
 *
 * @example
 * const { searchQuery, setSearchQuery, filteredEntries, isSearching } = useJournalSearch(entries, currentMonth)
 */
export function useJournalSearch(
  entries: JournalEntry[],
  currentMonth: Date
) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')

  // Debounce la recherche pour éviter les recalculs à chaque frappe
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const isSearching = searchQuery !== debouncedSearchQuery

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

    // Recherche textuelle (avec valeur debouncée)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = filtered.filter(entry =>
        (entry.intention?.toLowerCase().includes(query)) ||
        (entry.freeNotes?.toLowerCase().includes(query)) ||
        (entry.mainGoal?.toLowerCase().includes(query)) ||
        (entry.reflection?.toLowerCase().includes(query)) ||
        // Nouvelles sections structurées
        (entry.gratitudeText?.toLowerCase().includes(query)) ||
        (entry.learningText?.toLowerCase().includes(query)) ||
        (entry.victoryText?.toLowerCase().includes(query)) ||
        // Tags
        (entry.tags?.some(tag => tag.toLowerCase().includes(query)))
      )
    }

    // Tri par date décroissante
    return filtered.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [entries, currentMonth, debouncedSearchQuery, filterMode])

  return {
    searchQuery,
    setSearchQuery,
    filterMode,
    setFilterMode,
    filteredEntries,
    isSearching
  }
}


