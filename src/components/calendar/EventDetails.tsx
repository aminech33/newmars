import { X, Calendar, Clock, MapPin, Users, Tag, Flag, Trash2, Plus, Repeat, Link as LinkIcon } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { Event, EventType, EventCategory, EventPriority, Recurrence } from '../../types/calendar'
import { useStore } from '../../store/useStore'

interface EventDetailsProps {
  event: Event
  onClose: () => void
}

const typeOptions: { value: EventType; label: string; icon: string }[] = [
  { value: 'meeting', label: 'Réunion', icon: '🗓️' },
  { value: 'deadline', label: 'Deadline', icon: '⏰' },
  { value: 'reminder', label: 'Rappel', icon: '🔔' },
  { value: 'birthday', label: 'Anniversaire', icon: '🎂' },
  { value: 'holiday', label: 'Vacances', icon: '🎉' },
  { value: 'custom', label: 'Personnalisé', icon: '📌' },
]

const categoryOptions: { value: EventCategory; label: string; color: string }[] = [
  { value: 'work', label: 'Travail', color: 'text-amber-400' },
  { value: 'personal', label: 'Personnel', color: 'text-emerald-400' },
  { value: 'health', label: 'Santé', color: 'text-rose-400' },
  { value: 'social', label: 'Social', color: 'text-cyan-400' },
  { value: 'learning', label: 'Formation', color: 'text-violet-400' },
]

const priorityOptions: { value: EventPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Basse', color: 'text-zinc-500' },
  { value: 'medium', label: 'Moyenne', color: 'text-indigo-500' },
  { value: 'high', label: 'Haute', color: 'text-amber-500' },
  { value: 'urgent', label: 'Urgent', color: 'text-rose-500' },
]

const frequencyOptions: { value: Recurrence['frequency']; label: string }[] = [
  { value: 'daily', label: 'Quotidien' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuel' },
  { value: 'yearly', label: 'Annuel' },
]

const daysOfWeek = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mer' },
  { value: 4, label: 'Jeu' },
  { value: 5, label: 'Ven' },
  { value: 6, label: 'Sam' },
  { value: 0, label: 'Dim' },
]

