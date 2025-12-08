import { useState } from 'react'
import { Calendar as CalendarIcon, Check, Clock, Repeat, X, Plus, Trash2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { Event } from '../../types/calendar'

interface EventTemplatesPageProps {
  isOpen: boolean
  onClose: () => void
  onCreateEvents: (events: Omit<Event, 'id' | 'createdAt'>[]) => void
  preSelectedDates?: string[]
}

interface TemplateEvent {
  title: string
  startTime: string
  endTime: string
  type: Event['type']
  category: Event['category']
  daysOfWeek: number[]
}

interface CustomTemplate {
  id: string
  label: string
  emoji: string
  description: string
  events: TemplateEvent[]
  isCustom: true
}

const DEFAULT_TEMPLATES: CustomTemplate[] = []

export function EventTemplatesPage({ isOpen, onClose, onCreateEvents, preSelectedDates = [] }: EventTemplatesPageProps) {
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateEmoji, setNewTemplateEmoji] = useState('📅')
  const [newTemplateDescription, setNewTemplateDescription] = useState('')
  const [newTemplateEvent, setNewTemplateEvent] = useState({
    title: '',
    startTime: '09:00',
    endTime: '10:00'
  })

  const allTemplates = [...DEFAULT_TEMPLATES, ...customTemplates]
  const selectedTemplate = allTemplates.find(t => t.id === selectedTemplateId)

  const toggleDate = (dateStr: string) => {
    // Cette fonction n'est plus utilisée car les dates sont sélectionnées depuis le calendrier principal
  }

  const handlePrevMonth = () => {
    // Pas besoin de navigation de mois ici
  }

  const handleNextMonth = () => {
    // Pas besoin de navigation de mois ici
  }

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId)
  }

  const handleCreateCustomTemplate = () => {
    if (!newTemplateName.trim() || !newTemplateEvent.title.trim()) return

    const newTemplate: CustomTemplate = {
      id: `custom-${Date.now()}`,
      label: newTemplateName.trim(),
      emoji: newTemplateEmoji,
      description: newTemplateDescription.trim() || 'Template personnalisé',
      events: [{
        title: newTemplateEvent.title.trim(),
        startTime: newTemplateEvent.startTime,
        endTime: newTemplateEvent.endTime,
        type: 'custom',
        category: 'personal',
        daysOfWeek: [1, 2, 3, 4, 5] // Par défaut lun-ven
      }],
      isCustom: true
    }

    setCustomTemplates([...customTemplates, newTemplate])
    setSelectedTemplateId(newTemplate.id)
    setShowCreateTemplate(false)
    setNewTemplateName('')
    setNewTemplateEmoji('📅')
    setNewTemplateDescription('')
    setNewTemplateEvent({ title: '', startTime: '09:00', endTime: '10:00' })
  }

  const handleDeleteTemplate = (templateId: string) => {
    setCustomTemplates(customTemplates.filter(t => t.id !== templateId))
    if (selectedTemplateId === templateId) {
      setSelectedTemplateId(null)
    }
  }

  const generateEvents = () => {
    if (!selectedTemplate || preSelectedDates.length === 0) return

    const events: Omit<Event, 'id' | 'createdAt'>[] = []

    preSelectedDates.forEach(dateStr => {
      const date = new Date(dateStr)
      const dayOfWeek = date.getDay()

      selectedTemplate.events.forEach(eventTemplate => {
        if (eventTemplate.daysOfWeek.includes(dayOfWeek)) {
          events.push({
            title: eventTemplate.title,
            description: `Généré depuis le template "${selectedTemplate.label}"`,
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
    setSelectedTemplateId(null)
    setShowCreateTemplate(false)
    onClose()
  }

  if (!isOpen) return null

  // Calculate total events
  const getTotalEvents = () => {
    if (!selectedTemplate) return 0
    let total = 0
    preSelectedDates.forEach(dateStr => {
      const date = new Date(dateStr)
      const dayOfWeek = date.getDay()
      selectedTemplate.events.forEach(event => {
        if (event.daysOfWeek.includes(dayOfWeek)) {
          total++
        }
      })
    })
    return total
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-mars-surface rounded-2xl w-full max-w-2xl border border-white/5 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-mars-surface/95 backdrop-blur-xl border-b border-white/5 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Appliquer un template</h2>
              <p className="text-sm text-zinc-500 mt-1">
                {preSelectedDates.length} date{preSelectedDates.length > 1 ? 's' : ''} sélectionnée{preSelectedDates.length > 1 ? 's' : ''} sur le calendrier
              </p>
            </div>
            
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {preSelectedDates.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
              <p className="text-zinc-500 mb-2">Aucune date sélectionnée</p>
              <p className="text-sm text-zinc-600">Sélectionnez des dates sur le calendrier principal avant d'appliquer un template</p>
            </div>
          ) : (
            <>
              {/* Create Template Button */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-400">Choisir un template</h3>
                <button
                  onClick={() => setShowCreateTemplate(!showCreateTemplate)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nouveau
                </button>
              </div>

              {/* Create Template Form */}
              {showCreateTemplate && (
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTemplateEmoji}
                      onChange={(e) => setNewTemplateEmoji(e.target.value)}
                      className="w-14 text-center text-2xl bg-white/5 text-zinc-300 px-2 py-2 rounded-lg border border-white/5 focus:border-indigo-500/50 focus:outline-none"
                      maxLength={2}
                      placeholder="📅"
                    />
                    <input
                      type="text"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="Nom du template"
                      className="flex-1 bg-white/5 text-sm text-zinc-300 placeholder:text-zinc-600 px-3 py-2 rounded-lg border border-white/5 focus:border-indigo-500/50 focus:outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    value={newTemplateDescription}
                    onChange={(e) => setNewTemplateDescription(e.target.value)}
                    placeholder="Description (optionnel)"
                    className="w-full bg-white/5 text-sm text-zinc-300 placeholder:text-zinc-600 px-3 py-2 rounded-lg border border-white/5 focus:border-indigo-500/50 focus:outline-none"
                  />
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-500">Événement du template</p>
                    <input
                      type="text"
                      value={newTemplateEvent.title}
                      onChange={(e) => setNewTemplateEvent({ ...newTemplateEvent, title: e.target.value })}
                      placeholder="Titre de l'événement"
                      className="w-full bg-white/5 text-sm text-zinc-300 placeholder:text-zinc-600 px-3 py-2 rounded-lg border border-white/5 focus:border-indigo-500/50 focus:outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Début</label>
                        <input
                          type="time"
                          value={newTemplateEvent.startTime}
                          onChange={(e) => setNewTemplateEvent({ ...newTemplateEvent, startTime: e.target.value })}
                          className="w-full bg-white/5 text-sm text-zinc-300 px-3 py-2 rounded-lg border border-white/5 focus:border-indigo-500/50 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Fin</label>
                        <input
                          type="time"
                          value={newTemplateEvent.endTime}
                          onChange={(e) => setNewTemplateEvent({ ...newTemplateEvent, endTime: e.target.value })}
                          className="w-full bg-white/5 text-sm text-zinc-300 px-3 py-2 rounded-lg border border-white/5 focus:border-indigo-500/50 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateCustomTemplate}
                      disabled={!newTemplateName.trim() || !newTemplateEvent.title.trim()}
                      className="flex-1"
                    >
                      Créer
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setShowCreateTemplate(false)}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              )}

              {/* Templates List */}
              {allTemplates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className={`p-4 rounded-xl transition-all ${
                    selectedTemplateId === tmpl.id
                      ? 'bg-indigo-500/20 border-2 border-indigo-500/50'
                      : 'bg-white/[0.02] border-2 border-white/5 hover:bg-white/[0.04]'
                  }`}
                >
                  <button
                    onClick={() => handleSelectTemplate(tmpl.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{tmpl.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-zinc-200 mb-1">
                          {tmpl.label}
                        </h4>
                        <p className="text-xs text-zinc-500">
                          {tmpl.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {selectedTemplateId === tmpl.id && (
                          <Check className="w-5 h-5 text-indigo-400" />
                        )}
                        {tmpl.isCustom && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteTemplate(tmpl.id)
                            }}
                            className="p-1 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              ))}

              {/* Preview */}
              {selectedTemplate && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <Clock className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-indigo-300 mb-1">
                        Aperçu du template
                      </h4>
                      <p className="text-xs text-indigo-400/60">
                        {getTotalEvents()} événement{getTotalEvents() > 1 ? 's' : ''} sur {preSelectedDates.length} date{preSelectedDates.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {selectedTemplate.events.map((event, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-indigo-400/70 bg-indigo-500/10 rounded-lg p-2">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-indigo-300">{event.title}</div>
                          <div className="text-indigo-400/80">{event.startTime} - {event.endTime}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {preSelectedDates.length > 0 && (
          <div className="sticky bottom-0 bg-mars-surface/95 backdrop-blur-xl border-t border-white/5 px-6 py-4">
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleClose}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button 
                variant="primary"
                onClick={generateEvents}
                disabled={!selectedTemplate}
                className="flex-1"
              >
                <Repeat className="w-4 h-4" />
                Créer {getTotalEvents()} événement{getTotalEvents() > 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

