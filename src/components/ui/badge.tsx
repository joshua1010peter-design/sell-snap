import { cn } from '@/lib/utils'

export interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error'
  className?: string
  children: React.ReactNode
}

export function Badge({ variant = 'default', className, children }: BadgeProps) {
  const variants = {
    default: {
      backgroundColor: 'var(--color-surface-container)',
      color: 'var(--color-on-surface)',
    },
    success: {
      backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
      color: 'var(--color-primary-container)',
    },
    warning: {
      backgroundColor: 'color-mix(in srgb, #f59e0b 15%, transparent)',
      color: '#92400e',
    },
    error: {
      backgroundColor: 'color-mix(in srgb, var(--color-error) 15%, transparent)',
      color: 'var(--color-error)',
    },
  }

  return (
    <span
      className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', className)}
      style={variants[variant]}
    >
      {children}
    </span>
  )
}
