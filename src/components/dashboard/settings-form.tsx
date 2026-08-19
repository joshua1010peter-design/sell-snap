'use client';

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface SettingsFormProps {
  user: {
    name: string
    email: string
    businessName: string
  }
}

export function SettingsForm({ user }: SettingsFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [name, setName] = useState(user.name)
  const [businessName, setBusinessName] = useState(user.businessName)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, businessName }),
      })

      const data = await res.json()
      if (!data.ok) {
        setError(data.error.message)
        return
      }

      setSuccess(true)
      router.refresh()
    } catch {
      setError('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label style={{ fontSize: 'var(--text-label-medium-font-size)', color: 'var(--color-on-surface)' }}>
            Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-3 py-2 rounded-lg w-full outline-none border-0 border-b border-[var(--color-outline-variant)] focus:placeholder-green-400"
            style={{
              backgroundColor: 'var(--color-surface-container-low)',
              borderBottomWidth: 2,
              color: 'var(--color-on-surface)',
              fontSize: 'var(--text-body-medium-font-size)',
              caretColor: 'var(--color-primary)',
            }}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label style={{ fontSize: 'var(--text-label-medium-font-size)', color: 'var(--color-on-surface)' }}>
            Business Name
          </label>
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="px-3 py-2 rounded-lg w-full outline-none border-0 border-b border-[var(--color-outline-variant)] focus:placeholder-green-400"
            style={{
              backgroundColor: 'var(--color-surface-container-low)',
              borderBottomWidth: 2,
              color: 'var(--color-on-surface)',
              fontSize: 'var(--text-body-medium-font-size)',
              caretColor: 'var(--color-primary)',
            }}
            placeholder="My Store"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label style={{ fontSize: 'var(--text-label-medium-font-size)', color: 'var(--color-on-surface)' }}>
            Email
          </label>
          <input
            value={user.email}
            disabled
            className="px-3 py-2 rounded-lg w-full outline-none border-0 border-b border-[var(--color-outline-variant)]"
            style={{
              backgroundColor: 'var(--color-surface-container-low)',
              borderBottomWidth: 2,
              color: 'var(--color-on-surface-variant)',
              fontSize: 'var(--text-body-medium-font-size)',
            }}
          />
          <p style={{ fontSize: 'var(--text-body-small-font-size)', color: 'var(--color-on-surface-variant)' }}>
            Email cannot be changed.
          </p>
        </div>

        {error && (
          <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>
        )}
        {success && (
          <p className="text-sm" style={{ color: 'var(--color-primary-container)' }}>Settings saved!</p>
        )}

        <Button type="submit" loading={loading}>
          Save Settings
        </Button>
      </div>
    </form>
  )
}
