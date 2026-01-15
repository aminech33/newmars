import { Undo } from 'lucide-react'

interface UndoToastProps {
  message: string
  onUndo: () => void
  isVisible: boolean
  onClose?: () => void
}

export function UndoToast({ message, onUndo, isVisible, onClose }: UndoToastProps) {
  if (!isVisible) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up"
    >
      <div className="flex items-center gap-3 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl">
        <span className="text-sm text-zinc-300">{message}</span>
        <button
          onClick={onUndo}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors"
          aria-label={`Annuler: ${message}`}
        >
          <Undo className="w-3.5 h-3.5" aria-hidden="true" />
          Annuler
        </button>
      </div>
    </div>
  )
}

