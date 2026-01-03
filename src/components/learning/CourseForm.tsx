import { useState, useEffect, useRef } from 'react'
import { 
  Course, 
  CreateCourseData, 
  COURSE_ICONS, 
  COURSE_COLORS, 
  COURSE_LEVELS,
  CourseColor,
  CodeEnvironment
} from '../../types/learning'
import { useStore } from '../../store/useStore'
import { Button } from '../ui/Button'
import { Input, Textarea } from '../ui/Input'

interface CourseFormProps {
  course?: Course | null
  onSubmit: (data: CreateCourseData) => void
  onCancel: () => void
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

const TECH_KEYWORDS = [
  'javascript', 'js', 'typescript', 'ts', 'python', 'java', 'cpp', 'c++',
  'csharp', 'c#', 'rust', 'go', 'golang', 'php', 'ruby', 'html', 'css',
  'react', 'vue', 'angular', 'node', 'sql', 'mongodb', 'api', 'backend',
  'frontend', 'web', 'code', 'programming', 'développement', 'dev'
]

const detectCodeMode = (courseName: string): boolean => {
  const lowerName = courseName.toLowerCase()
  return TECH_KEYWORDS.some(keyword => lowerName.includes(keyword))
}

export function CourseForm({ course, onSubmit, onCancel }: CourseFormProps) {
  const projects = useStore(state => state.projects)
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('📚')
  const [color, setColor] = useState<CourseColor>('indigo')
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [linkedProjectId, setLinkedProjectId] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [codeEnvironment, setCodeEnvironment] = useState<CodeEnvironment>('none')
  const [programmingLanguage, setProgrammingLanguage] = useState('python')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [error, setError] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)
  const isEditMode = !!course

  // Initialize form
  useEffect(() => {
    if (course) {
      setName(course.name)
      setDescription(course.description || '')
      setIcon(course.icon)
      setColor(course.color as CourseColor)
      setLevel(course.level)
      setLinkedProjectId(course.linkedProjectId || '')
      setSystemPrompt(course.systemPrompt || '')
      setCodeEnvironment(course.codeEnvironment)
      setProgrammingLanguage(course.programmingLanguage || 'python')
    } else {
      setName('')
      setDescription('')
      setIcon('📚')
      setColor('indigo')
      setLevel('beginner')
      setLinkedProjectId('')
      setSystemPrompt('')
      setCodeEnvironment('none')
      setProgrammingLanguage('python')
    }
    setError('')
    setShowAdvanced(false)
    
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [course])

  // Auto-detect code mode
  useEffect(() => {
    if (!isEditMode && name && codeEnvironment === 'none') {
      if (detectCodeMode(name)) {
        setCodeEnvironment('both')
      }
    }
  }, [name, isEditMode, codeEnvironment])

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

    const finalProjectId = linkedProjectId || (projects.length > 0 ? projects[0].id : '')

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      icon,
      color,
      level,
      linkedProjectId: finalProjectId,
      systemPrompt: systemPrompt.trim() || undefined,
      codeEnvironment,
      programmingLanguage: (codeEnvironment === 'editor' || codeEnvironment === 'both') ? programmingLanguage : undefined
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nom */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Nom du cours *
        </label>
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Apprendre Python"
          maxLength={50}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Description
        </label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Objectifs et contenu du cours..."
          rows={3}
          maxLength={500}
        />
      </div>

      {/* Icon & Color */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Icône
          </label>
          <select
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {COURSE_ICONS.map(ic => (
              <option key={ic} value={ic}>{ic}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Couleur
          </label>
          <div className="flex gap-2 flex-wrap">
            {COURSE_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-lg border-2 transition-all ${
                  COLOR_CLASSES[c].bg
                } ${
                  color === c ? COLOR_CLASSES[c].border : 'border-transparent'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Level */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Niveau
        </label>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value as any)}
          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {COURSE_LEVELS.map(lvl => (
            <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
          ))}
        </select>
      </div>

      {/* Environnement de code */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Environnement de code
        </label>
        
        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors">
          <input
            type="radio"
            name="codeEnv"
            value="none"
            checked={codeEnvironment === 'none'}
            onChange={() => setCodeEnvironment('none')}
            className="mt-0.5 w-4 h-4 border-zinc-700 bg-zinc-900 text-amber-500"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">💬</span>
              <span className="text-sm font-medium text-zinc-200">Chat simple</span>
            </div>
            <p className="text-xs text-zinc-500">Conversation uniquement, sans code</p>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors">
          <input
            type="radio"
            name="codeEnv"
            value="editor"
            checked={codeEnvironment === 'editor'}
            onChange={() => setCodeEnvironment('editor')}
            className="mt-0.5 w-4 h-4 border-zinc-700 bg-zinc-900 text-amber-500"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">📝</span>
              <span className="text-sm font-medium text-zinc-200">Éditeur de code</span>
            </div>
            <p className="text-xs text-zinc-500">Pour écrire et analyser du code</p>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors">
          <input
            type="radio"
            name="codeEnv"
            value="terminal"
            checked={codeEnvironment === 'terminal'}
            onChange={() => setCodeEnvironment('terminal')}
            className="mt-0.5 w-4 h-4 border-zinc-700 bg-zinc-900 text-amber-500"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">💻</span>
              <span className="text-sm font-medium text-zinc-200">Terminal</span>
            </div>
            <p className="text-xs text-zinc-500">CLI, bash, git, devops...</p>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border-2 border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50 transition-colors">
          <input
            type="radio"
            name="codeEnv"
            value="both"
            checked={codeEnvironment === 'both'}
            onChange={() => setCodeEnvironment('both')}
            className="mt-0.5 w-4 h-4 border-zinc-700 bg-zinc-900 text-amber-500"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🚀</span>
              <span className="text-sm font-medium text-amber-400">Éditeur + Terminal</span>
              <span className="px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 rounded">Recommandé</span>
            </div>
            <p className="text-xs text-zinc-500">Environnement complet de développement</p>
          </div>
        </label>

        {/* Language selector */}
        {(codeEnvironment === 'editor' || codeEnvironment === 'both') && (
          <div className="pl-4 pt-2 border-l-2 border-amber-500/30">
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              Langage de programmation
            </label>
            <select
              value={programmingLanguage}
              onChange={(e) => setProgrammingLanguage(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {PROGRAMMING_LANGUAGES.map(lang => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Advanced */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-xs text-zinc-500 hover:text-zinc-300"
      >
        {showAdvanced ? '▼' : '▶'} Options avancées
      </button>

      {showAdvanced && (
        <div className="space-y-3 pl-4 border-l-2 border-zinc-800">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Projet lié
            </label>
            <select
              value={linkedProjectId}
              onChange={(e) => setLinkedProjectId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Aucun</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Prompt système (IA)
            </label>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Instructions pour l'IA..."
              rows={3}
              maxLength={1000}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" variant="primary">
          {isEditMode ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  )
}

