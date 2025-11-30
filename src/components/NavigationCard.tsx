import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface NavigationCardProps {
  icon: LucideIcon
  title: string
  description: string
  onClick: () => void
  accentColor: 'indigo' | 'cyan' | 'violet' | 'emerald' | 'amber'
  preview?: ReactNode
}

const accentClasses = {
  indigo: {
    icon: 'text-indigo-400/80',
    bg: 'bg-indigo-500/10',
    border: 'group-hover:border-indigo-500/20',
  },
  cyan: {
    icon: 'text-cyan-400/80',
    bg: 'bg-cyan-500/10',
    border: 'group-hover:border-cyan-500/20',
  },
  violet: {
    icon: 'text-violet-400/80',
    bg: 'bg-violet-500/10',
    border: 'group-hover:border-violet-500/20',
  },
  emerald: {
    icon: 'text-emerald-400/80',
    bg: 'bg-emerald-500/10',
    border: 'group-hover:border-emerald-500/20',
  },
  amber: {
    icon: 'text-amber-400/80',
    bg: 'bg-amber-500/10',
    border: 'group-hover:border-amber-500/20',
  },
}

export function NavigationCard({ 
  icon: Icon, 
  title, 
  description, 
  onClick, 
  accentColor,
  preview 
}: NavigationCardProps) {
  const accent = accentClasses[accentColor]

  return (
    <button
      onClick={onClick}
      className={`
        group card-press w-full text-left
        bg-mars-surface border border-white/5 rounded-xl p-5
        hover:bg-mars-surface-hover hover:border-white/10 ${accent.border}
        transition-all duration-150 cursor-pointer
      `}
    >
      <div className="flex items-start gap-4">
        <div className={`p-2.5 rounded-lg ${accent.bg}`}>
          <Icon className={`w-5 h-5 ${accent.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-zinc-100 font-medium tracking-tight">{title}</h3>
          <p className="text-sm text-zinc-500">{description}</p>
        </div>
      </div>
      {preview}
    </button>
  )
}
