import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { LucideIcon } from 'lucide-react'

type InputSize = 'sm' | 'md' | 'lg'
type InputVariant = 'default' | 'filled' | 'ghost' | 'glass'

interface BaseInputProps {
  label?: string
  error?: string
  hint?: string
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  size?: InputSize
  variant?: InputVariant
  fullWidth?: boolean
}

interface InputProps extends BaseInputProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {}

const sizeClasses: Record<InputSize, string> = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-4 py-3 text-sm',
  lg: 'px-5 py-4 text-base',
}

const iconPaddingClasses: Record<InputSize, { left: string; right: string }> = {
  sm: { left: 'pl-9', right: 'pr-9' },
  md: { left: 'pl-11', right: 'pr-11' },
  lg: { left: 'pl-13', right: 'pr-13' },
}

const iconSizeClasses: Record<InputSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
}

const iconPositionClasses: Record<InputSize, { left: string; right: string }> = {
  sm: { left: 'left-3', right: 'right-3' },
  md: { left: 'left-3.5', right: 'right-3.5' },
  lg: { left: 'left-4', right: 'right-4' },
}

const variantClasses: Record<InputVariant, string> = {
  default: `
    bg-zinc-900 border border-zinc-800
    hover:border-zinc-700
    focus:border-zinc-600 focus:bg-zinc-900/80
    disabled:bg-zinc-900/50 disabled:border-zinc-800/50 disabled:text-zinc-600
  `,
  filled: `
    bg-zinc-800 border border-transparent
    hover:bg-zinc-800/80
    focus:border-zinc-700 focus:bg-zinc-800
    disabled:bg-zinc-800/50 disabled:text-zinc-600
  `,
  ghost: `
    bg-transparent border border-transparent
    hover:bg-zinc-800/50
    focus:bg-zinc-800/50 focus:border-zinc-700
    disabled:text-zinc-600 disabled:hover:bg-transparent
  `,
  glass: `
    bg-zinc-900/50 backdrop-blur-sm
    border border-zinc-800
    hover:border-zinc-700 hover:bg-zinc-900/70
    focus:border-zinc-600 focus:bg-zinc-900/80
    disabled:bg-zinc-900/30 disabled:border-zinc-800/50 disabled:text-zinc-600
  `,
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      icon: Icon,
      iconPosition = 'left',
      size = 'md',
      variant = 'default',
      fullWidth = true,
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    const hasIcon = !!Icon

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-zinc-300 mb-2"
          >
            {label}
          </label>
        )}
        
        <div className="relative group">
          {Icon && (
            <div
              className={`
                absolute top-1/2 -translate-y-1/2
                ${iconPositionClasses[size][iconPosition]}
                pointer-events-none
                transition-colors duration-200
                ${disabled ? 'text-zinc-600' : 'text-zinc-500 group-focus-within:text-zinc-400'}
              `}
            >
              <Icon className={iconSizeClasses[size]} />
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`
              w-full rounded-xl
              text-zinc-100 placeholder-zinc-500
              transition-colors duration-200
              outline-none
              ${variantClasses[variant]}
              ${sizeClasses[size]}
              ${hasIcon ? iconPaddingClasses[size][iconPosition] : ''}
              ${error ? 'border-rose-500/50 focus:border-rose-500' : ''}
              ${className}
            `}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
        </div>

        {error && (
          <p id={`${inputId}-error`} className="mt-2 text-xs text-rose-400 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-rose-400" />
            {error}
          </p>
        )}
        
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-2 text-xs text-zinc-500">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

// Textarea component
interface TextareaProps extends BaseInputProps, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  rows?: number
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      size = 'md',
      variant = 'default',
      fullWidth = true,
      className = '',
      id,
      disabled,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-zinc-300 mb-2"
          >
            {label}
          </label>
        )}
        
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          rows={rows}
          className={`
            w-full rounded-xl resize-none
            text-zinc-100 placeholder-zinc-500
            transition-colors duration-200
            outline-none
            ${variantClasses[variant]}
            ${sizeClasses[size]}
            ${error ? 'border-rose-500/50 focus:border-rose-500' : ''}
            ${className}
          `}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
          {...props}
        />

        {error && (
          <p id={`${textareaId}-error`} className="mt-2 text-xs text-rose-400 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-rose-400" />
            {error}
          </p>
        )}
        
        {hint && !error && (
          <p id={`${textareaId}-hint`} className="mt-2 text-xs text-zinc-500">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

// Select component
interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps extends Omit<InputHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  error?: string
  hint?: string
  options: SelectOption[]
  size?: InputSize
  variant?: InputVariant
  fullWidth?: boolean
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      options,
      size = 'md',
      variant = 'default',
      fullWidth = true,
      className = '',
      id,
      disabled,
      placeholder,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-zinc-300 mb-2"
          >
            {label}
          </label>
        )}
        
        <div className="relative group">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={`
              w-full rounded-xl
              text-zinc-100
              transition-colors duration-200
              outline-none
              appearance-none
              cursor-pointer
              pr-12
              ${variantClasses[variant]}
              ${sizeClasses[size]}
              ${error ? 'border-rose-500/50 focus:border-rose-500' : ''}
              ${className}
            `}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="text-zinc-500 bg-zinc-900">
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="bg-zinc-900 text-zinc-100"
              >
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Custom chevron icon */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 text-zinc-500 group-focus-within:text-zinc-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {error && (
          <p id={`${selectId}-error`} className="mt-2 text-xs text-rose-400 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-rose-400" />
            {error}
          </p>
        )}
        
        {hint && !error && (
          <p id={`${selectId}-hint`} className="mt-2 text-xs text-zinc-500">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

