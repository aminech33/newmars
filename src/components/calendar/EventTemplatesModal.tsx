import { useState } from 'react'
import { Calendar, Check, Clock, Repeat, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Event } from '../../types/calendar'
import { getCalendarDays, getMonthName } from '../../utils/dateUtils'

interface EventTemplatesModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateEvents: (events: Omit<Event, 'id' | 'createdAt'>[]) => void
}

type TemplateType = 'work-week' | 'workout' | 'study' | 'meetings' | 'custom'

interface Template {
  id: TemplateType
  label: string
  emoji: string
  description: string
  defaultEvents: Array<{
    title: string
    startTime: string
    endTime: string
    type: Event['type']
    category: Event['category']
    daysOfWeek: number[] // 0 = Dimanche, 1 = Lundi, etc.
  }>
}

const TEMPLATES: Template[] = [
  {
    id: 'work-week',
    label: 'Semaine de travail',
    emoji: '💼',
    description: 'Routine de travail du lundi au vendredi',
    defaultEvents: [
      {
        title: 'Début de journée',
        startTime: '09:00',
        endTime: '09:30',
        type: 'work',
        category: 'work',
        daysOfWeek: [1, 2, 3, 4, 5] // Lun-Ven
      },
      {
        title: 'Pause déjeuner',
        startTime: '12:30',
        endTime: '13:30',
        type: 'personal',
        category: 'personal',
        daysOfWeek: [1, 2, 3, 4, 5]
      },
      {
        title: 'Fin de journée',
        startTime: '17:30',
        endTime: '18:00',
        type: 'work',
        category: 'work',
        daysOfWeek: [1, 2, 3, 4, 5]
      }
    ]
  },
  {
    id: 'workout',
    label: 'Routine sportive',
    emoji: '💪',
    description: 'Séances de sport régulières',
    defaultEvents: [
      {
        title: 'Sport',
        startTime: '07:00',
        endTime: '08:00',
        type: 'personal',
        category: 'personal',
        daysOfWeek: [1, 3, 5] // Lun, Mer, Ven
      }
    ]
  },
  {
    id: 'study',
    label: 'Sessions d\'étude',
    emoji: '📚',
    description: 'Blocs d\'apprentissage quotidiens',
    defaultEvents: [
      {
        title: 'Session d\'étude',
        startTime: '19:00',
        endTime: '20:30',
        type: 'personal',
        category: 'personal',
        daysOfWeek: [1, 2, 3, 4, 5, 6] // Lun-Sam
      }
    ]
  },
  {
    id: 'meetings',
    label: 'Réunions hebdo',
    emoji: '🤝',
    description: 'Réunions d\'équipe récurrentes',
    defaultEvents: [
      {
        title: 'Réunion d\'équipe',
        startTime: '10:00',
        endTime: '11:00',
        type: 'meeting',
        category: 'work',
        daysOfWeek: [1] // Lundi
      },
      {
        title: 'Point hebdo',
        startTime: '15:00',
        endTime: '15:30',
        type: 'meeting',
        category: 'work',
        daysOfWeek: [5] // Vendredi
      }
    ]
  }
]

