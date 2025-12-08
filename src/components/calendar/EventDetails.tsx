import { useState, useEffect } from 'react'
import { MapPin, Users, Plus, Link as LinkIcon, Check } from 'lucide-react'
import { Event, EventType, EventCategory, EventPriority, Recurrence } from '../../types/calendar'
import { useStore } from '../../store/useStore'
import { EventDetailsHeader } from './EventDetailsHeader'
import { EventDateTimeSection } from './EventDateTimeSection'
import { EventMetadataSection } from './EventMetadataSection'
import { EventRecurrenceSection } from './EventRecurrenceSection'
import { EventRemindersSection } from './EventRemindersSection'
import { ConflictWarning } from './ConflictWarning'
import { Collapsible } from '../ui/Collapsible'
import { ConfirmDialog } from '../ui/ConfirmDialog'

interface EventDetailsProps {
  event: Event
  onClose: () => void
}

export function EventDetails({ event, onClose }: EventDetailsProps) {
  const { updateEvent, deleteEvent, tasks, events } = useStore()
  
  // Form state
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
  const [editReminders, setEditReminders] = useState(event.reminders || [])
  
  // UI state
  const [showSaved, setShowSaved] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Sync with event changes
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
    setEditReminders(event.reminders || [])
  }, [event])

  // Auto-save feedback
  useEffect(() => {
    if (showSaved) {
      const timer = setTimeout(() => setShowSaved(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [showSaved])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSave = () => {
    updateEvent(event.id, {
      title: editTitle,
      description: editDescription,
      startDate: editStartDate,
      endDate: editEndDate || undefined,
      startTime: editStartTime || undefined,
      endTime: editEndTime || undefined,
      type: editType,
      category: editCategory,
      priority: editPriority,
      location: editLocation || undefined,
      attendees: editAttendees.length > 0 ? editAttendees : undefined,
      isRecurring: editIsRecurring,
      recurrence: editRecurrence,
      reminders: editReminders.length > 0 ? editReminders : undefined
    })
    setShowSaved(true)
  }

  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    deleteEvent(event.id)
    onClose()
  }

  const handleAddAttendee = () => {
    if (newAttendee.trim() && !editAttendees.includes(newAttendee.trim())) {
      setEditAttendees([...editAttendees, newAttendee.trim()])
      setNewAttendee('')
    }
  }

  const handleRemoveAttendee = (attendee: string) => {
    setEditAttendees(editAttendees.filter(a => a !== attendee))
  }

  // Linked task
  const linkedTask = tasks.find(t => t.linkedEventId === event.id)

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <div 
          className="w-full max-w-lg bg-mars-surface h-full overflow-y-auto animate-slide-in-right"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-title"
        >
          {/* Header */}
          <EventDetailsHeader
            event={event}
            editTitle={editTitle}
            onTitleChange={(title) => {
              setEditTitle(title)
              handleSave()
            }}
            onClose={onClose}
            onDelete={handleDelete}
          />

          {/* Auto-save indicator */}
          {showSaved && (
            <div className="flex items-center gap-2 px-6 py-2 bg-emerald-500/10 text-emerald-400 text-sm animate-fade-in">
              <Check className="w-4 h-4" />
              Sauvegardé
            </div>
          )}

          <div className="p-6 space-y-4">
            {/* Conflict Warning */}
            <ConflictWarning event={event} allEvents={events} />
            
            {/* Date & Time */}
            <Collapsible title="Date et heure" defaultOpen={true}>
              <EventDateTimeSection
                startDate={editStartDate}
                endDate={editEndDate}
                startTime={editStartTime}
                endTime={editEndTime}
                onStartDateChange={(date) => { setEditStartDate(date); handleSave() }}
                onEndDateChange={(date) => { setEditEndDate(date); handleSave() }}
                onStartTimeChange={(time) => { setEditStartTime(time); handleSave() }}
                onEndTimeChange={(time) => { setEditEndTime(time); handleSave() }}
              />
            </Collapsible>

            {/* Type, Category, Priority */}
            <Collapsible title="Classification" defaultOpen={true}>
              <EventMetadataSection
                type={editType}
                category={editCategory}
                priority={editPriority}
                onTypeChange={(type) => { setEditType(type); handleSave() }}
                onCategoryChange={(cat) => { setEditCategory(cat); handleSave() }}
                onPriorityChange={(pri) => { setEditPriority(pri); handleSave() }}
              />
            </Collapsible>

            {/* Description */}
            <Collapsible title="Description" defaultOpen={!!editDescription}>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                onBlur={handleSave}
                placeholder="Ajouter une description..."
                rows={4}
                className="w-full px-3 py-2 bg-zinc-900/50 rounded-xl text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </Collapsible>

            {/* Location */}
            <Collapsible title="Lieu" icon={<MapPin className="w-4 h-4 text-zinc-500" />} defaultOpen={!!editLocation}>
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                onBlur={handleSave}
                placeholder="Ajouter un lieu..."
                className="w-full px-3 py-2 bg-zinc-900/50 rounded-xl text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </Collapsible>

            {/* Attendees */}
            <Collapsible title="Participants" icon={<Users className="w-4 h-4 text-zinc-500" />} defaultOpen={editAttendees.length > 0}>
              <div className="space-y-3">
                {editAttendees.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {editAttendees.map((attendee) => (
                      <span
                        key={attendee}
                        className="flex items-center gap-1 px-2 py-1 bg-zinc-800/50 text-zinc-300 text-xs rounded-lg"
                      >
                        {attendee}
                        <button
                          onClick={() => handleRemoveAttendee(attendee)}
                          className="ml-1 text-zinc-500 hover:text-rose-400 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAttendee}
                    onChange={(e) => setNewAttendee(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddAttendee()}
                    placeholder="Ajouter un participant..."
                    className="flex-1 px-3 py-2 bg-zinc-900/50 rounded-xl text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                  <button
                    onClick={handleAddAttendee}
                    className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl hover:bg-indigo-500/30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Collapsible>

            {/* Recurrence */}
            <Collapsible title="Récurrence" defaultOpen={editIsRecurring}>
              <EventRecurrenceSection
                isRecurring={editIsRecurring}
                recurrence={editRecurrence}
                onRecurringChange={(val) => { setEditIsRecurring(val); handleSave() }}
                onRecurrenceChange={(rec) => { setEditRecurrence(rec); handleSave() }}
              />
            </Collapsible>

            {/* Reminders */}
            <Collapsible title="Rappels" defaultOpen={editReminders.length > 0}>
              <EventRemindersSection
                reminders={editReminders}
                onRemindersChange={(reminders) => { setEditReminders(reminders); handleSave() }}
              />
            </Collapsible>

            {/* Linked Task */}
            {linkedTask && (
              <Collapsible title="Tâche liée" icon={<LinkIcon className="w-4 h-4 text-zinc-500" />} defaultOpen={true}>
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                  <p className="text-sm text-indigo-300">📋 {linkedTask.title}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {linkedTask.completed ? '✅ Complétée' : '⏳ En cours'}
                  </p>
                </div>
              </Collapsible>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Supprimer l'événement ?"
        message={`Êtes-vous sûr de vouloir supprimer "${event.title}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
      />
    </>
  )
}

