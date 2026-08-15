'use client'

import { useState, useCallback } from 'react'

interface CheckoutFormProps {
  productId: string
  productName: string
  price: string
  productSlug: string
}

export function CheckoutForm({ productId, productName, price }: CheckoutFormProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError('')
      setSubmitting(true)

      try {
        // 1. Create order + get the Flutterwave hosted payment link from the server
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId,
            buyerEmail: email.trim(),
            buyerName: name.trim() || undefined,
            buyerPhone: phone.trim() || undefined,
          }),
        })

        const data = await res.json()

        if (!data.ok) {
          throw new Error(data.error?.message || 'Checkout failed. Please try again.')
        }

        const { paymentLink } = data.data

        if (!paymentLink || typeof paymentLink !== 'string') {
          throw new Error('Could not generate a payment link. Please try again.')
        }

        // 2. Redirect the buyer to the Flutterwave-hosted checkout page
        window.location.href = paymentLink
        // keep submitting=true so the button stays disabled during redirect
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
        setSubmitting(false)
      }
    },
    [productId, email, name, phone],
  )

  return (
    <div
      className="mt-6 rounded-2xl overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, var(--color-surface-container-low) 0%, var(--color-surface-container) 100%)',
        border: '1px solid var(--color-outline-variant)',
      }}
    >
      {/* Header */}
      <div
        className="px-6 pt-6 pb-4"
        style={{ borderBottom: '1px solid var(--color-outline-variant)' }}
      >
        <h2
          style={{
            fontSize: 'var(--text-title-medium-font-size)',
            fontWeight: 700,
            color: 'var(--color-on-surface)',
            fontFamily: 'var(--text-title-medium-font-family)',
            letterSpacing: '-0.01em',
          }}
        >
          Complete Your Purchase
        </h2>
        <div className="flex items-center justify-between mt-1">
          <p
            style={{
              fontSize: 'var(--text-body-medium-font-size)',
              color: 'var(--color-on-surface-variant)',
            }}
          >
            {productName}
          </p>
          <span
            style={{
              fontSize: 'var(--text-title-large-font-size)',
              fontWeight: 700,
              color: 'var(--color-primary)',
            }}
          >
            {price}
          </span>
        </div>
      </div>

      {/* Form body */}
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="checkout-email"
            style={{
              fontSize: 'var(--text-label-medium-font-size)',
              fontWeight: 600,
              color: 'var(--color-on-surface)',
              fontFamily: 'var(--text-label-medium-font-family)',
            }}
          >
            Email <span style={{ color: 'var(--color-error)' }}>*</span>
          </label>
          <input
            id="checkout-email"
            type="email"
            required
            disabled={submitting}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1.5px solid var(--color-outline-variant)',
              background: 'var(--color-surface)',
              color: 'var(--color-on-surface)',
              fontSize: 'var(--text-body-medium-font-size)',
              fontFamily: 'var(--text-body-medium-font-family)',
              outline: 'none',
              transition: 'border-color 0.2s',
              width: '100%',
              boxSizing: 'border-box',
              opacity: submitting ? 0.6 : 1,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--color-primary)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--color-outline-variant)'
            }}
          />
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="checkout-name"
            style={{
              fontSize: 'var(--text-label-medium-font-size)',
              fontWeight: 600,
              color: 'var(--color-on-surface)',
              fontFamily: 'var(--text-label-medium-font-family)',
            }}
          >
            Name{' '}
            <span style={{ color: 'var(--color-outline)', fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            id="checkout-name"
            type="text"
            disabled={submitting}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1.5px solid var(--color-outline-variant)',
              background: 'var(--color-surface)',
              color: 'var(--color-on-surface)',
              fontSize: 'var(--text-body-medium-font-size)',
              fontFamily: 'var(--text-body-medium-font-family)',
              outline: 'none',
              transition: 'border-color 0.2s',
              width: '100%',
              boxSizing: 'border-box',
              opacity: submitting ? 0.6 : 1,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--color-primary)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--color-outline-variant)'
            }}
          />
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="checkout-phone"
            style={{
              fontSize: 'var(--text-label-medium-font-size)',
              fontWeight: 600,
              color: 'var(--color-on-surface)',
              fontFamily: 'var(--text-label-medium-font-family)',
            }}
          >
            Phone{' '}
            <span style={{ color: 'var(--color-outline)', fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            id="checkout-phone"
            type="tel"
            disabled={submitting}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+234 ..."
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1.5px solid var(--color-outline-variant)',
              background: 'var(--color-surface)',
              color: 'var(--color-on-surface)',
              fontSize: 'var(--text-body-medium-font-size)',
              fontFamily: 'var(--text-body-medium-font-family)',
              outline: 'none',
              transition: 'border-color 0.2s',
              width: '100%',
              boxSizing: 'border-box',
              opacity: submitting ? 0.6 : 1,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--color-primary)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--color-outline-variant)'
            }}
          />
        </div>

        {/* Error message */}
        {error && (
          <div
            className="px-4 py-3 rounded-lg flex items-start gap-2"
            style={{
              background: 'var(--color-error-container)',
              border: '1px solid var(--color-error)',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: 'var(--color-error)', flexShrink: 0, marginTop: 1 }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p
              style={{
                color: 'var(--color-on-error-container)',
                fontSize: 'var(--text-body-small-font-size)',
                fontFamily: 'var(--text-body-small-font-family)',
              }}
            >
              {error}
            </p>
          </div>
        )}

        {/* Pay button */}
        <button
          id="checkout-pay-button"
          type="submit"
          disabled={submitting}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '14px 24px',
            borderRadius: '12px',
            border: 'none',
            cursor: submitting ? 'not-allowed' : 'pointer',
            background: submitting
              ? 'var(--color-surface-container-high)'
              : 'linear-gradient(135deg, var(--color-primary) 0%, color-mix(in srgb, var(--color-primary) 80%, var(--color-secondary)) 100%)',
            color: submitting ? 'var(--color-outline)' : 'var(--color-on-primary)',
            fontSize: 'var(--text-label-large-font-size)',
            fontWeight: 700,
            fontFamily: 'var(--text-label-large-font-family)',
            letterSpacing: '0.01em',
            transition: 'all 0.2s ease',
            boxShadow: submitting
              ? 'none'
              : '0 4px 16px color-mix(in srgb, var(--color-primary) 40%, transparent)',
          }}
        >
          {submitting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                <path
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  fill="currentColor"
                  opacity="0.75"
                />
              </svg>
              Redirecting to payment…
            </>
          ) : (
            <>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              Pay {price} Securely
            </>
          )}
        </button>

        {/* Trust badge */}
        <div
          className="flex items-center justify-center gap-2"
          style={{ color: 'var(--color-outline)' }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span style={{ fontSize: '11px', fontWeight: 500 }}>
            Secured by Flutterwave · SSL encrypted
          </span>
        </div>
      </form>
    </div>
  )
}
