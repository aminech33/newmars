import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, ChevronLeft, ChevronRight, LayoutGrid, LayoutList, Clock, Calendar as CalendarIcon } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { EventCard } from './EventCard'
import { EventDetails } from './EventDetails'
import { WeekView } from './WeekView'
import { DayView } from './DayView'
import { CalendarFilters } from './CalendarFilters'
import { SmartSuggestions } from './SmartSuggestions'
import { Tooltip } from '../ui/Tooltip'
import { useCalendarEvents, CalendarFilterState } from '../../hooks/useCalendarEvents'
import { useEventReminders } from '../../hooks/useEventReminders'
import { getCalendarDays, getMonthName, getWeekDays, isToday } from '../../utils/dateUtils'
import { detectEventType, detectEventCategory, detectEventPriority } from '../../utils/calendarIntelligence'

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
  const [newEventTitle, setNewEventTitle] = useState('')
  
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

    const type = detectEventType(newEventTitle)
    const category = detectEventCategory(newEventTitle)
    const priority = detectEventPriority(newEventTitle, selectedDate.toISOString().split('T')[0])

    addEvent({
      title: newEventTitle,
      startDate: selectedDate.toISOString().split('T')[0],
      type,
      category,
      priority,
      isRecurring: false,
      completed: false
    })

    setNewEventTitle('')
    setShowQuickAdd(false)
  }

  const handleEventClick = (eventId: string) => {
    if (!isEditMode) {
      setSelectedEventId(eventId)
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
              onClick={() => setView('hub')}
              className="p-1.5 hover:bg-zinc-800/50 rounded-lg transition-colors"
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
              {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={handleNextMonth} className="p-1.5 hover:bg-zinc-800/50 rounded-lg transition-colors">
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>
            <button
              onClick={handleToday}
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

            <button
              onClick={() => setShowQuickAdd(true)}
              className="flex items-center gap-1 px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouveau</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 py-3">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          {/* Calendar Grid */}
          <div className="lg:col-span-3">
            {/* Days header */}
            <div className="grid grid-cols-7 mb-1">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                <div key={day} className="text-center text-[10px] font-medium text-zinc-600 py-1">{day}</div>
              ))}
            </div>

            {/* Calendar cells */}
            <div className="grid grid-cols-7 gap-0.5">
              {calendarDays.map((day, i) => {
                const dateStr = day.date.toISOString().split('T')[0]
                const dayEvents = filteredEvents.filter(e => e.startDate === dateStr)
                const isSelected = selectedDate?.toISOString().split('T')[0] === dateStr

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(day.date)}
                    className={`
                      relative min-h-[60px] p-1 rounded-lg transition-colors text-left
                      ${!day.isCurrentMonth ? 'opacity-30' : ''}
                      ${day.isToday ? 'bg-indigo-500/10 border border-indigo-500/30' : 'hover:bg-zinc-800/50'}
                      ${isSelected ? 'ring-1 ring-indigo-500' : ''}
                    `}
                  >
                    <span className={`text-xs font-medium ${day.isToday ? 'text-indigo-400' : 'text-zinc-400'}`}>
                      {day.date.getDate()}
                    </span>
                    {dayEvents.length > 0 && (
                      <div className="mt-0.5 space-y-0.5 overflow-hidden">
                        {dayEvents.slice(0, 2).map(event => (
                          <div
                            key={event.id}
                            className="text-[9px] px-1 py-0.5 rounded truncate"
                            style={{ backgroundColor: `${event.color}30`, color: event.color }}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[9px] text-zinc-500">+{dayEvents.length - 2}</div>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="bg-zinc-900/30 rounded-xl p-3 border border-zinc-800/50">
            <h3 className="text-xs font-medium text-zinc-400 mb-2">
              {selectedDate ? selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Sélectionnez un jour'}
            </h3>
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {selectedDayEvents.length === 0 ? (
                <p className="text-xs text-zinc-600 text-center py-4">Aucun événement</p>
              ) : (
                selectedDayEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="p-2 rounded-lg cursor-pointer hover:bg-zinc-800/50 transition-colors"
                    style={{ borderLeft: `3px solid ${event.color}` }}
                  >
                    <div className="text-xs font-medium text-zinc-200">{event.title}</div>
                    {event.startTime && (
                      <div className="text-[10px] text-zinc-500">{event.startTime}{event.endTime && ` - ${event.endTime}`}</div>
                    )}
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setShowQuickAdd(true)}
              className="w-full mt-2 py-1.5 text-xs text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3" /> Ajouter
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-zinc-900 rounded-xl p-4 w-full max-w-md border border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-200 mb-3">Nouvel événement</h3>
            <input
              type="text"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleQuickAdd()
                if (e.key === 'Escape') setShowQuickAdd(false)
              }}
              placeholder="Titre de l'événement..."
              className="w-full bg-zinc-800/50 text-sm text-zinc-300 placeholder:text-zinc-600 px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleQuickAdd}
                className="flex-1 px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg text-xs hover:bg-indigo-500/30 transition-colors"
              >
                Ajouter
              </button>
              <button
                onClick={() => setShowQuickAdd(false)}
                className="px-3 py-1.5 text-zinc-500 rounded-lg text-xs hover:bg-zinc-800 transition-colors"
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
    </div>
  )
}

