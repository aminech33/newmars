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
        <label className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
          <Tag className="w-3.5 h-3.5" />
          Type
        </label>
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onTypeChange(opt.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                type === opt.value
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border border-transparent'
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
        <label className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
          <Tag className="w-3.5 h-3.5" />
          Catégorie
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onCategoryChange(opt.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                category === opt.value
                  ? `${opt.color} bg-zinc-800/50 border border-current/30`
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border border-transparent'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div>
        <label className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
          <Flag className="w-3.5 h-3.5" />
          Priorité
        </label>
        <div className="flex flex-wrap gap-2">
          {PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onPriorityChange(opt.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                priority === opt.value
                  ? `${opt.color} bg-zinc-800/50 border border-current/30`
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border border-transparent'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

