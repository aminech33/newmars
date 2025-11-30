import { useStore } from '../store/useStore'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertCircle,
}

const colors = {
  success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  error: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  info: 'text-zinc-400 bg-zinc-800/50 border-zinc-700',
  warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
}

export function ToastContainer() {
  const { toasts, removeToast } = useStore()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const Icon = icons[toast.type]
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border ${colors[toast.type]} backdrop-blur-sm animate-slide-in-right`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertCircle,
}

const colors = {
  success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  error: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  info: 'text-zinc-400 bg-zinc-800/50 border-zinc-700',
  warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
}

export function ToastContainer() {
  const { toasts, removeToast } = useStore()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const Icon = icons[toast.type]
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border ${colors[toast.type]} backdrop-blur-sm animate-slide-in-right`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}


