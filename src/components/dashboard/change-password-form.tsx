'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function ChangePasswordForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match')
      return
    }

    const missing: string[] = []
    if (newPassword.length < 8) missing.push('minimum 8 characters')
    if (!/[A-Z]/.test(newPassword)) missing.push('an uppercase letter')
    if (!/[a-z]/.test(newPassword)) missing.push('a lowercase letter')
    if (!/[0-9]/.test(newPassword)) missing.push('a number')

    if (missing.length > 0) {
      setError('New password must contain ' + missing.join(', '))
      return
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      })

      const data = await res.json()
      if (!data.ok) {
        setError(data.error?.message || 'Failed to change password')
        return
      }

      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    backgroundColor: 'var(--color-surface-container-low)',
    borderBottomWidth: 2,
    color: 'var(--color-on-surface)',
    fontSize: 'var(--text-body-medium-font-size)',
    fontFamily: 'var(--text-body-medium-font-family)',
    caretColor: 'var(--color-primary)',
  }

  const labelStyle = {
    fontSize: 'var(--text-label-medium-font-size)',
    color: 'var(--color-on-surface)',
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label style={labelStyle}>Current Password</label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="px-3 py-2 rounded-lg w-full outline-none border-0 border-b border-[var(--color-outline-variant)]"
              style={{ ...inputStyle, paddingRight: '28px' }}
              required
            />
            {currentPassword.length > 0 && (
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-transparent border-none p-0 cursor-pointer"
                style={{ color: 'var(--color-on-surface-variant)', lineHeight: 0 }}
                tabIndex={-1}
              >
                {showCurrent ? '🙈' : '👁️'}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label style={labelStyle}>New Password</label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="px-3 py-2 rounded-lg w-full outline-none border-0 border-b border-[var(--color-outline-variant)]"
              style={{ ...inputStyle, paddingRight: '28px' }}
              placeholder="At least 8 characters"
              required
            />
            {newPassword.length > 0 && (
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-transparent border-none p-0 cursor-pointer"
                style={{ color: 'var(--color-on-surface-variant)', lineHeight: 0 }}
                tabIndex={-1}
              >
                {showNew ? '🙈' : '👁️'}
              </button>
            )}
          </div>
          {(() => {
            const reqs = [
              { met: /[A-Z]/.test(newPassword), text: 'Must contain one uppercase letter' },
              { met: newPassword.length >= 8, text: 'Must contain at least 8 characters' },
              { met: /[a-z]/.test(newPassword), text: 'Must contain one lowercase letter' },
              { met: /[0-9]/.test(newPassword), text: 'Must contain one number' },
            ]
            const next = reqs.find((r) => !r.met)
            return next && newPassword.length > 0 ? (
              <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-body-small-font-size)', fontFamily: 'var(--text-body-small-font-family)' }}>
                {next.text}
              </p>
            ) : null
          })()}
        </div>

        <div className="flex flex-col gap-1.5">
          <label style={labelStyle}>Confirm New Password</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="px-3 py-2 rounded-lg w-full outline-none border-0 border-b border-[var(--color-outline-variant)]"
              style={{ ...inputStyle, paddingRight: '28px' }}
              placeholder="Repeat your new password"
              required
            />
            {confirmNewPassword.length > 0 && (
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-transparent border-none p-0 cursor-pointer"
                style={{ color: 'var(--color-on-surface-variant)', lineHeight: 0 }}
                tabIndex={-1}
              >
                {showConfirm ? '🙈' : '👁️'}
              </button>
            )}
          </div>
        </div>

        {error && (
          <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>
        )}
        {success && (
          <p className="text-sm" style={{ color: 'var(--color-primary-container)' }}>Password changed successfully. You have been logged out of other sessions.</p>
        )}

        <Button type="submit" loading={loading}>
          Change Password
        </Button>
      </div>
    </form>
  )
}
