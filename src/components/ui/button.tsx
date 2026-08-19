'use client';

import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-container)]',
    secondary: 'bg-[var(--color-surface-container)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)]',
    ghost: 'bg-transparent text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)]',
    danger: 'bg-[var(--color-error)] text-[var(--color-on-error)] hover:bg-[var(--color-error-container)]',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
