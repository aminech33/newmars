interface ProgressBarProps {
  value: number
  color?: 'emerald' | 'blue' | 'violet' | 'rose' | 'amber' | 'cyan'
  showLabel?: boolean
  label?: string
  height?: 'sm' | 'md' | 'lg'
}

const gradientClasses = {
  emerald: 'from-emerald-500 to-emerald-600',
  blue: 'from-blue-500 to-blue-600',
  violet: 'from-violet-500 to-purple-500',
  rose: 'from-rose-500 to-pink-500',
  amber: 'from-amber-500 to-orange-500',
  cyan: 'from-cyan-500 to-blue-500',
}

const heightClasses = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2',
}

export function ProgressBar({ 
  value, 
  color = 'blue', 
  showLabel = false,
  label,
  height = 'md'
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, value))
  
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-xs text-zinc-400">{label}</span>}
          <span className="text-xs font-bold text-white tabular-nums">{percentage}%</span>
        </div>
      )}
      <div className={`w-full ${heightClasses[height]} bg-white/10 rounded-full overflow-hidden`}>
        <div 
          className={`h-full bg-gradient-to-r ${gradientClasses[color]} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

