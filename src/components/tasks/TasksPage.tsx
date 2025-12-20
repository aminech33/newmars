import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, Plus, Check, Star, Sparkles, Loader2, ChevronDown, ChevronRight, X, Timer, ListTodo } from 'lucide-react'
import { PomodoroPage } from '../pomodoro/PomodoroPage'

// Typography: Inter / SF Pro for optimal dark mode readability
const fontStack = 'font-[Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,SF_Pro_Display,Segoe_UI,Roboto,sans-serif]'

import { useStore, Task, TaskCategory } from '../../store/useStore'
import { TaskDetails } from './TaskDetails'
import { Tooltip } from '../ui/Tooltip'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { autoCategorizeTasks, estimateTaskDuration, detectPriority } from '../../utils/taskIntelligence'

// Types pour la planification intégrée
interface TaskPlan {
  title: string
  effort?: 'XS' | 'S' | 'M' | 'L'
  covers?: string[] // Dimensions couvertes
  isValidation?: boolean // Tâche de validation de phase
}

interface PhasePlan {
  name: string
  objective: string
  tasks: TaskPlan[]
}

interface ProjectPlan {
  projectName: string
  coverageGrid?: string[] // Grille de couverture du domaine
  phases?: PhasePlan[]
  tasks: TaskPlan[]
}

interface EditableTask {
  title: string
  effort: 'XS' | 'S' | 'M' | 'L'
  phase: string
  phaseIndex: number
  covers?: string[]
  isValidation?: boolean
}

const EFFORT_COLORS: Record<string, string> = {
  XS: 'bg-emerald-500/20 text-emerald-400',
  S: 'bg-blue-500/20 text-blue-400',
  M: 'bg-amber-500/20 text-amber-400',
  L: 'bg-rose-500/20 text-rose-400',
}

type TemporalColumn = 'today' | 'inProgress' | 'upcoming' | 'distant'

interface ColumnConfig {
  id: TemporalColumn
  title: string
}

const COLUMNS: ColumnConfig[] = [
  { id: 'today', title: "Aujourd'hui" },
  { id: 'inProgress', title: 'En cours' },
  { id: 'upcoming', title: 'À venir' },
  { id: 'distant', title: 'Lointain' }
]

function categorizeTask(task: Task): TemporalColumn {
  // Tâches terminées → restent dans Aujourd'hui pour feedback
  if (task.completed) return 'today'
  
  // Status explicite "en cours" → colonne En cours
  if (task.status === 'in-progress') return 'inProgress'
  
  // Si la tâche a une colonne assignée manuellement, l'utiliser
  if (task.temporalColumn) return task.temporalColumn
  
  // Tâche prioritaire → Aujourd'hui
  if (task.isPriority || task.priority === 'urgent' || task.priority === 'high') return 'today'
  
  // Fallback basé sur les dates si présentes (compatibilité)
  if (task.dueDate) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    const dueDate = new Date(task.dueDate)
    if (dueDate < tomorrow) return 'today'
    if (dueDate < in7Days) return 'upcoming'
    if (dueDate < in30Days) return 'upcoming'
    return 'distant'
  }
  
  // Par défaut → À venir
  return 'upcoming'
}

