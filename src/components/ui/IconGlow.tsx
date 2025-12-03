import { LucideIcon } from 'lucide-react'

interface IconGlowProps {
  Icon: LucideIcon
  color?: 'emerald' | 'blue' | 'violet' | 'rose' | 'amber' | 'cyan'
  size?: 12 | 10 | 8
}

const sizeClasses = {
  12: 'w-12 h-12',
  10: 'w-10 h-10',
  8: 'w-8 h-8',
}

const colorClasses = {
  emerald: {
    text: 'text-emerald-400',
    glow: 'bg-emerald-400/30'
  },
  blue: {
    text: 'text-blue-400',
    glow: 'bg-blue-400/30'
  },
  violet: {
    text: 'text-violet-400',
    glow: 'bg-violet-400/30'
  },
  rose: {
    text: 'text-rose-400',
    glow: 'bg-rose-400/30'
  },
  amber: {
    text: 'text-amber-400',
    glow: 'bg-amber-400/30'
  },
  cyan: {
    text: 'text-cyan-400',
    glow: 'bg-cyan-400/30'
  },
}

export function IconGlow({ Icon, color = 'blue', size = 12 }: IconGlowProps) {
  const colors = colorClasses[color]
  const sizeClass = sizeClasses[size]
  
  return (
    <div className="relative">
      <Icon className={`${sizeClass} ${colors.text}`} strokeWidth={1.5} />
      <div className={`absolute inset-0 blur-xl opacity-50 ${colors.glow}`} />
    </div>
  )
}

