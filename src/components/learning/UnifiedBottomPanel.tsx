import { useState } from 'react'
import { ChevronDown, ChevronUp, AlertCircle, Check } from 'lucide-react'
import type { editor } from 'monaco-editor'
import { useOutputPanelResize } from '../../hooks/useCodeEditor'
import { TerminalEmulator } from './TerminalEmulator'
import type { CodeProblem } from './CodeOutputPanel'

export type { CodeProblem }

type TabType = 'problems' | 'output' | 'debug' | 'terminal'

interface UnifiedBottomPanelProps {
  // Terminal
  terminalSessionId: string
  
  // Output (résultat IA)
  output: string
  
  // Problems (erreurs/warnings)
  problems: CodeProblem[]
  editorRef: React.RefObject<editor.IStandaloneCodeEditor | null>
  
  // Debug (pour plus tard)
  debugOutput?: string
  
  // State
  isVisible: boolean
  onToggle: () => void
  
  // Tabs à afficher selon mode
  availableTabs?: TabType[]
  
  // Terminal callbacks
  onTerminalCommand?: (command: string) => void
  onTerminalOutput?: (output: string) => void
  
  // Execution status
  executionStatus?: string
  exitCode?: number
}

export function UnifiedBottomPanel({ 
  terminalSessionId,
  output, 
  problems, 
  editorRef,
  debugOutput = '',
  isVisible, 
  onToggle,
  availableTabs = ['problems', 'output', 'debug', 'terminal'],
  onTerminalCommand,
  onTerminalOutput,
  executionStatus = '',
  exitCode
}: UnifiedBottomPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>(availableTabs[0] || 'problems')
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
        aria-label="Afficher le panneau"
      >
        <ChevronUp className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" aria-hidden="true" />
        <span>Afficher le panneau</span>
        {problems.length > 0 && (
          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-md text-[10px] font-medium border border-red-500/30">
            {problems.length} problème{problems.length > 1 ? 's' : ''}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="bg-black flex flex-col flex-shrink-0 shadow-lg" style={{ height: `${height}%`, minHeight: '200px', maxHeight: '60%' }}>
      {/* Resize Handle - Minimaliste */}
      <div
        onMouseDown={handleMouseDown}
        className={`h-1 bg-black hover:bg-[#007acc] cursor-ns-resize transition-colors ${
          isDragging ? 'bg-[#007acc]' : ''
        }`}
        role="separator"
        aria-label="Redimensionner le panneau"
        aria-orientation="horizontal"
      />

      {/* Panel Header - Style VS Code ultra-compact */}
      <div className="flex items-center justify-between px-2 bg-black">
        <div className="flex items-center">
          {/* Tab Problems */}
          {availableTabs.includes('problems') && (
            <button 
              onClick={() => setActiveTab('problems')}
              className={`px-3 py-1 text-[13px] font-semibold transition-colors ${
                activeTab === 'problems' 
                  ? 'text-white bg-[#1e1e1e]' 
                  : 'text-[#858585] hover:text-white hover:bg-[#2a2a2a]'
              }`}
              role="tab"
              aria-selected={activeTab === 'problems'}
            >
              Problems
              {problems.length > 0 && (
                <span className="ml-1.5 text-[#858585] font-normal">
                  {problems.length}
                </span>
              )}
            </button>
          )}
          
          {/* Tab Output */}
          {availableTabs.includes('output') && (
            <button 
              onClick={() => setActiveTab('output')}
              className={`px-3 py-1 text-[13px] font-semibold transition-colors relative ${
                activeTab === 'output' 
                  ? 'text-white bg-[#1e1e1e]' 
                  : 'text-[#858585] hover:text-white hover:bg-[#2a2a2a]'
              }`}
              role="tab"
              aria-selected={activeTab === 'output'}
            >
              Output
              {/* Status indicator */}
              {executionStatus && activeTab === 'output' && (
                <span className="ml-2 text-[10px] text-zinc-500">
                  {executionStatus}
                </span>
              )}
              {/* Exit code indicator */}
              {exitCode !== undefined && activeTab === 'output' && (
                <span className={`ml-2 w-2 h-2 rounded-full ${
                  exitCode === 0 ? 'bg-emerald-400' : 'bg-red-400'
                }`} title={`Exit code: ${exitCode}`} />
              )}
            </button>
          )}

          {/* Tab Debug Console */}
          {availableTabs.includes('debug') && (
            <button 
              onClick={() => setActiveTab('debug')}
              className={`px-3 py-1 text-[13px] font-semibold transition-colors ${
                activeTab === 'debug' 
                  ? 'text-white bg-[#1e1e1e]' 
                  : 'text-[#858585] hover:text-white hover:bg-[#2a2a2a]'
              }`}
              role="tab"
              aria-selected={activeTab === 'debug'}
            >
              Debug Console
            </button>
          )}

          {/* Tab Terminal */}
          {availableTabs.includes('terminal') && (
            <button 
              onClick={() => setActiveTab('terminal')}
              className={`px-3 py-1 text-[13px] font-semibold transition-colors ${
                activeTab === 'terminal' 
                  ? 'text-white bg-[#1e1e1e]' 
                  : 'text-[#858585] hover:text-white hover:bg-[#2a2a2a]'
              }`}
              role="tab"
              aria-selected={activeTab === 'terminal'}
            >
              Terminal
            </button>
          )}
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
      <div className="flex-1 overflow-hidden bg-black">
        {activeTab === 'problems' && (
          <div className="h-full overflow-auto p-3 font-mono text-xs text-[#cccccc] whitespace-pre-wrap">
            {problems.length === 0 ? (
              <span className="text-[#858585]">No problems have been detected in the workspace.</span>
            ) : (
              <ul className="space-y-px">
                {problems.map((problem, index) => (
                  <li 
                    key={index}
                    className="flex items-start gap-3 px-3 py-2 hover:bg-[#1e1e1e] cursor-pointer transition-colors"
                    onClick={() => handleProblemClick(problem.line)}
                  >
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[#cccccc] text-xs">{problem.message}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'output' && (
          <div className="h-full overflow-auto p-3 font-mono text-xs">
            {output ? (
              <div>
                {/* Output text */}
                <pre className="text-[#cccccc] whitespace-pre-wrap">{output}</pre>
                
                {/* Error detected + AI suggestion */}
                {exitCode !== undefined && exitCode !== 0 && output.length > 0 && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-red-300 text-xs font-medium mb-1">Erreur détectée</p>
                        <p className="text-zinc-400 text-xs">
                          Demande à l'IA de t'aider à résoudre ce problème dans le chat ! 💡
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Success message */}
                {exitCode === 0 && (
                  <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <p className="text-emerald-300 text-xs font-medium">
                        ✓ Exécution réussie
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <span className="text-[#858585]">No output.</span>
            )}
          </div>
        )}

        {activeTab === 'debug' && (
          <div className="h-full overflow-auto p-3 font-mono text-xs text-[#cccccc] whitespace-pre-wrap">
            {debugOutput || (
              <span className="text-[#858585]">Debug console is empty.</span>
            )}
          </div>
        )}

        {activeTab === 'terminal' && (
          <div className="h-full">
            <TerminalEmulator 
              sessionId={terminalSessionId}
              onCommand={onTerminalCommand}
              onOutputCapture={onTerminalOutput}
            />
          </div>
        )}
      </div>
    </div>
  )
}

