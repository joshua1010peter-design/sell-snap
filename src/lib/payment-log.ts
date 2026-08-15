import { prisma } from '@/lib/db'

const METADATA_MAX_LENGTH = 10_000

function truncateMetadata(raw: string): string {
  if (raw.length > METADATA_MAX_LENGTH) {
    return raw.slice(0, METADATA_MAX_LENGTH) + '…[truncated]'
  }
  return raw
}

export interface LogPaymentEvent {
  orderId?: string
  event: string
  amount?: number
  currency?: string
  status?: string
  message?: string
  metadata?: Record<string, unknown>
}

export async function logPaymentEvent(data: LogPaymentEvent): Promise<void> {
  try {
    await prisma.paymentLog.create({
      data: {
        orderId: data.orderId || null,
        event: data.event,
        amount: data.amount ?? null,
        currency: data.currency || null,
        status: data.status || null,
        message: data.message || null,
        metadata: data.metadata ? truncateMetadata(JSON.stringify(data.metadata)) : null,
      },
    })
  } catch (error) {
    console.error('CRITICAL: Failed to write payment log:', {
      event: data.event,
      orderId: data.orderId,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
