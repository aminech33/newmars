/**
 * Utilitaires pour manipuler les dates
 */

export const formatDate = (date: Date | string, format: 'short' | 'long' | 'full' = 'short'): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    case 'long':
      return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    case 'full':
      return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    default:
      return d.toLocaleDateString('fr-FR')
  }
}

export const formatTime = (time: string): string => {
  return time // Déjà au format HH:mm
}

export const isToday = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? date : date.toISOString().split('T')[0]
  const today = new Date().toISOString().split('T')[0]
  return d === today
}

export const isTomorrow = (date: string): boolean => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return date === tomorrow.toISOString().split('T')[0]
}

export const isThisWeek = (date: string): boolean => {
  const d = new Date(date)
  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)
  
  return d >= weekStart && d < weekEnd
}

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate()
}

export const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay()
}

export const getMonthName = (month: number): string => {
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]
  return months[month]
}

export const getDayName = (day: number): string => {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  return days[day]
}

export const getWeekDays = (): string[] => {
  return ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
}

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

export const isSameDay = (date1: Date | string, date2: Date | string): boolean => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate()
}

export const isPast = (date: string): boolean => {
  const d = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return d < today
}

/**
 * Vérifie si un événement est actif pour une date donnée
 * (prend en compte les événements multi-jours)
 */
export const isEventActiveOnDate = (event: { startDate: string; endDate?: string }, dateStr: string): boolean => {
  const eventStart = event.startDate
  const eventEnd = event.endDate || event.startDate
  
  // L'événement est actif si la date est entre le début et la fin (inclus)
  return dateStr >= eventStart && dateStr <= eventEnd
}

export const getTimeUntil = (date: string, time?: string): string => {
  const targetDate = new Date(date)
  if (time) {
    const [hours, minutes] = time.split(':').map(Number)
    targetDate.setHours(hours, minutes)
  }
  
  const now = new Date()
  const diff = targetDate.getTime() - now.getTime()
  
  if (diff < 0) return 'Passé'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (days > 0) return `Dans ${days}j`
  if (hours > 0) return `Dans ${hours}h`
  if (minutes > 0) return `Dans ${minutes}min`
  return 'Maintenant'
}

export const getRelativeTime = (date: string): string => {
  if (isToday(date)) return 'Aujourd\'hui'
  if (isTomorrow(date)) return 'Demain'
  if (isPast(date)) return 'Passé'
  
  const d = new Date(date)
  const today = new Date()
  const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 7) return `Dans ${diffDays} jours`
  if (diffDays <= 30) return `Dans ${Math.ceil(diffDays / 7)} semaines`
  return formatDate(date, 'short')
}

export const getCalendarDays = (year: number, month: number): Array<{ date: Date, isCurrentMonth: boolean, isToday: boolean }> => {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const days: Array<{ date: Date, isCurrentMonth: boolean, isToday: boolean }> = []
  
  // Jours du mois précédent (pour remplir la première semaine)
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1 // Lundi = 0
  const prevMonth = month === 0 ? 11 : month - 1
  const prevYear = month === 0 ? year - 1 : year
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth)
  
  for (let i = adjustedFirstDay - 1; i >= 0; i--) {
    const date = new Date(prevYear, prevMonth, daysInPrevMonth - i)
    days.push({ 
      date, 
      isCurrentMonth: false, 
      isToday: isToday(date) 
    })
  }
  
  // Jours du mois actuel
  const today = new Date()
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i)
    days.push({ 
      date, 
      isCurrentMonth: true, 
      isToday: date.toDateString() === today.toDateString()
    })
  }
  
  // Jours du mois suivant (pour remplir la dernière semaine)
  const remainingDays = 42 - days.length // 6 semaines max
  const nextMonth = month === 11 ? 0 : month + 1
  const nextYear = month === 11 ? year + 1 : year
  
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(nextYear, nextMonth, i)
    days.push({ 
      date, 
      isCurrentMonth: false, 
      isToday: isToday(date) 
    })
  }
  
  return days
}

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h${mins}` : `${hours}h`
}

