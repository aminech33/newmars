import { useState, useEffect, useCallback, useRef } from 'react'

export function useSplitView(initialWidth: number = 60) {
  const [editorWidth, setEditorWidth] = useState(initialWidth)
  const [isResizing, setIsResizing] = useState(false)
  const splitContainerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!splitContainerRef.current) return
      requestAnimationFrame(() => {
        const container = splitContainerRef.current
        if (!container) return
        const rect = container.getBoundingClientRect()
        const newWidth = ((e.clientX - rect.left) / rect.width) * 100
        // Limiter : éditeur entre 30% et 70%, chat entre 30% et 70%
        setEditorWidth(Math.min(70, Math.max(30, newWidth)))
      })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  return {
    editorWidth,
    isResizing,
    splitContainerRef,
    handleMouseDown
  }
}


