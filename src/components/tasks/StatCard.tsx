import { LucideIcon } from 'lucide-react'
import { Sparkline } from '../ui/Sparkline'

interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  iconColor: string
  iconBg: string
  trend?: {
    data: number[]
    color: string
  }
  comparison?: {
    value: number
    label: string
    isPositive: boolean
  }
  onClick?: () => void
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  iconColor, 
  iconBg,
  trend,
  comparison,
  onClick 
}: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className={`p-4 bg-zinc-900/30 backdrop-blur-xl rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.2)] border border-zinc-800/50 transition-all duration-300 text-left w-full ${
        onClick ? 'hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:border-zinc-700/50 hover:scale-[1.02] cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${iconBg} rounded-xl`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-200">{value}</p>
            <p className="text-xs text-zinc-600">{title}</p>
          </div>
        </div>
        
        {/* Sparkline */}
        {trend && (
          <div className="w-20 h-8">
            <Sparkline 
              data={trend.data} 
              color={trend.color}
              height={32}
            />
          </div>
        )}
      </div>
      
      {/* Comparison */}
      {comparison && (
        <div className={`flex items-center gap-1 text-xs mt-2 ${
          comparison.isPositive ? 'text-emerald-400' : 'text-rose-400'
        }`}>
          <span>{comparison.isPositive ? '↗' : '↘'}</span>
          <span className="font-medium">{comparison.value > 0 ? '+' : ''}{comparison.value}</span>
          <span className="text-zinc-600">{comparison.label}</span>
        </div>
      )}
    </button>
  )
}

