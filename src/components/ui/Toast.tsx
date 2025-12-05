import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  onClose: () => void
  action?: {
    label: string
    onClick: () => void
  }
}

export function Toast({ message, type = 'info', duration = 4000, onClose, action }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    error: <XCircle className="w-5 h-5 text-rose-400" />,
    info: <Info className="w-5 h-5 text-indigo-400" />
  }

  const colors = {
    success: 'border-emerald-500/30 bg-emerald-500/10',
    error: 'border-rose-500/30 bg-rose-500/10',
    info: 'border-indigo-500/30 bg-indigo-500/10'
  }

  return (
    <div
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]
        flex items-center gap-3 px-4 py-3 
        bg-zinc-900 border ${colors[type]} 
        rounded-xl shadow-2xl
        transition-opacity duration-300
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      role="alert"
      aria-live="polite"
    >
      {icons[type]}
      <span className="text-sm text-zinc-200">{message}</span>
      
      {action && (
        <button
          onClick={() => {
            action.onClick()
            onClose()
          }}
          className="ml-2 px-3 py-1 text-xs font-medium text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
        >
          {action.label}
        </button>
      )}
      
      <button
        onClick={onClose}
        className="ml-2 p-1 text-zinc-600 hover:text-zinc-400 transition-colors"
        aria-label="Fermer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// Hook pour gérer les toasts
import { createContext, useContext, useCallback, ReactNode } from 'react'

interface ToastContextType {
  showToast: (message: string, type?: ToastType, action?: { label: string; onClick: () => void }) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Array<{
    id: string
    message: string
    type: ToastType
    action?: { label: string; onClick: () => void }
  }>>([])

  const showToast = useCallback((
    message: string, 
    type: ToastType = 'info',
    action?: { label: string; onClick: () => void }
  ) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type, action }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          action={toast.action}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

