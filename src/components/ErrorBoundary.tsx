import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-mars-bg flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-zinc-900/50 backdrop-blur-xl rounded-3xl p-8 shadow-[0_16px_64px_rgba(0,0,0,0.5)]"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-zinc-200 mb-2">Oups ! Une erreur s'est produite</h1>
              <p className="text-zinc-500 text-sm">L'application a rencontré un problème</p>
            </div>
            
            <div className="bg-zinc-950/50 rounded-2xl p-4 mb-6">
              <p className="text-xs text-rose-400 font-mono">
                {this.state.error?.message || 'Erreur inconnue'}
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  localStorage.clear()
                  window.location.reload()
                }}
                className="w-full px-4 py-3 bg-indigo-500/20 text-indigo-400 rounded-2xl hover:bg-indigo-500/30 transition-all duration-300 font-medium"
              >
                🔄 Réinitialiser et recharger
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-3 bg-zinc-800/50 text-zinc-400 rounded-2xl hover:bg-zinc-800 transition-all duration-300"
              >
                Recharger la page
              </button>
              
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="w-full px-4 py-3 text-zinc-600 hover:text-zinc-400 rounded-2xl hover:bg-zinc-800/30 transition-all duration-300 text-sm"
              >
                Réessayer
              </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-zinc-800">
              <p className="text-xs text-zinc-700 text-center">
                Si le problème persiste, ouvrez la console (F12) pour plus de détails
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

