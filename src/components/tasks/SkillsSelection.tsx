/**
 * 🎯 SkillsSelection - Affichage et sélection des compétences par niveau
 * S'affiche dans le body de la colonne "Plus tard" après analyse
 */

import { useState } from 'react'
import { ChevronDown, ChevronRight, Check, ArrowRight } from 'lucide-react'
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

interface SkillsSelectionProps {
  domainMap: DomainMap
  onPlanify: (selectedSkills: string[]) => void
}

export function SkillsSelection({ domainMap, onPlanify }: SkillsSelectionProps) {
  const [levels, setLevels] = useState<SkillLevel[]>(domainMap.levels)

  const toggleLevel = (levelIndex: number) => {
    setLevels(levels.map((level, i) => 
      i === levelIndex ? { ...level, expanded: !level.expanded } : level
    ))
  }

  const toggleSkill = (levelIndex: number, skillIndex: number) => {
    const level = levels[levelIndex]
    if (level.isCore) return
    
    setLevels(levels.map((lvl, i) => 
      i === levelIndex ? {
        ...lvl,
        skills: lvl.skills.map((skill, j) =>
          j === skillIndex ? { ...skill, selected: !skill.selected } : skill
        )
      } : lvl
    ))
  }

  const handlePlanify = () => {
    const selectedSkills = levels
      .flatMap(level => level.skills.filter(s => s.selected).map(s => s.name))
    if (selectedSkills.length === 0) return
    onPlanify(selectedSkills)
  }

  const totalSelected = levels.reduce((sum, level) => 
    sum + level.skills.filter(s => s.selected).length, 0
  )

  return (
    <div className="space-y-3">
      {/* Titre */}
      <div className="text-center py-4">
        <h3 className={`text-base font-semibold text-zinc-200 mb-1 ${fontStack}`}>
          {domainMap.title}
        </h3>
        <p className={`text-xs text-zinc-500 ${fontStack}`}>
          Sélectionnez les compétences à inclure
        </p>
      </div>

      {/* Niveaux de compétences */}
      {levels.map((level, levelIndex) => {
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
                  {!level.isCore && selectedInLevel > 0 && (
                    <span className={`px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 text-[9px] font-medium rounded ${fontStack}`}>
                      {selectedInLevel}
                    </span>
                  )}
                </div>
                <p className={`text-[10px] text-zinc-500 mt-0.5 ${fontStack}`}>
                  {level.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] text-zinc-600 ${fontStack}`}>
                  {level.skills.length}
                </span>
                {level.expanded ? (
                  <ChevronDown className="w-4 h-4 text-zinc-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                )}
              </div>
            </div>

            {level.expanded && (
              <div className="px-3 pb-3 space-y-1.5">
                {level.skills.map((skill, skillIndex) => (
                  <button
                    key={skillIndex}
                    onClick={() => toggleSkill(levelIndex, skillIndex)}
                    disabled={level.isCore}
                    className={`
                      w-full flex items-start gap-2 px-2.5 py-2 rounded-lg text-left transition-all
                      ${level.isCore 
                        ? 'bg-emerald-500/10 cursor-default' 
                        : skill.selected 
                          ? 'bg-indigo-500/20 hover:bg-indigo-500/30' 
                          : 'bg-zinc-800/30 hover:bg-zinc-800/50'
                      }
                    `}
                  >
                    <div className={`
                      w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5
                      ${level.isCore || skill.selected 
                        ? 'bg-indigo-500 text-white' 
                        : 'bg-zinc-700 border border-zinc-600'
                      }
                    `}>
                      {(level.isCore || skill.selected) && (
                        <Check className="w-3 h-3" strokeWidth={3} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] text-zinc-200 ${fontStack}`}>
                        {skill.name}
                      </p>
                      {skill.description && (
                        <p className={`text-[10px] text-zinc-500 mt-0.5 ${fontStack}`}>
                          {skill.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Bouton de planification */}
      <button
        onClick={handlePlanify}
        disabled={totalSelected === 0}
        className={`
          w-full py-3 px-4 rounded-lg font-medium text-[13px] transition-all flex items-center justify-center gap-2
          ${totalSelected > 0
            ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
          }
          ${fontStack}
        `}
      >
        Générer le plan ({totalSelected} compétence{totalSelected > 1 ? 's' : ''})
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

