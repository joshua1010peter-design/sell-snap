'use client';

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: '📊' },
  { href: '/products', label: 'Products', icon: '📦' },
  { href: '/orders', label: 'Orders', icon: '🛒' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [showSignOut, setShowSignOut] = useState(false)

  return (
    <aside
      className="flex flex-col w-64 min-h-screen border-r transition-colors duration-300 relative z-10 glass-panel"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-surface) 90%, transparent)',
        borderColor: 'var(--color-outline-variant)',
      }}
    >
      <div className="p-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2"
          style={{
            fontSize: 'var(--text-title-large-font-size)',
            fontWeight: 800,
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-container))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textDecoration: 'none',
            letterSpacing: '-0.5px',
          }}
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center animate-pulse-glow">
            <span className="text-white text-lg leading-none select-none">S</span>
          </div>
          SELL SNAP
        </Link>
      </div>

      <nav className="flex-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg mb-2 transition-all duration-300 ease-out group hover:translate-x-1',
                isActive ? 'glass-panel' : 'hover:bg-[color-mix(in_srgb,var(--color-surface-container-high)_50%,transparent)]'
              )}
              style={{
                backgroundColor: isActive ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)' : 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                fontSize: 'var(--text-body-medium-font-size)',
                fontFamily: 'var(--text-body-medium-font-family)',
                fontWeight: isActive ? 600 : 500,
                textDecoration: 'none',
                borderColor: isActive ? 'color-mix(in srgb, var(--color-primary) 30%, transparent)' : 'transparent',
              }}
            >
              <span className={cn('transition-transform duration-300', isActive ? 'scale-110' : 'group-hover:scale-110')}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t" style={{ borderColor: 'var(--color-outline-variant)' }}>
        <button
          onClick={() => setShowSignOut(!showSignOut)}
          className="flex items-center justify-between w-full px-3 py-3 transition-all duration-300 cursor-pointer hover:translate-x-1"
          style={{
            backgroundColor: 'transparent',
            color: 'var(--color-on-surface-variant)',
            fontSize: 'var(--text-body-medium-font-size)',
            fontFamily: 'var(--text-body-medium-font-family)',
            fontWeight: 500,
            border: 'none',
            textAlign: 'left',
          }}
        >
          <div className="flex items-center gap-3">
            <span>🚪</span>
            <span>Sign Out</span>
          </div>
          <span
            className="transition-transform duration-300"
            style={{ transform: showSignOut ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            ▾
          </span>
        </button>

        {showSignOut && (
          <div className="px-3 pb-3">
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-all duration-300 cursor-pointer hover:translate-x-1"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-error) 10%, transparent)',
                  color: 'var(--color-error)',
                  fontSize: 'var(--text-body-medium-font-size)',
                  fontFamily: 'var(--text-body-medium-font-family)',
                  fontWeight: 600,
                  border: 'none',
                  textAlign: 'left',
                }}
              >
                Log Out
              </button>
            </form>
          </div>
        )}
      </div>
    </aside>
  )
}
