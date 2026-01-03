import { useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { Play, Copy, Check, Code, Loader2, AlertCircle } from 'lucide-react'
import { useCodeEditor } from '../../hooks/useCodeEditor'
import { getFileExtension, getLanguageInfo } from '../../constants/languageConfig'
import { MONACO_EDITOR_OPTIONS, initMonacoTheme } from '../../constants/monacoTheme'

export interface CodeProblem {
  line: number
  message: string
}

interface CodeEditorProps {
  language?: string
  value?: string
  onChange?: (code: string) => void
  onRun?: (code: string) => void
  readOnly?: boolean
  showHeader?: boolean
  isTyping?: boolean
  problems?: CodeProblem[]
  isExecuting?: boolean
}

export function CodeEditor({ 
  language = 'python',
  value,
  onChange,
  onRun,
  readOnly = false,
  showHeader = true,
  isTyping = false,
  problems = [],
  isExecuting = false
}: CodeEditorProps) {
  const languageInfo = getLanguageInfo(language)
  const fileExtension = getFileExtension(language)
  
  // Hook personnalisé pour la logique
  const {
    code,
    copied,
    editorRef,
    setCode,
    handleCopy,
    handleRun,
    handleEditorDidMount,
    handleKeyDown
  } = useCodeEditor({
    initialCode: value || `${languageInfo.commentPrefix || '#'} Écris ton code ici\n`,
    language,
    onRun,
    value,
    onChange
  })
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => handleKeyDown(e)
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKeyDown])

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#21262d]/50 shadow-2xl shadow-black/20">
      {/* Header - Minimaliste & Premium */}
      <div className="flex items-center bg-[#0d1117] border-b border-[#21262d]/30 px-3 py-1.5">
        {/* Tab - Ultra minimaliste */}
        <div className="flex-1 flex items-center">
          <span className="text-[13px] text-[#c9d1d9] font-semibold">
            main.{fileExtension}
          </span>
        </div>

        {/* Action buttons - Sans icônes */}
        {showHeader && (
          <div className="flex items-center gap-2">
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded-md hover:bg-[#21262d] text-[#8b949e] hover:text-[#c9d1d9] text-[11px] font-medium transition-all"
              title="Copier le code (Ctrl+K)"
              aria-label="Copier le code"
            >
              {copied ? 'Copié' : 'Copier'}
            </button>

            {/* Run Button - Text only */}
            {onRun && (
              <button
                onClick={handleRun}
                disabled={isTyping || isExecuting}
                className="px-2.5 py-1 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-[11px] font-semibold transition-all hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none flex items-center gap-1.5"
                title="Analyser le code (Ctrl+Enter)"
                aria-label="Analyser le code"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Exécution...</span>
                  </>
                ) : isTyping ? (
                  <span>Analyse...</span>
                ) : (
                  <span>Analyser</span>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={languageInfo.monacoId}
          value={code}
          onChange={(value) => !readOnly && setCode(value || '')}
          onMount={handleEditorDidMount}
          theme="vscode-dark-plus"
          options={{
            ...MONACO_EDITOR_OPTIONS,
            readOnly
          }}
          beforeMount={initMonacoTheme}
        />
      </div>

    </div>
  )
}