function TaskRow({ 
  task, 
  column,
  onClick,
  onToggle
}: { 
  task: Task
  column: TemporalColumn
  onClick: () => void
  onToggle: () => void
}) {
  const { projects, setPriorityTask, updateTask } = useStore()
  const project = task.projectId ? projects.find(p => p.id === task.projectId) : null
  const [isChecking, setIsChecking] = useState(false)
  
  const isUpcoming = column === 'upcoming'
  const isDistant = column === 'distant'
  const isOverdue = task.dueDate && new Date(task.dueDate).getTime() < Date.now() && !task.completed
  
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isDistant && !task.completed) {
      setIsChecking(true)
      setTimeout(() => setIsChecking(false), 350)
    }
    onToggle()
  }
  
  const handlePriority = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (task.isPriority) {
      updateTask(task.id, { isPriority: false })
    } else {
      setPriorityTask(task.id)
    }
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) return "Auj."
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (d.toDateString() === tomorrow.toDateString()) return 'Dem.'
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  // Configuration visuelle par colonne
  const columnConfig = {
    today: {
      row: 'bg-zinc-800/50 hover:bg-zinc-800/80',
      rowHover: 'hover:shadow-lg hover:shadow-black/25 hover:-translate-y-0.5',
      text: 'text-zinc-50',
      textSecondary: 'text-zinc-400',
      checkbox: 'border-zinc-400 hover:border-zinc-200 hover:bg-white/10',
      checkboxPriority: 'border-amber-400/80 hover:border-amber-300 hover:bg-amber-400/15',
      dateBadge: 'text-zinc-300 bg-zinc-700/50',
      opacity: '',
    },
    inProgress: {
      row: 'bg-zinc-800/35 hover:bg-zinc-800/55',
      rowHover: 'hover:shadow-md hover:shadow-black/15 hover:-translate-y-px',
      text: 'text-zinc-200',
      textSecondary: 'text-zinc-500',
      checkbox: 'border-zinc-500 hover:border-zinc-300 hover:bg-zinc-600/30',
      checkboxPriority: 'border-amber-500/70 hover:border-amber-400 hover:bg-amber-400/10',
      dateBadge: 'text-zinc-400 bg-zinc-700/35',
      opacity: '',
    },
    upcoming: {
      row: 'bg-zinc-800/20 hover:bg-zinc-800/35',
      rowHover: 'hover:shadow-sm hover:shadow-black/10 hover:-translate-y-px',
      text: 'text-zinc-400',
      textSecondary: 'text-zinc-600',
      checkbox: 'border-zinc-600 hover:border-zinc-400 hover:bg-zinc-600/20',
      checkboxPriority: 'border-amber-600/50 hover:border-amber-500 hover:bg-amber-400/10',
      dateBadge: 'text-zinc-500 bg-zinc-800/40',
      opacity: 'opacity-85',
    },
    distant: {
      row: 'bg-zinc-900/30 hover:bg-zinc-800/25',
      rowHover: '',
      text: 'text-zinc-500',
      textSecondary: 'text-zinc-700',
      checkbox: 'border-zinc-700',
      checkboxPriority: 'border-amber-700/40',
      dateBadge: 'text-zinc-600 bg-zinc-800/25',
      opacity: 'opacity-60 hover:opacity-75',
    },
  }

  const config = columnConfig[column]

  // Checkbox
  const Checkbox = () => {
    if (task.completed) {
      return (
        <div className="w-5 h-5 rounded-full flex items-center justify-center bg-emerald-500/20 ring-1 ring-emerald-500/40 transition-all duration-150">
          <Check className="w-3 h-3 text-emerald-400" strokeWidth={2.5} />
        </div>
      )
    }
    
    if (isDistant) {
      return (
        <div className={`w-5 h-5 rounded-full border-[1.5px] ${config.checkbox} transition-all duration-150`} />
      )
    }
    
    return (
      <button
        onClick={handleToggle}
        className={`
          w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center
          transition-all duration-150 ease-out
          ${task.isPriority ? config.checkboxPriority : config.checkbox}
          hover:scale-110 active:scale-95
          focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-1 focus:ring-offset-zinc-900
          ${isChecking ? 'scale-90 bg-emerald-500/30 border-emerald-400' : ''}
        `}
      />
    )
  }

  return (
    <div
      onClick={onClick}
      className={`
        group flex items-center gap-3 h-12 px-3.5 rounded-xl cursor-pointer
        transition-all duration-150 ease-out
        ${config.row} ${config.rowHover} ${config.opacity}
        ${task.isPriority && !task.completed && !isDistant ? 'ring-1 ring-amber-500/20 bg-amber-500/[0.04]' : ''}
        ${task.completed ? 'opacity-45' : ''}
        ${isChecking ? 'scale-[0.99]' : ''}
      `}
    >
      <Checkbox />
      
      {/* Project indicator */}
      {project && (
        <div 
          className={`w-1 h-5 rounded-full flex-shrink-0 transition-opacity duration-150
            ${isDistant ? 'opacity-40' : isUpcoming ? 'opacity-60' : 'opacity-80'}
          `}
          style={{ backgroundColor: project.color }}
        />
      )}
      
      {/* Title */}
      <span className={`
        flex-1 min-w-0 text-[17px] leading-normal truncate
        transition-all duration-200 ${fontStack}
        ${task.completed ? 'line-through opacity-70' : ''} 
        ${config.text}
        ${isDistant && !task.completed ? 'blur-[0.6px] group-hover:blur-0' : ''}
      `}>
        {task.title}
      </span>
      
      {/* Date badge */}
      {task.dueDate && !task.completed && (
        <span className={`
          flex-shrink-0 text-[13px] leading-none tabular-nums px-2.5 py-1 rounded-md
          transition-all duration-150 ${fontStack}
          ${isOverdue ? 'text-rose-400 bg-rose-500/15 font-medium' : config.dateBadge}
          ${isDistant ? 'opacity-60 group-hover:opacity-90' : ''}
        `}>
          {formatDate(task.dueDate)}
        </span>
      )}
      
      {/* Priority star */}
      {!isDistant && !task.completed && (
        <button
          onClick={handlePriority}
          className={`
            flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center
            transition-all duration-150
            ${task.isPriority ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
            hover:bg-white/10 active:scale-90
          `}
        >
          <Star 
            className={`w-3.5 h-3.5 transition-all duration-150 ${
              task.isPriority 
                ? 'text-amber-400 fill-amber-400' 
                : 'text-zinc-500 group-hover:text-zinc-400'
            }`}
          />
        </button>
      )}
    </div>
  )
}

