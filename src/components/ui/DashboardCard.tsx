import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface DashboardCardProps {
  title: string
  icon?: LucideIcon
  iconColor?: string
  children: ReactNode
  action?: ReactNode
  className?: string
  onClick?: () => void
}

export function DashboardCard({ 
  title, 
  icon: Icon, 
  iconColor = 'text-indigo-400',
  children, 
  action,
  className = '',
  onClick 
}: DashboardCardProps) {
  return (
    <section 
      className={`bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-zinc-800/50 hover:border-zinc-800/50 transition-[border-color,box-shadow] duration-300 motion-reduce:transition-none ${onClick ? 'cursor-pointer hover:shadow-xl' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={`p-2 bg-${iconColor.split('-')[1]}-500/10 rounded-xl`}>
              <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor}`} aria-hidden="true" />
            </div>
          )}
          <h3 className="text-base sm:text-lg font-semibold text-zinc-200">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

