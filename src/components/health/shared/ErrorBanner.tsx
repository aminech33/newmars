interface ErrorBannerProps {
  error: string
}

/**
 * Banner d'erreur pour les modals du module Santé
 * 
 * Affiche un message d'erreur stylisé
 * Ne s'affiche que si une erreur est présente
 */
export function ErrorBanner({ error }: ErrorBannerProps) {
  if (!error) return null
  
  return (
    <div 
      className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-sm text-rose-400" 
      role="alert"
    >
      {error}
    </div>
  )
}

