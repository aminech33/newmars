/**
 * 📋 PlanningZone - Zone de planification intégrée
 */

import { useState, useEffect } from 'react'
import { Loader2, ChevronDown, ChevronRight, X, Check, Sparkles } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { 
  fontStack, 
  ProjectPlan, 
  EditableTask, 
  EFFORT_COLORS, 
  getLevelLabel 
} from './taskUtils'

interface PlanningZoneProps {
  onProjectCreated: () => void
  onCancel: () => void
  preselectedSkills?: string[]
  preselectedDomain?: string
}

export function PlanningZone({ 
  onProjectCreated,
  onCancel,
  preselectedSkills,
  preselectedDomain
}: PlanningZoneProps) {
  const { addProject, addTask } = useStore()
  const [idea, setIdea] = useState(preselectedDomain || '')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<ProjectPlan | null>(null)
  const [editableTasks, setEditableTasks] = useState<EditableTask[]>([])
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  
  const hasPreselection = preselectedSkills && preselectedSkills.length > 0
  
  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)
    
    try {
      let response: Response
      
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
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Impossible de générer le plan. Essayez avec une description plus détaillée.')
      }
    } finally {
      setIsGenerating(false)
    }
  }
  
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
      icon: '✨',
      hasPhases: (generatedPlan.phases?.length || 0) > 0,
      phaseCount: generatedPlan.phases?.length || 0
    })
    
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
        
        if (task.phaseIndex === 0 && todayCount < MAX_TODAY) {
          temporalColumn = 'today'
          priority = 'high'
          todayCount++
        } else if (task.phaseIndex === lastPhaseIndex) {
          temporalColumn = 'distant'
          priority = 'low'
        } else if (upcomingCount < MAX_UPCOMING) {
          temporalColumn = 'upcoming'
          priority = task.phaseIndex <= 1 ? 'high' : 'medium'
          upcomingCount++
        } else {
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
  
  const totalTasks = editableTasks.length
  const phaseCount = phases.length || 1
  const validationCount = editableTasks.filter(t => t.isValidation).length
  
  const coverageGrid = generatedPlan?.coverageGrid || []
  const coveredDimensions = new Set(editableTasks.flatMap(t => t.covers || []))
  const missingDimensions = coverageGrid.filter(d => !coveredDimensions.has(d))
  
  const phasesWithoutValidation = phases.filter(phase => {
    const phaseTasks = tasksByPhase[phase.name] || []
    return !phaseTasks.some(t => t.isValidation)
  }).map(p => p.name)
  
  const warnings: string[] = []
  if (missingDimensions.length > 0) {
    warnings.push(`Dimensions non couvertes: ${missingDimensions.join(', ')}`)
  }
  if (phasesWithoutValidation.length > 0 && phasesWithoutValidation.length < phases.length) {
    warnings.push(`${phasesWithoutValidation.length} phase(s) sans validation`)
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
          <div className="flex flex-col h-full">
            {/* Titre du projet */}
            <div className="px-4 pt-5 pb-4 border-b border-zinc-800/30">
              <p className={`text-[11px] text-indigo-400/70 uppercase tracking-wider mb-1.5 font-medium ${fontStack}`}>
                Projet
              </p>
              <h2 className={`text-[20px] font-semibold text-zinc-100 leading-tight ${fontStack}`}>
                {generatedPlan.projectName}
              </h2>
              
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
              
              {warnings.length > 0 && (
                <div className="mt-3 px-2.5 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  {warnings.map((w, i) => (
                    <p key={i} className={`text-[12px] text-amber-400/80 ${fontStack}`}>
                      ⚠️ {w}
                    </p>
                  ))}
                </div>
              )}
              
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
            
            {/* Phases & Tâches */}
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
                      <button
                        onClick={() => togglePhase(phase.name)}
                        className="w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-zinc-800/20 transition-colors"
                      >
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
                          <h3 className={`text-[16px] font-medium leading-snug ${
                            isFirst ? 'text-zinc-100' : 'text-zinc-300'
                          } ${fontStack}`}>
                            {phase.name}
                          </h3>
                          
                          {phase.objective && (
                            <p className={`mt-1 text-[13px] text-zinc-500 leading-relaxed line-clamp-2 ${fontStack}`}>
                              {phase.objective}
                            </p>
                          )}
                          
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
                        
                        <div className="mt-1">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-zinc-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-zinc-600" />
                          )}
                        </div>
                      </button>
                      
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
                                  
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                                    isValidation 
                                      ? 'bg-emerald-500/20 text-emerald-400' 
                                      : EFFORT_COLORS[task.effort]
                                  } ${fontStack}`}>
                                    {task.effort}
                                  </span>
                                </div>
                                
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
            
            {/* Footer */}
            <div className="px-4 py-4 border-t border-zinc-800/40 bg-zinc-950/80">
              <div className="mb-3 px-3 py-2 bg-zinc-900/60 rounded-lg">
                <p className={`text-[12px] text-zinc-500 ${fontStack}`}>
                  <span className="text-zinc-400">Distribution :</span> 5 max → Aujourd'hui • ~25 → À venir • reste → Lointain
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setGeneratedPlan(null)
                    setEditableTasks([])
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


