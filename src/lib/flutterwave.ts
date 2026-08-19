import crypto from 'crypto'

const FLW_BASE = 'https://api.flutterwave.com/v3'
const VALID_TX_ID = /^\d{1,20}$/

async function flwFetch<T = Record<string, unknown>>(path: string, options: RequestInit = {}): Promise<T> {
  const secretKey = process.env.FLW_SECRET_KEY
  if (!secretKey) throw new Error('FLW_SECRET_KEY is not configured')

  const res = await fetch(`${FLW_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secretKey}`,
      ...options.headers,
    },
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error('Payment gateway error — please try again')
  }

  return data
}

export interface VerifiedTransaction {
  id: number
  tx_ref: string
  amount: number
  currency: string
  status: string
  charged_amount: number
}

export function amountsMatch(fwAmount: number, orderAmountKobo: number): boolean {
  // Avoid IEEE 754 floating-point precision issues by working through string representation
  const fwInKobo = Math.round(Number(fwAmount.toFixed(2)) * 100)
  return fwInKobo === orderAmountKobo
}

export async function verifyTransaction(transactionId: string) {
  if (!VALID_TX_ID.test(transactionId)) {
    throw new Error('Invalid transaction ID format')
  }
  const data = await flwFetch<{ data: VerifiedTransaction }>(
    `/transactions/${encodeURIComponent(transactionId)}/verify`,
  )
  return data.data
}

export function verifyWebhookSignature(signature: string): boolean {
  const secretHash = process.env.FLW_SECRET_HASH
  if (!secretHash) {
    throw new Error('Webhook verification unavailable: FLW_SECRET_HASH not configured')
  }

  const sigBuf = Buffer.from(signature)
  const hashBuf = Buffer.from(secretHash)

  if (sigBuf.length !== hashBuf.length) {
    return false
  }

  return crypto.timingSafeEqual(sigBuf, hashBuf)
}
