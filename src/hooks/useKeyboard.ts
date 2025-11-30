import { useEffect } from 'react'

export function useKeyboard(callback: (e: KeyboardEvent) => void, deps: any[] = []) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => callback(e)
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, deps)
}

export function isModKey(e: KeyboardEvent) {
  return e.metaKey || e.ctrlKey
}

