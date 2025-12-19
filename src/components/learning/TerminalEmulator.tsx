import { useEffect, useRef, useState } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import { Circle, Terminal as TerminalIcon } from 'lucide-react'

interface TerminalEmulatorProps {
  sessionId: string
  onCommand?: (command: string) => void
}

export function TerminalEmulator({ sessionId, onCommand }: TerminalEmulatorProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!terminalRef.current) return

    // Créer le terminal xterm.js avec thème style iTerm2/zsh
    const term = new Terminal({
      theme: {
        // Fond sombre style iTerm2
        background: '#0d1117',
        foreground: '#c9d1d9',
        cursor: '#58a6ff',
        cursorAccent: '#0d1117',
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
      },
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Menlo', 'Monaco', 'Consolas', monospace",
      fontSize: 13,
      fontWeight: '400',
      fontWeightBold: '600',
      letterSpacing: 0,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'bar',
      cursorWidth: 2,
      scrollback: 5000,
      smoothScrollDuration: 100,
      allowProposedApi: true,
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(terminalRef.current)
    
    // Petit délai pour que le DOM soit prêt
    setTimeout(() => fitAddon.fit(), 50)

    xtermRef.current = term
    fitAddonRef.current = fitAddon

    // Connecter au WebSocket backend
    const wsUrl = `ws://localhost:8000/api/terminal/ws/terminal/${sessionId}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      setError(null)
      
      // Envoyer la taille initiale
      const { rows, cols } = term
      ws.send(JSON.stringify({ type: 'resize', rows, cols }))
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        if (message.type === 'output') {
          term.write(message.data)
        } else if (message.type === 'error') {
          setError(message.message)
          term.writeln(`\x1b[31m✗ ${message.message}\x1b[0m`)
        }
      } catch {
        term.write(event.data)
      }
    }

    ws.onerror = () => {
      setError('Connexion impossible')
      term.writeln('\x1b[38;5;203m')
      term.writeln('  ╭─────────────────────────────────────╮')
      term.writeln('  │  ✗ Impossible de se connecter      │')
      term.writeln('  │                                     │')
      term.writeln('  │  Vérifiez que:                      │')
      term.writeln('  │  • Docker Desktop est lancé         │')
      term.writeln('  │  • Le backend tourne (port 8000)    │')
      term.writeln('  ╰─────────────────────────────────────╯')
      term.writeln('\x1b[0m')
    }

    ws.onclose = () => {
      setConnected(false)
    }

    // Gérer l'input utilisateur
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }))
        
        if (data === '\r' && onCommand) {
          // Callback pour l'IA si besoin
        }
      }
    })

    // Gérer le resize
    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current) {
        fitAddonRef.current.fit()
        const { rows, cols } = xtermRef.current
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'resize', rows, cols }))
        }
      }
    }

    window.addEventListener('resize', handleResize)

    const resizeObserver = new ResizeObserver(() => {
      setTimeout(handleResize, 50)
    })
    resizeObserver.observe(terminalRef.current)

    return () => {
      window.removeEventListener('resize', handleResize)
      resizeObserver.disconnect()
      ws.close()
      term.dispose()
    }
  }, [sessionId, onCommand])

  return (
    <div className="h-full flex flex-col bg-[#0d1117] rounded-lg overflow-hidden">
      {/* Barre de titre style macOS/iTerm2 */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-[#21262d]">
        {/* Traffic lights */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Circle className="w-3 h-3 fill-[#ff5f57] text-[#ff5f57]" />
            <Circle className="w-3 h-3 fill-[#febc2e] text-[#febc2e]" />
            <Circle className="w-3 h-3 fill-[#28c840] text-[#28c840]" />
          </div>
        </div>
        
        {/* Titre central */}
        <div className="flex items-center gap-2 text-[#8b949e]">
          <TerminalIcon className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">
            {connected ? 'ubuntu@docker' : 'Terminal'}
          </span>
          <span className="text-[10px] text-[#484f58]">— bash</span>
        </div>
        
        {/* Status */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium ${
            connected 
              ? 'bg-[#238636]/20 text-[#3fb950]' 
              : 'bg-[#f85149]/20 text-[#f85149]'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-[#3fb950]' : 'bg-[#f85149]'}`} />
            {connected ? 'Connecté' : 'Déconnecté'}
          </div>
        </div>
      </div>

      {/* Terminal */}
      <div 
        ref={terminalRef} 
        className="flex-1 px-1 py-2"
        style={{ 
          minHeight: 0,
          // Override xterm default styles pour un look plus propre
        }}
      />

      {/* Barre de status en bas */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[#f8514920] border-t border-[#f8514930]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#f85149] animate-pulse" />
          <span className="text-xs text-[#f85149]">{error}</span>
        </div>
      )}
    </div>
  )
}
