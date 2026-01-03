import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Hook personnalisé pour gérer le cycle de vie des modals du module Santé
 * 
 * Gère automatiquement :
 * - Auto-focus sur le premier input
 * - Reset du formulaire à l'ouverture
 * - Gestion des erreurs
 * - Soumission avec validation
 * 
 * @param isOpen - État d'ouverture du modal
 * @param onSubmit - Fonction de soumission (retourne { success, error? })
 * @param onClose - Fonction de fermeture
 * @param resetCallback - Callback optionnel pour reset custom des states
 * @returns { error, setError, inputRef, handleSubmit }
 */
export function useHealthModal<T>(
  isOpen: boolean,
  onSubmit: (data: T) => { success: boolean; error?: string },
  onClose: () => void,
  resetCallback?: () => void
) {
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus sur le premier input à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Reset du formulaire à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setError('')
      resetCallback?.()
    }
  }, [isOpen, resetCallback])

  // Handler de soumission avec gestion d'erreur
  const handleSubmit = useCallback((data: T, e?: React.FormEvent) => {
    e?.preventDefault()
    setError('')
    
    const result = onSubmit(data)
    
    if (result.success) {
      onClose()
    } else {
      setError(result.error || 'Une erreur est survenue')
    }
  }, [onSubmit, onClose])

  return { error, setError, inputRef, handleSubmit }
}


