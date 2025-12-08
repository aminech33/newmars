import { Tag, Flag } from 'lucide-react'
import { EventType, EventCategory, EventPriority } from '../../types/calendar'
import { TYPE_OPTIONS, CATEGORY_OPTIONS, PRIORITY_OPTIONS } from '../../constants/calendar'

interface EventMetadataSectionProps {
  type: EventType
  category: EventCategory
  priority: EventPriority
  onTypeChange: (type: EventType) => void
  onCategoryChange: (category: EventCategory) => void
  onPriorityChange: (priority: EventPriority) => void
}

export function EventMetadataSection({
  type,
  category,
  priority,
  onTypeChange,
  onCategoryChange,
  onPriorityChange
}: EventMetadataSectionProps) {
  return (
    <div className="space-y-4">
      {/* Type */}
      <div>
        <label className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
          <Tag className="w-3.5 h-3.5" />
          <span className="font-medium">Nature de l'événement</span>
        </label>
        <p className="text-[10px] text-zinc-600 mb-2">Ce que c'est (réunion, rappel, etc.)</p>
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onTypeChange(opt.value)}
              title={opt.description}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                type === opt.value
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 scale-95'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
          <Tag className="w-3.5 h-3.5" />
          <span className="font-medium">Domaine de vie</span>
        </label>
        <p className="text-[10px] text-zinc-600 mb-2">Le contexte (travail, santé, personnel, etc.)</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onCategoryChange(opt.value)}
              title={opt.description}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                category === opt.value
                  ? `${opt.color} bg-zinc-800/50 border border-current/30 scale-95`
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div>
        <label className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
          <Flag className="w-3.5 h-3.5" />
          <span className="font-medium">Priorité</span>
        </label>
        <p className="text-[10px] text-zinc-600 mb-2">Niveau d'importance</p>
        <div className="flex flex-wrap gap-2">
          {PRIORITY_OPTIONS.map((opt) => {
            // Définir les styles complets pour chaque priorité
            const activeStyle = priority === opt.value
              ? opt.value === 'low' ? 'bg-zinc-700/50 text-zinc-400 border-zinc-600/50'
              : opt.value === 'medium' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
              : opt.value === 'high' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border-zinc-800 hover:border-zinc-700'
            
            return (
              <button
                key={opt.value}
                onClick={() => onPriorityChange(opt.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border scale-95 ${activeStyle}`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

