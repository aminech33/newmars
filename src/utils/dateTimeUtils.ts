/**
 * Utilities pour la gestion des dates et heures
 * Centralise les opérations courantes sur les dates
 */

/**
 * Retourne la date actuelle au format ISO (YYYY-MM-DD)
 */
export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Retourne l'heure actuelle au format HH:MM
 */
export function getCurrentTime(): string {
  return new Date().toTimeString().slice(0, 5)
}

/**
 * Formate une date ISO en format français lisible
 * @param date - Date au format ISO (YYYY-MM-DD)
 * @param options - Options de formatage
 * @returns Date formatée (ex: "lun. 1 janv.")
 */
export function formatDateFR(
  date: string, 
  options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  }
): string {
  return new Date(date).toLocaleDateString('fr-FR', options)
}

/**
 * Formate une date ISO en format français complet
 * @param date - Date au format ISO (YYYY-MM-DD)
 * @returns Date formatée (ex: "lundi 1 janvier 2026")
 */
export function formatDateFRLong(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

/**
 * Calcule le nombre de jours entre deux dates
 * @param date1 - Première date (ISO)
 * @param date2 - Deuxième date (ISO)
 * @returns Nombre de jours (positif si date2 > date1)
 */
export function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1).getTime()
  const d2 = new Date(date2).getTime()
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24))
}

/**
 * Vérifie si une date est aujourd'hui
 * @param date - Date au format ISO (YYYY-MM-DD)
 * @returns true si la date est aujourd'hui
 */
export function isToday(date: string): boolean {
  return date === getCurrentDate()
}

/**
 * Vérifie si une date est hier
 * @param date - Date au format ISO (YYYY-MM-DD)
 * @returns true si la date est hier
 */
export function isYesterday(date: string): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return date === yesterday.toISOString().split('T')[0]
}

