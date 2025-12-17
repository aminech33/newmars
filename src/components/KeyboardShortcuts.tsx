import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { isModKey } from '../hooks/useKeyboard'
import { ShortcutsHelpModal } from './ShortcutsHelpModal'

export function KeyboardShortcuts() {
  const { setView, setCommandPaletteOpen, undo, redo, canUndo, canRedo, currentView, isCommandPaletteOpen } = useStore()
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Vérifier si un modal est ouvert (ne pas naviguer si modal actif)
      const hasOpenModal = document.querySelector('[role="dialog"], [data-modal="true"]') !== null
      const isInputFocused = document.activeElement?.tagName === 'INPUT' || 
                             document.activeElement?.tagName === 'TEXTAREA' ||
                             document.activeElement?.getAttribute('contenteditable') === 'true'

      // Search Widget: ⌘K or Ctrl+K
      if (isModKey(e) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
        return
      }

      // Shortcuts Help: ? or Cmd+/
      if ((e.key === '?' && !isInputFocused) || (isModKey(e) && e.key === '/')) {
        e.preventDefault()
        setShowShortcutsHelp(true)
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
          case 'j':
            e.preventDefault()
            setView('myday')
            break
          case 'l':
            e.preventDefault()
            setView('library')
            break
          case 'p':
            e.preventDefault()
            setView('pomodoro')
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


      // Escape - Intelligent behavior
      if (e.key === 'Escape') {
        // Fermer le modal shortcuts help si ouvert
        if (showShortcutsHelp) {
          setShowShortcutsHelp(false)
          return
        }
        
        // Fermer la palette de commandes si ouverte
        if (isCommandPaletteOpen) {
          setCommandPaletteOpen(false)
          return
        }
        
        // Si un modal est ouvert, laisser le modal gérer Escape
        if (hasOpenModal) {
          return
        }
        
        // Sinon, retourner au Hub seulement si pas déjà sur Hub
        if (currentView !== 'hub') {
          setView('hub')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setView, setCommandPaletteOpen, undo, redo, canUndo, canRedo, currentView, isCommandPaletteOpen, showShortcutsHelp])

  return (
    <ShortcutsHelpModal 
      isOpen={showShortcutsHelp} 
      onClose={() => setShowShortcutsHelp(false)} 
    />
  )
}
