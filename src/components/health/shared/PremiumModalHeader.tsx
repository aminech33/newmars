import React from 'react'

interface PremiumModalHeaderProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  colorFrom?: 'emerald' | 'rose' | 'indigo' | 'purple' | 'amber'
  colorTo?: 'teal' | 'pink' | 'purple' | 'indigo' | 'orange'
}

/**
 * Header premium pour les modals du module Santé
 * 
 * Affiche un icon avec gradient + titre
 * Design cohérent avec la philosophie premium de l'app
 */
export function PremiumModalHeader({ 
  icon: Icon, 
  title, 
  colorFrom = 'indigo', 
  colorTo = 'purple' 
}: PremiumModalHeaderProps) {
  // Mapping des couleurs pour Tailwind (éviter la purge)
  const gradientClasses = {
    'emerald-teal': 'from-emerald-500/20 to-teal-500/20 border-emerald-500/20 text-emerald-400',
    'rose-pink': 'from-rose-500/20 to-pink-500/20 border-rose-500/20 text-rose-400',
    'indigo-purple': 'from-indigo-500/20 to-purple-500/20 border-indigo-500/20 text-indigo-400',
    'purple-indigo': 'from-purple-500/20 to-indigo-500/20 border-purple-500/20 text-purple-400',
    'amber-orange': 'from-amber-500/20 to-orange-500/20 border-amber-500/20 text-amber-400',
  }

  const key = `${colorFrom}-${colorTo}` as keyof typeof gradientClasses
  const classes = gradientClasses[key] || gradientClasses['indigo-purple']

  return (
    <div className="flex items-center gap-3 mb-6 -mt-2">
      <div className={`p-2.5 bg-gradient-to-br ${classes} rounded-xl border`}>
        <Icon className={`w-5 h-5 ${classes.split(' ').pop()}`} />
      </div>
      <h2 className="text-lg font-semibold text-zinc-100">
        {title}
      </h2>
    </div>
  )
}


