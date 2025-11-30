import { Event, Recurrence } from '../types/calendar'
import { addDays } from './dateUtils'

/**
 * Génère toutes les instances d'un événement récurrent
 */
export function generateRecurringInstances(baseEvent: Event, maxInstances: number = 52): Event[] {
  if (!baseEvent.isRecurring || !baseEvent.recurrence) {
    return [baseEvent]
  }

  const instances: Event[] = []
  const { frequency, interval, endDate, daysOfWeek } = baseEvent.recurrence
  const startDate = new Date(baseEvent.startDate)
  const endDateLimit = endDate ? new Date(endDate) : addDays(startDate, 365) // Max 1 year if no end date
  
  let currentDate = new Date(startDate)
  let instanceCount = 0

  while (currentDate <= endDateLimit && instanceCount < maxInstances) {
    // Check if this date matches the recurrence pattern
    let shouldInclude = true

    if (frequency === 'weekly' && daysOfWeek && daysOfWeek.length > 0) {
      shouldInclude = daysOfWeek.includes(currentDate.getDay())
    }

    if (shouldInclude) {
      instances.push({
        ...baseEvent,
        id: `${baseEvent.id}-${currentDate.toISOString().split('T')[0]}`,
        startDate: currentDate.toISOString().split('T')[0],
        endDate: baseEvent.endDate ? addDays(currentDate, 
          Math.ceil((new Date(baseEvent.endDate).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        ).toISOString().split('T')[0] : undefined,
      })
      instanceCount++
    }

    // Move to next occurrence
    switch (frequency) {
      case 'daily':
        currentDate = addDays(currentDate, interval)
        break
      case 'weekly':
        currentDate = addDays(currentDate, 1) // Check each day for weekly pattern
        break
      case 'monthly':
        currentDate = new Date(currentDate)
        currentDate.setMonth(currentDate.getMonth() + interval)
        break
      case 'yearly':
        currentDate = new Date(currentDate)
        currentDate.setFullYear(currentDate.getFullYear() + interval)
        break
    }
  }

  return instances
}

/**
 * Vérifie si un événement est une instance récurrente
 */
export function isRecurringInstance(eventId: string): boolean {
  return eventId.includes('-')
}

/**
 * Extrait l'ID de base d'une instance récurrente
 */
export function getBaseEventId(eventId: string): string {
  return eventId.split('-')[0]
}

/**
 * Obtient la date d'une instance récurrente
 */
export function getInstanceDate(eventId: string): string | null {
  const parts = eventId.split('-')
  if (parts.length > 1) {
    return parts.slice(1).join('-')
  }
  return null
}

/**
 * Crée une description lisible de la récurrence
 */
export function getRecurrenceDescription(recurrence: Recurrence): string {
  const { frequency, interval, daysOfWeek, endDate } = recurrence
  
  let description = ''
  
  // Frequency
  switch (frequency) {
    case 'daily':
      description = interval === 1 ? 'Tous les jours' : `Tous les ${interval} jours`
      break
    case 'weekly':
      if (interval === 1) {
        if (daysOfWeek && daysOfWeek.length > 0) {
          const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
          const selectedDays = daysOfWeek.map(d => dayNames[d]).join(', ')
          description = `Chaque ${selectedDays}`
        } else {
          description = 'Chaque semaine'
        }
      } else {
        description = `Toutes les ${interval} semaines`
      }
      break
    case 'monthly':
      description = interval === 1 ? 'Chaque mois' : `Tous les ${interval} mois`
      break
    case 'yearly':
      description = interval === 1 ? 'Chaque année' : `Tous les ${interval} ans`
      break
  }
  
  // End date
  if (endDate) {
    const date = new Date(endDate)
    description += ` jusqu'au ${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
  }
  
  return description
}

/**
 * Calcule le nombre total d'instances pour une récurrence
 */
export function calculateTotalInstances(startDate: string, recurrence: Recurrence): number {
  const start = new Date(startDate)
  const end = recurrence.endDate ? new Date(recurrence.endDate) : addDays(start, 365)
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  
  switch (recurrence.frequency) {
    case 'daily':
      return Math.floor(diffDays / recurrence.interval)
    case 'weekly':
      const weeks = Math.floor(diffDays / 7 / recurrence.interval)
      return recurrence.daysOfWeek ? weeks * recurrence.daysOfWeek.length : weeks
    case 'monthly':
      return Math.floor(diffDays / 30 / recurrence.interval)
    case 'yearly':
      return Math.floor(diffDays / 365 / recurrence.interval)
    default:
      return 1
  }
}

/**
 * Vérifie si une date correspond à un pattern de récurrence
 */
export function matchesRecurrencePattern(date: Date, startDate: Date, recurrence: Recurrence): boolean {
  const diffTime = date.getTime() - startDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  switch (recurrence.frequency) {
    case 'daily':
      return diffDays % recurrence.interval === 0
    case 'weekly':
      if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
        return recurrence.daysOfWeek.includes(date.getDay())
      }
      return diffDays % (7 * recurrence.interval) === 0
    case 'monthly':
      return date.getDate() === startDate.getDate() && 
             (date.getMonth() - startDate.getMonth()) % recurrence.interval === 0
    case 'yearly':
      return date.getDate() === startDate.getDate() && 
             date.getMonth() === startDate.getMonth() &&
             (date.getFullYear() - startDate.getFullYear()) % recurrence.interval === 0
    default:
      return false
  }
}
