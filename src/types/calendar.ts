export type EventType = 'meeting' | 'deadline' | 'reminder' | 'birthday' | 'holiday' | 'custom'
export type EventCategory = 'work' | 'personal' | 'health' | 'social' | 'learning'
export type EventPriority = 'low' | 'medium' | 'high' | 'urgent'
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface Recurrence {
  frequency: RecurrenceFrequency
  interval: number  // Tous les X jours/semaines/mois
  endDate?: string
  daysOfWeek?: number[]  // 0-6 (dimanche-samedi)
}

export interface Reminder {
  time: number  // minutes avant
  sent: boolean
}

export interface Event {
  id: string
  title: string
  description?: string
  startDate: string  // ISO date YYYY-MM-DD
  endDate?: string   // Pour événements multi-jours
  startTime?: string // HH:mm
  endTime?: string   // HH:mm
  type: EventType
  category: EventCategory
  location?: string
  attendees?: string[]
  isRecurring: boolean
  recurrence?: Recurrence
  reminders?: Reminder[]
  color?: string
  priority: EventPriority
  linkedTaskId?: string  // Lien avec une tâche
  completed: boolean
  createdAt: number
}

export type EventCategory = 'work' | 'personal' | 'health' | 'social' | 'learning'
export type EventPriority = 'low' | 'medium' | 'high' | 'urgent'
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface Recurrence {
  frequency: RecurrenceFrequency
  interval: number  // Tous les X jours/semaines/mois
  endDate?: string
  daysOfWeek?: number[]  // 0-6 (dimanche-samedi)
}

export interface Reminder {
  time: number  // minutes avant
  sent: boolean
}

export interface Event {
  id: string
  title: string
  description?: string
  startDate: string  // ISO date YYYY-MM-DD
  endDate?: string   // Pour événements multi-jours
  startTime?: string // HH:mm
  endTime?: string   // HH:mm
  type: EventType
  category: EventCategory
  location?: string
  attendees?: string[]
  isRecurring: boolean
  recurrence?: Recurrence
  reminders?: Reminder[]
  color?: string
  priority: EventPriority
  linkedTaskId?: string  // Lien avec une tâche
  completed: boolean
  createdAt: number
}


