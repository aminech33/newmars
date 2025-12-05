import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import logger from '../../utils/logger'

interface Props {
  children: ReactNode
  widgetId: string
  widgetTitle: string
  onRemove?: () => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class WidgetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error(`Widget Error [${this.props.widgetId}]:`, error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full rounded-3xl p-5 bg-zinc-900/50 border border-rose-500/20 flex flex-col items-center justify-center text-center">
          <div className="p-3 bg-rose-500/10 rounded-full mb-3">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>
          <h3 className="text-sm font-medium text-zinc-300 mb-1">
            {this.props.widgetTitle}
          </h3>
          <p className="text-xs text-zinc-600 mb-4">
            Une erreur est survenue
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Réessayer
            </button>
            {this.props.onRemove && (
              <button
                onClick={this.props.onRemove}
                className="px-3 py-1.5 text-rose-400 hover:bg-rose-500/10 text-xs rounded-lg transition-colors"
              >
                Supprimer
              </button>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

