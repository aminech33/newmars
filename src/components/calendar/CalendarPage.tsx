import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, ChevronLeft, ChevronRight, LayoutGrid, LayoutList, Clock } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { EventCard } from './EventCard'
import { EventDetails } from './EventDetails'
import { WeekView } from './WeekView'
import { DayView } from './DayView'
import { CalendarFilters } from './CalendarFilters'
import { Tooltip } from '../ui/Tooltip'
import { useCalendarEvents, CalendarFilterState } from '../../hooks/useCalendarEvents'
import { getCalendarDays, getMonthName, getWeekDays, isToday } from '../../utils/dateUtils'
import { detectEventType, detectEventCategory, detectEventPriority } from '../../utils/calendarIntelligence'

type ViewMode = 'month' | 'week' | 'day'

export function CalendarPage() {
  const { events, addEvent, setView, isEditMode } = useStore()
  
  // Navigation state
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  
  // Event state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [newEventTitle, setNewEventTitle] = useState('')
  
  // Filters
  const [filters, setFilters] = useState<CalendarFilterState>({
    types: [],
    categories: [],
    priorities: [],
    showCompleted: true,
  })

  // Custom hook for events
  const { filteredEvents, getEventsForDay, stats } = useCalendarEvents({ events, filters })

  // Calendar data
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const calendarDays = getCalendarDays(year, month)
  const weekDays = getWeekDays()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N for new event
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        setShowQuickAdd(true)
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
      // T for today
      if (e.key === 't' && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          handleGoToToday()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
    <div className="min-h-screen w-full bg-mars-bg">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-mars-surface/80 border-b border-zinc-800">
        <div className="flex items-center justify-between p-4 lg:p-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('hub')}
              className="p-2 text-zinc-600 hover:text-zinc-400 transition-colors rounded-xl hover:bg-zinc-800/50"
              aria-label="Retour"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl lg:text-2xl font-bold text-zinc-200">Calendrier</h1>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            {/* Stats badges */}
            <div className="hidden md:flex items-center gap-2">
              {stats.today > 0 && (
                <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs rounded-lg">
                  {stats.today} aujourd'hui
                </span>
              )}
              {stats.overdue > 0 && (
                <span className="px-2 py-1 bg-rose-500/20 text-rose-400 text-xs rounded-lg">
                  {stats.overdue} en retard
                </span>
              )}
            </div>

            <CalendarFilters onFilterChange={(f) => setFilters(f as CalendarFilterState)} />

            {/* View toggle */}
            <div className="flex items-center gap-1 p-1 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
              <Tooltip content="Mois" side="bottom">
                <button
                  onClick={() => setViewMode('month')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'month'
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'text-zinc-600 hover:text-zinc-400'
                  }`}
                  aria-label="Vue mois"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip content="Semaine" side="bottom">
                <button
                  onClick={() => setViewMode('week')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'week'
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'text-zinc-600 hover:text-zinc-400'
                  }`}
                  aria-label="Vue semaine"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip content="Jour" side="bottom">
                <button
                  onClick={() => setViewMode('day')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'day'
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'text-zinc-600 hover:text-zinc-400'
                  }`}
                  aria-label="Vue jour"
                >
                  <Clock className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>

            <Tooltip content="Ctrl+N" side="bottom">
              <button
                onClick={() => setShowQuickAdd(true)}
                className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-xl hover:bg-indigo-500/30 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden lg:inline text-sm font-medium">Nouvel événement</span>
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between px-4 lg:px-6 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 text-zinc-600 hover:text-zinc-400 transition-colors rounded-xl hover:bg-zinc-800/50"
              aria-label="Mois précédent"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-zinc-200 min-w-[180px] text-center">
              {getMonthName(month)} {year}
            </h2>
            <button
              onClick={handleNextMonth}
              className="p-2 text-zinc-600 hover:text-zinc-400 transition-colors rounded-xl hover:bg-zinc-800/50"
              aria-label="Mois suivant"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <Tooltip content="T" side="left">
            <button
              onClick={handleGoToToday}
              className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-lg transition-colors"
            >
              Aujourd'hui
            </button>
          </Tooltip>
        </div>
      </header>

      {/* Main content */}
      <main className="p-4 lg:p-6">
        {viewMode === 'month' ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Calendar grid */}
            <div className="lg:col-span-3">
              {/* Week days header */}
              <div className="grid grid-cols-7 mb-2">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-zinc-600 py-2"
                  >
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{day.slice(0, 1)}</span>
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div 
                className="grid grid-cols-7 gap-1"
                role="grid"
                aria-label="Calendrier"
              >
                {calendarDays.map((day, index) => {
                  const dayEvents = day ? getEventsForDay(day) : []
                  const isCurrentMonth = day && day.getMonth() === month
                  const isTodayDate = day && isToday(day)
                  const isSelected = day && selectedDate && 
                    day.toDateString() === selectedDate.toDateString()

                  return (
                    <button
                      key={index}
                      onClick={() => day && setSelectedDate(day)}
                      disabled={!day}
                      className={`
                        relative min-h-[80px] lg:min-h-[100px] p-1 lg:p-2 rounded-xl transition-all text-left
                        ${!day ? 'bg-transparent cursor-default' : ''}
                        ${day && !isCurrentMonth ? 'opacity-30' : ''}
                        ${day && isCurrentMonth ? 'hover:bg-zinc-800/30' : ''}
                        ${isSelected ? 'bg-indigo-500/20 ring-2 ring-indigo-500/50' : ''}
                        ${isTodayDate ? 'bg-zinc-800/50' : ''}
                      `}
                      style={day ? { border: '1px solid rgba(255,255,255,0.05)' } : {}}
                      aria-label={day ? `${day.getDate()} ${getMonthName(day.getMonth())}` : undefined}
                      role="gridcell"
                    >
                      {day && (
                        <>
                          <span className={`
                            text-xs lg:text-sm font-medium
                            ${isTodayDate ? 'text-indigo-400' : 'text-zinc-400'}
                          `}>
                            {day.getDate()}
                          </span>

                          {/* Events preview */}
                          <div className="mt-1 space-y-0.5 overflow-hidden">
                            {dayEvents.slice(0, 2).map((event) => (
                              <div
                                key={event.id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEventClick(event.id)
                                }}
                                className="text-[10px] lg:text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity"
                                style={{
                                  backgroundColor: `var(--${event.category}-bg, rgba(99, 102, 241, 0.2))`,
                                  color: `var(--${event.category}-text, rgb(129, 140, 248))`
                                }}
                              >
                                {event.title}
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <span className="text-[10px] text-zinc-600">
                                +{dayEvents.length - 2}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Sidebar - Selected day events */}
            <aside className="lg:col-span-1">
              <div className="sticky top-32 bg-zinc-900/30 backdrop-blur-xl rounded-2xl p-4 border border-zinc-800/50">
                <h3 className="text-sm font-medium text-zinc-400 mb-4">
                  {selectedDate
                    ? selectedDate.toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })
                    : 'Sélectionnez une date'}
                </h3>

                {/* Quick add */}
                {showQuickAdd && selectedDate && (
                  <div className="mb-4 p-3 bg-zinc-800/50 rounded-xl animate-fade-in">
                    <input
                      type="text"
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleQuickAdd()
                        if (e.key === 'Escape') setShowQuickAdd(false)
                      }}
                      placeholder="Nouvel événement..."
                      className="w-full bg-transparent text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none"
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleQuickAdd}
                        className="flex-1 px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-lg text-xs hover:bg-indigo-500/30 transition-colors"
                      >
                        Ajouter
                      </button>
                      <button
                        onClick={() => setShowQuickAdd(false)}
                        className="px-2 py-1 text-zinc-500 rounded-lg text-xs hover:bg-zinc-800 transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {/* Events list */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {selectedDayEvents.length > 0 ? (
                    selectedDayEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onClick={() => handleEventClick(event.id)}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-zinc-600 text-center py-8">
                      {selectedDate ? 'Aucun événement' : 'Cliquez sur une date'}
                    </p>
                  )}
                </div>

                {/* Add button */}
                {selectedDate && !showQuickAdd && (
                  <button
                    onClick={() => setShowQuickAdd(true)}
                    className="w-full mt-4 py-2 text-sm text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter un événement
                  </button>
                )}
              </div>
            </aside>
          </div>
        ) : viewMode === 'week' ? (
          <WeekView
            currentDate={currentDate}
            events={filteredEvents}
            onEventClick={handleEventClick}
          />
        ) : (
          <DayView
            date={selectedDate || currentDate}
            events={filteredEvents}
            onEventClick={handleEventClick}
            onTimeSlotClick={(hour) => {
              setShowQuickAdd(true)
              const time = `${hour.toString().padStart(2, '0')}:00`
              setNewEventTitle(`${time} - `)
            }}
          />
        )}
      </main>

      {/* Event details panel */}
      {selectedEvent && (
        <EventDetails
          event={selectedEvent}
          onClose={() => setSelectedEventId(null)}
        />
      )}

      {/* Mobile FAB */}
      <button
        onClick={() => setShowQuickAdd(true)}
        className="fixed bottom-6 right-6 z-40 p-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-110 lg:hidden"
        aria-label="Nouvel événement"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  )
}

