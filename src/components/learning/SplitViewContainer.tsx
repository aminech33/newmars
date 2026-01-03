import { ReactNode } from 'react'
import { useSplitView } from '../../hooks/useSplitView'

interface SplitViewContainerProps {
  leftPanel: ReactNode
  rightPanel: ReactNode
  initialWidth?: number
}

export function SplitViewContainer({ leftPanel, rightPanel, initialWidth = 60 }: SplitViewContainerProps) {
  const { editorWidth, isResizing, splitContainerRef, handleMouseDown } = useSplitView(initialWidth)

  return (
    <div ref={splitContainerRef} className="flex-1 flex overflow-hidden relative">
      {/* Panel gauche (éditeur/terminal) */}
      <div 
        className="overflow-auto border-r border-zinc-800"
        style={{ width: `${editorWidth}%` }}
      >
        {leftPanel}
      </div>

      {/* Séparateur resizable */}
      <div
        className={`w-1 hover:w-2 bg-zinc-800 hover:bg-amber-500/50 cursor-col-resize transition-all ${
          isResizing ? 'w-2 bg-amber-500' : ''
        }`}
        onMouseDown={handleMouseDown}
      />

      {/* Panel droit (chat) */}
      <div 
        className="flex-1 overflow-hidden flex flex-col"
        style={{ width: `${100 - editorWidth}%` }}
      >
        {rightPanel}
      </div>
    </div>
  )
}


