/**
 * Utilities pour les styles premium du module Santé
 * Centralise les classes Tailwind pour cohérence et maintenabilité
 */

type ColorPair = 'emerald-teal' | 'rose-pink' | 'indigo-purple' | 'purple-indigo' | 'amber-orange'

/**
 * Retourne les classes Tailwind pour une card premium
 * @param isSelected - État de sélection
 * @param colorPair - Paire de couleurs pour le gradient
 * @returns Classes Tailwind
 */
export function getPremiumCardStyles(
  isSelected: boolean, 
  colorPair: ColorPair = 'indigo-purple'
): string {
  const selectedGradients = {
    'emerald-teal': 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/60 shadow-lg shadow-emerald-500/10',
    'rose-pink': 'bg-gradient-to-br from-rose-500/20 to-pink-500/20 border-rose-500/60 shadow-lg shadow-rose-500/10',
    'indigo-purple': 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/60 shadow-lg shadow-indigo-500/10',
    'purple-indigo': 'bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border-purple-500/60 shadow-lg shadow-purple-500/10',
    'amber-orange': 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/60 shadow-lg shadow-amber-500/10',
  }

  return isSelected
    ? selectedGradients[colorPair]
    : 'bg-zinc-800/30 border-zinc-700/50 hover:border-zinc-600 hover:bg-zinc-800/50'
}

/**
 * Retourne les classes Tailwind pour un bouton premium
 * @param variant - Variante du bouton ('primary' | 'secondary')
 * @returns Classes Tailwind
 */
export function getPremiumButtonStyles(variant: 'primary' | 'secondary' = 'primary'): string {
  if (variant === 'primary') {
    return 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40'
  }
  return 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/50'
}

/**
 * Retourne les classes Tailwind pour un header de modal premium
 * @param colorPair - Paire de couleurs pour le gradient
 * @returns Classes Tailwind pour l'icon et le container
 */
export function getPremiumHeaderStyles(colorPair: ColorPair = 'indigo-purple') {
  const gradients = {
    'emerald-teal': {
      container: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/20',
      icon: 'text-emerald-400'
    },
    'rose-pink': {
      container: 'from-rose-500/20 to-pink-500/20 border-rose-500/20',
      icon: 'text-rose-400'
    },
    'indigo-purple': {
      container: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/20',
      icon: 'text-indigo-400'
    },
    'purple-indigo': {
      container: 'from-purple-500/20 to-indigo-500/20 border-purple-500/20',
      icon: 'text-purple-400'
    },
    'amber-orange': {
      container: 'from-amber-500/20 to-orange-500/20 border-amber-500/20',
      icon: 'text-amber-400'
    }
  }

  return gradients[colorPair]
}

/**
 * Retourne les classes Tailwind pour un badge de macro
 * @param type - Type de macro ('protein' | 'carbs' | 'fat')
 * @returns Classes Tailwind
 */
export function getMacroStyles(type: 'protein' | 'carbs' | 'fat') {
  const styles = {
    protein: {
      gradient: 'from-rose-500/10 to-pink-500/10',
      border: 'border-rose-500/20',
      text: 'text-rose-400'
    },
    carbs: {
      gradient: 'from-amber-500/10 to-orange-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400'
    },
    fat: {
      gradient: 'from-yellow-500/10 to-amber-500/10',
      border: 'border-yellow-500/20',
      text: 'text-yellow-400'
    }
  }

  return styles[type]
}

