import { cn } from '@/lib/utils'

export interface StatsCardProps {
  title: string
  value: string | number
  icon: string
  trend?: { value: string; positive: boolean }
  className?: string
}

export function StatsCard({ title, value, icon, trend, className }: StatsCardProps) {
  return (
    <div
      className={cn('rounded-xl p-5 glass-panel glass-panel-hover transition-all duration-300 relative overflow-hidden group', className)}
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-surface) 90%, transparent)',
        border: '1px solid color-mix(in srgb, var(--color-outline-variant) 50%, transparent)',
      }}
    >
      {/* Decorative gradient blob */}
      <div 
        className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-20 blur-xl group-hover:scale-150 transition-transform duration-700"
        style={{ background: 'var(--color-primary)' }}
      />

      <div className="flex items-center justify-between mb-3 relative z-10">
        <span
          style={{
            fontSize: 'var(--text-body-medium-font-size)',
            fontWeight: 600,
            fontFamily: 'var(--text-body-medium-font-family)',
            color: 'var(--color-on-surface-variant)',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </span>
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] text-xl">
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between relative z-10">
        <span
          style={{
            fontSize: 'var(--text-display-small-font-size)',
            fontWeight: 700,
            fontFamily: 'var(--text-display-small-font-family)',
            color: 'var(--color-on-surface)',
            letterSpacing: '-1px',
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        {trend && (
          <span
            style={{
              fontSize: 'var(--text-body-small-font-size)',
              fontFamily: 'var(--text-body-small-font-family)',
              color: trend.positive ? 'var(--color-primary-container)' : 'var(--color-error)',
            }}
          >
            {trend.value}
          </span>
        )}
      </div>
    </div>
  )
}
