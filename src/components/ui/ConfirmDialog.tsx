import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'danger'
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: {
      bg: 'bg-rose-500/10',
      icon: 'text-rose-400',
      buttonVariant: 'danger' as const
    },
    warning: {
      bg: 'bg-amber-500/10',
      icon: 'text-amber-400',
      buttonVariant: 'warning' as const
    },
    info: {
      bg: 'bg-indigo-500/10',
      icon: 'text-indigo-400',
      buttonVariant: 'primary' as const
    }
  }

  const styles = variantStyles[variant]

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {cancelText}
          </Button>
          <Button 
            variant={styles.buttonVariant}
            onClick={handleConfirm}
            autoFocus
          >
            {confirmText}
          </Button>
        </>
      }
    >
      {/* Header with icon */}
      <div className="flex items-center gap-3 mb-4 -mt-2">
        <div className={`p-2 rounded-xl ${styles.bg}`}>
          <AlertTriangle className={`w-5 h-5 ${styles.icon}`} />
        </div>
        <h2 className="text-lg font-semibold text-zinc-100">
          {title}
        </h2>
      </div>

      {/* Message */}
      <p className="text-sm text-zinc-400 leading-relaxed">
        {message}
      </p>
    </Modal>
  )
}
