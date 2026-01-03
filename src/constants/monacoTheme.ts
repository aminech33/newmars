import type { editor } from 'monaco-editor'

/**
 * Thème VS Code Dark+ authentique pour Monaco Editor
 * Extrait pour réutilisabilité et performance
 */
export const MONACO_THEME_DARK_PLUS: editor.IStandaloneThemeData = {
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
    'editor.background': '#0a0a0a',
    'editor.foreground': '#d4d4d4',
    'editor.lineHighlightBackground': '#1a1a1a',
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
}

/**
 * Options de configuration Monaco Editor optimisées
 */
export const MONACO_EDITOR_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  minimap: { enabled: false },
  fontSize: 14,
  lineNumbers: 'on',
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 4,
  wordWrap: 'on',
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
  },
  // Quicksuggestions pour intellisense
  quickSuggestions: {
    other: true,
    comments: false,
    strings: false
  },
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnCommitCharacter: true,
  acceptSuggestionOnEnter: 'on',
  snippetSuggestions: 'top',
}

/**
 * Initialise le thème Monaco (à appeler une seule fois au démarrage)
 */
export function initMonacoTheme(monaco: typeof import('monaco-editor')) {
  try {
    monaco.editor.defineTheme('vscode-dark-plus', MONACO_THEME_DARK_PLUS)
    monaco.editor.setTheme('vscode-dark-plus')
  } catch (error) {
    console.warn('Monaco theme already defined or error:', error)
  }
}

