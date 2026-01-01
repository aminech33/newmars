import React from 'react'

interface PremiumCardProps {
  isSelected?: boolean
  onClick?: () => void
  children: React.ReactNode
  colorFrom?: 'emerald' | 'rose' | 'indigo' | 'purple' | 'amber'
  colorTo?: 'teal' | 'pink' | 'purple' | 'indigo' | 'orange'
  className?: string
  disabled?: boolean
}

/**
 * Card premium pour les sélections dans les modals Santé
 * 
 * Affiche un état sélectionné avec gradient
 * Design cohérent avec la philosophie premium de l'app
 */
export function PremiumCard({ 
  isSelected = false, 
  onClick, 
  children, 
  colorFrom = 'indigo', 
  colorTo = 'purple',
  className = '',
  disabled = false
}: PremiumCardProps) {
  // Mapping des couleurs pour Tailwind (éviter la purge)
  const selectedGradients = {
    'emerald-teal': 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/60 shadow-lg shadow-emerald-500/10',
    'rose-pink': 'bg-gradient-to-br from-rose-500/20 to-pink-500/20 border-rose-500/60 shadow-lg shadow-rose-500/10',
    'indigo-purple': 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/60 shadow-lg shadow-indigo-500/10',
    'purple-indigo': 'bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border-purple-500/60 shadow-lg shadow-purple-500/10',
    'amber-orange': 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/60 shadow-lg shadow-amber-500/10',
  }

  const key = `${colorFrom}-${colorTo}` as keyof typeof selectedGradients
  const selectedClass = selectedGradients[key] || selectedGradients['indigo-purple']

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group p-4 rounded-xl border-2 transition-all ${
        isSelected
          ? selectedClass
          : 'bg-zinc-800/30 border-zinc-700/50 hover:border-zinc-600 hover:bg-zinc-800/50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  )
}

