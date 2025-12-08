import { Event } from '../types/calendar'

export interface PositionedEvent {
  event: Event
  column: number
  totalColumns: number
  top: number
  height: number
}

/**
 * Calcule la position d'un événement dans la timeline
 */
export function getEventPosition(startTime: string, endTime?: string, hourHeight: number = 80) {
  const [startH, startM] = startTime.split(':').map(Number)
  const startMinutes = (startH - 8) * 60 + startM
  const top = (startMinutes / 60) * hourHeight
  
  if (endTime) {
    const [endH, endM] = endTime.split(':').map(Number)
    const endMinutes = (endH - 8) * 60 + endM
    const height = ((endMinutes - startMinutes) / 60) * hourHeight
    return { top, height: Math.max(height, 40) }
  }
  
  return { top, height: 40 } // Default 40px
}

/**
 * Détecte si deux événements se chevauchent
 */
function eventsOverlap(e1: Event, e2: Event): boolean {
  if (!e1.startTime || !e2.startTime) return false
  
  const e1Start = timeToMinutes(e1.startTime)
  const e1End = e1.endTime ? timeToMinutes(e1.endTime) : e1Start + 30
  const e2Start = timeToMinutes(e2.startTime)
  const e2End = e2.endTime ? timeToMinutes(e2.endTime) : e2Start + 30
  
  return e1Start < e2End && e1End > e2Start
}

/**
 * Convertit une heure en minutes depuis minuit
 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/**
 * Algorithme de placement des événements en colonnes (comme Google Calendar)
 * Retourne les événements avec leurs positions calculées
 */
export function layoutEvents(events: Event[], hourHeight: number = 80): PositionedEvent[] {
  if (events.length === 0) return []
  
  // Trier par heure de début, puis par durée (plus long en premier)
  const sortedEvents = [...events].sort((a, b) => {
    const aStart = a.startTime || '00:00'
    const bStart = b.startTime || '00:00'
    const startCompare = aStart.localeCompare(bStart)
    if (startCompare !== 0) return startCompare
    
    // Si même heure de début, événement le plus long en premier
    const aDuration = a.endTime ? timeToMinutes(a.endTime) - timeToMinutes(aStart) : 30
    const bDuration = b.endTime ? timeToMinutes(b.endTime) - timeToMinutes(bStart) : 30
    return bDuration - aDuration
  })
  
  const positioned: PositionedEvent[] = []
  const columns: Event[][] = []
  
  for (const event of sortedEvents) {
    if (!event.startTime) {
      // All-day events
      positioned.push({
        event,
        column: 0,
        totalColumns: 1,
        ...getEventPosition('00:00', undefined, hourHeight)
      })
      continue
    }
    
    // Trouver la première colonne disponible
    let columnIndex = 0
    let placed = false
    
    for (let i = 0; i < columns.length; i++) {
      const columnEvents = columns[i]
      const hasOverlap = columnEvents.some(e => eventsOverlap(e, event))
      
      if (!hasOverlap) {
        columns[i].push(event)
        columnIndex = i
        placed = true
        break
      }
    }
    
    // Si aucune colonne disponible, créer une nouvelle
    if (!placed) {
      columns.push([event])
      columnIndex = columns.length - 1
    }
    
    positioned.push({
      event,
      column: columnIndex,
      totalColumns: 1, // Will be updated in second pass
      ...getEventPosition(event.startTime, event.endTime, hourHeight)
    })
  }
  
  // Second pass: calculer le nombre réel de colonnes pour chaque groupe d'événements qui se chevauchent
  for (let i = 0; i < positioned.length; i++) {
    const current = positioned[i]
    if (!current.event.startTime) continue
    
    // Trouver tous les événements qui se chevauchent avec celui-ci
    let maxColumns = 1
    for (let j = 0; j < positioned.length; j++) {
      if (i === j || !positioned[j].event.startTime) continue
      
      if (eventsOverlap(current.event, positioned[j].event)) {
        maxColumns = Math.max(maxColumns, positioned[j].column + 1)
      }
    }
    
    // Mettre à jour le totalColumns pour tous les événements qui se chevauchent
    current.totalColumns = maxColumns
    for (let j = 0; j < positioned.length; j++) {
      if (i !== j && positioned[j].event.startTime && eventsOverlap(current.event, positioned[j].event)) {
        positioned[j].totalColumns = maxColumns
      }
    }
  }
  
  return positioned
}

/**
 * Calcule le style CSS pour un événement positionné
 */
export function getEventStyle(positioned: PositionedEvent): React.CSSProperties {
  const { column, totalColumns, top, height } = positioned
  const columnWidth = 100 / totalColumns
  const left = column * columnWidth
  const gap = 0.5 // 0.5% gap between columns
  
  return {
    position: 'absolute',
    top: `${top}px`,
    height: `${height}px`,
    left: `${left}%`,
    width: `${columnWidth - gap}%`,
    minHeight: '40px'
  }
}




