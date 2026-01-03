import { useState } from 'react'
import { ChevronDown, ChevronUp, Terminal, AlertCircle, GripHorizontal, Code, Check } from 'lucide-react'
import type { editor } from 'monaco-editor'
import { useOutputPanelResize } from '../../hooks/useCodeEditor'

export interface CodeProblem {
  line: number
  message: string
}

interface CodeOutputPanelProps {
  output: string
  problems: CodeProblem[]
  editorRef: React.RefObject<editor.IStandaloneCodeEditor | null>
  isVisible: boolean
  onToggle: () => void
}

export function CodeOutputPanel({ 
  output, 
  problems, 
  editorRef,
  isVisible, 
  onToggle 
}: CodeOutputPanelProps) {
  const [activeTab, setActiveTab] = useState<'output' | 'problems'>('output')
  const { height, isDragging, handleMouseDown } = useOutputPanelResize(35)

  const handleProblemClick = (line: number) => {
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(line)
      editorRef.current.setPosition({ lineNumber: line, column: 1 })
      editorRef.current.focus()
    }
  }

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-4 py-2 bg-[#161b22] hover:bg-[#21262d] border-t border-[#21262d] text-xs text-[#8b949e] hover:text-[#c9d1d9] transition-all group"
        aria-label="Afficher le panneau de sortie"
      >
        <ChevronUp className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" aria-hidden="true" />
        <span>Afficher le panneau de sortie</span>
        {problems.length > 0 && (
          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-md text-[10px] font-medium border border-amber-500/30">
            {problems.length} problème{problems.length > 1 ? 's' : ''}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="border-t border-[#21262d] bg-[#0d1117] flex flex-col flex-shrink-0" style={{ height: `${height}%`, minHeight: '150px', maxHeight: '60%' }}>
      {/* Resize Handle - Visible */}
      <div
        onMouseDown={handleMouseDown}
        className={`group flex items-center justify-center h-2 bg-[#161b22] hover:bg-[#238636]/20 cursor-ns-resize transition-all border-b border-[#21262d] ${
          isDragging ? 'bg-[#238636]/30' : ''
        }`}
        role="separator"
        aria-label="Redimensionner le panneau"
        aria-orientation="horizontal"
      >
        <GripHorizontal className={`w-4 h-4 text-[#8b949e] group-hover:text-[#3fb950] transition-all ${
          isDragging ? 'text-[#3fb950] scale-110' : 'opacity-50 group-hover:opacity-100'
        }`} aria-hidden="true" />
      </div>

      {/* Panel Header - Onglets */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-[#161b22] border-b border-[#21262d]">
        <div className="flex items-center gap-1">
          {/* Onglet Output */}
          <button 
            onClick={() => setActiveTab('output')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'output' 
                ? 'bg-[#238636]/20 text-[#3fb950] shadow-sm' 
                : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]'
            }`}
            role="tab"
            aria-selected={activeTab === 'output'}
            aria-label="Onglet sortie"
          >
            <Terminal className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Output</span>
          </button>
          
          {/* Onglet Problèmes */}
          <button 
            onClick={() => setActiveTab('problems')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'problems' 
                ? 'bg-[#d29922]/20 text-amber-400 shadow-sm' 
                : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]'
            }`}
            role="tab"
            aria-selected={activeTab === 'problems'}
            aria-label={`Onglet problèmes${problems.length > 0 ? ` (${problems.length})` : ''}`}
          >
            <AlertCircle className={`w-3.5 h-3.5 ${problems.length > 0 ? 'text-amber-400 animate-pulse' : ''}`} aria-hidden="true" />
            <span>Problèmes</span>
            {problems.length > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-500/30 text-amber-400 rounded-md text-[10px] font-bold border border-amber-500/50" aria-label={`${problems.length} problèmes`}>
                {problems.length}
              </span>
            )}
          </button>
        </div>
        
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-[#21262d] text-[#8b949e] hover:text-[#c9d1d9] transition-all hover:scale-110 active:scale-95"
          aria-label="Masquer le panneau"
          title="Masquer (Échap)"
        >
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      
      {/* Contenu selon l'onglet actif */}
      <div className="flex-1 overflow-auto bg-[#0d1117]">
        {activeTab === 'output' ? (
          /* Output - Résultat d'exécution */
          <div className="p-4 font-mono text-xs text-[#c9d1d9] whitespace-pre-wrap">
            {output || (
              <div className="flex items-center gap-2 text-[#8b949e] italic">
                <Terminal className="w-4 h-4" />
                <span>Aucune sortie à afficher.</span>
              </div>
            )}
          </div>
        ) : (
          /* Problèmes - Erreurs pédagogiques */
          <div className="p-2">
            {problems.length === 0 ? (
              <div className="flex items-center gap-2 text-[#8b949e] text-xs italic p-3">
                <Check className="w-4 h-4 text-[#3fb950]" />
                <span>Aucun problème détecté.</span>
              </div>
            ) : (
              <ul className="space-y-1">
                {problems.map((problem, index) => (
                  <li 
                    key={index}
                    className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-[#161b22] cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md border border-transparent hover:border-[#21262d]"
                    onClick={() => handleProblemClick(problem.line)}
                  >
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[#c9d1d9] text-xs leading-relaxed">{problem.message}</p>
                      <p className="text-[#8b949e] text-[10px] mt-1 flex items-center gap-1">
                        <Code className="w-3 h-3" />
                        Ligne {problem.line}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

