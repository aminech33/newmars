import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', error)
    console.error('Component stack:', errorInfo.componentStack)
    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleClearAndReload = () => {
    try {
      localStorage.removeItem('newmars-storage')
    } catch (e) {
      console.error('Failed to clear storage:', e)
    }
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen w-full bg-zinc-950 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">⚠️</div>
              <h1 className="text-xl font-bold text-white mb-2">
                Oups ! Une erreur s'est produite
              </h1>
              <p className="text-zinc-500 text-sm">
                L'application a rencontré un problème
              </p>
            </div>
            
            <div className="bg-zinc-950 rounded-xl p-4 mb-6 max-h-32 overflow-auto">
              <p className="text-xs text-red-400 font-mono break-all">
                {this.state.error?.message || 'Erreur inconnue'}
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
              >
                🔄 Réessayer
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-3 bg-zinc-800 text-zinc-300 rounded-xl hover:bg-zinc-700 transition-colors"
              >
                Recharger la page
              </button>
              
              <button
                onClick={this.handleClearAndReload}
                className="w-full px-4 py-3 text-zinc-500 hover:text-zinc-300 rounded-xl hover:bg-zinc-800/50 transition-colors text-sm"
              >
                Réinitialiser les données et recharger
              </button>
            </div>
            
            <p className="text-xs text-zinc-700 text-center mt-6">
              Ouvrez la console (F12) pour plus de détails
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
