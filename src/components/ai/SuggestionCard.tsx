import { LucideIcon } from 'lucide-react'

interface SuggestionCardProps {
  icon: LucideIcon
  title: string
  description: string
  onClick: () => void
}

export function SuggestionCard({ icon: Icon, title, description, onClick }: SuggestionCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-start gap-2 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-800/50 transition-colors duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/10 text-left"
    >
      {/* Icon */}
      <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 group-hover:from-indigo-500/20 group-hover:to-purple-500/20 transition-colors duration-300">
        <Icon className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
      </div>

      {/* Text */}
      <div>
        <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
          {title}
        </h3>
        <p className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors mt-0.5">
          {description}
        </p>
      </div>

      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-colors duration-300 pointer-events-none" />
    </button>
  )
}


