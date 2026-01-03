import { useState, useEffect, useMemo } from 'react'
import { MoodEmoji } from '../types/journal'
import { JournalEntry } from '../types/journal'

/**
 * Hook personnalisé pour gérer l'état d'une entrée de journal
 * 
 * Gère automatiquement :
 * - Chargement des données depuis l'entrée du jour
 * - Validation (minimum 10 caractères)
 * - Détection des changements
 * 
 * @param todayEntry - Entrée du jour (si elle existe)
 * @returns { intention, setIntention, mood, setMood, canSave, hasChanges }
 */
export function useJournalEntry(todayEntry: JournalEntry | undefined) {
  const [intention, setIntention] = useState('')
  const [mood, setMood] = useState<MoodEmoji>('🙂')

  // Auto-load from today's entry
  useEffect(() => {
    if (todayEntry) {
      setIntention(todayEntry.intention || todayEntry.mainGoal || '')
      setMood(todayEntry.moodEmoji || '🙂')
    }
  }, [todayEntry?.id])

  // Validation : minimum 10 caractères
  const canSave = useMemo(() => {
    return intention.trim().length >= 10
  }, [intention])
  
  // Détection des changements
  const hasChanges = useMemo(() => {
    if (!todayEntry) return intention.trim().length > 0
    return (
      intention !== (todayEntry.intention || todayEntry.mainGoal || '') ||
      mood !== (todayEntry.moodEmoji || '🙂')
    )
  }, [intention, mood, todayEntry])

  return { 
    intention, 
    setIntention, 
    mood, 
    setMood, 
    canSave, 
    hasChanges 
  }
}

