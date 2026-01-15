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
 * - Tags éditables
 * - Sections structurées (gratitude, apprentissage, victoire)
 *
 * @param todayEntry - Entrée du jour (si elle existe)
 * @returns États et setters pour toutes les sections du journal
 */
export function useJournalEntry(todayEntry: JournalEntry | undefined) {
  const [intention, setIntention] = useState('')
  const [mood, setMood] = useState<MoodEmoji>('🙂')
  const [tags, setTags] = useState<string[]>([])

  // Sections structurées
  const [gratitudeText, setGratitudeText] = useState('')
  const [learningText, setLearningText] = useState('')
  const [victoryText, setVictoryText] = useState('')

  // Auto-load from today's entry
  useEffect(() => {
    if (todayEntry) {
      setIntention(todayEntry.intention || todayEntry.mainGoal || '')
      setMood(todayEntry.moodEmoji || '🙂')
      setTags(todayEntry.tags || [])
      // Sections structurées
      setGratitudeText(todayEntry.gratitudeText || '')
      setLearningText(todayEntry.learningText || '')
      setVictoryText(todayEntry.victoryText || '')
    }
  }, [todayEntry?.id])

  // Validation : minimum 10 caractères
  const canSave = useMemo(() => {
    return intention.trim().length >= 10
  }, [intention])

  // Comparaison des tags
  const tagsChanged = useMemo(() => {
    const originalTags = todayEntry?.tags || []
    if (tags.length !== originalTags.length) return true
    return tags.some((tag, i) => tag !== originalTags[i])
  }, [tags, todayEntry?.tags])

  // Détection des changements
  const hasChanges = useMemo(() => {
    if (!todayEntry) return intention.trim().length > 0
    return (
      intention !== (todayEntry.intention || todayEntry.mainGoal || '') ||
      mood !== (todayEntry.moodEmoji || '🙂') ||
      tagsChanged ||
      gratitudeText !== (todayEntry.gratitudeText || '') ||
      learningText !== (todayEntry.learningText || '') ||
      victoryText !== (todayEntry.victoryText || '')
    )
  }, [intention, mood, todayEntry, tagsChanged, gratitudeText, learningText, victoryText])

  return {
    intention,
    setIntention,
    mood,
    setMood,
    tags,
    setTags,
    gratitudeText,
    setGratitudeText,
    learningText,
    setLearningText,
    victoryText,
    setVictoryText,
    canSave,
    hasChanges
  }
}