export function EventDetails({ event, onClose }: EventDetailsProps) {
  const { updateEvent, deleteEvent, tasks, addTask } = useStore()
  const [editTitle, setEditTitle] = useState(event.title)
  const [editDescription, setEditDescription] = useState(event.description || '')
  const [editStartDate, setEditStartDate] = useState(event.startDate)
  const [editEndDate, setEditEndDate] = useState(event.endDate || '')
  const [editStartTime, setEditStartTime] = useState(event.startTime || '')
  const [editEndTime, setEditEndTime] = useState(event.endTime || '')
  const [editType, setEditType] = useState<EventType>(event.type)
  const [editCategory, setEditCategory] = useState<EventCategory>(event.category)
  const [editPriority, setEditPriority] = useState<EventPriority>(event.priority)
  const [editLocation, setEditLocation] = useState(event.location || '')
  const [editAttendees, setEditAttendees] = useState<string[]>(event.attendees || [])
  const [newAttendee, setNewAttendee] = useState('')
  const [editIsRecurring, setEditIsRecurring] = useState(event.isRecurring)
  const [editRecurrence, setEditRecurrence] = useState<Recurrence | undefined>(event.recurrence)
  
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditTitle(event.title)
    setEditDescription(event.description || '')
    setEditStartDate(event.startDate)
    setEditEndDate(event.endDate || '')
    setEditStartTime(event.startTime || '')
    setEditEndTime(event.endTime || '')
    setEditType(event.type)
    setEditCategory(event.category)
    setEditPriority(event.priority)
    setEditLocation(event.location || '')
    setEditAttendees(event.attendees || [])
    setEditIsRecurring(event.isRecurring)
    setEditRecurrence(event.recurrence)
  }, [event])

  const handleUpdate = (field: keyof Event, value: any) => {
    updateEvent(event.id, { [field]: value })
  }

  const handleTitleBlur = () => {
    if (editTitle.trim() !== event.title) {
      handleUpdate('title', editTitle.trim())
    }
  }

  const handleDescriptionBlur = () => {
    if (editDescription.trim() !== (event.description || '')) {
      handleUpdate('description', editDescription.trim())
    }
  }

  const handleAddAttendee = () => {
    if (newAttendee.trim()) {
      const updated = [...editAttendees, newAttendee.trim()]
      setEditAttendees(updated)
      handleUpdate('attendees', updated)
      setNewAttendee('')
    }
  }

  const handleRemoveAttendee = (index: number) => {
    const updated = editAttendees.filter((_, i) => i !== index)
    setEditAttendees(updated)
    handleUpdate('attendees', updated)
  }

  const handleDeleteEvent = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      deleteEvent(event.id)
      onClose()
    }
  }

  const handleCreateTask = () => {
    if (confirm('Créer une tâche liée à cet événement ?')) {
      addTask({
        title: event.title,
        completed: false,
        category: event.category === 'work' ? 'work' : event.category === 'personal' ? 'personal' : 'work',
        status: 'todo',
        priority: event.priority,
        dueDate: event.startDate,
        description: event.description,
        estimatedTime: event.startTime && event.endTime ? calculateDuration(event.startTime, event.endTime) : 60,
      })
      handleUpdate('linkedTaskId', 'temp-id') // Will be replaced with actual task ID
    }
  }

  const calculateDuration = (start: string, end: string): number => {
    const [startH, startM] = start.split(':').map(Number)
    const [endH, endM] = end.split(':').map(Number)
    return (endH * 60 + endM) - (startH * 60 + startM)
  }

  const handleToggleRecurring = () => {
    const newValue = !editIsRecurring
    setEditIsRecurring(newValue)
    handleUpdate('isRecurring', newValue)
    
    if (newValue && !editRecurrence) {
      const defaultRecurrence: Recurrence = {
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [new Date(editStartDate).getDay()]
      }
      setEditRecurrence(defaultRecurrence)
      handleUpdate('recurrence', defaultRecurrence)
    }
  }

  const handleRecurrenceChange = (field: keyof Recurrence, value: any) => {
    const updated = { ...editRecurrence, [field]: value } as Recurrence
    setEditRecurrence(updated)
    handleUpdate('recurrence', updated)
  }

  const currentTypeIcon = typeOptions.find(t => t.value === editType)?.icon || '📌'
  const currentCategoryColor = categoryOptions.find(c => c.value === editCategory)?.color || 'text-zinc-500'
  const currentPriorityColor = priorityOptions.find(p => p.value === editPriority)?.color || 'text-zinc-500'

  const linkedTask = event.linkedTaskId ? tasks.find(t => t.id === event.linkedTaskId) : null

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-slide-in-right">
      <div className="w-full md:w-1/2 lg:w-1/3 h-full bg-mars-surface border-l border-zinc-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-900/50">
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-medium text-zinc-200">Détails de l'événement</h2>
          <button onClick={handleDeleteEvent} className="text-rose-500 hover:text-rose-400 transition-colors">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Title */}
          <div className="flex items-center gap-3">
            <span className="text-2xl">{currentTypeIcon}</span>
            <input
              ref={titleRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => e.key === 'Enter' && titleRef.current?.blur()}
              className="flex-1 text-xl font-bold bg-transparent text-zinc-200 focus:outline-none focus:ring-0 border-b border-transparent focus:border-zinc-700 pb-1 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-zinc-500 mb-2">Description</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              placeholder="Ajouter une description..."
              rows={4}
              className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-indigo-600 rounded-xl p-3 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none transition-colors shadow-sm"
            />
          </div>

          {/* Dates & Times */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-2 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Date de début
              </label>
              <input
                type="date"
                value={editStartDate}
                onChange={(e) => {
                  setEditStartDate(e.target.value)
                  handleUpdate('startDate', e.target.value)
                }}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-indigo-600 rounded-xl p-3 text-sm text-zinc-300 focus:outline-none transition-colors shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-2 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Date de fin
              </label>
              <input
                type="date"
                value={editEndDate}
                onChange={(e) => {
                  setEditEndDate(e.target.value)
                  handleUpdate('endDate', e.target.value)
                }}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-indigo-600 rounded-xl p-3 text-sm text-zinc-300 focus:outline-none transition-colors shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Heure de début
              </label>
              <input
                type="time"
                value={editStartTime}
                onChange={(e) => {
                  setEditStartTime(e.target.value)
                  handleUpdate('startTime', e.target.value)
                }}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-indigo-600 rounded-xl p-3 text-sm text-zinc-300 focus:outline-none transition-colors shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Heure de fin
              </label>
              <input
                type="time"
                value={editEndTime}
                onChange={(e) => {
                  setEditEndTime(e.target.value)
                  handleUpdate('endTime', e.target.value)
                }}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-indigo-600 rounded-xl p-3 text-sm text-zinc-300 focus:outline-none transition-colors shadow-sm"
              />
            </div>
          </div>

          {/* Type, Category, Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-2 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Type
              </label>
              <select
                value={editType}
                onChange={(e) => {
                  const type = e.target.value as EventType
                  setEditType(type)
                  handleUpdate('type', type)
                }}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-indigo-600 rounded-xl p-3 text-sm text-zinc-300 focus:outline-none transition-colors shadow-sm"
              >
                {typeOptions.map(option => (
                  <option key={option.value} value={option.value} className="bg-zinc-900">
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-2 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Catégorie
              </label>
              <select
                value={editCategory}
                onChange={(e) => {
                  const category = e.target.value as EventCategory
                  setEditCategory(category)
                  handleUpdate('category', category)
                }}
                className={`w-full bg-zinc-900/50 border border-zinc-800 focus:border-indigo-600 rounded-xl p-3 text-sm ${currentCategoryColor} focus:outline-none transition-colors shadow-sm`}
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value} className="bg-zinc-900 text-zinc-300">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-2 flex items-center gap-1">
                <Flag className="w-3 h-3" /> Priorité
              </label>
              <select
                value={editPriority}
                onChange={(e) => {
                  const priority = e.target.value as EventPriority
                  setEditPriority(priority)
                  handleUpdate('priority', priority)
                }}
                className={`w-full bg-zinc-900/50 border border-zinc-800 focus:border-indigo-600 rounded-xl p-3 text-sm ${currentPriorityColor} focus:outline-none transition-colors shadow-sm`}
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value} className="bg-zinc-900 text-zinc-300">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs text-zinc-500 mb-2 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Lieu
            </label>
            <input
              type="text"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              onBlur={() => handleUpdate('location', editLocation)}
              placeholder="Ajouter un lieu..."
              className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-indigo-600 rounded-xl p-3 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none transition-colors shadow-sm"
            />
          </div>

          {/* Attendees */}
          <div>
            <label className="block text-xs text-zinc-500 mb-2 flex items-center gap-1">
              <Users className="w-3 h-3" /> Participants
            </label>
            <div className="space-y-2">
              {editAttendees.map((attendee, index) => (
                <div key={index} className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-2 shadow-sm">
                  <span className="flex-1 text-sm text-zinc-300">{attendee}</span>
                  <button onClick={() => handleRemoveAttendee(index)} className="text-zinc-600 hover:text-rose-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={newAttendee}
                onChange={(e) => setNewAttendee(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddAttendee()}
                placeholder="Ajouter un participant..."
                className="flex-1 bg-zinc-900/50 border border-zinc-800 focus:border-indigo-600 rounded-xl p-2 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none transition-colors shadow-sm"
              />
              <button onClick={handleAddAttendee} className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Recurring */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editIsRecurring}
                onChange={handleToggleRecurring}
                className="form-checkbox h-4 w-4 text-indigo-600 bg-zinc-700 border-zinc-600 rounded focus:ring-indigo-500"
              />
              <Repeat className="w-4 h-4 text-zinc-500" />
              <span className="text-sm text-zinc-300">Événement récurrent</span>
            </label>

            {editIsRecurring && editRecurrence && (
              <div className="mt-3 p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-600 mb-1">Fréquence</label>
                    <select
                      value={editRecurrence.frequency}
                      onChange={(e) => handleRecurrenceChange('frequency', e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs text-zinc-300"
                    >
                      {frequencyOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-600 mb-1">Intervalle</label>
                    <input
                      type="number"
                      min="1"
                      value={editRecurrence.interval}
                      onChange={(e) => handleRecurrenceChange('interval', parseInt(e.target.value))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs text-zinc-300"
                    />
                  </div>
                </div>

                {editRecurrence.frequency === 'weekly' && (
                  <div>
                    <label className="block text-xs text-zinc-600 mb-2">Jours de la semaine</label>
                    <div className="flex gap-1">
                      {daysOfWeek.map(day => (
                        <button
                          key={day.value}
                          onClick={() => {
                            const current = editRecurrence.daysOfWeek || []
                            const updated = current.includes(day.value)
                              ? current.filter(d => d !== day.value)
                              : [...current, day.value]
                            handleRecurrenceChange('daysOfWeek', updated)
                          }}
                          className={`flex-1 py-1 px-2 text-xs rounded-lg transition-colors ${
                            editRecurrence.daysOfWeek?.includes(day.value)
                              ? 'bg-indigo-600 text-white'
                              : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs text-zinc-600 mb-1">Date de fin (optionnel)</label>
                  <input
                    type="date"
                    value={editRecurrence.endDate || ''}
                    onChange={(e) => handleRecurrenceChange('endDate', e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs text-zinc-300"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Linked Task */}
          <div>
            <label className="block text-xs text-zinc-500 mb-2 flex items-center gap-1">
              <LinkIcon className="w-3 h-3" /> Tâche liée
            </label>
            {linkedTask ? (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                <p className="text-sm text-indigo-300">📋 {linkedTask.title}</p>
                <p className="text-xs text-zinc-600 mt-1">Statut: {linkedTask.status}</p>
              </div>
            ) : (
              <button
                onClick={handleCreateTask}
                className="w-full p-3 bg-zinc-900/50 border border-zinc-800 hover:border-indigo-600 rounded-xl text-sm text-zinc-400 hover:text-indigo-400 transition-all"
              >
                + Créer une tâche liée
              </button>
            )}
          </div>

          {/* Complete Toggle */}
          <div className="pt-4 border-t border-zinc-900/50">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={event.completed}
                onChange={() => handleUpdate('completed', !event.completed)}
                className="form-checkbox h-5 w-5 text-emerald-600 bg-zinc-700 border-zinc-600 rounded focus:ring-emerald-500"
              />
              <span className="text-sm text-zinc-300 font-medium">Marquer comme terminé</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}


import { Event, EventType, EventCategory, EventPriority, Recurrence } from '../../types/calendar'
import { useStore } from '../../store/useStore'

interface EventDetailsProps {
  event: Event
  onClose: () => void
}

const typeOptions: { value: EventType; label: string; icon: string }[] = [
  { value: 'meeting', label: 'Réunion', icon: '🗓️' },
  { value: 'deadline', label: 'Deadline', icon: '⏰' },
  { value: 'reminder', label: 'Rappel', icon: '🔔' },
  { value: 'birthday', label: 'Anniversaire', icon: '🎂' },
  { value: 'holiday', label: 'Vacances', icon: '🎉' },
  { value: 'custom', label: 'Personnalisé', icon: '📌' },
]

const categoryOptions: { value: EventCategory; label: string; color: string }[] = [
  { value: 'work', label: 'Travail', color: 'text-amber-400' },
  { value: 'personal', label: 'Personnel', color: 'text-emerald-400' },
  { value: 'health', label: 'Santé', color: 'text-rose-400' },
  { value: 'social', label: 'Social', color: 'text-cyan-400' },
  { value: 'learning', label: 'Formation', color: 'text-violet-400' },
]

const priorityOptions: { value: EventPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Basse', color: 'text-zinc-500' },
  { value: 'medium', label: 'Moyenne', color: 'text-indigo-500' },
  { value: 'high', label: 'Haute', color: 'text-amber-500' },
  { value: 'urgent', label: 'Urgent', color: 'text-rose-500' },
]

const frequencyOptions: { value: Recurrence['frequency']; label: string }[] = [
  { value: 'daily', label: 'Quotidien' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuel' },
  { value: 'yearly', label: 'Annuel' },
]

const daysOfWeek = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mer' },
  { value: 4, label: 'Jeu' },
  { value: 5, label: 'Ven' },
  { value: 6, label: 'Sam' },
  { value: 0, label: 'Dim' },
]

export function EventDetails({ event, onClose }: EventDetailsProps) {
  const { updateEvent, deleteEvent, tasks, addTask } = useStore()
  const [editTitle, setEditTitle] = useState(event.title)
  const [editDescription, setEditDescription] = useState(event.description || '')
  const [editStartDate, setEditStartDate] = useState(event.startDate)
  const [editEndDate, setEditEndDate] = useState(event.endDate || '')
  const [editStartTime, setEditStartTime] = useState(event.startTime || '')
  const [editEndTime, setEditEndTime] = useState(event.endTime || '')
  const [editType, setEditType] = useState<EventType>(event.type)
  const [editCategory, setEditCategory] = useState<EventCategory>(event.category)
  const [editPriority, setEditPriority] = useState<EventPriority>(event.priority)
  const [editLocation, setEditLocation] = useState(event.location || '')
  const [editAttendees, setEditAttendees] = useState<string[]>(event.attendees || [])
  const [newAttendee, setNewAttendee] = useState('')
  const [editIsRecurring, setEditIsRecurring] = useState(event.isRecurring)
  const [editRecurrence, setEditRecurrence] = useState<Recurrence | undefined>(event.recurrence)
  
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditTitle(event.title)
    setEditDescription(event.description || '')
    setEditStartDate(event.startDate)
    setEditEndDate(event.endDate || '')
    setEditStartTime(event.startTime || '')
    setEditEndTime(event.endTime || '')
    setEditType(event.type)
    setEditCategory(event.category)
    setEditPriority(event.priority)
    setEditLocation(event.location || '')
    setEditAttendees(event.attendees || [])
    setEditIsRecurring(event.isRecurring)
    setEditRecurrence(event.recurrence)
  }, [event])

  const handleUpdate = (field: keyof Event, value: any) => {
    updateEvent(event.id, { [field]: value })
  }

  const handleTitleBlur = () => {
    if (editTitle.trim() !== event.title) {
      handleUpdate('title', editTitle.trim())
    }
  }

  const handleDescriptionBlur = () => {
    if (editDescription.trim() !== (event.description || '')) {
      handleUpdate('description', editDescription.trim())
    }
  }

  const handleAddAttendee = () => {
    if (newAttendee.trim()) {
      const updated = [...editAttendees, newAttendee.trim()]
      setEditAttendees(updated)
      handleUpdate('attendees', updated)
      setNewAttendee('')
    }
  }

  const handleRemoveAttendee = (index: number) => {
    const updated = editAttendees.filter((_, i) => i !== index)
    setEditAttendees(updated)
    handleUpdate('attendees', updated)
  }

  const handleDeleteEvent = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      deleteEvent(event.id)
      onClose()
    }
  }

  const handleCreateTask = () => {
    if (confirm('Créer une tâche liée à cet événement ?')) {
      addTask({
        title: event.title,
        completed: false,
        category: event.category === 'work' ? 'work' : event.category === 'personal' ? 'personal' : 'work',
        status: 'todo',
        priority: event.priority,
        dueDate: event.startDate,
        description: event.description,
        estimatedTime: event.startTime && event.endTime ? calculateDuration(event.startTime, event.endTime) : 60,
      })
      handleUpdate('linkedTaskId', 'temp-id') // Will be replaced with actual task ID
    }
  }

  const calculateDuration = (start: string, end: string): number => {
    const [startH, startM] = start.split(':').map(Number)
    const [endH, endM] = end.split(':').map(Number)
    return (endH * 60 + endM) - (startH * 60 + startM)
  }

  const handleToggleRecurring = () => {
    const newValue = !editIsRecurring
    setEditIsRecurring(newValue)
    handleUpdate('isRecurring', newValue)
    
    if (newValue && !editRecurrence) {
      const defaultRecurrence: Recurrence = {
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [new Date(editStartDate).getDay()]
      }
      setEditRecurrence(defaultRecurrence)
      handleUpdate('recurrence', defaultRecurrence)
    }
  }

  const handleRecurrenceChange = (field: keyof Recurrence, value: any) => {
    const updated = { ...editRecurrence, [field]: value } as Recurrence
    setEditRecurrence(updated)
    handleUpdate('recurrence', updated)
  }

  const currentTypeIcon = typeOptions.find(t => t.value === editType)?.icon || '📌'
  const currentCategoryColor = categoryOptions.find(c => c.value === editCategory)?.color || 'text-zinc-500'
  const currentPriorityColor = priorityOptions.find(p => p.value === editPriority)?.color || 'text-zinc-500'

  const linkedTask = event.linkedTaskId ? tasks.find(t => t.id === event.linkedTaskId) : null

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-slide-in-right">
      <div className="w-full md:w-1/2 lg:w-1/3 h-full bg-mars-surface border-l border-zinc-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-900/50">
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-medium text-zinc-200">Détails de l'événement</h2>
          <button onClick={handleDeleteEvent} className="text-rose-500 hover:text-rose-400 transition-colors">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Title */}
          <div className="flex items-center gap-3">
            <span className="text-2xl">{currentTypeIcon}</span>
            <input
              ref={titleRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => e.key === 'Enter' && titleRef.current?.blur()}
              className="flex-1 text-xl font-bold bg-transparent text-zinc-200 focus:outline-none focus:ring-0 border-b border-transparent focus:border-zinc-700 pb-1 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-zinc-500 mb-2">Description</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              placeholder="Ajouter une description..."
              rows={4}
              className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-indigo-600 rounded-xl p-3 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none transition-colors shadow-sm"
            />
          </div>

          {/* Dates & Times */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-2 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Date de début
              </label>
              <input
                type="date"
                value={editStartDate}
                onChange={(e) => {
                  setEditStartDate(e.target.value)
                  handleUpdate('startDate', e.target.value)
                }}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-indigo-600 rounded-xl p-3 text-sm text-zinc-300 focus:outline-none transition-colors shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-2 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Date de fin
              </label>
              <input
                type="date"
                value={editEndDate}
                onChange={(e) => {
                  setEditEndDate(e.target.value)
                  handleUpdate('endDate', e.target.value)
                }}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-indigo-600 rounded-xl p-3 text-sm text-zinc-300 focus:outline-none transition-colors shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Heure de début
              </label>
              <input
                type="time"
                value={editStartTime}
                onChange={(e) => {
                  setEditStartTime(e.target.value)
                  handleUpdate('startTime', e.target.value)
                }}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-indigo-600 rounded-xl p-3 text-sm text-zinc-300 focus:outline-none transition-colors shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Heure de fin
              </label>
              <input
                type="time"
                value={editEndTime}
                onChange={(e) => {
                  setEditEndTime(e.target.value)
                  handleUpdate('endTime', e.target.value)
                }}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-indigo-600 rounded-xl p-3 text-sm text-zinc-300 focus:outline-none transition-colors shadow-sm"
              />
            </div>
          </div>

          {/* Type, Category, Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-2 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Type
              </label>
              <select
                value={editType}
                onChange={(e) => {
                  const type = e.target.value as EventType
                  setEditType(type)
                  handleUpdate('type', type)
                }}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-indigo-600 rounded-xl p-3 text-sm text-zinc-300 focus:outline-none transition-colors shadow-sm"
              >
                {typeOptions.map(option => (
                  <option key={option.value} value={option.value} className="bg-zinc-900">
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-2 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Catégorie
              </label>
              <select
                value={editCategory}
                onChange={(e) => {
                  const category = e.target.value as EventCategory
                  setEditCategory(category)
                  handleUpdate('category', category)
                }}
                className={`w-full bg-zinc-900/50 border border-zinc-800 focus:border-indigo-600 rounded-xl p-3 text-sm ${currentCategoryColor} focus:outline-none transition-colors shadow-sm`}
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value} className="bg-zinc-900 text-zinc-300">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-2 flex items-center gap-1">
                <Flag className="w-3 h-3" /> Priorité
              </label>
              <select
                value={editPriority}
                onChange={(e) => {
                  const priority = e.target.value as EventPriority
                  setEditPriority(priority)
                  handleUpdate('priority', priority)
                }}
                className={`w-full bg-zinc-900/50 border border-zinc-800 focus:border-indigo-600 rounded-xl p-3 text-sm ${currentPriorityColor} focus:outline-none transition-colors shadow-sm`}
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value} className="bg-zinc-900 text-zinc-300">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs text-zinc-500 mb-2 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Lieu
            </label>
            <input
              type="text"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              onBlur={() => handleUpdate('location', editLocation)}
              placeholder="Ajouter un lieu..."
              className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-indigo-600 rounded-xl p-3 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none transition-colors shadow-sm"
            />
          </div>

          {/* Attendees */}
          <div>
            <label className="block text-xs text-zinc-500 mb-2 flex items-center gap-1">
              <Users className="w-3 h-3" /> Participants
            </label>
            <div className="space-y-2">
              {editAttendees.map((attendee, index) => (
                <div key={index} className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-2 shadow-sm">
                  <span className="flex-1 text-sm text-zinc-300">{attendee}</span>
                  <button onClick={() => handleRemoveAttendee(index)} className="text-zinc-600 hover:text-rose-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={newAttendee}
                onChange={(e) => setNewAttendee(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddAttendee()}
                placeholder="Ajouter un participant..."
                className="flex-1 bg-zinc-900/50 border border-zinc-800 focus:border-indigo-600 rounded-xl p-2 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none transition-colors shadow-sm"
              />
              <button onClick={handleAddAttendee} className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Recurring */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editIsRecurring}
                onChange={handleToggleRecurring}
                className="form-checkbox h-4 w-4 text-indigo-600 bg-zinc-700 border-zinc-600 rounded focus:ring-indigo-500"
              />
              <Repeat className="w-4 h-4 text-zinc-500" />
              <span className="text-sm text-zinc-300">Événement récurrent</span>
            </label>

            {editIsRecurring && editRecurrence && (
              <div className="mt-3 p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-600 mb-1">Fréquence</label>
                    <select
                      value={editRecurrence.frequency}
                      onChange={(e) => handleRecurrenceChange('frequency', e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs text-zinc-300"
                    >
                      {frequencyOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-600 mb-1">Intervalle</label>
                    <input
                      type="number"
                      min="1"
                      value={editRecurrence.interval}
                      onChange={(e) => handleRecurrenceChange('interval', parseInt(e.target.value))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs text-zinc-300"
                    />
                  </div>
                </div>

                {editRecurrence.frequency === 'weekly' && (
                  <div>
                    <label className="block text-xs text-zinc-600 mb-2">Jours de la semaine</label>
                    <div className="flex gap-1">
                      {daysOfWeek.map(day => (
                        <button
                          key={day.value}
                          onClick={() => {
                            const current = editRecurrence.daysOfWeek || []
                            const updated = current.includes(day.value)
                              ? current.filter(d => d !== day.value)
                              : [...current, day.value]
                            handleRecurrenceChange('daysOfWeek', updated)
                          }}
                          className={`flex-1 py-1 px-2 text-xs rounded-lg transition-colors ${
                            editRecurrence.daysOfWeek?.includes(day.value)
                              ? 'bg-indigo-600 text-white'
                              : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs text-zinc-600 mb-1">Date de fin (optionnel)</label>
                  <input
                    type="date"
                    value={editRecurrence.endDate || ''}
                    onChange={(e) => handleRecurrenceChange('endDate', e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs text-zinc-300"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Linked Task */}
          <div>
            <label className="block text-xs text-zinc-500 mb-2 flex items-center gap-1">
              <LinkIcon className="w-3 h-3" /> Tâche liée
            </label>
            {linkedTask ? (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                <p className="text-sm text-indigo-300">📋 {linkedTask.title}</p>
                <p className="text-xs text-zinc-600 mt-1">Statut: {linkedTask.status}</p>
              </div>
            ) : (
              <button
                onClick={handleCreateTask}
                className="w-full p-3 bg-zinc-900/50 border border-zinc-800 hover:border-indigo-600 rounded-xl text-sm text-zinc-400 hover:text-indigo-400 transition-all"
              >
                + Créer une tâche liée
              </button>
            )}
          </div>

          {/* Complete Toggle */}
          <div className="pt-4 border-t border-zinc-900/50">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={event.completed}
                onChange={() => handleUpdate('completed', !event.completed)}
                className="form-checkbox h-5 w-5 text-emerald-600 bg-zinc-700 border-zinc-600 rounded focus:ring-emerald-500"
              />
              <span className="text-sm text-zinc-300 font-medium">Marquer comme terminé</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

