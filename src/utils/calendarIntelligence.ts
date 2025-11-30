import { Event, EventType, EventCategory, EventPriority } from '../types/calendar'
import { isToday, isTomorrow, isPast, getTimeUntil } from './dateUtils'

// Mots-clés pour la détection automatique
const MEETING_KEYWORDS = ['réunion', 'meeting', 'call', 'rendez-vous', 'rdv', 'entretien', 'interview']
const DEADLINE_KEYWORDS = ['deadline', 'échéance', 'rendu', 'livraison', 'fin', 'terminer']
const BIRTHDAY_KEYWORDS = ['anniversaire', 'birthday', 'fête']
const REMINDER_KEYWORDS = ['rappel', 'reminder', 'penser', 'ne pas oublier']

const WORK_KEYWORDS = ['réunion', 'meeting', 'client', 'projet', 'présentation', 'travail']
const PERSONAL_KEYWORDS = ['perso', 'personnel', 'famille', 'ami', 'vacances']
const HEALTH_KEYWORDS = ['médecin', 'docteur', 'rdv médical', 'santé', 'sport', 'gym']
const SOCIAL_KEYWORDS = ['dîner', 'déjeuner', 'soirée', 'fête', 'sortie']
const LEARNING_KEYWORDS = ['cours', 'formation', 'apprendre', 'étudier', 'conférence']

/**
 * Détecte automatiquement le type d'événement
 */
export function detectEventType(title: string): EventType {
  const lowerTitle = title.toLowerCase()
  
  if (BIRTHDAY_KEYWORDS.some(kw => lowerTitle.includes(kw))) return 'birthday'
  if (DEADLINE_KEYWORDS.some(kw => lowerTitle.includes(kw))) return 'deadline'
  if (MEETING_KEYWORDS.some(kw => lowerTitle.includes(kw))) return 'meeting'
  if (REMINDER_KEYWORDS.some(kw => lowerTitle.includes(kw))) return 'reminder'
  
  return 'custom'
}

/**
 * Détecte automatiquement la catégorie
 */
export function detectEventCategory(title: string): EventCategory {
  const lowerTitle = title.toLowerCase()
  
  if (HEALTH_KEYWORDS.some(kw => lowerTitle.includes(kw))) return 'health'
  if (SOCIAL_KEYWORDS.some(kw => lowerTitle.includes(kw))) return 'social'
  if (LEARNING_KEYWORDS.some(kw => lowerTitle.includes(kw))) return 'learning'
  if (PERSONAL_KEYWORDS.some(kw => lowerTitle.includes(kw))) return 'personal'
  if (WORK_KEYWORDS.some(kw => lowerTitle.includes(kw))) return 'work'
  
  return 'work' // Par défaut
}

/**
 * Détecte la priorité basée sur le titre et la date
 */
export function detectEventPriority(title: string, startDate: string): EventPriority {
  const lowerTitle = title.toLowerCase()
  
  // Urgent si contient des mots-clés
  if (lowerTitle.includes('urgent') || lowerTitle.includes('asap') || lowerTitle.includes('critique')) {
    return 'urgent'
  }
  
  // Haute priorité si deadline proche
  if (isToday(startDate) || isTomorrow(startDate)) {
    return 'high'
  }
  
  // Haute priorité si contient "important"
  if (lowerTitle.includes('important')) {
    return 'high'
  }
  
  return 'medium'
}

/**
 * Détecte les conflits entre événements
 */
export function detectConflicts(event: Event, allEvents: Event[]): Event[] {
  if (!event.startTime || !event.endTime) return []
  
  const conflicts: Event[] = []
  const eventStart = new Date(`${event.startDate}T${event.startTime}`)
  const eventEnd = new Date(`${event.startDate}T${event.endTime}`)
  
  allEvents.forEach(other => {
    if (other.id === event.id || !other.startTime || !other.endTime) return
    if (other.startDate !== event.startDate) return
    
    const otherStart = new Date(`${other.startDate}T${other.startTime}`)
    const otherEnd = new Date(`${other.startDate}T${other.endTime}`)
    
    // Vérifie le chevauchement
    if (eventStart < otherEnd && eventEnd > otherStart) {
      conflicts.push(other)
    }
  })
  
  return conflicts
}

/**
 * Génère des suggestions intelligentes
 */
