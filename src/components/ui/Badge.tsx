import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  color?: 'emerald' | 'blue' | 'violet' | 'rose' | 'amber' | 'cyan' | 'orange'
  icon?: LucideIcon
  variant?: 'gradient' | 'subtle'
}

const gradientClasses = {
  emerald: 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30',
  blue: 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30',
  violet: 'bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg shadow-violet-500/30',
  rose: 'bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/30',
  amber: 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30',
  cyan: 'bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/30',
  orange: 'bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/30',
}

const subtleClasses = {
  emerald: 'bg-emerald-500/20 text-emerald-400',
  blue: 'bg-blue-500/20 text-blue-400',
  violet: 'bg-violet-500/20 text-violet-400',
  rose: 'bg-rose-500/20 text-rose-400',
  amber: 'bg-amber-500/20 text-amber-400',
  cyan: 'bg-cyan-500/20 text-cyan-400',
  orange: 'bg-orange-500/20 text-orange-400',
}

export function Badge({ children, color = 'blue', icon: Icon, variant = 'gradient' }: BadgeProps) {
  const classes = variant === 'gradient' ? gradientClasses[color] : subtleClasses[color]
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${classes}`}>
      {Icon && <Icon className={`w-4 h-4 ${variant === 'gradient' ? 'text-white' : ''}`} />}
      <span className={`text-sm font-bold ${variant === 'gradient' ? 'text-white' : ''}`}>
        {children}
      </span>
    </div>
  )
}

