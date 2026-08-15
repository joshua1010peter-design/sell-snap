export interface HeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function Header({ title, description, action }: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8 animate-fade-in-up">
      <div>
        <h1
          style={{
            fontSize: 'var(--text-headline-small-font-size)',
            fontWeight: 800,
            lineHeight: 'var(--text-headline-small-line-height)',
            fontFamily: 'var(--text-headline-small-font-family)',
            background: 'linear-gradient(135deg, var(--color-on-surface), var(--color-on-surface-variant))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.5px',
          }}
        >
          {title}
        </h1>
        {description && (
          <p
            className="mt-2 animate-fade-in-up delay-100"
            style={{
              fontSize: 'var(--text-body-medium-font-size)',
              fontFamily: 'var(--text-body-medium-font-family)',
              color: 'var(--color-on-surface-variant)',
            }}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="animate-fade-in-up delay-200">{action}</div>}
    </div>
  )
}
