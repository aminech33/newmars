import { useState, useCallback, useRef, useEffect } from 'react'
import type { editor } from 'monaco-editor'

/**
 * Hook personnalisé pour gérer l'état et la logique de l'éditeur de code
 * Sépare la logique métier du composant UI
 */

interface UseCodeEditorOptions {
  initialCode?: string
  language?: string
  onRun?: (code: string) => void
  value?: string
  onChange?: (code: string) => void
}

interface UseCodeEditorReturn {
  // État
  code: string
  copied: boolean
  showOutput: boolean
  editorRef: React.RefObject<editor.IStandaloneCodeEditor | null>
  
  // Actions
  setCode: (code: string) => void
  handleCopy: () => void
  handleRun: () => void
  handleEditorDidMount: (editor: editor.IStandaloneCodeEditor) => void
  toggleOutput: () => void
  
  // Keyboard shortcuts
  handleKeyDown: (e: KeyboardEvent) => void
}

export function useCodeEditor({
  initialCode = '# Écris ton code ici\n',
  language = 'python',
  onRun,
  value,
  onChange
}: UseCodeEditorOptions = {}): UseCodeEditorReturn {
  const [internalCode, setInternalCode] = useState(initialCode)
  const [copied, setCopied] = useState(false)
  const [showOutput, setShowOutput] = useState(false)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  
  // Controlled vs uncontrolled
  const code = value !== undefined ? value : internalCode
  const setCode = useCallback((newCode: string) => {
    if (onChange) {
      onChange(newCode)
    } else {
      setInternalCode(newCode)
    }
  }, [onChange])

  // Copy to clipboard
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  // Run code
  const handleRun = useCallback(() => {
    if (onRun) {
      onRun(code)
      setShowOutput(true)
    }
  }, [code, onRun])

  // Toggle output panel
  const toggleOutput = useCallback(() => {
    setShowOutput(prev => !prev)
  }, [])

  // Editor mount callback
  const handleEditorDidMount = useCallback((editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor
    
    // Focus editor
    editor.focus()
    
    // Add custom keyboard shortcuts
    editor.addCommand(
      // Ctrl/Cmd + Enter to run
      (window.navigator.platform.match('Mac') ? 2048 : 2048) | 3, // KeyMod.CtrlCmd | KeyCode.Enter
      () => {
        if (onRun) {
          handleRun()
        }
      }
    )
    
    editor.addCommand(
      // Ctrl/Cmd + S to save (prevent default)
      (window.navigator.platform.match('Mac') ? 2048 : 2048) | 49, // KeyMod.CtrlCmd | KeyCode.KEY_S
      () => {
        // Prevent browser save dialog
        // Could trigger a toast "Code sauvegardé"
      }
    )
  }, [onRun, handleRun])

  // Global keyboard shortcuts (when editor focused)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleRun()
    }
    
    // Ctrl/Cmd + K to copy
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      handleCopy()
    }
    
    // Escape to close output
    if (e.key === 'Escape' && showOutput) {
      e.preventDefault()
      setShowOutput(false)
    }
  }, [handleRun, handleCopy, showOutput])

  return {
    code,
    copied,
    showOutput,
    editorRef,
    setCode,
    handleCopy,
    handleRun,
    handleEditorDidMount,
    toggleOutput,
    handleKeyDown
  }
}

/**
 * Hook pour gérer le resizing du output panel
 */
export function useOutputPanelResize(initialHeight: number = 35) {
  const [height, setHeight] = useState(initialHeight)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartY = useRef<number>(0)
  const dragStartHeight = useRef<number>(initialHeight)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    dragStartY.current = e.clientY
    dragStartHeight.current = height
    e.preventDefault()
  }, [height])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = dragStartY.current - e.clientY
      const containerHeight = window.innerHeight * 0.6 // Max 60% of screen
      const newHeight = Math.max(
        20, // Min 20%
        Math.min(
          60, // Max 60%
          dragStartHeight.current + (deltaY / containerHeight) * 100
        )
      )
      setHeight(newHeight)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  return {
    height,
    isDragging,
    handleMouseDown
  }
}


