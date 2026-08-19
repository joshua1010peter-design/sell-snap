'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

type PaymentState = 'verifying' | 'awaiting_webhook' | 'success' | 'failed' | 'cancelled'

const VALID_CUID = /^c[a-z0-9]{24}$/
const VALID_TX_ID = /^\d{1,20}$/

function getInitialState(
  status: string | null,
  transactionId: string | null,
  txRef: string | null,
): PaymentState | null {
  if (!status && !transactionId && !txRef) return null
  if (status === 'cancelled') return 'cancelled'
  if (VALID_CUID.test(txRef ?? '')) return 'verifying'
  if (status === 'successful' && VALID_TX_ID.test(transactionId ?? '')) return 'verifying'
  return 'failed'
}

function cleanPaymentParams(searchParams: URLSearchParams, router: ReturnType<typeof useRouter>) {
  const params = new URLSearchParams(searchParams.toString())
  params.delete('status')
  params.delete('transaction_id')
  params.delete('tx_ref')
  params.delete('paid')
  const clean = params.toString()
  router.replace(clean ? `?${clean}` : window.location.pathname, { scroll: false })
}

const POLL_INTERVAL_MS = 3000
const MAX_POLL_ATTEMPTS = 45

interface StatusConfig {
  icon: React.ReactNode
  title: string
  subtitle: string
  bg: string
  border: string
  titleColor: string
  subtitleColor: string
  iconBg: string
}

function SuccessIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75" />
    </svg>
  )
}

function PulseIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}

function FailIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  )
}

function CancelIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  )
}

export function PaymentStatus() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const statusParam = searchParams.get('status')
  const transactionId = searchParams.get('transaction_id')
  const txRef = searchParams.get('tx_ref')
  const ran = useRef(false)

  const [state, setState] = useState<PaymentState | null>(() =>
    getInitialState(statusParam, transactionId, txRef),
  )
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (state) {
      // Slight delay so the animation triggers after mount
      const t = setTimeout(() => setVisible(true), 50)
      return () => clearTimeout(t)
    }
  }, [state])

  const verify = useCallback(async (): Promise<PaymentState> => {
    if (!txRef) return 'failed'
    const params = new URLSearchParams({ tx_ref: txRef })
    if (transactionId) { params.set('transaction_id', transactionId) }
    const res = await fetch(`/api/verify-payment?${params.toString()}`)
    const data = await res.json()

    if (data.ok && data.data.status === 'PAID') return 'success'
    if (data.ok && data.data.status === 'VERIFIED') return 'awaiting_webhook'
    if (data.ok && data.data.status === 'PENDING') return 'verifying'
    return 'failed'
  }, [transactionId, txRef])

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    if (!state) return

    if (state === 'cancelled' || state === 'failed') {
      const t = setTimeout(() => cleanPaymentParams(searchParams, router), 3000)
      return () => clearTimeout(t)
    }

    let cancelled = false

    async function poll() {
      for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
        if (cancelled) return

        try {
          const result = await verify()
          if (cancelled) return

          if (result === 'success') {
            setState('success')
            setTimeout(() => cleanPaymentParams(searchParams, router), 4000)
            return
          }

          if (result === 'awaiting_webhook') {
            setState('awaiting_webhook')
          }
        } catch {
          if (cancelled) return
        }

        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
      }

      if (!cancelled) {
        setState('failed')
        setTimeout(() => cleanPaymentParams(searchParams, router), 3000)
      }
    }

    poll()

    return () => {
      cancelled = true
    }
  }, [state, transactionId, txRef, searchParams, router, verify])

  if (!state) return null

  const configs: Record<PaymentState, StatusConfig> = {
    verifying: {
      icon: <SpinnerIcon />,
      title: 'Verifying payment…',
      subtitle: 'Please wait while we confirm your payment.',
      bg: 'color-mix(in srgb, var(--color-tertiary) 12%, var(--color-surface))',
      border: 'var(--color-tertiary)',
      titleColor: 'var(--color-on-tertiary-container)',
      subtitleColor: 'var(--color-on-surface-variant)',
      iconBg: 'color-mix(in srgb, var(--color-tertiary) 20%, transparent)',
    },
    awaiting_webhook: {
      icon: <PulseIcon />,
      title: 'Payment confirmed!',
      subtitle: 'Waiting for final confirmation from our payment processor.',
      bg: 'color-mix(in srgb, var(--color-secondary) 12%, var(--color-surface))',
      border: 'var(--color-secondary)',
      titleColor: 'var(--color-on-secondary-container)',
      subtitleColor: 'var(--color-on-surface-variant)',
      iconBg: 'color-mix(in srgb, var(--color-secondary) 20%, transparent)',
    },
    success: {
      icon: <SuccessIcon />,
      title: 'Payment successful! 🎉',
      subtitle: 'Thank you! Your order has been confirmed. Check your email for details.',
      bg: 'color-mix(in srgb, var(--color-primary) 12%, var(--color-surface))',
      border: 'var(--color-primary)',
      titleColor: 'var(--color-primary)',
      subtitleColor: 'var(--color-on-surface-variant)',
      iconBg: 'color-mix(in srgb, var(--color-primary) 20%, transparent)',
    },
    failed: {
      icon: <FailIcon />,
      title: 'Payment failed',
      subtitle: 'We could not verify your payment. Please contact the seller if you were charged.',
      bg: 'var(--color-error-container)',
      border: 'var(--color-error)',
      titleColor: 'var(--color-error)',
      subtitleColor: 'var(--color-on-error-container)',
      iconBg: 'color-mix(in srgb, var(--color-error) 20%, transparent)',
    },
    cancelled: {
      icon: <CancelIcon />,
      title: 'Payment cancelled',
      subtitle: 'You cancelled the payment. You can try again whenever you\'re ready.',
      bg: 'var(--color-surface-container)',
      border: 'var(--color-outline-variant)',
      titleColor: 'var(--color-on-surface)',
      subtitleColor: 'var(--color-on-surface-variant)',
      iconBg: 'var(--color-surface-container-high)',
    },
  }

  const cfg = configs[state]

  return (
    <div
      className="mt-6"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-12px)',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
      }}
    >
      <div
        className="rounded-2xl p-5 flex items-start gap-4"
        style={{
          background: cfg.bg,
          border: `1.5px solid ${cfg.border}`,
        }}
      >
        {/* Icon */}
        <div
          className="shrink-0 flex items-center justify-center rounded-full"
          style={{
            width: 52,
            height: 52,
            background: cfg.iconBg,
            color: cfg.border,
          }}
        >
          {cfg.icon}
        </div>

        {/* Text */}
        <div>
          <p
            style={{
              fontSize: 'var(--text-title-medium-font-size)',
              fontWeight: 700,
              fontFamily: 'var(--text-title-medium-font-family)',
              color: cfg.titleColor,
              lineHeight: 1.3,
            }}
          >
            {cfg.title}
          </p>
          <p
            className="mt-1"
            style={{
              fontSize: 'var(--text-body-small-font-size)',
              fontFamily: 'var(--text-body-small-font-family)',
              color: cfg.subtitleColor,
              lineHeight: 1.5,
            }}
          >
            {cfg.subtitle}
          </p>
        </div>
      </div>
    </div>
  )
}
