import { useEffect, useRef, useState } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import { XTERM_OPTIONS } from '../../constants/xtermTheme'
import { TerminalSuggester } from './TerminalSuggester'
import { API_URLS } from '../../services/api'

interface TerminalEmulatorProps {
  sessionId: string
  onCommand?: (command: string) => void
  onOutputCapture?: (output: string) => void
}

export function TerminalEmulator({ sessionId, onCommand, onOutputCapture }: TerminalEmulatorProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Capture de l'historique pour l'IA
  const commandHistoryRef = useRef<string[]>([])
  const outputBufferRef = useRef<string>('')
  const currentCommandRef = useRef<string>('')

  useEffect(() => {
    if (!terminalRef.current) return

    // Créer le terminal xterm.js avec thème style iTerm2/zsh
    const term = new Terminal(XTERM_OPTIONS)

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(terminalRef.current)
    
    // Petit délai pour que le DOM soit prêt
    setTimeout(() => fitAddon.fit(), 50)

    xtermRef.current = term
    fitAddonRef.current = fitAddon

    // Connecter au WebSocket backend
    const wsUrl = `${API_URLS.TERMINAL_WS}/terminal/${sessionId}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
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
          
          // Capturer l'output pour l'IA (limiter à 2000 chars)
          outputBufferRef.current += message.data
          if (outputBufferRef.current.length > 2000) {
            outputBufferRef.current = outputBufferRef.current.slice(-2000)
          }
          
          // Notifier le parent si callback fourni
          if (onOutputCapture) {
            onOutputCapture(outputBufferRef.current)
          }
        } else if (message.type === 'error') {
          setError(message.message)
          term.writeln(`\x1b[31m✗ ${message.message}\x1b[0m`)
        }
      } catch {
        term.write(event.data)
        
        // Capturer aussi les outputs bruts
        outputBufferRef.current += event.data
        if (outputBufferRef.current.length > 2000) {
          outputBufferRef.current = outputBufferRef.current.slice(-2000)
        }
        
        if (onOutputCapture) {
          onOutputCapture(outputBufferRef.current)
        }
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
      // Connexion fermée
    }

    // Gérer l'input utilisateur
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }))
        
        // Capturer les commandes (Enter = \r)
        if (data === '\r') {
          const command = currentCommandRef.current.trim()
          
          if (command) {
            // Ajouter à l'historique (garder les 10 dernières)
            commandHistoryRef.current.push(command)
            if (commandHistoryRef.current.length > 10) {
              commandHistoryRef.current.shift()
            }
            
            // Notifier le parent
            if (onCommand) {
              onCommand(command)
            }
          }
          
          // Réinitialiser la commande courante
          currentCommandRef.current = ''
        } else if (data === '\x7f' || data === '\b') {
          // Backspace
          currentCommandRef.current = currentCommandRef.current.slice(0, -1)
        } else if (data.charCodeAt(0) >= 32) {
          // Caractère printable
          currentCommandRef.current += data
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
  }, [sessionId, onCommand, onOutputCapture])

  // Handler pour accepter une suggestion
  const handleAcceptSuggestion = (command: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && xtermRef.current) {
      // Envoyer la commande au terminal
      wsRef.current.send(JSON.stringify({ type: 'input', data: command + '\r' }))
    }
  }

  return (
    <div className="h-full flex flex-col bg-black overflow-hidden relative">
      {/* AI Suggester */}
      <TerminalSuggester
        recentCommands={commandHistoryRef.current}
        recentOutput={outputBufferRef.current}
        onAcceptSuggestion={handleAcceptSuggestion}
      />

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
