import { useState, useEffect, useRef } from 'react'
import { X, Sparkles } from 'lucide-react'
import { 
  Course, 
  CreateCourseData, 
  COURSE_ICONS, 
  COURSE_COLORS, 
  COURSE_LEVELS,
  CourseColor
} from '../../types/learning'

interface CourseModalProps {
  isOpen: boolean
  course?: Course | null  // null = create mode, Course = edit mode
  onClose: () => void
  onSubmit: (data: CreateCourseData) => void
}

const COLOR_CLASSES: Record<CourseColor, { bg: string; border: string; text: string }> = {
  indigo: { bg: 'bg-indigo-500/20', border: 'border-indigo-500', text: 'text-indigo-400' },
  emerald: { bg: 'bg-emerald-500/20', border: 'border-emerald-500', text: 'text-emerald-400' },
  rose: { bg: 'bg-rose-500/20', border: 'border-rose-500', text: 'text-rose-400' },
  amber: { bg: 'bg-amber-500/20', border: 'border-amber-500', text: 'text-amber-400' },
  cyan: { bg: 'bg-cyan-500/20', border: 'border-cyan-500', text: 'text-cyan-400' },
  violet: { bg: 'bg-violet-500/20', border: 'border-violet-500', text: 'text-violet-400' },
  orange: { bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-400' },
  teal: { bg: 'bg-teal-500/20', border: 'border-teal-500', text: 'text-teal-400' }
}

export function CourseModal({ isOpen, course, onClose, onSubmit }: CourseModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('📚')
  const [color, setColor] = useState<CourseColor>('indigo')
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [error, setError] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const isEditMode = !!course

  // Initialize form when opening
  useEffect(() => {
    if (isOpen) {
      if (course) {
        setName(course.name)
        setDescription(course.description || '')
        setIcon(course.icon)
        setColor(course.color as CourseColor)
        setLevel(course.level)
        setSystemPrompt(course.systemPrompt || '')
      } else {
        setName('')
        setDescription('')
        setIcon('📚')
        setColor('indigo')
        setLevel('beginner')
        setSystemPrompt('')
      }
      setError('')
      setShowAdvanced(false)
      
      // Focus input
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, course])

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const first = focusables[0]
        const last = focusables[focusables.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Le nom du cours est requis')
      return
    }

    if (name.trim().length < 2) {
      setError('Le nom doit contenir au moins 2 caractères')
      return
    }

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      icon,
      color,
      level,
      systemPrompt: systemPrompt.trim() || undefined
    })

    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-modal-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden animate-scale-in"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${COLOR_CLASSES[color].bg}`}>
              <Sparkles className={`w-5 h-5 ${COLOR_CLASSES[color].text}`} />
            </div>
            <h2 id="course-modal-title" className="text-lg font-semibold text-zinc-100">
              {isEditMode ? 'Modifier le cours' : 'Nouveau cours'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-xl transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-sm text-rose-400" role="alert">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="course-name" className="text-sm text-zinc-400 mb-2 block">
              Nom du cours <span className="text-rose-400">*</span>
            </label>
            <input
              ref={inputRef}
              id="course-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="JavaScript Avancé"
              required
              maxLength={50}
              className="w-full bg-zinc-800/50 text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="course-description" className="text-sm text-zinc-400 mb-2 block">
              Description (optionnel)
            </label>
            <textarea
              id="course-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Promises, async/await, modules ES6..."
              maxLength={200}
              rows={2}
              className="w-full bg-zinc-800/50 text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
            />
          </div>

          {/* Icon & Color */}
          <div className="grid grid-cols-2 gap-4">
            {/* Icon */}
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Icône</label>
              <div className="grid grid-cols-8 gap-1 p-2 bg-zinc-800/30 rounded-xl max-h-24 overflow-y-auto">
                {COURSE_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    className={`p-1.5 rounded-lg text-lg transition-all ${
                      icon === emoji
                        ? `${COLOR_CLASSES[color].bg} ring-2 ${COLOR_CLASSES[color].border}`
                        : 'hover:bg-zinc-700/50'
                    }`}
                    aria-label={`Icône ${emoji}`}
                    aria-pressed={icon === emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Couleur</label>
              <div className="grid grid-cols-4 gap-2 p-2 bg-zinc-800/30 rounded-xl">
                {COURSE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-full aspect-square rounded-xl transition-all ${COLOR_CLASSES[c].bg} ${
                      color === c ? `ring-2 ${COLOR_CLASSES[c].border}` : ''
                    }`}
                    aria-label={`Couleur ${c}`}
                    aria-pressed={color === c}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Level */}
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Niveau</label>
            <div className="grid grid-cols-3 gap-2">
              {COURSE_LEVELS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setLevel(l.value)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    level === l.value
                      ? `${COLOR_CLASSES[color].bg} ${COLOR_CLASSES[color].text} ring-1 ${COLOR_CLASSES[color].border}`
                      : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800'
                  }`}
                  aria-pressed={level === l.value}
                >
                  <span className="text-xl block mb-1">{l.emoji}</span>
                  <span className="text-xs">{l.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Options */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {showAdvanced ? '▼' : '▶'} Options avancées
            </button>

            {showAdvanced && (
              <div className="mt-3 animate-fade-in">
                <label htmlFor="system-prompt" className="text-sm text-zinc-400 mb-2 block">
                  Instructions pour l'IA (optionnel)
                </label>
                <textarea
                  id="system-prompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Ex: Je suis développeur junior, explique avec des analogies simples..."
                  maxLength={500}
                  rows={3}
                  className="w-full bg-zinc-800/50 text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none text-sm"
                />
                <p className="text-xs text-zinc-600 mt-1">
                  Ces instructions guideront l'IA pour adapter ses réponses à ton niveau et tes besoins.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-zinc-800 text-zinc-400 rounded-xl hover:bg-zinc-700 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${COLOR_CLASSES[color].bg} ${COLOR_CLASSES[color].text} hover:opacity-80`}
            >
              {isEditMode ? 'Enregistrer' : 'Créer le cours'}
            </button>
          </div>
        </form>

        {/* Preview */}
        <div className="px-6 pb-6">
          <p className="text-xs text-zinc-600 mb-2">Aperçu</p>
          <div className={`p-3 rounded-xl ${COLOR_CLASSES[color].bg} flex items-center gap-3`}>
            <span className="text-2xl">{icon}</span>
            <div>
              <p className={`font-medium ${COLOR_CLASSES[color].text}`}>
                {name || 'Nom du cours'}
              </p>
              <p className="text-xs text-zinc-500">
                {COURSE_LEVELS.find(l => l.value === level)?.label}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

