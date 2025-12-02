import { useEffect } from 'react'
import { useStore } from '../store/useStore'
import { isModKey } from '../hooks/useKeyboard'

export function KeyboardShortcuts() {
  const { setView, setCommandPaletteOpen, undo, redo, canUndo, canRedo } = useStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Search Widget: ⌘K or Ctrl+K
      if (isModKey(e) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
        return
      }

      // Navigation shortcuts
      if (isModKey(e)) {
        switch (e.key) {
          case 't':
            e.preventDefault()
            setView('tasks')
            break
          case 'd':
            e.preventDefault()
            setView('dashboard')
            break
          case 'i':
            e.preventDefault()
            setView('ai')
            break
          case 'h':
            e.preventDefault()
            setView('hub')
            break
          case 'z':
            e.preventDefault()
            if (e.shiftKey) {
              if (canRedo) redo()
            } else {
              if (canUndo) undo()
            }
            break
        }
      }

      // Escape to go back to hub
      if (e.key === 'Escape') {
        setView('hub')
        setCommandPaletteOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setView, setCommandPaletteOpen, undo, redo, canUndo, canRedo])

  return null
}
