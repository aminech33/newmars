/**
 * 🧩 SmartWidget — Composant de base pour widgets intelligents
 * 
 * Design principles :
 * - 1 widget = 1 information
 * - Texte > chiffres
 * - États plutôt que scores
 * - Pas de conseils, pas de notifications
 * - Utile même sans action
 */

import { memo, ReactNode } from 'react'

interface SmartWidgetProps {
  /** Titre discret (optionnel) */
  title?: string
  /** Information principale (texte court) */
  main: string | ReactNode
  /** Contexte léger (optionnel) */
  context?: string
  /** Couleur d'accent (optionnel, 1 seule) */
  accent?: 'emerald' | 'amber' | 'violet' | 'zinc'
  /** Action au tap (optionnel) */
  onTap?: () => void
  /** Action au long press (optionnel) - masquer */
  onLongPress?: () => void
}

export const SmartWidget = memo(function SmartWidget({
  title,
  main,
  context,
  accent = 'zinc',
  onTap,
  onLongPress,
}: SmartWidgetProps) {
  
  const accentColors = {
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    violet: 'text-violet-400',
    zinc: 'text-zinc-400',
  }

  return (
    <div
      onClick={onTap}
      onContextMenu={(e) => {
        if (onLongPress) {
          e.preventDefault()
          onLongPress()
        }
      }}
      className={`
        p-4 
        bg-zinc-900/40 
        border border-zinc-800/50 
        rounded-xl
        ${onTap ? 'cursor-pointer hover:bg-zinc-800/40 transition-colors' : ''}
      `}
    >
      {/* Titre discret */}
      {title && (
        <p className="text-xs text-zinc-600 mb-2">{title}</p>
      )}
      
      {/* Information principale */}
      <p className={`text-sm ${accentColors[accent]} leading-relaxed`}>
        {main}
      </p>
      
      {/* Contexte léger */}
      {context && (
        <p className="text-xs text-zinc-600 mt-2">{context}</p>
      )}
    </div>
  )
})











