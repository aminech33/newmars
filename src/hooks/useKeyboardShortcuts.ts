import { useEffect } from 'react'

interface KeyboardShortcutsConfig {
  onToggleSidebar?: () => void
  onNewCourse?: () => void
  onEscape?: () => void
  isModalOpen?: boolean
  isConfirmOpen?: boolean
  activeCourse?: any
}

/**
 * Hook pour gérer les raccourcis clavier globaux
 */
export function useKeyboardShortcuts({
  onToggleSidebar,
  onNewCourse,
  onEscape,
  isModalOpen,
  isConfirmOpen,
  activeCourse
}: KeyboardShortcutsConfig) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘B / Ctrl+B - Toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b' && onToggleSidebar) {
        e.preventDefault()
        onToggleSidebar()
      }
      
      // Ctrl+N - Nouveau cours
      if (e.ctrlKey && e.key === 'n' && onNewCourse) {
        e.preventDefault()
        onNewCourse()
      }
      
      // Escape - Fermer modals/retour
      if (e.key === 'Escape' && onEscape) {
        if (isModalOpen || isConfirmOpen) {
          onEscape()
        } else if (activeCourse && window.innerWidth < 1024) {
          onEscape()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onToggleSidebar, onNewCourse, onEscape, isModalOpen, isConfirmOpen, activeCourse])
}

