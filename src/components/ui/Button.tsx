import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  isLoading?: boolean
  fullWidth?: boolean
  children?: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: `
    bg-indigo-500 text-white
    hover:bg-indigo-600 
    focus:ring-indigo-500/50
    disabled:bg-indigo-500/50 disabled:text-white/70
  `,
  secondary: `
    bg-zinc-800 text-zinc-200
    hover:bg-zinc-700 hover:text-zinc-100
    focus:ring-zinc-500/50
    disabled:bg-zinc-800/50 disabled:text-zinc-500
  `,
  ghost: `
    bg-transparent text-zinc-400
    hover:bg-zinc-800 hover:text-zinc-200
    focus:ring-zinc-500/50
    disabled:text-zinc-600 disabled:hover:bg-transparent
  `,
  danger: `
    bg-rose-500 text-white
    hover:bg-rose-600
    focus:ring-rose-500/50
    disabled:bg-rose-500/50 disabled:text-white/70
  `,
  success: `
    bg-emerald-500 text-white
    hover:bg-emerald-600
    focus:ring-emerald-500/50
    disabled:bg-emerald-500/50 disabled:text-white/70
  `,
  warning: `
    bg-amber-500 text-white
    hover:bg-amber-600
    focus:ring-amber-500/50
    disabled:bg-amber-500/50 disabled:text-white/70
  `,
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
}

const iconSizeClasses: Record<ButtonSize, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon: Icon,
      iconPosition = 'left',
      isLoading = false,
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center
          font-medium rounded-lg
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950
          disabled:cursor-not-allowed disabled:opacity-70
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className={`animate-spin ${iconSizeClasses[size]}`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="ml-2">Chargement...</span>
          </>
        ) : (
          <>
            {Icon && iconPosition === 'left' && (
              <Icon className={iconSizeClasses[size]} />
            )}
            {children}
            {Icon && iconPosition === 'right' && (
              <Icon className={iconSizeClasses[size]} />
            )}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

// Composant IconButton pour les boutons avec seulement une icône
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  variant?: ButtonVariant
  size?: ButtonSize
  label: string // Pour accessibilité
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, variant = 'ghost', size = 'md', label, className = '', ...props }, ref) => {
    const paddingClasses: Record<ButtonSize, string> = {
      sm: 'p-1.5',
      md: 'p-2',
      lg: 'p-3',
    }

    return (
      <button
        ref={ref}
        aria-label={label}
        title={label}
        className={`
          inline-flex items-center justify-center
          rounded-lg
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950
          disabled:cursor-not-allowed disabled:opacity-70
          ${variantClasses[variant]}
          ${paddingClasses[size]}
          ${className}
        `}
        {...props}
      >
        <Icon className={iconSizeClasses[size]} />
      </button>
    )
  }
)

IconButton.displayName = 'IconButton'





