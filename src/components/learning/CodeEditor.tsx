import { useState, useRef } from 'react'
import Editor from '@monaco-editor/react'
import { Play, Copy, Check, Code, X, ChevronDown, ChevronUp, Terminal, AlertCircle } from 'lucide-react'
import type { editor } from 'monaco-editor'

interface CodeEditorProps {
  language?: string
  defaultCode?: string
  value?: string
  onChange?: (code: string) => void
  onRun?: (code: string) => void
  readOnly?: boolean
  showHeader?: boolean
  courseName?: string
  isTyping?: boolean
}

export function CodeEditor({ 
  language = 'python', 
  defaultCode = '# Écris ton code ici\n',
  value,
  onChange,
  onRun,
  readOnly = false,
  showHeader = true,
  isTyping = false
}: CodeEditorProps) {
  const [internalCode, setInternalCode] = useState(defaultCode)
  const [copied, setCopied] = useState(false)
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 })
  const [showOutput, setShowOutput] = useState(false)
  const [output, setOutput] = useState<string>('')
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  
  const code = value !== undefined ? value : internalCode
  const setCode = onChange || setInternalCode
  
  const lineCount = code.split('\n').length
  const charCount = code.length
  
  // Extension du fichier selon le langage
  const fileExtension = {
    python: 'py',
    javascript: 'js',
    typescript: 'ts',
    java: 'java',
    cpp: 'cpp',
    csharp: 'cs',
    rust: 'rs',
    go: 'go',
    php: 'php',
    ruby: 'rb'
  }[language] || 'txt'

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor
    
    // Track cursor position
    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition({
        line: e.position.lineNumber,
        column: e.position.column
      })
    })
  }

  return (
    <div className="border border-zinc-800/50 overflow-hidden bg-[#1e1e1e] shadow-xl h-full flex flex-col max-h-full">
      {/* VS Code Style Tabs */}
      <div className="flex items-center bg-[#1e1e1e] border-b border-[#2d2d30]">
        {/* Tab */}
        <div className="group flex items-center gap-2 px-4 py-2 bg-[#1e1e1e] border-r border-[#2d2d30] min-w-[120px] hover:bg-[#2d2d30] transition-[background-color] duration-200">
          <Code className="w-3.5 h-3.5 text-[#858585]" aria-hidden="true" />
          <span className="text-xs text-[#cccccc] font-medium">main.{fileExtension}</span>
          <button className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Fermer">
            <X className="w-3 h-3 text-[#858585] hover:text-[#cccccc]" aria-hidden="true" />
          </button>
        </div>
        
        {/* Empty space */}
        <div className="flex-1 bg-[#252526]" />
        
        {/* Action buttons */}
        {showHeader && (
          <div className="flex items-center gap-1 px-2 bg-[#252526]">
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="p-1.5 rounded hover:bg-[#2d2d30] text-[#858585] hover:text-[#cccccc] transition-[background-color] duration-200"
              title="Copier le code"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-400" aria-hidden="true" />
              ) : (
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              )}
            </button>

            {/* Run Button - Principal */}
            {onRun && (
              <button
                onClick={() => {
                  onRun(code)
                  setShowOutput(true)
                  setOutput('Analyse en cours...')
                }}
                disabled={isTyping}
                className="px-3 py-1.5 rounded bg-green-600 hover:bg-green-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-green-600/50"
                title="Exécuter le code"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Exécuter</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Monaco Editor */}
      <div className={`flex-1 min-h-0 ${showOutput ? 'max-h-[60%]' : ''}`}>
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={(value) => !readOnly && setCode(value || '')}
          onMount={handleEditorDidMount}
          theme="vscode-dark-plus"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            wordWrap: 'on',
            readOnly,
            cursorStyle: 'line',
            smoothScrolling: true,
            fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', 'Monaco', monospace",
            fontLigatures: true,
            padding: { top: 16, bottom: 16 },
            renderLineHighlight: 'all',
            bracketPairColorization: {
              enabled: true,
            },
            glyphMargin: false,
            folding: true,
            foldingHighlight: true,
            showFoldingControls: 'mouseover',
            lineDecorationsWidth: 16,
            lineNumbersMinChars: 3,
            renderWhitespace: 'selection',
            guides: {
              bracketPairs: true,
              indentation: true
            }
          }}
          beforeMount={(monaco) => {
            // Thème VS Code Dark+ exact
            monaco.editor.defineTheme('vscode-dark-plus', {
              base: 'vs-dark',
              inherit: true,
              rules: [
                { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
                { token: 'keyword', foreground: 'C586C0' },
                { token: 'keyword.control', foreground: 'C586C0' },
                { token: 'string', foreground: 'CE9178' },
                { token: 'number', foreground: 'B5CEA8' },
                { token: 'function', foreground: 'DCDCAA' },
                { token: 'variable', foreground: '9CDCFE' },
                { token: 'variable.parameter', foreground: '9CDCFE' },
                { token: 'type', foreground: '4EC9B0' },
                { token: 'class', foreground: '4EC9B0' },
                { token: 'operator', foreground: 'D4D4D4' },
                { token: 'delimiter', foreground: 'D4D4D4' },
              ],
              colors: {
                'editor.background': '#1e1e1e',
                'editor.foreground': '#d4d4d4',
                'editor.lineHighlightBackground': '#2a2a2a',
                'editor.selectionBackground': '#264f78',
                'editor.inactiveSelectionBackground': '#3a3d41',
                'editorCursor.foreground': '#aeafad',
                'editorWhitespace.foreground': '#404040',
                'editorLineNumber.foreground': '#858585',
                'editorLineNumber.activeForeground': '#c6c6c6',
                'editorIndentGuide.background': '#404040',
                'editorIndentGuide.activeBackground': '#707070',
                'editorBracketMatch.background': '#0064001a',
                'editorBracketMatch.border': '#888888',
              }
            })
            monaco.editor.setTheme('vscode-dark-plus')
          }}
        />
      </div>

      {/* Output Panel (VS Code style) */}
      {showOutput && (
        <div className="border-t border-[#2d2d30] bg-[#1e1e1e] flex flex-col flex-shrink-0" style={{ height: '35%', minHeight: '150px', maxHeight: '40%' }}>
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-1 bg-[#252526] border-b border-[#2d2d30]">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-3 py-1 text-xs text-[#cccccc] border-b-2 border-[#007acc] font-medium">
                <Terminal className="w-3.5 h-3.5" />
                <span>OUTPUT</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-1 text-xs text-[#858585] hover:text-[#cccccc] transition-[background-color] duration-200">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>PROBLÈMES</span>
              </button>
            </div>
            <button
              onClick={() => setShowOutput(false)}
              className="p-1 rounded hover:bg-[#2d2d30] text-[#858585] hover:text-[#cccccc] transition-[background-color] duration-200"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          
          {/* Panel Content */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs text-[#cccccc] bg-[#1e1e1e]">
            {output || 'Aucune sortie à afficher.'}
          </div>
        </div>
      )}

      {/* Toggle Output Button (if hidden) */}
      {!showOutput && onRun && (
        <button
          onClick={() => setShowOutput(true)}
          className="flex items-center gap-2 px-4 py-1.5 bg-[#252526] hover:bg-[#2d2d30] border-t border-[#2d2d30] text-xs text-[#858585] hover:text-[#cccccc] transition-[background-color] duration-200"
        >
          <ChevronUp className="w-3.5 h-3.5" />
          <span>Afficher Output</span>
        </button>
      )}

      {/* Status Bar (VS Code style) */}
      <div className="flex items-center justify-between px-3 py-0.5 bg-[#007acc] text-white text-xs flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span>Ln {cursorPosition.line},</span>
            <span>Col {cursorPosition.column}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>{lineCount} lignes</span>
          </div>
          <div className="flex items-center gap-1">
            <span>{charCount} caractères</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="uppercase font-medium">{language}</span>
          <span>UTF-8</span>
          {!readOnly && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              <span>Live</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

