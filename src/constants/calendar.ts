import { EventType, EventCategory, EventPriority, Recurrence } from '../types/calendar'

export const TYPE_OPTIONS: { value: EventType; label: string; icon: string }[] = [
  { value: 'meeting', label: 'Réunion', icon: '🗓️' },
  { value: 'deadline', label: 'Deadline', icon: '⏰' },
  { value: 'reminder', label: 'Rappel', icon: '🔔' },
  { value: 'birthday', label: 'Anniversaire', icon: '🎂' },
  { value: 'holiday', label: 'Vacances', icon: '🎉' },
  { value: 'custom', label: 'Personnalisé', icon: '📌' },
]

export const CATEGORY_OPTIONS: { value: EventCategory; label: string; color: string }[] = [
  { value: 'work', label: 'Travail', color: 'text-amber-400' },
  { value: 'personal', label: 'Personnel', color: 'text-emerald-400' },
  { value: 'health', label: 'Santé', color: 'text-rose-400' },
  { value: 'social', label: 'Social', color: 'text-cyan-400' },
  { value: 'learning', label: 'Formation', color: 'text-violet-400' },
]

export const PRIORITY_OPTIONS: { value: EventPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Basse', color: 'text-zinc-500' },
  { value: 'medium', label: 'Moyenne', color: 'text-indigo-500' },
  { value: 'high', label: 'Haute', color: 'text-amber-500' },
  { value: 'urgent', label: 'Urgent', color: 'text-rose-500' },
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

