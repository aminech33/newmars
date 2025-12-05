import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { LucideIcon } from 'lucide-react'

type InputSize = 'sm' | 'md' | 'lg'
type InputVariant = 'default' | 'filled' | 'ghost'

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
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-base',
}

const iconPaddingClasses: Record<InputSize, { left: string; right: string }> = {
  sm: { left: 'pl-8', right: 'pr-8' },
  md: { left: 'pl-10', right: 'pr-10' },
  lg: { left: 'pl-12', right: 'pr-12' },
}

const iconSizeClasses: Record<InputSize, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}

const iconPositionClasses: Record<InputSize, { left: string; right: string }> = {
  sm: { left: 'left-2.5', right: 'right-2.5' },
  md: { left: 'left-3', right: 'right-3' },
  lg: { left: 'left-4', right: 'right-4' },
}

const variantClasses: Record<InputVariant, string> = {
  default: `
    bg-zinc-900 border border-zinc-800
    focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50
    disabled:bg-zinc-900/50 disabled:border-zinc-800/50 disabled:text-zinc-600
  `,
  filled: `
    bg-zinc-800 border border-transparent
    focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50
    disabled:bg-zinc-800/50 disabled:text-zinc-600
  `,
  ghost: `
    bg-transparent border border-transparent
    hover:bg-zinc-800/50
    focus:bg-zinc-800/50 focus:border-zinc-800
    disabled:text-zinc-600 disabled:hover:bg-transparent
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
            className="block text-sm font-medium text-zinc-300 mb-1.5"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {Icon && (
            <div
              className={`
                absolute top-1/2 -translate-y-1/2
                ${iconPositionClasses[size][iconPosition]}
                pointer-events-none
                ${disabled ? 'text-zinc-600' : 'text-zinc-500'}
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
              w-full rounded-lg
              text-zinc-200 placeholder-zinc-600
              transition-colors duration-200
              outline-none
              ${variantClasses[variant]}
              ${sizeClasses[size]}
              ${hasIcon ? iconPaddingClasses[size][iconPosition] : ''}
              ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/50' : ''}
              ${className}
            `}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
        </div>

        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs text-rose-400">
            {error}
          </p>
        )}
        
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-zinc-500">
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
            className="block text-sm font-medium text-zinc-300 mb-1.5"
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
            w-full rounded-lg resize-none
            text-zinc-200 placeholder-zinc-600
            transition-colors duration-200
            outline-none
            ${variantClasses[variant]}
            ${sizeClasses[size]}
            ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/50' : ''}
            ${className}
          `}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
          {...props}
        />

        {error && (
          <p id={`${textareaId}-error`} className="mt-1.5 text-xs text-rose-400">
            {error}
          </p>
        )}
        
        {hint && !error && (
          <p id={`${textareaId}-hint`} className="mt-1.5 text-xs text-zinc-500">
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
            className="block text-sm font-medium text-zinc-300 mb-1.5"
          >
            {label}
          </label>
        )}
        
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={`
            w-full rounded-lg
            text-zinc-200
            transition-colors duration-200
            outline-none
            appearance-none
            bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')]
            bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat
            pr-10
            ${variantClasses[variant]}
            ${sizeClasses[size]}
            ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/50' : ''}
            ${className}
          `}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        {error && (
          <p id={`${selectId}-error`} className="mt-1.5 text-xs text-rose-400">
            {error}
          </p>
        )}
        
        {hint && !error && (
          <p id={`${selectId}-hint`} className="mt-1.5 text-xs text-zinc-500">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

