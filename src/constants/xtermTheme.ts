// Theme xterm.js optimisé style iTerm2/zsh
export const XTERM_THEME = {
  // Fond noir profond
  background: '#000000',
  foreground: '#c9d1d9',
  cursor: '#58a6ff',
  cursorAccent: '#000000',
  selectionBackground: '#264f78',
  selectionForeground: '#ffffff',
  
  // Couleurs ANSI style zsh/Oh-My-Zsh
  black: '#484f58',
  red: '#ff7b72',
  green: '#3fb950',
  yellow: '#d29922',
  blue: '#58a6ff',
  magenta: '#bc8cff',
  cyan: '#39c5cf',
  white: '#b1bac4',
  brightBlack: '#6e7681',
  brightRed: '#ffa198',
  brightGreen: '#56d364',
  brightYellow: '#e3b341',
  brightBlue: '#79c0ff',
  brightMagenta: '#d2a8ff',
  brightCyan: '#56d4dd',
  brightWhite: '#ffffff',
}

export const XTERM_OPTIONS = {
  fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Menlo', 'Monaco', 'Consolas', monospace",
  fontSize: 13,
  fontWeight: '400' as const,
  fontWeightBold: '600' as const,
  letterSpacing: 0,
  lineHeight: 1.4,
  cursorBlink: true,
  cursorStyle: 'bar' as const,
  cursorWidth: 2,
  scrollback: 5000,
  smoothScrollDuration: 100,
  allowProposedApi: true,
  theme: XTERM_THEME,
}

