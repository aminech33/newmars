import { useState, useCallback } from 'react'

interface UndoAction {
  type: 'delete' | 'complete' | 'update'
  data: any
  undo: () => void
  label: string
}

export function useUndo() {
  const [_history, setHistory] = useState<UndoAction[]>([])
  const [showToast, setShowToast] = useState(false)
  const [currentAction, setCurrentAction] = useState<UndoAction | null>(null)

  const addAction = useCallback((action: UndoAction) => {
    setHistory(prev => [...prev.slice(-9), action]) // Keep last 10 actions
    setCurrentAction(action)
    setShowToast(true)
    
    // Auto-hide toast after 5 seconds
    setTimeout(() => {
      setShowToast(false)
      setCurrentAction(null)
    }, 5000)
  }, [])

  const undo = useCallback(() => {
    if (currentAction) {
      currentAction.undo()
      setShowToast(false)
      setCurrentAction(null)
    }
  }, [currentAction])

  return {
    addAction,
    undo,
    showToast,
    currentAction,
    canUndo: !!currentAction
  }
}

