import { cn } from '@/lib/utils'

export interface CardProps {
  className?: string
  children: React.ReactNode
}

export function Card({ className, children }: CardProps) {
  return (
    <div
      className={cn('rounded-xl p-6 glass-panel transition-all duration-300', className)}
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-surface) 90%, transparent)',
        border: '1px solid color-mix(in srgb, var(--color-outline-variant) 50%, transparent)',
      }}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: CardProps) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

export function CardTitle({ className, children }: CardProps) {
  return (
    <h2
      className={cn(className)}
      style={{
        fontSize: 'var(--text-title-medium-font-size)',
        fontWeight: 'var(--text-title-medium-font-weight)',
        lineHeight: 'var(--text-title-medium-line-height)',
        fontFamily: 'var(--text-title-medium-font-family)',
        color: 'var(--color-on-surface)',
      }}
    >
      {children}
    </h2>
  )
}

export function CardContent({ className, children }: CardProps) {
  return <div className={cn(className)}>{children}</div>
}
