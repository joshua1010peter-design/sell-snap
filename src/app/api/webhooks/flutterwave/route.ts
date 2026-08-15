import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyWebhookSignature, amountsMatch } from '@/lib/flutterwave'
import { logPaymentEvent } from '@/lib/payment-log'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { formatPrice } from '@/lib/utils'
import { sendOrderConfirmation, sendSellerNotification } from '@/lib/email'
import { z } from 'zod'

const webhookEventSchema = z.object({
  event: z.string(),
  data: z.object({
    id: z.union([z.string(), z.number()]),
    tx_ref: z.string().optional(),
    amount: z.union([z.string(), z.number()]),
    currency: z.string(),
    status: z.string(),
  }),
})

function ipToNumber(ip: string): number | null {
  const parts = ip.split('.')
  if (parts.length !== 4) return null
  return (
    ((parseInt(parts[0], 10) << 24) |
      (parseInt(parts[1], 10) << 16) |
      (parseInt(parts[2], 10) << 8) |
      parseInt(parts[3], 10)) >>>
    0
  )
}

function cidrMatch(ip: string, cidr: string): boolean {
  const [subnet, bits] = cidr.split('/')
  const prefix = parseInt(bits, 10)
  const ipNum = ipToNumber(ip)
  const subnetNum = ipToNumber(subnet)
  if (ipNum === null || subnetNum === null) return false
  const mask = (~0 << (32 - prefix)) >>> 0
  return (ipNum & mask) === (subnetNum & mask)
}

function isAllowedWebhookIp(ip: string): boolean {
  const allowedIps = process.env.FLW_WEBHOOK_IPS
  if (!allowedIps) {
    console.warn('FLW_WEBHOOK_IPS is not set — skipping IP allowlist. Set this in production.')
    return true
  }

  const whitelist = allowedIps.split(',').map((s) => s.trim())
  return whitelist.some((cidr) => {
    if (cidr.includes('/')) return cidrMatch(ip, cidr)
    return ip === cidr
  })
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)

    if (!isAllowedWebhookIp(ip)) {
      console.warn(`Webhook request from disallowed IP: ${ip}`)
      return NextResponse.json(
        { ok: false, error: { code: 'FORBIDDEN', message: 'IP not allowed' } },
        { status: 403 },
      )
    }

    const rateLimit = await checkRateLimit(`webhook:${ip}`, {
      windowMs: 60_000,
      maxRequests: 100,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
        { status: 429 },
      )
    }

    const signature = request.headers.get('verif-hash')
    if (!signature) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'Missing signature' } },
        { status: 401 },
      )
    }

    if (!verifyWebhookSignature(signature)) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'Invalid signature' } },
        { status: 401 },
      )
    }

    const body = await request.json()
    const parsed = webhookEventSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ ok: true, data: { received: true } })
    }

    const { event, data: webhookData } = parsed.data

    if (event === 'charge.completed' && webhookData.status === 'successful') {
      const txRef = webhookData.tx_ref
      const flutterwaveId = String(webhookData.id)

      if (!txRef) {
        return NextResponse.json({ ok: true, data: { received: true } })
      }

      // Step 1: Read the order FIRST and validate BEFORE any writes (fix TOCTOU)
      const order = await prisma.order.findUnique({ where: { id: txRef } })
      if (!order || (order.status !== 'PENDING' && order.status !== 'FAILED')) {
        // Already processed or not found — idempotent
        return NextResponse.json({ ok: true, data: { received: true } })
      }

      const amountsOk = amountsMatch(Number(webhookData.amount), order.totalAmount)
      const currenciesMatch = webhookData.currency === order.currency

      if (!amountsOk || !currenciesMatch) {
        await prisma.order.update({
          where: { id: order.id, status: { in: ['PENDING', 'FAILED'] } },
          data: { status: 'FAILED' },
        })

        await logPaymentEvent({
          orderId: order.id,
          event: 'WEBHOOK_MISMATCH',
          amount: order.totalAmount,
          currency: order.currency,
          status: 'FAILED',
          message: 'Webhook amount/currency mismatch',
          metadata: {
            flutterwaveId,
            webhookAmount: webhookData.amount,
            webhookCurrency: webhookData.currency,
            orderAmount: order.totalAmount,
          },
        })

        return NextResponse.json({ ok: true, data: { received: true } })
      }

      // Step 2: All checks passed — single atomic write to PAID
      const updated = await prisma.order.updateMany({
        where: { id: txRef, status: { in: ['PENDING', 'FAILED'] } },
        data: { status: 'PAID', flutterwaveId },
      })

      if (updated.count === 0) {
        return NextResponse.json({ ok: true, data: { received: true } })
      }

      await logPaymentEvent({
        orderId: order.id,
        event: 'WEBHOOK_PROCESSED',
        amount: order.totalAmount,
        currency: order.currency,
        status: 'PAID',
        message: 'Webhook confirmed payment',
        metadata: {
          flutterwaveId,
          webhookAmount: webhookData.amount,
          webhookCurrency: webhookData.currency,
        },
      })

      const fullOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: {
          items: { include: { product: { select: { name: true } } } },
          seller: { select: { name: true, email: true, businessName: true } },
        },
      })

      if (fullOrder) {
        const productName = fullOrder.items[0]?.product?.name ?? 'Product'
        const quantity = fullOrder.items[0]?.quantity ?? 1
        const amountStr = formatPrice(fullOrder.totalAmount, fullOrder.currency)

        sendOrderConfirmation({
          buyerEmail: fullOrder.buyerEmail,
          buyerName: fullOrder.buyerName,
          productName,
          quantity,
          amount: amountStr,
          orderId: fullOrder.id,
        })

        sendSellerNotification({
          sellerEmail: fullOrder.seller.email,
          sellerName: fullOrder.seller.businessName ?? fullOrder.seller.name,
          productName,
          quantity,
          amount: amountStr,
          buyerName: fullOrder.buyerName,
          buyerEmail: fullOrder.buyerEmail,
          buyerPhone: fullOrder.buyerPhone,
          orderId: fullOrder.id,
        })
      }
    }

    return NextResponse.json({ ok: true, data: { received: true } })
  } catch (error) {
    console.error('Webhook error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: true, data: { received: true } })
  }
}