export function generateSmartSuggestions(events: Event[]): string[] {
  const suggestions: string[] = []
  const now = new Date()
  const currentHour = now.getHours()
  
  // Événements aujourd'hui
  const todayEvents = events.filter(e => isToday(e.startDate) && !e.completed)
  if (todayEvents.length > 0) {
    const meetingsToday = todayEvents.filter(e => e.type === 'meeting').length
    if (meetingsToday >= 3) {
      suggestions.push(`🗓️ ${meetingsToday} réunions aujourd'hui - bloquer du temps pour focus ?`)
    }
  }
  
  // Deadlines proches
  const upcomingDeadlines = events.filter(e => 
    e.type === 'deadline' && 
    !e.completed && 
    (isToday(e.startDate) || isTomorrow(e.startDate))
  )
  if (upcomingDeadlines.length > 0) {
    const deadline = upcomingDeadlines[0]
    const timeUntil = getTimeUntil(deadline.startDate, deadline.startTime)
    suggestions.push(`⏰ Deadline "${deadline.title}" ${timeUntil} - activer le mode focus ?`)
  }
  
  // Anniversaires demain
  const birthdaysTomorrow = events.filter(e => 
    e.type === 'birthday' && 
    isTomorrow(e.startDate)
  )
  if (birthdaysTomorrow.length > 0) {
    suggestions.push(`🎂 Anniversaire demain - préparer un cadeau ?`)
  }
  
  // Semaine chargée
  const thisWeekEvents = events.filter(e => {
    const eventDate = new Date(e.startDate)
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)
    return eventDate >= weekStart && eventDate < weekEnd && !e.completed
  })
  if (thisWeekEvents.length > 15) {
    suggestions.push(`📊 Semaine chargée (${thisWeekEvents.length} événements) - reporter les non-urgents ?`)
  }
  
  // Suggestion de temps de focus
  if (currentHour >= 9 && currentHour < 11 && todayEvents.length === 0) {
    suggestions.push(`🧠 Pas d'événements ce matin - parfait pour du deep work !`)
  }
  
  // Événements passés non complétés
  const overdueEvents = events.filter(e => isPast(e.startDate) && !e.completed)
  if (overdueEvents.length > 0) {
    suggestions.push(`📌 ${overdueEvents.length} événement(s) passé(s) - marquer comme terminé ?`)
  }
  
  return suggestions
}

/**
 * Analyse la charge de travail par jour
 */
export function analyzeWorkload(events: Event[], date: string): {
  count: number
  duration: number
  level: 'light' | 'moderate' | 'heavy'
} {
  const dayEvents = events.filter(e => e.startDate === date && !e.completed)
  const count = dayEvents.length
  
  // Calculer la durée totale
  let duration = 0
  dayEvents.forEach(event => {
    if (event.startTime && event.endTime) {
      const [startH, startM] = event.startTime.split(':').map(Number)
      const [endH, endM] = event.endTime.split(':').map(Number)
      duration += (endH * 60 + endM) - (startH * 60 + startM)
    } else {
      duration += 30 // Par défaut 30min
    }
  })
  
  // Déterminer le niveau
  let level: 'light' | 'moderate' | 'heavy' = 'light'
  if (count >= 5 || duration >= 360) level = 'heavy'
  else if (count >= 3 || duration >= 180) level = 'moderate'
  
  return { count, duration, level }
}

/**
 * Suggère le meilleur moment pour un événement
 */
export function suggestBestTime(events: Event[], date: string, duration: number = 60): string[] {
  const suggestions: string[] = []
  const dayEvents = events.filter(e => e.startDate === date && e.startTime && e.endTime)
  
  // Heures de travail (9h-18h)
  const workStart = 9
  const workEnd = 18
  
  // Créer des slots occupés
  const busySlots: { start: number; end: number }[] = dayEvents.map(e => {
    const [startH, startM] = e.startTime!.split(':').map(Number)
    const [endH, endM] = e.endTime!.split(':').map(Number)
    return {
      start: startH * 60 + startM,
      end: endH * 60 + endM
    }
  }).sort((a, b) => a.start - b.start)
  
  // Trouver les créneaux libres
  let currentTime = workStart * 60
  busySlots.forEach(slot => {
    if (currentTime + duration <= slot.start) {
      const hours = Math.floor(currentTime / 60)
      const minutes = currentTime % 60
      suggestions.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`)
    }
    currentTime = Math.max(currentTime, slot.end)
  })
  
  // Vérifier après le dernier événement
  if (currentTime + duration <= workEnd * 60) {
    const hours = Math.floor(currentTime / 60)
    const minutes = currentTime % 60
    suggestions.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`)
  }
  
  return suggestions.slice(0, 3) // Top 3 suggestions
}

/**
 * Calcule les statistiques du calendrier
 */
export function analyzeCalendarStats(events: Event[]): {
  totalEvents: number
  completedEvents: number
  upcomingEvents: number
  meetingsCount: number
  averagePerWeek: number
  busiestDay: string
} {
  const totalEvents = events.length
  const completedEvents = events.filter(e => e.completed).length
  const upcomingEvents = events.filter(e => !e.completed && !isPast(e.startDate)).length
  const meetingsCount = events.filter(e => e.type === 'meeting').length
  
  // Moyenne par semaine (sur les 30 derniers jours)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentEvents = events.filter(e => new Date(e.startDate) >= thirtyDaysAgo)
  const averagePerWeek = Math.round((recentEvents.length / 30) * 7 * 10) / 10
  
  // Jour le plus chargé
  const dayCount: Record<string, number> = {}
  events.forEach(e => {
    const day = new Date(e.startDate).toLocaleDateString('fr-FR', { weekday: 'long' })
    dayCount[day] = (dayCount[day] || 0) + 1
  })
  const busiestDay = Object.entries(dayCount).sort(([, a], [, b]) => b - a)[0]?.[0] || 'Lundi'
  
  return {
    totalEvents,
    completedEvents,
    upcomingEvents,
    meetingsCount,
    averagePerWeek,
    busiestDay
  }
}