export function EventTemplatesModal({ isOpen, onClose, onCreateEvents }: EventTemplatesModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | null>(null)
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [calendarDate, setCalendarDate] = useState(new Date())

  const template = TEMPLATES.find(t => t.id === selectedTemplate)
  
  const year = calendarDate.getFullYear()
  const month = calendarDate.getMonth()
  const calendarDays = getCalendarDays(year, month)

  const toggleDate = (dateStr: string) => {
    setSelectedDates(prev =>
      prev.includes(dateStr)
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    )
  }

  const handlePrevMonth = () => {
    setCalendarDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCalendarDate(new Date(year, month + 1, 1))
  }

  const handleSelectTemplate = (templateId: TemplateType) => {
    setSelectedTemplate(templateId)
    setSelectedDates([]) // Reset dates when changing template
  }

  const generateEvents = () => {
    if (!template || selectedDates.length === 0) return

    const events: Omit<Event, 'id' | 'createdAt'>[] = []

    // Generate events for each selected date
    selectedDates.forEach(dateStr => {
      const date = new Date(dateStr)
      const dayOfWeek = date.getDay()

      // Add all events from template that match this day of week
      template.defaultEvents.forEach(eventTemplate => {
        if (eventTemplate.daysOfWeek.includes(dayOfWeek)) {
          events.push({
            title: eventTemplate.title,
            description: `Généré depuis le template "${template.label}"`,
            startDate: dateStr,
            startTime: eventTemplate.startTime,
            endTime: eventTemplate.endTime,
            type: eventTemplate.type,
            category: eventTemplate.category,
            priority: 'medium',
            isRecurring: false,
            completed: false
          })
        }
      })
    })

    onCreateEvents(events)
    handleClose()
  }

  const handleClose = () => {
    // Reset all state
    setSelectedTemplate(null)
    setSelectedDates([])
    setCalendarDate(new Date())
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Templates d'événements récurrents"
      size="lg"
    >
      <div className="space-y-6">
        {/* Step 1: Select Template */}
        <div>
          <h3 className="text-sm font-medium text-zinc-300 mb-3">1. Choisir un template</h3>
          <div className="grid grid-cols-2 gap-3">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => handleSelectTemplate(tmpl.id)}
                className={`p-4 rounded-xl text-left transition-all ${
                  selectedTemplate === tmpl.id
                    ? 'bg-indigo-500/20 border-2 border-indigo-500/50'
                    : 'bg-white/[0.02] border-2 border-white/5 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{tmpl.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-zinc-200 mb-1">
                      {tmpl.label}
                    </h4>
                    <p className="text-xs text-zinc-500 line-clamp-2">
                      {tmpl.description}
                    </p>
                  </div>
                  {selectedTemplate === tmpl.id && (
                    <Check className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Select Dates on Calendar */}
        {selectedTemplate && (
          <div className="animate-fade-in">
            <h3 className="text-sm font-medium text-zinc-300 mb-3">
              2. Sélectionner les dates sur le calendrier
            </h3>
            
            {/* Calendar Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handlePrevMonth}
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <h4 className="text-lg font-semibold text-zinc-200">
                {getMonthName(month)} {year}
              </h4>
              
              <button
                onClick={handleNextMonth}
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-zinc-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  const dateStr = day.date.toISOString().split('T')[0]
                  const isSelected = selectedDates.includes(dateStr)
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  const dayDate = new Date(day.date)
                  dayDate.setHours(0, 0, 0, 0)
                  const isToday = dayDate.getTime() === today.getTime()
                  const isPast = dayDate < today
                  const dayOfWeek = day.date.getDay()
                  
                  // Check if this day matches template's days
                  const matchesTemplate = template?.defaultEvents.some(e => 
                    e.daysOfWeek.includes(dayOfWeek)
                  )

                  return (
                    <button
                      key={index}
                      onClick={() => !isPast && day.isCurrentMonth && toggleDate(dateStr)}
                      disabled={isPast || !day.isCurrentMonth}
                      className={`
                        aspect-square p-2 rounded-lg text-sm transition-all relative
                        ${!day.isCurrentMonth ? 'text-zinc-700 cursor-not-allowed' : ''}
                        ${isPast && day.isCurrentMonth ? 'text-zinc-700 cursor-not-allowed opacity-50' : ''}
                        ${day.isCurrentMonth && !isPast && !isSelected ? 'text-zinc-300 hover:bg-white/10' : ''}
                        ${isSelected ? 'bg-indigo-500/30 text-indigo-300 ring-2 ring-indigo-500/50' : ''}
                        ${isToday && !isSelected ? 'ring-1 ring-cyan-500/50 text-cyan-400' : ''}
                        ${matchesTemplate && !isSelected && day.isCurrentMonth && !isPast ? 'bg-white/5' : ''}
                      `}
                    >
                      <span className="relative z-10">{day.date.getDate()}</span>
                      {isSelected && (
                        <Check className="w-3 h-3 absolute top-0.5 right-0.5 text-indigo-400" />
                      )}
                      {matchesTemplate && !isSelected && day.isCurrentMonth && !isPast && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-500/50 rounded-full" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
            
            <p className="text-xs text-zinc-600 mt-2">
              {selectedDates.length === 0
                ? 'Cliquez sur les dates pour les sélectionner'
                : `${selectedDates.length} date${selectedDates.length > 1 ? 's' : ''} sélectionnée${selectedDates.length > 1 ? 's' : ''}`}
            </p>
            <p className="text-xs text-indigo-400/70 mt-1">
              💡 Les jours avec un point correspondent aux jours du template
            </p>
          </div>
        )}

        {/* Preview */}
        {selectedTemplate && selectedDates.length > 0 && template && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
            <div className="flex items-start gap-2 mb-2">
              <Repeat className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-indigo-300 mb-1">
                  Aperçu
                </h4>
                <p className="text-xs text-indigo-400/80">
                  {selectedDates.length} date{selectedDates.length > 1 ? 's' : ''} sélectionnée{selectedDates.length > 1 ? 's' : ''}
                  {' • '}
                  {(() => {
                    // Calculate total events
                    let total = 0
                    selectedDates.forEach(dateStr => {
                      const date = new Date(dateStr)
                      const dayOfWeek = date.getDay()
                      template.defaultEvents.forEach(event => {
                        if (event.daysOfWeek.includes(dayOfWeek)) {
                          total++
                        }
                      })
                    })
                    return <strong>{total}</strong>
                  })()}{' '}
                  événement{(() => {
                    let total = 0
                    selectedDates.forEach(dateStr => {
                      const date = new Date(dateStr)
                      const dayOfWeek = date.getDay()
                      template.defaultEvents.forEach(event => {
                        if (event.daysOfWeek.includes(dayOfWeek)) {
                          total++
                        }
                      })
                    })
                    return total > 1 ? 's' : ''
                  })()} au total
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              {template.defaultEvents.map((event, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-indigo-400/70">
                  <Clock className="w-3 h-3" />
                  <span>{event.title}</span>
                  <span className="text-indigo-500/50">•</span>
                  <span>{event.startTime} - {event.endTime}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
          <Button variant="ghost" onClick={handleClose}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={generateEvents}
            disabled={!selectedTemplate || selectedDates.length === 0}
          >
            <Repeat className="w-4 h-4" />
            Créer les événements
          </Button>
        </div>
      </div>
    </Modal>
  )
}

