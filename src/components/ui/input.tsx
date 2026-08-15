'use client';

import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: 'var(--text-label-medium-font-size)',
            fontWeight: 'var(--text-label-medium-font-weight)',
            lineHeight: 'var(--text-label-medium-line-height)',
            fontFamily: 'var(--text-label-medium-font-family)',
            color: 'var(--color-on-surface)',
          }}
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          'px-3 py-2 rounded-lg w-full outline-none border-0 border-b border-[var(--color-outline-variant)] focus:placeholder-green-400',
          className,
        )}
        style={{
          backgroundColor: 'var(--color-surface-container-low)',
          borderBottomWidth: 2,
          color: 'var(--color-on-surface)',
          fontSize: 'var(--text-body-medium-font-size)',
          fontFamily: 'var(--text-body-medium-font-family)',
          caretColor: 'var(--color-primary)',
        }}
        {...props}
      />
      {error && (
        <p className="text-sm" style={{ color: 'var(--color-error)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
