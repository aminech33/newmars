import { memo, useState } from 'react'
import { CodeEditor, type CodeProblem } from './CodeEditor'
import { TerminalEmulator } from './TerminalEmulator'
import { UnifiedBottomPanel } from './UnifiedBottomPanel'
import { Code, Terminal } from 'lucide-react'
import { CodeEnvironment } from '../../types/learning'
import type { editor } from 'monaco-editor'
import { useRef } from 'react'

interface EditorPanelProps {
  code: string
  language: string
  onCodeChange: (code: string) => void
  mode: CodeEnvironment
  terminalSessionId: string
  output?: string
  problems?: CodeProblem[]
  isTyping?: boolean
  onTerminalCommand?: (command: string) => void
  onTerminalOutput?: (output: string) => void
  onRunCode?: () => void
  isExecuting?: boolean
  execResult?: { stdout: string; stderr: string; exit_code: number; error?: string } | null
  execStatus?: string
}

export const EditorPanel = memo(function EditorPanel({
  code,
  language,
  onCodeChange,
  mode,
  terminalSessionId,
  output = '',
  problems = [],
  isTyping = false,
  onTerminalCommand,
  onTerminalOutput,
  onRunCode,
  isExecuting = false,
  execResult,
  execStatus = ''
}: EditorPanelProps) {
  const [activeTab, setActiveTab] = useState<'editor' | 'terminal'>('editor')
  const [showPanel, setShowPanel] = useState(true)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  // Mode both: afficher les deux côte à côte
  if (mode === 'both') {
    return (
      <div className="h-full flex bg-zinc-900">
        <div className="flex-1 flex flex-col border-r border-zinc-800">
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              value={code}
              language={language}
              onChange={onCodeChange}
              showHeader={true}
              onRun={onRunCode}
              isExecuting={isExecuting}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-shrink-0 px-3 py-2 bg-zinc-900/50 border-b border-zinc-800">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-medium text-zinc-300">Terminal</span>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <TerminalEmulator 
              sessionId={terminalSessionId}
              onCommand={onTerminalCommand}
              onOutputCapture={onTerminalOutput}
            />
          </div>
        </div>
      </div>
    )
  }

  // Mode editor: éditeur avec panel unifié en bas (4 tabs)
  if (mode === 'editor') {
    // Utiliser le résultat d'exécution pour l'output
    const displayOutput = execResult 
      ? (execResult.stdout || execResult.stderr || execResult.error || '')
      : output

    return (
      <div className="h-full flex flex-col bg-zinc-900">
        <div className="flex-1 overflow-hidden">
          <CodeEditor
            value={code}
            language={language}
            onChange={onCodeChange}
            showHeader={true}
            isTyping={isTyping}
            problems={problems}
            onRun={onRunCode}
            isExecuting={isExecuting}
          />
        </div>
        
        <UnifiedBottomPanel
          terminalSessionId={terminalSessionId}
          output={displayOutput}
          problems={problems}
          editorRef={editorRef}
          isVisible={showPanel}
          onToggle={() => setShowPanel(!showPanel)}
          availableTabs={['problems', 'output', 'debug', 'terminal']}
          onTerminalCommand={onTerminalCommand}
          onTerminalOutput={onTerminalOutput}
          executionStatus={execStatus}
          exitCode={execResult?.exit_code}
        />
      </div>
    )
  }

  // Mode terminal: terminal uniquement
  if (mode === 'terminal') {
    return (
      <div className="h-full flex flex-col bg-zinc-900">
        <div className="flex-shrink-0 px-3 py-2 bg-zinc-900/50 border-b border-zinc-800">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-medium text-zinc-300">Terminal</span>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <TerminalEmulator 
            sessionId={terminalSessionId}
            onCommand={onTerminalCommand}
            onOutputCapture={onTerminalOutput}
          />
        </div>
      </div>
    )
  }

  // Fallback: mode legacy avec tabs (pour compatibilité)
  return (
    <div className="h-full flex flex-col bg-zinc-900">
      {/* Tabs */}
      <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1 bg-zinc-900/50 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            activeTab === 'editor'
              ? 'bg-zinc-800 text-amber-400'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          Éditeur
        </button>
        <button
          onClick={() => setActiveTab('terminal')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            activeTab === 'terminal'
              ? 'bg-zinc-800 text-amber-400'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          Terminal
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'editor' ? (
          <CodeEditor
            value={code}
            language={language}
            onChange={onCodeChange}
            showHeader={true}
          />
        ) : (
          <TerminalEmulator sessionId={terminalSessionId} />
        )}
      </div>
    </div>
  )
})

