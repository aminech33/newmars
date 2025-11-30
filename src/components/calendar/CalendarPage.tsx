import { useState, useMemo } from 'react'
import { ArrowLeft, Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, LayoutGrid, LayoutList } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Event } from '../../types/calendar'
import { EventCard } from './EventCard'
import { EventDetails } from './EventDetails'
import { WeekView } from './WeekView'
import { CalendarFilters, FilterState } from './CalendarFilters'
import { getCalendarDays, getMonthName, getWeekDays, isToday, isSameDay } from '../../utils/dateUtils'
import { generateSmartSuggestions, analyzeWorkload, detectEventType, detectEventCategory, detectEventPriority } from '../../utils/calendarIntelligence'
import { generateRecurringInstances } from '../../utils/recurrenceUtils'

type ViewMode = 'month' | 'week'

export function CalendarPage() {
  const { events, addEvent, setView, isEditMode } = useStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [newEventTitle, setNewEventTitle] = useState('')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [filters, setFilters] = useState<FilterState>({
    types: [],
    categories: [],
    priorities: [],
    showCompleted: true,
  })
  
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const calendarDays = getCalendarDays(year, month)
  const weekDays = getWeekDays()
  
  // Generate recurring instances for all events
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
      // Filter by type
      if (filters.types.length > 0 && !filters.types.includes(event.type)) {
        return false
      }
      
      // Filter by category
      if (filters.categories.length > 0 && !filters.categories.includes(event.category)) {
        return false
      }
      
      // Filter by priority
      if (filters.priorities.length > 0 && !filters.priorities.includes(event.priority)) {
        return false
      }
      
      // Filter by completed
      if (!filters.showCompleted && event.completed) {
        return false
      }
      
      return true
    })
  }, [allEventsWithRecurring, filters])
  
  // Suggestions intelligentes
  const suggestions = generateSmartSuggestions(filteredEvents)
  
  // Événements du jour sélectionné
  const selectedDateStr = selectedDate?.toISOString().split('T')[0]
  const selectedDayEvents = selectedDateStr 
    ? filteredEvents.filter(e => e.startDate === selectedDateStr)
    : []
  
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1))
  }
  
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1))
  }
  
  const handleQuickAdd = () => {
    if (newEventTitle.trim() && selectedDate) {
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
  }
  
  const getEventsForDay = (date: Date | null) => {
    if (!date) return []
    const dateStr = date.toISOString().split('T')[0]
    return filteredEvents.filter(e => e.startDate === dateStr)
  }

  const handleEventClick = (eventId: string) => {
    if (!isEditMode) {
      setSelectedEventId(eventId)
    }
  }

  const selectedEvent = events.find(e => e.id === selectedEventId)
  
  return (
    <div className="min-h-screen w-full bg-mars-bg">
      <div className="w-full max-w-[1800px] mx-auto px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setView('hub')}
                className="p-2 text-zinc-600 hover:text-zinc-400 transition-all rounded-xl hover:bg-zinc-800/50"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-zinc-200">Calendrier</h1>
                <p className="text-sm text-zinc-600 mt-0.5">
                  {events.filter(e => !e.completed).length} événements à venir
                </p>
              </div>
            </div>
            
            <button
              onClick={() => {
                setSelectedDate(new Date())
                setShowQuickAdd(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-2xl hover:bg-indigo-500/30 shadow-[0_4px_16px_rgba(91,127,255,0.2)] transition-all duration-300"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Nouvel événement</span>
            </button>
          </div>
        </div>
        
        {/* Smart Suggestions */}
        {suggestions.length > 0 && (
          <div className="mb-6 backdrop-blur-xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 rounded-2xl p-4 shadow-[0_4px_24px_rgba(91,127,255,0.1)]"
            style={{ border: '1px solid rgba(99, 102, 241, 0.2)' }}
          >
            <h3 className="text-sm font-medium text-indigo-300 mb-2">💡 Suggestions Intelligentes</h3>
            <div className="space-y-1">
              {suggestions.slice(0, 2).map((suggestion, i) => (
                <p key={i} className="text-xs text-zinc-400">{suggestion}</p>
              ))}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendrier */}
          <div className="lg:col-span-2">
            <div className="backdrop-blur-xl bg-zinc-900/30 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {/* Navigation mois */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-zinc-200">
                  {getMonthName(month)} {year}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 text-zinc-600 hover:text-zinc-400 transition-all rounded-xl hover:bg-zinc-800/50"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 rounded-xl hover:bg-zinc-800/50 transition-all"
              >
                Aujourd'hui
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 text-zinc-600 hover:text-zinc-400 transition-all rounded-xl hover:bg-zinc-800/50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 mt-4 mb-4">
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl transition-all ${
                viewMode === 'month'
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Mois
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl transition-all ${
                viewMode === 'week'
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              Semaine
            </button>
            <CalendarFilters onFilterChange={setFilters} />
          </div>
              
          {/* Month View */}
          {viewMode === 'month' && (
            <>
              {/* Jours de la semaine */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {weekDays.map(day => (
                  <div key={day} className="text-center text-xs font-medium text-zinc-600 py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Grille du calendrier */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="aspect-square" />
                  }
                  
                  const dateStr = date.toISOString().split('T')[0]
                  const dayEvents = getEventsForDay(date)
                  const workload = analyzeWorkload(events, dateStr)
                  const isSelected = selectedDate && isSameDay(date, selectedDate)
                  const isTodayDate = isToday(dateStr)
                  
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedDate(date)}
                      className={`
                        aspect-square p-2 rounded-xl transition-all duration-300
                        ${isSelected ? 'bg-indigo-500/20 border border-indigo-500/50' : 'hover:bg-zinc-800/50'}
                        ${isTodayDate ? 'border border-cyan-500/50' : ''}
                      `}
                    >
                      <div className="flex flex-col items-center justify-center h-full">
                        <span className={`text-sm ${isTodayDate ? 'text-cyan-400 font-bold' : 'text-zinc-400'}`}>
                          {date.getDate()}
                        </span>
                        {dayEvents.length > 0 && (
                          <div className="flex gap-0.5 mt-1">
                            {dayEvents.slice(0, 3).map((_, i) => (
                              <div
                                key={i}
                                className={`w-1 h-1 rounded-full ${
                                  workload.level === 'heavy' ? 'bg-rose-500' :
                                  workload.level === 'moderate' ? 'bg-amber-500' :
                                  'bg-emerald-500'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* Week View */}
          {viewMode === 'week' && (
            <WeekView
              currentDate={currentDate}
              events={filteredEvents}
              onEventClick={handleEventClick}
            />
          )}
        </div>
      </div>
          
          {/* Événements du jour */}
          <div className="space-y-4">
            <div className="backdrop-blur-xl bg-zinc-900/30 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <CalendarIcon className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-semibold text-zinc-200">
                  {selectedDate ? selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : 'Sélectionnez un jour'}
                </h3>
              </div>
              
              {showQuickAdd && selectedDate && (
                <div className="mb-4 p-3 bg-zinc-900/50 rounded-xl"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <input
                    type="text"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleQuickAdd()
                      if (e.key === 'Escape') setShowQuickAdd(false)
                    }}
                    placeholder="Titre de l'événement..."
                    className="w-full bg-transparent text-zinc-300 placeholder:text-zinc-700 focus:outline-none text-sm"
                    autoFocus
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={handleQuickAdd}
                      className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-lg text-xs hover:bg-indigo-500/30 transition-colors"
                    >
                      Créer
                    </button>
                    <button
                      onClick={() => setShowQuickAdd(false)}
                      className="px-3 py-1 text-zinc-500 rounded-lg text-xs hover:bg-zinc-800/50 transition-colors"
                    >
                      Annuler
                    </button>
                    <span className="text-xs text-zinc-700 ml-2">
                      💡 L'IA analyse automatiquement
                    </span>
                  </div>
                </div>
              )}
              
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {selectedDayEvents.length > 0 ? (
                  selectedDayEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onClick={() => handleEventClick(event.id)}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📅</div>
                    <p className="text-zinc-500 text-sm">Aucun événement</p>
                    {selectedDate && (
                      <button
                        onClick={() => setShowQuickAdd(true)}
                        className="mt-3 text-xs text-indigo-400 hover:text-indigo-300"
                      >
                        + Ajouter un événement
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Event Details Panel */}
        {selectedEvent && (
          <EventDetails event={selectedEvent} onClose={() => setSelectedEventId(null)} />
        )}
      </div>
    </div>
  )
}
