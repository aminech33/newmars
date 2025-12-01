// Utilitaires de formatage pour la bibliothèque

/**
 * Formate un temps en secondes en MM:SS
 */
export function formatTimerDisplay(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Formate un temps de lecture en minutes en format lisible
 */
export function formatReadingTime(minutes: number): string {
  if (minutes === 0) return '0min'
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h${mins}` : `${hours}h`
}

/**
 * Formate un temps de lecture pour affichage détaillé
 */
export function formatReadingTimeDetailed(minutes: number): string {
  if (minutes === 0) return '0 min'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
}

/**
 * Calcule le pourcentage de progression d'un livre
 */
export function getBookProgress(currentPage?: number, totalPages?: number): number {
  if (!totalPages || !currentPage) return 0
  return Math.round((currentPage / totalPages) * 100)
}

/**
 * Formate une date en format français court
 */
export function formatDateShort(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('fr-FR')
}

/**
 * Valide et parse un nombre de pages (retourne undefined si invalide)
 */
export function parsePages(value: string | null): number | undefined {
  if (!value) return undefined
  const parsed = parseInt(value, 10)
  if (isNaN(parsed) || parsed < 0) return undefined
  return parsed
}

/**
 * Tronque un texte avec ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '…'
}

