import { useState, useEffect } from 'react'

/**
 * Hook pour simuler un état de chargement initial
 * Utile pour montrer les skeletons au premier rendu
 */
export function useLoadingState(delay = 300) {
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, delay)
    
    return () => clearTimeout(timer)
  }, [delay])
  
  return isLoading
}

/**
 * Hook pour gérer un état de chargement avec données
 */
export function useAsyncData<T>(
  fetchFn: () => Promise<T>,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    let cancelled = false
    
    setIsLoading(true)
    setError(null)
    
    fetchFn()
      .then(result => {
        if (!cancelled) {
          setData(result)
          setIsLoading(false)
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err)
          setIsLoading(false)
        }
      })
    
    return () => {
      cancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  
  return { data, isLoading, error }
}

