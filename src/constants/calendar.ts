import { EventType, EventCategory, EventPriority, Recurrence } from '../types/calendar'

export const TYPE_OPTIONS: { value: EventType; label: string; icon: string; description: string }[] = [
  { value: 'meeting', label: 'Réunion', icon: '🗓️', description: 'Rencontre, rendez-vous' },
  { value: 'deadline', label: 'Deadline', icon: '⏰', description: 'Échéance, date limite' },
  { value: 'reminder', label: 'Rappel', icon: '🔔', description: 'Pense-bête, notification' },
  { value: 'birthday', label: 'Anniversaire', icon: '🎂', description: 'Date de naissance' },
  { value: 'holiday', label: 'Vacances', icon: '🎉', description: 'Congés, jour férié' },
  { value: 'custom', label: 'Autre', icon: '📌', description: 'Événement personnalisé' },
]

export const CATEGORY_OPTIONS: { value: EventCategory; label: string; icon: string; color: string; description: string }[] = [
  { value: 'work', label: 'Travail', icon: '💼', color: 'text-amber-400', description: 'Contexte professionnel' },
  { value: 'personal', label: 'Personnel', icon: '🏠', color: 'text-emerald-400', description: 'Vie privée, famille' },
  { value: 'health', label: 'Santé', icon: '💚', color: 'text-rose-400', description: 'Médical, sport, bien-être' },
  { value: 'social', label: 'Social', icon: '👥', color: 'text-cyan-400', description: 'Amis, sorties, loisirs' },
  { value: 'learning', label: 'Formation', icon: '📚', color: 'text-violet-400', description: 'Études, apprentissage' },
]

export const PRIORITY_OPTIONS: { value: EventPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Basse', color: 'text-zinc-500' },
  { value: 'medium', label: 'Moyenne', color: 'text-indigo-400' },
  { value: 'high', label: 'Haute', color: 'text-amber-400' },
  { value: 'urgent', label: 'Urgent', color: 'text-rose-400' },
]

export const FREQUENCY_OPTIONS: { value: Recurrence['frequency']; label: string }[] = [
  { value: 'daily', label: 'Quotidien' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuel' },
  { value: 'yearly', label: 'Annuel' },
]

export const DAYS_OF_WEEK = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mer' },
  { value: 4, label: 'Jeu' },
  { value: 5, label: 'Ven' },
  { value: 6, label: 'Sam' },
  { value: 0, label: 'Dim' },
]

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  work: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  personal: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  health: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  social: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  learning: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
}

export const PRIORITY_COLORS: Record<EventPriority, string> = {
  low: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  medium: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  high: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  urgent: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
}