function TemporalColumn({ 
  config, 
  tasks, 
  onTaskClick,
  onTaskToggle
}: { 
  config: ColumnConfig
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onTaskToggle: (taskId: string) => void
}) {
  const column = config.id
  const isToday = column === 'today'
  
  const todoTasks = tasks.filter(t => !t.completed)
  const doneTasks = tasks.filter(t => t.completed)

  // Configuration visuelle par colonne
  const columnStyles = {
    today: {
      bg: 'bg-zinc-900/60',
      header: 'text-zinc-50',
      count: 'bg-zinc-700/70 text-zinc-200',
      empty: 'text-zinc-600',
    },
    inProgress: {
      bg: 'bg-zinc-900/30',
      header: 'text-zinc-300',
      count: 'text-zinc-400',
      empty: 'text-zinc-700',
    },
    upcoming: {
      bg: 'bg-zinc-950/40',
      header: 'text-zinc-500',
      count: 'text-zinc-600',
      empty: 'text-zinc-700',
    },
    distant: {
      bg: 'bg-zinc-950/60',
      header: 'text-zinc-600',
      count: 'text-zinc-700',
      empty: 'text-zinc-800',
    },
  }

  const styles = columnStyles[column]
  
  return (
    <div className={`flex-1 min-w-0 flex flex-col h-full relative ${styles.bg}`}>
      {/* Separator */}
      {!isToday && (
        <div className="absolute left-0 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-zinc-800/50 to-transparent" />
      )}
      
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <h2 className={`text-[19px] font-semibold leading-tight tracking-tight ${fontStack} ${styles.header}`}>
            {config.title}
          </h2>
          {todoTasks.length > 0 && (
            <span className={`text-[14px] leading-none tabular-nums px-2 py-1 rounded-md ${fontStack} ${styles.count}`}>
              {todoTasks.length}
            </span>
          )}
        </div>
        
      </div>
      
      {/* Tasks list */}
      <div className="flex-1 overflow-y-auto px-2.5 pb-4">
        {todoTasks.length === 0 && doneTasks.length === 0 ? (
          <div className="h-20 flex items-center justify-center">
            <span className={`text-[15px] ${fontStack} ${styles.empty}`}>
              {isToday ? "Journée libre" : '—'}
            </span>
          </div>
        ) : (
          <div className="space-y-1.5">
            {todoTasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                column={column}
                onClick={() => onTaskClick(task)}
                onToggle={() => onTaskToggle(task.id)}
              />
            ))}
            
            {/* Completed section - Today only */}
            {isToday && doneTasks.length > 0 && (
              <div className="mt-6 pt-4 border-t border-zinc-800/50">
                <p className={`text-[12px] text-zinc-600 uppercase tracking-wider mb-3 px-1 font-semibold ${fontStack}`}>
                  Terminées
                </p>
                <div className="space-y-1">
                  {doneTasks.slice(0, 4).map(task => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      column={column}
                      onClick={() => onTaskClick(task)}
                      onToggle={() => onTaskToggle(task.id)}
                    />
                  ))}
                </div>
                {doneTasks.length > 4 && (
                  <button className={`w-full mt-2 py-2 text-[13px] text-zinc-600 hover:text-zinc-400 transition-colors ${fontStack}`}>
                    +{doneTasks.length - 4} autres
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Zone de définition du projet (cercles de compétences) dans Lointain
// ═══════════════════════════════════════════════════════════════

interface Skill {
  name: string
  description?: string
  selected: boolean
}

interface SkillLevel {
  level: number
  name: string
  description: string
  skills: Skill[]
  isCore: boolean
  expanded: boolean
}

interface DomainMap {
  domain: string
  title: string
  levels: SkillLevel[]
}

function DefineProjectZone({
  onCancel,
  onPlanify
}: {
  onCancel: () => void
  onPlanify: (domain: string, selectedSkills: string[]) => void
}) {
  const [domain, setDomain] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [domainMap, setDomainMap] = useState<DomainMap | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Analyser le domaine
  const handleAnalyze = async () => {
    if (!domain.trim() || domain.trim().length < 2) {
      setError('Entre au moins 2 caractères')
      return
    }
    
    setIsAnalyzing(true)
    setError(null)
    
    // Timeout de 45 secondes
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000)
    
    try {
      const response = await fetch('http://localhost:8000/api/skills/generate-domain-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim() }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.detail || `Erreur serveur (${response.status})`)
      }
      
      const data = await response.json()
      
      // Validation de la structure de réponse
      if (!data || !data.levels || !Array.isArray(data.levels)) {
        throw new Error('Réponse invalide du serveur')
      }
      
      if (data.levels.length === 0) {
        throw new Error('Aucune compétence trouvée pour ce domaine')
      }
      
      // Transformer pour l'UI avec validation
      const transformedLevels: SkillLevel[] = data.levels.map((level: any) => ({
        level: level.level ?? 0,
        name: level.name ?? 'Sans nom',
        description: level.description ?? '',
        isCore: level.isCore ?? (level.level === 0),
        expanded: level.level <= 1,
        skills: Array.isArray(level.skills) 
          ? level.skills.map((skill: any) => ({
              name: skill.name ?? 'Compétence',
              description: skill.description ?? null,
              selected: level.isCore ?? (level.level === 0)
            }))
          : []
      }))
      
      setDomainMap({
        domain: data.domain ?? domain.trim(),
        title: data.title ?? `Maîtriser ${domain.trim()}`,
        levels: transformedLevels
      })
      
    } catch (err) {
      clearTimeout(timeoutId)
      
      // Gestion des erreurs spécifiques
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Timeout : l\'analyse prend trop de temps. Réessayez.')
        } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          setError('Impossible de contacter le serveur. Vérifiez que le backend est lancé.')
        } else {
          setError(err.message)
        }
      } else {
        setError('Erreur inconnue')
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Toggle expansion d'un niveau
  const toggleLevel = (levelIndex: number) => {
    if (!domainMap) return
    setDomainMap({
      ...domainMap,
      levels: domainMap.levels.map((level, i) => 
        i === levelIndex ? { ...level, expanded: !level.expanded } : level
      )
    })
  }

  // Toggle sélection d'une compétence
  const toggleSkill = (levelIndex: number, skillIndex: number) => {
    if (!domainMap) return
    const level = domainMap.levels[levelIndex]
    if (level.isCore) return
    
    setDomainMap({
      ...domainMap,
      levels: domainMap.levels.map((lvl, i) => 
        i === levelIndex ? {
          ...lvl,
          skills: lvl.skills.map((skill, j) =>
            j === skillIndex ? { ...skill, selected: !skill.selected } : skill
          )
        } : lvl
      )
    })
  }

  // Compter les compétences sélectionnées
  const getSelectedCount = () => {
    if (!domainMap) return 0
    return domainMap.levels.reduce((acc, level) => 
      acc + level.skills.filter(s => s.selected).length, 0
    )
  }

  // Lancer la planification
  const handlePlanify = () => {
    if (!domainMap) return
    const selectedSkills = domainMap.levels
      .flatMap(level => level.skills.filter(s => s.selected).map(s => s.name))
    if (selectedSkills.length === 0) return
    onPlanify(domainMap.domain, selectedSkills)
  }

  // Icônes et couleurs par niveau
  const levelStyles: Record<number, { emoji: string; borderColor: string; bgColor: string }> = {
    0: { emoji: '🎯', borderColor: 'border-emerald-500/30', bgColor: 'bg-emerald-500/5' },
    1: { emoji: '🔵', borderColor: 'border-blue-500/30', bgColor: 'bg-blue-500/5' },
    2: { emoji: '🟡', borderColor: 'border-amber-500/30', bgColor: 'bg-amber-500/5' },
    3: { emoji: '🔴', borderColor: 'border-rose-500/30', bgColor: 'bg-rose-500/5' },
  }

  // Reset l'analyse
  const handleReset = () => {
    setDomainMap(null)
    setDomain('')
    setError(null)
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header compact : Input + Analyser + Fermer */}
      <div className="px-4 py-3 border-b border-zinc-800/30">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="Définir le projet..."
              className={`w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-[13px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 ${fontStack}`}
              disabled={isAnalyzing}
            />
            {/* Bouton reset si domainMap existe */}
            {domainMap && (
              <button
                onClick={handleReset}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-300 rounded transition-colors"
                title="Recommencer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <button
            onClick={handleAnalyze}
            disabled={!domain.trim() || isAnalyzing}
            className={`px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1.5 ${fontStack}`}
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Analyser'
            )}
          </button>
          <button
            onClick={onCancel}
            className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {error && (
          <p className={`mt-2 text-[11px] text-rose-400 ${fontStack}`}>{error}</p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">

        {/* État de chargement amélioré */}
        {isAnalyzing && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 mx-auto mb-3 text-indigo-400 animate-spin" />
            <p className={`text-[12px] text-zinc-400 ${fontStack}`}>
              Analyse de <span className="text-zinc-200 font-medium">{domain}</span> en cours...
            </p>
            <p className={`text-[10px] text-zinc-600 mt-1 ${fontStack}`}>
              Identification des compétences par niveau
            </p>
          </div>
        )}

        {/* Cartographie */}
        {domainMap && !isAnalyzing && (
          <div className="space-y-3">
            {/* Niveaux */}
            {domainMap.levels.map((level, levelIndex) => {
              const style = levelStyles[level.level] || levelStyles[0]
              const selectedInLevel = level.skills.filter(s => s.selected).length
              
              return (
                <div
                  key={level.level}
                  className={`rounded-lg border ${style.borderColor} ${style.bgColor} overflow-hidden transition-all`}
                >
                  {/* Header niveau */}
                  <div
                    className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => toggleLevel(levelIndex)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px]">{style.emoji}</span>
                        <span className={`text-[13px] font-medium text-zinc-200 ${fontStack}`}>
                          {level.name}
                        </span>
                        {level.isCore && (
                          <span className={`px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-medium rounded ${fontStack}`}>
                            INCLUS
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className={`text-[10px] text-zinc-500 ${fontStack}`}>
                        {selectedInLevel}/{level.skills.length}
                      </span>
                      {level.expanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                      )}
                    </div>
                  </div>

                  {/* Compétences */}
                  {level.expanded && (
                    <div className="px-3 pb-3 space-y-1.5">
                      {level.skills.map((skill, skillIndex) => (
                        <div
                          key={skill.name}
                          onClick={() => toggleSkill(levelIndex, skillIndex)}
                          className={`
                            flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150
                            ${level.isCore 
                              ? 'bg-emerald-500/5 border border-emerald-500/20' 
                              : skill.selected
                                ? 'bg-indigo-500/10 border border-indigo-500/30 cursor-pointer'
                                : 'bg-zinc-900/50 border border-transparent hover:bg-zinc-800/50 hover:border-zinc-700/50 cursor-pointer'
                            }
                          `}
                        >
                          {/* Indicateur visuel */}
                          {level.isCore ? (
                            // Pour le cœur : simple check vert, pas de checkbox
                            <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 bg-emerald-500/20">
                              <Check className="w-3 h-3 text-emerald-400" />
                            </div>
                          ) : (
                            // Pour les autres : checkbox interactive
                            <div className={`
                              w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all duration-150
                              ${skill.selected 
                                ? 'bg-indigo-600 scale-110' 
                                : 'bg-zinc-800 border border-zinc-600 hover:border-zinc-500'
                              }
                            `}>
                              {skill.selected && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                          )}
                          <span className={`text-[12px] ${level.isCore ? 'text-emerald-300/80' : skill.selected ? 'text-zinc-200' : 'text-zinc-400'} ${fontStack}`}>
                            {skill.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Bouton Planifier */}
            <button
              onClick={handlePlanify}
              disabled={getSelectedCount() === 0}
              className={`w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-xl text-[14px] font-medium transition-all duration-150 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] ${fontStack}`}
            >
              <Sparkles className="w-4 h-4" />
              Planifier {getSelectedCount()} compétence{getSelectedCount() > 1 ? 's' : ''}
            </button>
          </div>
        )}

        {/* État initial - seulement si pas de domaine tapé */}
        {!domainMap && !isAnalyzing && !domain.trim() && (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-900 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-zinc-600" />
            </div>
            <p className={`text-[12px] text-zinc-500 ${fontStack}`}>
              Entre un domaine à maîtriser
            </p>
            <p className={`text-[10px] text-zinc-600 mt-1 ${fontStack}`}>
              Ex: Python, JavaScript, Design UX...
            </p>
          </div>
        )}

        {/* État intermédiaire - domaine tapé mais pas encore analysé */}
        {!domainMap && !isAnalyzing && domain.trim() && (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <p className={`text-[12px] text-zinc-400 ${fontStack}`}>
              Clique sur <span className="text-indigo-400 font-medium">Analyser</span> pour découvrir
            </p>
            <p className={`text-[12px] text-zinc-400 ${fontStack}`}>
              les compétences de <span className="text-zinc-200 font-medium">{domain}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Zone de planification intégrée dans Lointain
function PlanningZone({ 
  onProjectCreated,
  onCancel,
  preselectedSkills,
  preselectedDomain
}: { 
  onProjectCreated: () => void
  onCancel: () => void
  preselectedSkills?: string[]
  preselectedDomain?: string
}) {
  const { addProject, addTask } = useStore()
  const [idea, setIdea] = useState(preselectedDomain || '')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<ProjectPlan | null>(null)
  const [editableTasks, setEditableTasks] = useState<EditableTask[]>([])
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  
  // Si des compétences sont présélectionnées, générer automatiquement
  const hasPreselection = preselectedSkills && preselectedSkills.length > 0
  
  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)
    
    try {
      let response: Response
      
      // Utiliser le bon endpoint selon qu'on a des compétences présélectionnées ou non
      if (hasPreselection) {
        response = await fetch('http://localhost:8000/api/tasks/generate-skill-based-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectTitle: `Maîtriser ${preselectedDomain}`,
            domain: preselectedDomain,
            selectedSkills: preselectedSkills
          })
        })
      } else {
        if (!idea.trim() || idea.trim().length < 5) {
          setError('Décris ton idée en au moins 5 caractères')
          setIsGenerating(false)
          return
        }
        response = await fetch('http://localhost:8000/api/tasks/generate-project-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idea: idea.trim() })
        })
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Erreur ${response.status}`)
      }
      
      const plan: ProjectPlan = await response.json()
      setGeneratedPlan(plan)
      
      const tasks: EditableTask[] = []
      if (plan.phases && plan.phases.length > 0) {
        plan.phases.forEach((phase, phaseIndex) => {
          phase.tasks.forEach(task => {
            tasks.push({
              title: task.title,
              effort: task.effort || 'S',
              phase: phase.name,
              phaseIndex,
              covers: task.covers || [],
              isValidation: task.isValidation || false
            })
          })
        })
        setExpandedPhases(new Set([plan.phases[0].name]))
      } else {
        plan.tasks.forEach(task => {
          tasks.push({
            title: task.title,
            effort: task.effort || 'S',
            phase: 'Tâches',
            phaseIndex: 0,
            covers: task.covers || [],
            isValidation: task.isValidation || false
          })
        })
      }
      
      setEditableTasks(tasks)
    } catch (err) {
      // Afficher l'erreur détaillée du backend si disponible
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Impossible de générer le plan. Essayez avec une description plus détaillée.')
      }
    } finally {
      setIsGenerating(false)
    }
  }
  
  // Auto-générer si on a des compétences présélectionnées
  useEffect(() => {
    if (hasPreselection && !generatedPlan && !isGenerating) {
      handleGenerate()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPreselection])
  
  const handleCreateProject = () => {
    if (!generatedPlan || editableTasks.length === 0) return
    
    const projectId = addProject({
      name: generatedPlan.projectName,
      color: '#6366f1',
      icon: '✨'
    })
    
    // ═══════════════════════════════════════════════════════════════
    // DISTRIBUTION TEMPORELLE BASÉE SUR LE NOMBRE DE TÂCHES
    // ═══════════════════════════════════════════════════════════════
    // Objectif : éviter la surcharge cognitive
    //
    // Today: 5 tâches max (focus)
    // En cours: vide (l'utilisateur y déplace manuellement)
    // À venir: ~20-25 tâches max (confort visuel)
    // Lointain: le reste (horizon futur)
    
    const MAX_TODAY = 5
    const MAX_UPCOMING = 25
    
    let todayCount = 0
    let upcomingCount = 0
    const totalPhases = generatedPlan.phases?.length || 1
    const lastPhaseIndex = totalPhases - 1
    
    editableTasks.forEach((task) => {
      if (task.title.trim()) {
        let temporalColumn: 'today' | 'upcoming' | 'distant' = 'upcoming'
        let priority: 'high' | 'medium' | 'low' = 'medium'
        
        // Logique de distribution
        if (task.phaseIndex === 0 && todayCount < MAX_TODAY) {
          // Phase 1, premières tâches → Aujourd'hui (max 5)
          temporalColumn = 'today'
          priority = 'high'
          todayCount++
        } else if (task.phaseIndex === lastPhaseIndex) {
          // Dernière phase → toujours Lointain
          temporalColumn = 'distant'
          priority = 'low'
        } else if (upcomingCount < MAX_UPCOMING) {
          // Phases intermédiaires → À venir (jusqu'au seuil)
          temporalColumn = 'upcoming'
          priority = task.phaseIndex <= 1 ? 'high' : 'medium'
          upcomingCount++
        } else {
          // Dépassement du seuil → Lointain
          temporalColumn = 'distant'
          priority = 'low'
        }
        
        addTask({
          title: task.title.trim(),
          category: 'work',
          priority,
          projectId,
          completed: false,
          status: 'todo',
          temporalColumn,
          effort: task.effort,
          phaseIndex: task.phaseIndex
        })
      }
    })
    
    // Reset et callback
    setIdea('')
    setGeneratedPlan(null)
    setEditableTasks([])
    onProjectCreated()
  }
  
  const togglePhase = (name: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }
  
  const tasksByPhase = editableTasks.reduce((acc, task, idx) => {
    if (!acc[task.phase]) acc[task.phase] = []
    acc[task.phase].push({ ...task, idx })
    return acc
  }, {} as Record<string, (EditableTask & { idx: number })[]>)
  
  const phases = generatedPlan?.phases || []
  
  // ═══════════════════════════════════════════════════════════════
  // STATISTIQUES ET VALIDATION DU PLAN
  // ═══════════════════════════════════════════════════════════════
  const totalTasks = editableTasks.length
  const phaseCount = phases.length || 1
  const validationCount = editableTasks.filter(t => t.isValidation).length
  
  // Vérifier la couverture (si coverageGrid existe)
  const coverageGrid = generatedPlan?.coverageGrid || []
  const coveredDimensions = new Set(editableTasks.flatMap(t => t.covers || []))
  const missingDimensions = coverageGrid.filter(d => !coveredDimensions.has(d))
  
  // Vérifier les phases sans validation
  const phasesWithoutValidation = phases.filter(phase => {
    const phaseTasks = tasksByPhase[phase.name] || []
    return !phaseTasks.some(t => t.isValidation)
  }).map(p => p.name)
  
  // Warnings à afficher
  const warnings: string[] = []
  if (missingDimensions.length > 0) {
    warnings.push(`Dimensions non couvertes: ${missingDimensions.join(', ')}`)
  }
  if (phasesWithoutValidation.length > 0 && phasesWithoutValidation.length < phases.length) {
    warnings.push(`${phasesWithoutValidation.length} phase(s) sans validation`)
  }
  
  // Labels de niveau implicite par phase
  const getLevelLabel = (phaseIndex: number, total: number): string => {
    if (total <= 2) return ''
    const progress = phaseIndex / (total - 1)
    if (progress <= 0.33) return 'Fondations'
    if (progress <= 0.66) return 'Consolidation'
    return 'Maîtrise'
  }
  
  return (
    <div className="flex flex-col h-full bg-zinc-950/90">
      {/* Header compact */}
      <div className="px-4 pt-4 pb-3 border-b border-zinc-800/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <span className={`text-[15px] font-medium text-zinc-300 ${fontStack}`}>
              Nouveau projet
            </span>
          </div>
          <button 
            onClick={onCancel}
            className="p-1.5 text-zinc-600 hover:text-zinc-400 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {!generatedPlan ? (
          // ════════════════════════════════════════════════════════════════
          // ÉTAPE 1 : Saisie de l'intention
          // ════════════════════════════════════════════════════════════════
          <div className="px-4 py-5 space-y-5">
            <div>
              <label className={`block text-[13px] text-zinc-500 mb-2 ${fontStack}`}>
                Quel est ton objectif ?
              </label>
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate()
                }}
                placeholder="Ex: Apprendre Python pour l'analyse de données..."
                rows={4}
                className={`w-full px-4 py-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl text-[15px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/40 focus:bg-zinc-900/80 resize-none transition-all ${fontStack}`}
                autoFocus
              />
              <p className={`mt-2 text-[12px] text-zinc-600 ${fontStack}`}>
                Sois précis : l'IA adapte le parcours à ton contexte
              </p>
            </div>
            
            {error && (
              <div className="px-3 py-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                <p className={`text-[13px] text-rose-400 ${fontStack}`}>{error}</p>
              </div>
            )}
            
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !idea.trim()}
              className={`w-full flex items-center justify-center gap-2.5 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl transition-all text-[15px] font-medium ${fontStack}`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Structuration en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Générer le parcours
                </>
              )}
            </button>
          </div>
        ) : (
          // ════════════════════════════════════════════════════════════════
          // ÉTAPE 2 : Visualisation du plan structuré
          // ════════════════════════════════════════════════════════════════
          <div className="flex flex-col h-full">
            {/* ──────────────────────────────────────────────────────────── */}
            {/* TITRE DU PROJET - Niveau hiérarchique 1 */}
            {/* ──────────────────────────────────────────────────────────── */}
            <div className="px-4 pt-5 pb-4 border-b border-zinc-800/30">
              <p className={`text-[11px] text-indigo-400/70 uppercase tracking-wider mb-1.5 font-medium ${fontStack}`}>
                Projet
              </p>
              <h2 className={`text-[20px] font-semibold text-zinc-100 leading-tight ${fontStack}`}>
                {generatedPlan.projectName}
              </h2>
              
              {/* Statistiques du plan */}
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <span className={`text-[13px] px-2 py-0.5 rounded-md bg-zinc-800/60 text-zinc-400 ${fontStack}`}>
                  {phaseCount} {phaseCount > 1 ? 'phases' : 'phase'}
                </span>
                <span className={`text-[13px] px-2 py-0.5 rounded-md bg-zinc-800/60 text-zinc-400 ${fontStack}`}>
                  {totalTasks} tâches
                </span>
                {validationCount > 0 && (
                  <span className={`text-[13px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 ${fontStack}`}>
                    {validationCount} validations
                  </span>
                )}
              </div>
              
              {/* Warnings de qualité */}
              {warnings.length > 0 && (
                <div className="mt-3 px-2.5 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  {warnings.map((w, i) => (
                    <p key={i} className={`text-[12px] text-amber-400/80 ${fontStack}`}>
                      ⚠️ {w}
                    </p>
                  ))}
                </div>
              )}
              
              {/* Grille de couverture */}
              {generatedPlan.coverageGrid && generatedPlan.coverageGrid.length > 0 && (
                <div className="mt-4 pt-3 border-t border-zinc-800/30">
                  <p className={`text-[11px] text-zinc-600 uppercase tracking-wider mb-2 ${fontStack}`}>
                    Dimensions couvertes
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {generatedPlan.coverageGrid.map((dim, i) => (
                      <span 
                        key={i}
                        className={`text-[11px] px-2 py-1 rounded-md bg-zinc-800/60 text-zinc-400 ${fontStack}`}
                      >
                        {dim}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* ──────────────────────────────────────────────────────────── */}
            {/* PHASES & TÂCHES - Liste scrollable */}
            {/* ──────────────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
              {phases.length > 0 ? (
                phases.map((phase, phaseIndex) => {
                  const isFirst = phaseIndex === 0
                  const levelLabel = getLevelLabel(phaseIndex, phases.length)
                  const tasksInPhase = tasksByPhase[phase.name] || []
                  const isExpanded = expandedPhases.has(phase.name)
                  
                  return (
                    <div 
                      key={phase.name} 
                      className={`rounded-xl overflow-hidden border transition-all ${
                        isFirst 
                          ? 'bg-zinc-900/70 border-zinc-700/50' 
                          : 'bg-zinc-900/40 border-zinc-800/30'
                      }`}
                    >
                      {/* En-tête de phase - Niveau hiérarchique 2 */}
                      <button
                        onClick={() => togglePhase(phase.name)}
                        className="w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-zinc-800/20 transition-colors"
                      >
                        {/* Indicateur de progression */}
                        <div className="mt-0.5 flex flex-col items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold ${
                            isFirst 
                              ? 'bg-indigo-500/20 text-indigo-400' 
                              : 'bg-zinc-800 text-zinc-500'
                          } ${fontStack}`}>
                            {phaseIndex + 1}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          {/* Titre de phase */}
                          <h3 className={`text-[16px] font-medium leading-snug ${
                            isFirst ? 'text-zinc-100' : 'text-zinc-300'
                          } ${fontStack}`}>
                            {phase.name}
                          </h3>
                          
                          {/* Objectif de phase */}
                          {phase.objective && (
                            <p className={`mt-1 text-[13px] text-zinc-500 leading-relaxed line-clamp-2 ${fontStack}`}>
                              {phase.objective}
                            </p>
                          )}
                          
                          {/* Badge niveau + count */}
                          <div className="flex items-center gap-2 mt-2">
                            {levelLabel && (
                              <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                                phaseIndex === 0 ? 'bg-emerald-500/15 text-emerald-400' :
                                phaseIndex < phases.length * 0.5 ? 'bg-blue-500/15 text-blue-400' :
                                'bg-violet-500/15 text-violet-400'
                              } ${fontStack}`}>
                                {levelLabel}
                              </span>
                            )}
                            <span className={`text-[12px] text-zinc-600 ${fontStack}`}>
                              {tasksInPhase.length} {tasksInPhase.length > 1 ? 'tâches' : 'tâche'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Chevron */}
                        <div className="mt-1">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-zinc-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-zinc-600" />
                          )}
                        </div>
                      </button>
                      
                      {/* Liste des tâches - Niveau hiérarchique 3 */}
                      {isExpanded && tasksInPhase.length > 0 && (
                        <div className="px-4 pb-3 space-y-1.5">
                          {tasksInPhase.map((task, taskIndex) => {
                            const isValidation = task.isValidation
                            
                            return (
                              <div
                                key={task.idx}
                                className={`group px-3 py-2.5 rounded-lg transition-all ${
                                  isValidation 
                                    ? 'bg-emerald-500/10 border border-emerald-500/20' 
                                    : isFirst ? 'bg-zinc-800/50' : 'bg-zinc-800/25'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  {/* Indicateur de tâche */}
                                  <div className="mt-0.5 w-4 flex justify-end">
                                    {isValidation ? (
                                      <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                        <Check className="w-2.5 h-2.5 text-emerald-400" />
                                      </div>
                                    ) : (
                                      <span className={`text-[11px] text-zinc-600 tabular-nums ${fontStack}`}>
                                        {taskIndex + 1}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Titre de tâche - multiline autorisé */}
                                  <div className="flex-1 min-w-0">
                                    {isValidation && (
                                      <span className={`text-[10px] text-emerald-400 font-medium uppercase tracking-wider ${fontStack}`}>
                                        Validation
                                      </span>
                                    )}
                                    <span className={`block text-[14px] leading-relaxed ${
                                      isValidation 
                                        ? 'text-emerald-200' 
                                        : isFirst ? 'text-zinc-200' : 'text-zinc-400'
                                    } ${fontStack}`}>
                                      {task.title}
                                    </span>
                                  </div>
                                  
                                  {/* Badge effort */}
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                                    isValidation 
                                      ? 'bg-emerald-500/20 text-emerald-400' 
                                      : EFFORT_COLORS[task.effort]
                                  } ${fontStack}`}>
                                    {task.effort}
                                  </span>
                                </div>
                                
                                {/* Dimensions couvertes (affiché au hover ou si présentes) */}
                                {task.covers && task.covers.length > 0 && !isValidation && (
                                  <div className="mt-1.5 ml-7 flex flex-wrap gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                    {task.covers.slice(0, 2).map((dim, i) => (
                                      <span 
                                        key={i}
                                        className={`text-[9px] px-1.5 py-0.5 rounded bg-zinc-700/40 text-zinc-500 ${fontStack}`}
                                      >
                                        {dim}
                                      </span>
                                    ))}
                                    {task.covers.length > 2 && (
                                      <span className={`text-[9px] text-zinc-600 ${fontStack}`}>
                                        +{task.covers.length - 2}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                // Fallback sans phases
                <div className="space-y-1.5">
                  {editableTasks.map((task, i) => (
                    <div key={i} className="flex items-start gap-3 px-3 py-2.5 bg-zinc-900/40 rounded-lg">
                      <span className={`text-[11px] text-zinc-600 mt-0.5 w-4 text-right ${fontStack}`}>
                        {i + 1}
                      </span>
                      <span className={`flex-1 text-[14px] text-zinc-300 leading-relaxed ${fontStack}`}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* ──────────────────────────────────────────────────────────── */}
            {/* FOOTER - Actions */}
            {/* ──────────────────────────────────────────────────────────── */}
            <div className="px-4 py-4 border-t border-zinc-800/40 bg-zinc-950/80">
              {/* Info redistribution intelligente */}
              <div className="mb-3 px-3 py-2 bg-zinc-900/60 rounded-lg">
                <p className={`text-[12px] text-zinc-500 ${fontStack}`}>
                  <span className="text-zinc-400">Distribution :</span> 5 max → Aujourd'hui • ~25 → À venir • reste → Lointain
                </p>
              </div>
              
              {/* Boutons */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setGeneratedPlan(null)
                    setEditableTasks([])
                    // Garder l'idée pour regénérer
                  }}
                  className={`py-3 px-4 text-zinc-500 hover:text-zinc-300 bg-zinc-900/60 hover:bg-zinc-800/60 rounded-xl transition-all text-[14px] font-medium ${fontStack}`}
                >
                  Modifier
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={`py-3 px-4 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl transition-all text-[14px] font-medium flex items-center gap-2 ${fontStack}`}
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Regénérer
                </button>
                <button
                  onClick={handleCreateProject}
                  className={`flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-all text-[15px] font-semibold shadow-lg shadow-indigo-500/20 ${fontStack}`}
                >
                  Lancer le projet
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

type PlanningStep = 'none' | 'define' | 'plan'

interface PlanningContext {
  domain: string
  selectedSkills: string[]
}

type TasksTab = 'tasks' | 'focus'

export function TasksPage() {
  const { tasks, addTask, toggleTask, deleteTask, setView, selectedTaskId, setSelectedTaskId } = useStore()
  
  const [activeTab, setActiveTab] = useState<TasksTab>('tasks')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<{ task: Task } | null>(null)
  const [planningStep, setPlanningStep] = useState<PlanningStep>('none')
  const [planningContext, setPlanningContext] = useState<PlanningContext | null>(null)
  
  useEffect(() => {
    if (selectedTaskId) {
      const task = tasks.find(t => t.id === selectedTaskId)
      if (task) setSelectedTask(task)
      setSelectedTaskId(null)
    }
  }, [selectedTaskId, tasks, setSelectedTaskId])
  
  const tasksByColumn = useMemo(() => {
    const result: Record<TemporalColumn, Task[]> = {
      today: [],
      inProgress: [],
      upcoming: [],
      distant: []
    }
    
    tasks.forEach(task => {
      result[categorizeTask(task)].push(task)
    })
    
    const sortTasks = (list: Task[]) => list.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      if (a.isPriority && !b.isPriority) return -1
      if (!a.isPriority && b.isPriority) return 1
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1
      if (b.priority === 'urgent' && a.priority !== 'urgent') return 1
      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      if (a.dueDate && !b.dueDate) return -1
      if (!a.dueDate && b.dueDate) return 1
      return b.createdAt - a.createdAt
    })
    
    Object.keys(result).forEach(key => sortTasks(result[key as TemporalColumn]))
    return result
  }, [tasks])
  
  
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        setShowQuickAdd(true)
      }
      if (e.key === 'Escape' && showQuickAdd) {
        setShowQuickAdd(false)
        setNewTaskTitle('')
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showQuickAdd])
  
  const handleQuickAdd = () => {
    if (!newTaskTitle.trim()) return
    
    addTask({
      title: newTaskTitle,
      category: autoCategorizeTasks(newTaskTitle) as TaskCategory,
      priority: detectPriority(newTaskTitle),
      estimatedTime: estimateTaskDuration(newTaskTitle),
      completed: false,
      status: 'todo'
    })
    
    setNewTaskTitle('')
    setShowQuickAdd(false)
  }

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-zinc-950">
      {/* Header */}
      <header className="flex items-center gap-4 h-14 px-5 border-b border-zinc-800/40 bg-zinc-900/25 backdrop-blur-sm">
        <button
          onClick={() => setView('hub')}
          className="p-2 -ml-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-xl transition-all duration-150"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
        </button>
        
        {/* Onglets Tâches / Focus */}
        <div className="flex items-center gap-1 bg-zinc-800/40 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 flex items-center gap-1.5 ${
              activeTab === 'tasks'
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span className="hidden sm:inline">Tâches</span>
          </button>
          <button
            onClick={() => setActiveTab('focus')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 flex items-center gap-1.5 ${
              activeTab === 'focus'
                ? 'bg-red-500/20 text-red-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Timer className="w-4 h-4" />
            <span className="hidden sm:inline">Focus</span>
          </button>
        </div>
        
        <div className="flex-1" />
        
        {activeTab === 'tasks' && (
          <>
            <Tooltip content="Créer un projet d'apprentissage" side="bottom">
              <button
                onClick={() => setPlanningStep('define')}
                disabled={planningStep !== 'none'}
                className={`h-10 px-4 ${planningStep !== 'none' ? 'text-indigo-400 bg-indigo-500/20 border-indigo-500/50' : 'text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30'} border rounded-xl transition-all duration-150 text-[15px] font-medium flex items-center gap-2 active:scale-[0.98] ${fontStack}`}
              >
                <Sparkles className="w-[16px] h-[16px]" />
                <span className="hidden sm:inline">Nouveau projet</span>
              </button>
            </Tooltip>
            
            <Tooltip content="⌘N" side="bottom">
              <button
                onClick={() => setShowQuickAdd(true)}
                className={`h-10 px-4 text-zinc-100 bg-zinc-800/80 hover:bg-zinc-700/90 rounded-xl transition-all duration-150 text-[15px] font-medium flex items-center gap-2.5 active:scale-[0.98] hover:shadow-lg hover:shadow-black/20 ${fontStack}`}
              >
                <Plus className="w-[18px] h-[18px]" />
                <span className="hidden sm:inline">Nouvelle tâche</span>
              </button>
            </Tooltip>
          </>
        )}
      </header>
      
      {/* Contenu selon l'onglet actif */}
      {activeTab === 'tasks' ? (
        <>
          {/* Quick Add */}
          <div className={`
            overflow-hidden border-b border-zinc-800/30 bg-zinc-900/30
            transition-all duration-200 ease-out
            ${showQuickAdd ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}
          `}>
            <div className="px-5 py-3 flex items-center gap-3">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleQuickAdd()
                  if (e.key === 'Escape') { setShowQuickAdd(false); setNewTaskTitle('') }
                }}
                placeholder="Que devez-vous faire ?"
                className={`flex-1 h-12 px-4 bg-zinc-800/60 text-zinc-100 placeholder:text-zinc-500 rounded-xl border border-zinc-700/50 focus:outline-none focus:border-zinc-600 focus:ring-2 focus:ring-zinc-600/20 text-[16px] transition-all duration-150 ${fontStack}`}
                autoFocus={showQuickAdd}
              />
              <button
                onClick={handleQuickAdd}
                disabled={!newTaskTitle.trim()}
                className={`h-12 px-6 bg-zinc-100 text-zinc-900 rounded-xl text-[15px] font-semibold disabled:opacity-25 disabled:cursor-not-allowed hover:bg-white transition-all duration-150 active:scale-[0.98] ${fontStack}`}
              >
                Ajouter
              </button>
            </div>
          </div>
          
          {/* Columns */}
          <div className="flex-1 flex overflow-hidden">
            {COLUMNS.map((config) => {
              // Remplacer Lointain par la zone de définition/planification si active
              if (config.id === 'distant' && planningStep !== 'none') {
                return (
                  <div key="planning" className="flex-1 min-w-0 relative">
                    <div className="absolute left-0 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-zinc-800/50 to-transparent" />
                    
                    {/* Étape 1 : Définir le projet (cercles de compétences) */}
                    {planningStep === 'define' && (
                      <DefineProjectZone
                        onCancel={() => setPlanningStep('none')}
                        onPlanify={(domain, selectedSkills) => {
                          setPlanningContext({ domain, selectedSkills })
                          setPlanningStep('plan')
                        }}
                      />
                    )}
                    
                    {/* Étape 2 : Planifier les tâches */}
                    {planningStep === 'plan' && (
                      <PlanningZone 
                        onProjectCreated={() => {
                          setPlanningStep('none')
                          setPlanningContext(null)
                        }}
                        onCancel={() => {
                          setPlanningStep('none')
                          setPlanningContext(null)
                        }}
                        preselectedSkills={planningContext?.selectedSkills}
                        preselectedDomain={planningContext?.domain}
                      />
                    )}
                  </div>
                )
              }
              
              return (
                <TemporalColumn
                  key={config.id}
                  config={config}
                  tasks={tasksByColumn[config.id]}
                  onTaskClick={setSelectedTask}
                  onTaskToggle={toggleTask}
                />
              )
            })}
          </div>
          
          {/* Task Details */}
          {selectedTask && (
            <TaskDetails
              task={selectedTask}
              onClose={() => setSelectedTask(null)}
            />
          )}

          {/* Confirm Delete */}
          <ConfirmDialog
            isOpen={!!confirmDelete}
            onClose={() => setConfirmDelete(null)}
            onConfirm={() => { if (confirmDelete) { deleteTask(confirmDelete.task.id); setConfirmDelete(null) } }}
            title="Supprimer ?"
            message={`"${confirmDelete?.task.title}"`}
            confirmText="Supprimer"
            cancelText="Annuler"
            variant="danger"
          />
        </>
      ) : (
        /* Onglet Focus - Pomodoro intégré */
        <div className="flex-1 overflow-hidden">
          <PomodoroPage embedded />
        </div>
      )}
    </div>
  )
}
