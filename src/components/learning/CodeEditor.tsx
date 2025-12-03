import { useState } from 'react'
import Editor from '@monaco-editor/react'
import { Play, Copy, Lightbulb, Check, Code } from 'lucide-react'

interface CodeEditorProps {
  language?: string
  defaultCode?: string
  onRun?: (code: string) => void
  onAskHelp?: (code: string) => void
  readOnly?: boolean
}

export function CodeEditor({ 
  language = 'python', 
  defaultCode = '# Écris ton code ici\n',
  onRun,
  onAskHelp,
  readOnly = false
}: CodeEditorProps) {
  const [code, setCode] = useState(defaultCode)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl border border-zinc-800 overflow-hidden bg-[#1e1e1e] shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-indigo-400" />
          <span className="text-xs text-zinc-400 font-mono uppercase">{language}</span>
        </div>
        <div className="flex gap-2">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all duration-200"
            title="Copier le code"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>

          {/* Ask Help Button */}
          {onAskHelp && (
            <button
              onClick={() => onAskHelp(code)}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-amber-400 hover:text-amber-300 transition-all duration-200"
              title="Demander de l'aide à l'IA"
            >
              <Lightbulb className="w-4 h-4" />
            </button>
          )}

          {/* Run Button */}
          {onRun && (
            <button
              onClick={() => onRun(code)}
              className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-medium flex items-center gap-1.5 transition-all duration-200 hover:scale-105 shadow-lg shadow-green-500/20"
              title="Exécuter le code"
            >
              <Play className="w-3.5 h-3.5" />
              Exécuter
            </button>
          )}
        </div>
      </div>

      {/* Monaco Editor */}
      <Editor
        height="300px"
        language={language}
        value={code}
        onChange={(value) => !readOnly && setCode(value || '')}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          readOnly,
          cursorStyle: 'line',
          smoothScrolling: true,
          fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
          fontLigatures: true,
          padding: { top: 12, bottom: 12 },
          renderLineHighlight: 'all',
          bracketPairColorization: {
            enabled: true,
          },
        }}
      />
    </div>
  )
}

