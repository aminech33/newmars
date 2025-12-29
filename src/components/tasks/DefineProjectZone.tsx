/**
 * 📋 DefineProjectZone - Zone de définition du projet (cercles de compétences)
 */

import { useState } from 'react'
import { Loader2, ChevronDown, ChevronRight, X, Check, Sparkles } from 'lucide-react'
import { fontStack, levelStyles } from './taskUtils'

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

interface DefineProjectZoneProps {
  onCancel: () => void
  onPlanify: (domain: string, selectedSkills: string[]) => void
}

export function DefineProjectZone({
  onCancel,
  onPlanify
}: DefineProjectZoneProps) {
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
      
      if (!data || !data.levels || !Array.isArray(data.levels)) {
        throw new Error('Réponse invalide du serveur')
      }
      
      if (data.levels.length === 0) {
        throw new Error('Aucune compétence trouvée pour ce domaine')
      }
      
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

  const toggleLevel = (levelIndex: number) => {
    if (!domainMap) return
    setDomainMap({
      ...domainMap,
      levels: domainMap.levels.map((level, i) => 
        i === levelIndex ? { ...level, expanded: !level.expanded } : level
      )
    })
  }

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

  const getSelectedCount = () => {
    if (!domainMap) return 0
    return domainMap.levels.reduce((acc, level) => 
      acc + level.skills.filter(s => s.selected).length, 0
    )
  }

  const handlePlanify = () => {
    if (!domainMap) return
    const selectedSkills = domainMap.levels
      .flatMap(level => level.skills.filter(s => s.selected).map(s => s.name))
    if (selectedSkills.length === 0) return
    onPlanify(domainMap.domain, selectedSkills)
  }

  const handleReset = () => {
    setDomainMap(null)
    setDomain('')
    setError(null)
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header compact */}
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

        {domainMap && !isAnalyzing && (
          <div className="space-y-3">
            {domainMap.levels.map((level, levelIndex) => {
              const style = levelStyles[level.level] || levelStyles[0]
              const selectedInLevel = level.skills.filter(s => s.selected).length
              
              return (
                <div
                  key={level.level}
                  className={`rounded-lg border ${style.borderColor} ${style.bgColor} overflow-hidden transition-all`}
                >
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
                          {level.isCore ? (
                            <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 bg-emerald-500/20">
                              <Check className="w-3 h-3 text-emerald-400" />
                            </div>
                          ) : (
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


