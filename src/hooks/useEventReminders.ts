import { useEffect, useRef } from 'react'
import { Event } from '../types/calendar'
import { useStore } from '../store/useStore'

/**
 * Hook pour gérer les notifications de rappel d'événements
 */
export function useEventReminders(events: Event[]) {
  const { addToast, updateEvent } = useStore()
  const checkedEvents = useRef<Set<string>>(new Set())
  
  useEffect(() => {
    // Vérifier les permissions de notification
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    
    const checkReminders = () => {
      const now = new Date()
      const nowTime = now.getTime()
      
      events.forEach(event => {
        // Skip if already checked or completed
        if (checkedEvents.current.has(event.id) || event.completed) return
        
        // Skip if no reminders
        if (!event.reminders || event.reminders.length === 0) return
        
        // Parse event date/time
        const eventDate = new Date(event.startDate)
        if (event.startTime) {
          const [hours, minutes] = event.startTime.split(':').map(Number)
          eventDate.setHours(hours, minutes, 0, 0)
        } else {
          eventDate.setHours(9, 0, 0, 0) // Default to 9am for all-day events
        }
        
        const eventTime = eventDate.getTime()
        
        // Check each reminder
        event.reminders.forEach((reminder, index) => {
          if (reminder.sent) return
          
          const reminderTime = eventTime - (reminder.time * 60 * 1000)
          
          // If reminder time has passed, trigger notification
          if (nowTime >= reminderTime && nowTime < eventTime) {
            // Show toast notification
            const timeUntil = Math.round((eventTime - nowTime) / 60000)
            addToast(
              `📅 ${event.title} dans ${timeUntil} minute${timeUntil > 1 ? 's' : ''}`,
              'info'
            )
            
            // Show browser notification if permitted
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`Rappel: ${event.title}`, {
                body: `Dans ${timeUntil} minute${timeUntil > 1 ? 's' : ''}${event.location ? ` - ${event.location}` : ''}`,
                icon: '/favicon.ico',
                tag: `reminder-${event.id}-${index}`,
                requireInteraction: false
              })
            }
            
            // Mark reminder as sent
            const updatedReminders = [...(event.reminders || [])]
            updatedReminders[index] = { ...reminder, sent: true }
            updateEvent(event.id, { reminders: updatedReminders })
            
            // Mark event as checked
            checkedEvents.current.add(event.id)
          }
        })
      })
    }
    
    // Check immediately
    checkReminders()
    
    // Check every minute
    const interval = setInterval(checkReminders, 60000)
    
    return () => clearInterval(interval)
  }, [events, addToast, updateEvent])
  
  // Reset checked events when events change significantly
  useEffect(() => {
    const eventIds = new Set(events.map(e => e.id))
    const toRemove: string[] = []
    
    checkedEvents.current.forEach(id => {
      if (!eventIds.has(id)) {
        toRemove.push(id)
      }
    })
    
    toRemove.forEach(id => checkedEvents.current.delete(id))
  }, [events])
}

