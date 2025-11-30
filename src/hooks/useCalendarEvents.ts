import { useMemo } from 'react'
import { Event, EventType, EventCategory, EventPriority } from '../types/calendar'
import { generateRecurringInstances } from '../utils/recurrenceUtils'

export interface CalendarFilterState {
  types: EventType[]
  categories: EventCategory[]
  priorities: EventPriority[]
  showCompleted: boolean
}

interface UseCalendarEventsProps {
  events: Event[]
  filters: CalendarFilterState
}

export function useCalendarEvents({ events, filters }: UseCalendarEventsProps) {
  // Generate recurring instances
  const allEventsWithRecurring = useMemo(() => {
    const expanded: Event[] = []
    events.forEach(event => {
      if (event.isRecurring && event.recurrence) {
        const instances = generateRecurringInstances(event)
        expanded.push(...instances)
      } else {
        expanded.push(event)
      }
    })
    return expanded
  }, [events])

  // Apply filters
  const filteredEvents = useMemo(() => {
    return allEventsWithRecurring.filter(event => {
      if (filters.types.length > 0 && !filters.types.includes(event.type)) return false
      if (filters.categories.length > 0 && !filters.categories.includes(event.category)) return false
      if (filters.priorities.length > 0 && !filters.priorities.includes(event.priority)) return false
      if (!filters.showCompleted && event.completed) return false
      return true
    })
  }, [allEventsWithRecurring, filters])

  // Get events for a specific day
  const getEventsForDay = (date: Date | null): Event[] => {
    if (!date) return []
    const dateStr = date.toISOString().split('T')[0]
    return filteredEvents.filter(e => e.startDate === dateStr)
  }

  // Get events for a date range
  const getEventsForRange = (startDate: Date, endDate: Date): Event[] => {
    const start = startDate.toISOString().split('T')[0]
    const end = endDate.toISOString().split('T')[0]
    return filteredEvents.filter(e => e.startDate >= start && e.startDate <= end)
  }

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const todayEvents = filteredEvents.filter(e => e.startDate === today)
    const upcomingEvents = filteredEvents.filter(e => e.startDate > today).slice(0, 5)
    const overdueEvents = filteredEvents.filter(e => e.startDate < today && !e.completed)
    
    return {
      total: filteredEvents.length,
      today: todayEvents.length,
      upcoming: upcomingEvents.length,
      overdue: overdueEvents.length,
      todayEvents,
      upcomingEvents,
      overdueEvents
    }
  }, [filteredEvents])

  return {
    allEvents: allEventsWithRecurring,
    filteredEvents,
    getEventsForDay,
    getEventsForRange,
    stats
  }
}

