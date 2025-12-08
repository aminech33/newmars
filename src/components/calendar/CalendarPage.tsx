import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, ChevronLeft, ChevronRight, LayoutGrid, LayoutList, Clock, Calendar as CalendarIcon, Repeat, Check } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Event, EventType, EventCategory } from '../../types/calendar'
import { EventCard } from './EventCard'
import { EventDetails } from './EventDetails'
import { WeekView } from './WeekView'
import { DayView } from './DayView'
import { CalendarFilters } from './CalendarFilters'
import { SmartSuggestions } from './SmartSuggestions'
import { EventTemplatesPage } from './EventTemplatesPage'
import { Tooltip } from '../ui/Tooltip'
import { useCalendarEvents, CalendarFilterState } from '../../hooks/useCalendarEvents'
import { useEventReminders } from '../../hooks/useEventReminders'
import { getCalendarDays, getMonthName, getWeekDays, isToday, isEventActiveOnDate } from '../../utils/dateUtils'
import { detectEventType, detectEventCategory, detectEventPriority } from '../../utils/calendarIntelligence'
import { layoutEvents, getEventStyle } from '../../utils/eventLayoutUtils'

type ViewMode = 'month' | 'week' | 'day'

export function CalendarPage() {
  const { events, addEvent, setView, isEditMode, selectedEventId: deepLinkedEventId, setSelectedEventId: setDeepLinkedEventId } = useStore()
  
  // Navigation state
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  
  // Event state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [templateMode, setTemplateMode] = useState(false)
  const [selectedDatesForTemplate, setSelectedDatesForTemplate] = useState<string[]>([])
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventStartTime, setNewEventStartTime] = useState('')
  const [newEventEndTime, setNewEventEndTime] = useState('')
  const [newEventType, setNewEventType] = useState<EventType>('custom')
  const [newEventCategory, setNewEventCategory] = useState<EventCategory>('work')
  const [newEventPriority, setNewEventPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [newEventIsRecurring, setNewEventIsRecurring] = useState(false)
  const [newEventRecurrence, setNewEventRecurrence] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly')
  const [newEventIsMultiDay, setNewEventIsMultiDay] = useState(false)
  const [newEventEndDate, setNewEventEndDate] = useState<Date | null>(null)
  
  // Deep linking: ouvrir l'événement sélectionné depuis la recherche
  useEffect(() => {
    if (deepLinkedEventId) {
      const event = events.find(e => e.id === deepLinkedEventId)
      if (event) {
        setSelectedEventId(event.id)
        // Naviguer vers la date de l'événement
        const eventDate = new Date(event.startDate)
        setCurrentDate(eventDate)
      }
      // Reset après utilisation
      setDeepLinkedEventId(null)
    }
  }, [deepLinkedEventId, events, setDeepLinkedEventId])
  
  // Filters
  const [filters, setFilters] = useState<CalendarFilterState>({
    types: [],
    categories: [],
    priorities: [],
    showCompleted: true,
  })

  // Custom hook for events
  const { filteredEvents, getEventsForDay, stats } = useCalendarEvents({ events, filters })
  
  // Enable event reminders
  useEventReminders(events)

  // Calendar data
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const calendarDays = getCalendarDays(year, month)
  const weekDays = getWeekDays()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
      
      // Ctrl+N for new event
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        setShowQuickAdd(true)
      }
      
      // Escape to close quick add
      if (e.key === 'Escape' && showQuickAdd) {
        e.preventDefault()
        setShowQuickAdd(false)
        setNewEventTitle('')
      }
      
      // Arrow keys for navigation
      if (e.key === 'ArrowLeft' && e.altKey) {
        e.preventDefault()
        handlePrevMonth()
      }
      if (e.key === 'ArrowRight' && e.altKey) {
        e.preventDefault()
        handleNextMonth()
      }
      
      // View mode shortcuts (only when not in input)
      if (!isInputField) {
        // M for month view
        if (e.key === 'm') {
          e.preventDefault()
          setViewMode('month')
        }
        // W for week view
        if (e.key === 'w') {
          e.preventDefault()
          setViewMode('week')
        }
        // D for day view
        if (e.key === 'd') {
          e.preventDefault()
          setViewMode('day')
        }
        // T for today
        if (e.key === 't') {
          e.preventDefault()
          handleGoToToday()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showQuickAdd, viewMode])

  // Navigation handlers
  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1))
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1))
  const handleGoToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  // Quick add handler
  const handleQuickAdd = () => {
    if (!newEventTitle.trim() || !selectedDate) return

    const type = newEventType
    const category = newEventCategory
    const priority = newEventPriority

    addEvent({
      title: newEventTitle,
      startDate: selectedDate.toISOString().split('T')[0],
      endDate: newEventEndDate ? newEventEndDate.toISOString().split('T')[0] : undefined,
      startTime: newEventStartTime || undefined,
      endTime: newEventEndTime || undefined,
      type,
      category,
      priority,
      isRecurring: newEventIsRecurring,
      recurrence: newEventIsRecurring ? {
        frequency: newEventRecurrence,
        interval: 1,
      } : undefined,
      completed: false
    })

    setNewEventTitle('')
    setNewEventStartTime('')
    setNewEventEndTime('')
    setNewEventType('custom')
    setNewEventCategory('work')
    setNewEventPriority('medium')
    setNewEventIsRecurring(false)
    setNewEventRecurrence('weekly')
    setNewEventIsMultiDay(false)
    setNewEventEndDate(null)
    setShowQuickAdd(false)
  }

  const handleCreateFromTemplate = (events: Omit<Event, 'id' | 'createdAt'>[]) => {
    events.forEach(event => addEvent(event))
    setTemplateMode(false)
    setSelectedDatesForTemplate([])
  }

  const handleToggleTemplateMode = () => {
    setTemplateMode(!templateMode)
    setSelectedDatesForTemplate([])
    // Ne pas ouvrir le modal automatiquement
  }

  const handleDateClickInTemplateMode = (dateStr: string) => {
    if (selectedDatesForTemplate.includes(dateStr)) {
      setSelectedDatesForTemplate(selectedDatesForTemplate.filter(d => d !== dateStr))
    } else {
      setSelectedDatesForTemplate([...selectedDatesForTemplate, dateStr])
    }
  }

  // Templates d'événements
  const applyTemplate = (template: 'standup' | 'meeting' | 'review' | 'break') => {
    switch (template) {
      case 'standup':
        setNewEventTitle('Daily Standup')
        setNewEventStartTime('09:00')
        setNewEventEndTime('09:15')
        setNewEventType('meeting')
        setNewEventPriority('medium')
        setNewEventIsRecurring(true)
        setNewEventRecurrence('daily')
        break
      case 'meeting':
        setNewEventTitle('Réunion équipe')
        setNewEventStartTime('14:00')
        setNewEventEndTime('15:00')
        setNewEventType('meeting')
        setNewEventPriority('medium')
        break
      case 'review':
        setNewEventTitle('Revue hebdomadaire')
        setNewEventStartTime('16:00')
        setNewEventEndTime('17:00')
        setNewEventType('meeting')
        setNewEventPriority('high')
        setNewEventIsRecurring(true)
        setNewEventRecurrence('weekly')
        break
      case 'break':
        setNewEventTitle('Pause')
        setNewEventStartTime('12:00')
        setNewEventEndTime('13:00')
        setNewEventType('other')
        setNewEventPriority('low')
        setNewEventIsRecurring(true)
        setNewEventRecurrence('daily')
        break
    }
  }

  const handleEventClick = (eventId: string) => {
    if (!isEditMode) {
      setSelectedEventId(eventId)
      // Assurer que la date est bien définie pour l'événement
      const clickedEvent = events.find(e => e.id === eventId)
      if (clickedEvent) {
        const eventDate = new Date(clickedEvent.startDate)
        setCurrentDate(eventDate)
        setSelectedDate(eventDate)
      }
    }
  }

  const selectedEvent = events.find(e => e.id === selectedEventId)
  const selectedDateStr = selectedDate?.toISOString().split('T')[0]
  const selectedDayEvents = selectedDateStr
    ? filteredEvents.filter(e => e.startDate === selectedDateStr)
    : []

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      {/* Header - Standard */}
      <header className="flex-shrink-0 px-4 py-2 border-b border-zinc-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // Navigation intelligente
                if (viewMode === 'day' || viewMode === 'week') {
                  // Retour à la vue mois
                  setViewMode('month')
                } else {
                  // Retour au hub
                  setView('hub')
                }
              }}
              className="p-1.5 hover:bg-zinc-800/50 rounded-lg transition-colors"
              title={viewMode === 'month' ? 'Retour au hub' : 'Retour à la vue mois'}
            >
              <ArrowLeft className="w-4 h-4 text-zinc-400" />
            </button>
            <CalendarIcon className="w-4 h-4 text-indigo-400" />
            <h1 className="text-lg font-semibold text-zinc-200">Calendrier</h1>
            {/* Stats inline */}
            {stats.today > 0 && (
              <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] rounded">
                {stats.today} aujourd'hui
              </span>
            )}
            {stats.overdue > 0 && (
              <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-400 text-[10px] rounded">
                {stats.overdue} retard
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Navigation mois */}
            <button onClick={handlePrevMonth} className="p-1.5 hover:bg-zinc-800/50 rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4 text-zinc-400" />
            </button>
            <span className="text-sm font-medium text-zinc-200 min-w-[120px] text-center">
              {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={handleNextMonth} className="p-1.5 hover:bg-zinc-800/50 rounded-lg transition-colors">
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>
            <button
              onClick={handleGoToToday}
              className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-lg transition-colors"
            >
              Aujourd'hui
            </button>

            <CalendarFilters onFilterChange={(f) => setFilters(f as CalendarFilterState)} />

            {/* View toggle */}
            <div className="flex items-center gap-0.5 p-0.5 bg-zinc-800/50 rounded-lg">
              <button
                onClick={() => setViewMode('month')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'month' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'week' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <LayoutList className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'day' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Clock className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleTemplateMode}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
                  templateMode
                    ? 'bg-purple-500 text-white'
                    : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                }`}
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>{templateMode ? `${selectedDatesForTemplate.length} dates` : 'Templates'}</span>
              </button>
              
              <button
                onClick={() => setShowQuickAdd(true)}
                className="flex items-center gap-1 px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nouveau</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 py-3">
        {templateMode && (
          <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-300 font-medium">
                  Mode Template actif - Sélectionnez les dates sur le calendrier
                </span>
              </div>
              <div className="flex items-center gap-2">
                {selectedDatesForTemplate.length > 0 && (
                  <button
                    onClick={() => setShowTemplates(true)}
                    className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    Appliquer un template ({selectedDatesForTemplate.length})
                  </button>
                )}
                <button
                  onClick={() => {
                    setTemplateMode(false)
                    setSelectedDatesForTemplate([])
                  }}
                  className="text-xs text-purple-400 hover:text-purple-300 underline"
                >
                  Annuler
                </button>
              </div>
            </div>
            <p className="text-xs text-purple-400/70 mt-1">
              Cliquez sur les dates futures pour les sélectionner ({selectedDatesForTemplate.length} sélectionnée{selectedDatesForTemplate.length > 1 ? 's' : ''})
            </p>
          </div>
        )}
        
        {viewMode === 'month' && (
          <>
            {/* Days header */}
            <div className="grid grid-cols-7 mb-1">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                <div key={day} className="text-center text-[10px] font-medium text-zinc-600 py-1">{day}</div>
              ))}
            </div>

            {/* Calendar cells */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                const dateStr = day.date.toISOString().split('T')[0]
                // Inclure les événements qui commencent ce jour ET les événements multi-jours actifs ce jour
                const dayEvents = filteredEvents.filter(e => isEventActiveOnDate(e, dateStr))
                const isSelected = selectedDate?.toISOString().split('T')[0] === dateStr
                const isSelectedForTemplate = selectedDatesForTemplate.includes(dateStr)
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const dayDate = new Date(day.date)
                dayDate.setHours(0, 0, 0, 0)
                const isPast = dayDate < today

                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (templateMode) {
                        if (!isPast && day.isCurrentMonth) {
                          handleDateClickInTemplateMode(dateStr)
                        }
                      } else {
                        // Toujours définir la date sélectionnée
                        setSelectedDate(day.date)
                        setCurrentDate(day.date)
                        // Passer en vue jour
                        setViewMode('day')
                      }
                    }}
                    className={`
                      relative min-h-[100px] p-2 rounded-lg transition-all text-left
                      ${!day.isCurrentMonth ? 'opacity-30' : ''}
                      ${templateMode && isPast ? 'opacity-20 cursor-not-allowed' : ''}
                      ${day.isToday ? 'bg-indigo-500/10 border border-indigo-500/30' : 'hover:bg-zinc-800/50'}
                      ${isSelected && !templateMode ? 'ring-2 ring-indigo-500' : ''}
                      ${isSelectedForTemplate ? 'ring-2 ring-purple-500 bg-purple-500/30 scale-95' : ''}
                    `}
                  >
                    <span className={`text-sm font-medium ${
                      isSelectedForTemplate ? 'text-purple-200' : 
                      day.isToday ? 'text-indigo-400' : 
                      'text-zinc-400'
                    }`}>
                      {day.date.getDate()}
                    </span>
                    {isSelectedForTemplate && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {!templateMode && dayEvents.length > 0 && (
                      <div className="mt-1 relative" style={{ minHeight: `${Math.min(dayEvents.length, 3) * 18}px` }}>
                        {(() => {
                          // Grouper les événements qui se chevauchent
                          const eventsWithTime = dayEvents.filter(e => e.startTime).sort((a, b) => {
                            const timeA = a.startTime || '00:00'
                            const timeB = b.startTime || '00:00'
                            return timeA.localeCompare(timeB)
                          })
                          
                          // Fonction simple pour détecter les chevauchements
                          const getOverlapGroups = (events: typeof eventsWithTime) => {
                            const groups: typeof eventsWithTime[] = []
                            events.forEach(event => {
                              let placed = false
                              for (const group of groups) {
                                const hasOverlap = group.some(e => {
                                  if (!e.startTime || !e.endTime || !event.startTime || !event.endTime) return false
                                  const e1Start = e.startTime
                                  const e1End = e.endTime
                                  const e2Start = event.startTime
                                  const e2End = event.endTime
                                  return e1Start < e2End && e1End > e2Start
                                })
                                if (!hasOverlap) {
                                  group.push(event)
                                  placed = true
                                  break
                                }
                              }
                              if (!placed) {
                                groups.push([event])
                              }
                            })
                            return groups
                          }
                          
                          const overlapGroups = getOverlapGroups(eventsWithTime)
                          const totalColumns = overlapGroups.length
                          
                          let displayIndex = 0
                          return (
                            <>
                              {overlapGroups.map((group, colIndex) => 
                                group.slice(0, 3 - displayIndex).map(event => {
                                  const isMultiDay = event.endDate && event.endDate !== event.startDate
                                  const isStartDay = event.startDate === dateStr
                                  const isEndDay = event.endDate === dateStr
                                  
                                  const columnWidth = 100 / totalColumns
                                  const left = colIndex * columnWidth
                                  const currentIndex = displayIndex++
                                  
                                  return (
                                    <div
                                      key={event.id}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        // Double-clic pour éditer, simple clic ne fait rien (laisse le clic du jour passer)
                                      }}
                                      onDoubleClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedEventId(event.id)
                                      }}
                                      className="absolute text-[10px] px-1 py-0.5 rounded cursor-pointer hover:opacity-80 overflow-hidden hover:ring-1 hover:ring-indigo-500/50"
                                      style={{ 
                                        backgroundColor: `${event.color}30`, 
                                        color: event.color,
                                        left: `${left}%`,
                                        width: `${columnWidth - 0.5}%`,
                                        top: `${currentIndex * 18}px`,
                                        height: '16px'
                                      }}
                                      title="Double-cliquez pour éditer"
                                    >
                                      <div className="flex items-center gap-0.5 truncate">
                                        {isMultiDay && (
                                          <span className="flex-shrink-0">
                                            {isStartDay && '▶'}
                                            {!isStartDay && !isEndDay && '━'}
                                            {isEndDay && '◀'}
                                          </span>
                                        )}
                                        {event.startTime && <span className="font-medium flex-shrink-0">{event.startTime}</span>}
                                        <span className="truncate">{event.title}</span>
                                      </div>
                                    </div>
                                  )
                                })
                              )}
                              {/* Événements sans heure */}
                              {dayEvents.filter(e => !e.startTime).slice(0, Math.max(0, 3 - displayIndex)).map((event, idx) => {
                                const isMultiDay = event.endDate && event.endDate !== event.startDate
                                const isStartDay = event.startDate === dateStr
                                const isEndDay = event.endDate === dateStr
                                const currentIndex = displayIndex + idx
                                
                                return (
                                  <div
                                    key={event.id}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      // Double-clic pour éditer
                                    }}
                                    onDoubleClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedEventId(event.id)
                                    }}
                                    className="absolute text-[10px] px-1 py-0.5 rounded cursor-pointer hover:opacity-80 overflow-hidden hover:ring-1 hover:ring-indigo-500/50"
                                    style={{ 
                                      backgroundColor: `${event.color}30`, 
                                      color: event.color,
                                      left: 0,
                                      width: '99.5%',
                                      top: `${currentIndex * 18}px`,
                                      height: '16px'
                                    }}
                                    title="Double-cliquez pour éditer"
                                  >
                                    <div className="flex items-center gap-0.5 truncate">
                                      {isMultiDay && (
                                        <span className="flex-shrink-0">
                                          {isStartDay && '▶'}
                                          {!isStartDay && !isEndDay && '━'}
                                          {isEndDay && '◀'}
                                        </span>
                                      )}
                                      <span className="truncate">{event.title}</span>
                                    </div>
                                  </div>
                                )
                              })}
                            </>
                          )
                        })()}
                        {dayEvents.length > 3 && (
                          <div className="absolute left-1 text-[9px] text-zinc-500 bg-zinc-900/90 px-1 rounded" style={{ top: '54px' }}>
                            +{dayEvents.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {viewMode === 'week' && (
          <WeekView
            currentDate={currentDate}
            events={filteredEvents}
            onEventClick={handleEventClick}
            onDateClick={(date) => setSelectedDate(date)}
          />
        )}

        {viewMode === 'day' && (
          <DayView
            date={currentDate}
            events={filteredEvents}
            onEventClick={handleEventClick}
            onTimeSlotClick={(hour) => {
              setSelectedDate(currentDate)
              setShowQuickAdd(true)
            }}
          />
        )}
      </div>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-zinc-900 rounded-xl p-5 w-full max-w-2xl border border-zinc-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-zinc-200 mb-4">Nouvel événement</h3>
            
            {/* Templates rapides */}
            <div className="mb-4">
              <label className="block text-xs text-zinc-500 mb-2">Templates rapides</label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => applyTemplate('standup')}
                  className="p-2 bg-zinc-800/50 hover:bg-indigo-500/20 border border-zinc-700 hover:border-indigo-500 rounded-lg transition-all text-xs text-zinc-300"
                >
                  🌅 Daily Standup
                </button>
                <button
                  onClick={() => applyTemplate('meeting')}
                  className="p-2 bg-zinc-800/50 hover:bg-blue-500/20 border border-zinc-700 hover:border-blue-500 rounded-lg transition-all text-xs text-zinc-300"
                >
                  👥 Réunion
                </button>
                <button
                  onClick={() => applyTemplate('review')}
                  className="p-2 bg-zinc-800/50 hover:bg-amber-500/20 border border-zinc-700 hover:border-amber-500 rounded-lg transition-all text-xs text-zinc-300"
                >
                  📊 Review
                </button>
                <button
                  onClick={() => applyTemplate('break')}
                  className="p-2 bg-zinc-800/50 hover:bg-emerald-500/20 border border-zinc-700 hover:border-emerald-500 rounded-lg transition-all text-xs text-zinc-300"
                >
                  ☕ Pause
                </button>
              </div>
            </div>

            <div className="h-px bg-zinc-800 my-4" />
            
            {/* Titre */}
            <div className="mb-4">
              <label className="block text-xs text-zinc-500 mb-2">Titre *</label>
              <input
                type="text"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleQuickAdd()
                  }
                  if (e.key === 'Escape') setShowQuickAdd(false)
                }}
                placeholder="Ex: Réunion équipe, Appel client..."
                className="w-full bg-zinc-800/50 text-sm text-zinc-300 placeholder:text-zinc-600 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                autoFocus
              />
            </div>

            {/* Date et horaires */}
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={newEventIsMultiDay}
                  onChange={(e) => {
                    setNewEventIsMultiDay(e.target.checked)
                    if (!e.target.checked) {
                      setNewEventEndDate(null)
                    } else if (selectedDate) {
                      // Auto-remplir avec le lendemain
                      const nextDay = new Date(selectedDate)
                      nextDay.setDate(nextDay.getDate() + 1)
                      setNewEventEndDate(nextDay)
                    }
                  }}
                  className="w-4 h-4 rounded accent-indigo-500"
                />
                <span className="text-xs text-zinc-400">📅 Événement sur plusieurs jours</span>
              </label>

              <div className={`grid ${newEventIsMultiDay ? 'grid-cols-2' : 'grid-cols-1'} gap-3 mb-3`}>
                <div>
                  <label className="block text-xs text-zinc-500 mb-2">
                    {newEventIsMultiDay ? 'Date de début' : 'Date'}
                  </label>
                  <input
                    type="date"
                    value={selectedDate ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}` : ''}
                    onChange={(e) => {
                      const [year, month, day] = e.target.value.split('-').map(Number)
                      setSelectedDate(new Date(year, month - 1, day))
                    }}
                    className="w-full bg-zinc-800/50 text-sm text-zinc-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {newEventIsMultiDay && (
                  <div>
                    <label className="block text-xs text-zinc-500 mb-2">Date de fin</label>
                    <input
                      type="date"
                      value={newEventEndDate ? `${newEventEndDate.getFullYear()}-${String(newEventEndDate.getMonth() + 1).padStart(2, '0')}-${String(newEventEndDate.getDate()).padStart(2, '0')}` : ''}
                      onChange={(e) => {
                        const [year, month, day] = e.target.value.split('-').map(Number)
                        setNewEventEndDate(new Date(year, month - 1, day))
                      }}
                      min={selectedDate ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}` : ''}
                      className="w-full bg-zinc-800/50 text-sm text-zinc-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-2">Heure début</label>
                  <input
                    type="time"
                    value={newEventStartTime}
                    onChange={(e) => setNewEventStartTime(e.target.value)}
                    className="w-full bg-zinc-800/50 text-sm text-zinc-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-2">Heure fin</label>
                  <input
                    type="time"
                    value={newEventEndTime}
                    onChange={(e) => setNewEventEndTime(e.target.value)}
                    className="w-full bg-zinc-800/50 text-sm text-zinc-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Type et Catégorie */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1 font-medium">Nature</label>
                <p className="text-[10px] text-zinc-600 mb-2">Ce que c'est</p>
                <select
                  value={newEventType}
                  onChange={(e) => setNewEventType(e.target.value as any)}
                  className="w-full bg-zinc-800/50 text-sm text-zinc-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="meeting">🗓️ Réunion</option>
                  <option value="deadline">⏰ Deadline</option>
                  <option value="reminder">🔔 Rappel</option>
                  <option value="birthday">🎂 Anniversaire</option>
                  <option value="holiday">🎉 Vacances</option>
                  <option value="custom">📌 Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1 font-medium">Domaine</label>
                <p className="text-[10px] text-zinc-600 mb-2">Le contexte</p>
                <select
                  value={newEventCategory}
                  onChange={(e) => setNewEventCategory(e.target.value as EventCategory)}
                  className="w-full bg-zinc-800/50 text-sm text-zinc-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="work">💼 Travail</option>
                  <option value="personal">🏠 Personnel</option>
                  <option value="health">💚 Santé</option>
                  <option value="social">👥 Social</option>
                  <option value="learning">📚 Formation</option>
                </select>
              </div>
            </div>

            {/* Priorité */}
            <div className="mb-4">
              <label className="block text-xs text-zinc-400 mb-1 font-medium">Priorité</label>
              <p className="text-[10px] text-zinc-600 mb-2">Niveau d'importance</p>
              <select
                value={newEventPriority}
                onChange={(e) => setNewEventPriority(e.target.value as any)}
                className="w-full bg-zinc-800/50 text-sm text-zinc-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="low">🟢 Basse</option>
                <option value="medium">🟡 Moyenne</option>
                <option value="high">🟠 Haute</option>
                <option value="urgent">🔴 Urgente</option>
              </select>
            </div>

            {/* Récurrence */}
            <div className="mb-4 p-3 bg-zinc-800/30 rounded-lg border border-zinc-800">
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={newEventIsRecurring}
                  onChange={(e) => setNewEventIsRecurring(e.target.checked)}
                  className="w-4 h-4 rounded accent-indigo-500"
                />
                <span className="text-sm text-zinc-300 font-medium">🔄 Événement récurrent</span>
              </label>
              
              {newEventIsRecurring && (
                <div className="ml-6">
                  <label className="block text-xs text-zinc-500 mb-2">Fréquence</label>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => setNewEventRecurrence('daily')}
                      className={`px-3 py-2 text-xs rounded-lg transition-all ${
                        newEventRecurrence === 'daily'
                          ? 'bg-indigo-500 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      Quotidien
                    </button>
                    <button
                      onClick={() => setNewEventRecurrence('weekly')}
                      className={`px-3 py-2 text-xs rounded-lg transition-all ${
                        newEventRecurrence === 'weekly'
                          ? 'bg-indigo-500 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      Hebdo
                    </button>
                    <button
                      onClick={() => setNewEventRecurrence('monthly')}
                      className={`px-3 py-2 text-xs rounded-lg transition-all ${
                        newEventRecurrence === 'monthly'
                          ? 'bg-indigo-500 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      Mensuel
                    </button>
                    <button
                      onClick={() => setNewEventRecurrence('yearly')}
                      className={`px-3 py-2 text-xs rounded-lg transition-all ${
                        newEventRecurrence === 'yearly'
                          ? 'bg-indigo-500 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      Annuel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-5">
              <button
                onClick={handleQuickAdd}
                disabled={!newEventTitle.trim()}
                className="flex-1 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Créer l'événement
              </button>
              <button
                onClick={() => {
                  setShowQuickAdd(false)
                  setNewEventTitle('')
                  setNewEventStartTime('')
                  setNewEventEndTime('')
                  setNewEventType('custom')
                  setNewEventCategory('work')
                  setNewEventPriority('medium')
                  setNewEventIsRecurring(false)
                  setNewEventRecurrence('weekly')
                  setNewEventIsMultiDay(false)
                  setNewEventEndDate(null)
                }}
                className="px-4 py-2.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg text-sm transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event details panel */}
      {selectedEvent && (
        <EventDetails
          event={selectedEvent}
          onClose={() => setSelectedEventId(null)}
        />
      )}

      {/* Event Templates Page */}
      <EventTemplatesPage
        isOpen={showTemplates}
        onClose={() => {
          setShowTemplates(false)
          setTemplateMode(false)
          setSelectedDatesForTemplate([])
        }}
        onCreateEvents={handleCreateFromTemplate}
        preSelectedDates={selectedDatesForTemplate}
      />
    </div>
  )
}

