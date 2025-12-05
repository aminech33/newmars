import { useState, useEffect, useRef } from 'react'
import { Sparkles } from 'lucide-react'
import { 
  Course, 
  CreateCourseData, 
  COURSE_ICONS, 
  COURSE_COLORS, 
  COURSE_LEVELS,
  CourseColor
} from '../../types/learning'
import { useStore } from '../../store/useStore'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input, Textarea, Select } from '../ui/Input'

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
  const projects = useStore(state => state.projects)
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('📚')
  const [color, setColor] = useState<CourseColor>('indigo')
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [linkedProjectId, setLinkedProjectId] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [isProgramming, setIsProgramming] = useState(false)
  const [programmingLanguage, setProgrammingLanguage] = useState('python')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [error, setError] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)

  const isEditMode = !!course
  
  const PROGRAMMING_LANGUAGES = [
    { value: 'python', label: 'Python' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'csharp', label: 'C#' },
    { value: 'rust', label: 'Rust' },
    { value: 'go', label: 'Go' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' }
  ]

  // Initialize form when opening
  useEffect(() => {
    if (isOpen) {
      if (course) {
        setName(course.name)
        setDescription(course.description || '')
        setIcon(course.icon)
        setColor(course.color as CourseColor)
        setLevel(course.level)
        setLinkedProjectId(course.linkedProjectId || '')
        setSystemPrompt(course.systemPrompt || '')
        setIsProgramming(course.isProgramming || false)
        setProgrammingLanguage(course.programmingLanguage || 'python')
      } else {
        setName('')
        setDescription('')
        setIcon('📚')
        setColor('indigo')
        setLevel('beginner')
        setLinkedProjectId('')
        setSystemPrompt('')
        setIsProgramming(false)
        setProgrammingLanguage('python')
      }
      setError('')
      setShowAdvanced(false)
      
      // Focus input
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, course])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Le nom du cours est requis')
      return
    }

    if (name.trim().length < 2) {
      setError('Le nom doit contenir au moins 2 caractères')
      return
    }

    if (!linkedProjectId) {
      setError('Veuillez sélectionner un projet')
      return
    }

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      icon,
      color,
      level,
      linkedProjectId,
      systemPrompt: systemPrompt.trim() || undefined,
      isProgramming,
      programmingLanguage: isProgramming ? programmingLanguage : undefined
    })

    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            variant="primary"
            onClick={() => handleSubmit()}
          >
            {isEditMode ? 'Enregistrer' : 'Créer le cours'}
          </Button>
        </>
      }
    >
      {/* Header with icon */}
      <div className="flex items-center gap-3 mb-6 -mt-2">
        <div className={`p-2 rounded-xl ${COLOR_CLASSES[color].bg}`}>
          <Sparkles className={`w-5 h-5 ${COLOR_CLASSES[color].text}`} aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-100">
          {isEditMode ? 'Modifier le cours' : 'Nouveau cours'}
        </h2>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-sm text-rose-400" role="alert">
            {error}
          </div>
        )}

        {/* Name */}
        <Input
          ref={inputRef}
          label="Nom du cours"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="JavaScript Avancé"
          required
          maxLength={50}
        />

        {/* Description */}
        <Textarea
          label="Description (optionnel)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Promises, async/await, modules ES6..."
          maxLength={200}
          rows={2}
        />

        {/* Projet lié */}
        <Select
          label="Projet lié"
          value={linkedProjectId}
          onChange={(e) => setLinkedProjectId(e.target.value)}
          options={[
            { value: '', label: '-- Sélectionner un projet --' },
            ...projects.map(project => ({
              value: project.id,
              label: `${project.icon} ${project.name}`
            }))
          ]}
          hint="💡 Les tâches et concepts de ce projet seront accessibles pendant le chat via un widget flottant."
        />

        {/* Icon & Color */}
        <div className="grid grid-cols-2 gap-4">
          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Icône</label>
            <div className="grid grid-cols-8 gap-1 p-2 bg-zinc-800/30 rounded-xl max-h-24 overflow-y-auto">
              {COURSE_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`p-1.5 rounded-lg text-lg transition-[background-color] duration-200 ${
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
            <label className="block text-sm font-medium text-zinc-300 mb-2">Couleur</label>
            <div className="grid grid-cols-4 gap-2 p-2 bg-zinc-800/30 rounded-xl">
              {COURSE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-full aspect-square rounded-xl transition-shadow duration-200 ${COLOR_CLASSES[c].bg} ${
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
          <label className="block text-sm font-medium text-zinc-300 mb-2">Niveau</label>
          <div className="grid grid-cols-3 gap-2">
            {COURSE_LEVELS.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => setLevel(l.value)}
                className={`p-3 rounded-xl text-center transition-[background-color] duration-200 ${
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

        {/* Programming Options */}
        <div>
          <label className="flex items-center gap-3 p-4 bg-zinc-800/30 rounded-xl cursor-pointer hover:bg-zinc-800/50 transition-[background-color] duration-200">
            <input
              type="checkbox"
              checked={isProgramming}
              onChange={(e) => setIsProgramming(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-800/50 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
            />
            <div className="flex-1">
              <div className="text-sm text-zinc-200 font-medium flex items-center gap-2">
                💻 Cours de programmation
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Active l'éditeur de code en split view
              </p>
            </div>
          </label>

          {isProgramming && (
            <div className="mt-3 animate-fade-in">
              <Select
                label="Langage de programmation"
                value={programmingLanguage}
                onChange={(e) => setProgrammingLanguage(e.target.value)}
                options={PROGRAMMING_LANGUAGES}
              />
            </div>
          )}
        </div>

        {/* Advanced Options */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-[color] duration-200"
          >
            {showAdvanced ? '▼' : '▶'} Options avancées
          </button>

          {showAdvanced && (
            <div className="mt-3 animate-fade-in">
              <Textarea
                label="Instructions pour l'IA (optionnel)"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Ex: Je suis développeur junior, explique avec des analogies simples..."
                maxLength={500}
                rows={3}
                hint="Ces instructions guideront l'IA pour adapter ses réponses à ton niveau et tes besoins."
              />
            </div>
          )}
        </div>
      </form>

      {/* Preview */}
      <div className="mt-6 pt-4 border-t border-zinc-800/50">
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
    </Modal>
  )
}
