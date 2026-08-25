import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkoutSchema } from '@/lib/validators/checkout'
import { logPaymentEvent } from '@/lib/payment-log'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const FLW_BASE = 'https://api.flutterwave.com/v3'

async function createFlutterwavePaymentLink(payload: {
  tx_ref: string
  amount: number
  currency: string
  redirect_url: string
  customer: { email: string; name?: string; phonenumber?: string }
  customizations: { title: string; description: string }
}): Promise<string> {
  const secretKey = process.env.FLW_SECRET_KEY
  if (!secretKey) throw new Error('FLW_SECRET_KEY is not configured')

  const res = await fetch(`${FLW_BASE}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secretKey}`,
    },
    body: JSON.stringify(payload),
  })

  const data = await res.json()

  if (!res.ok || data.status !== 'success') {
    const safeData = { ...data }
    if (safeData.data && typeof safeData.data === 'object') {
      const d = safeData.data as Record<string, unknown>
      if (typeof d.flw_ref === 'string') d.flw_ref = '[REDACTED]'
    }
    delete safeData.secret_key
    console.error('Flutterwave /payments error:', JSON.stringify(safeData))
    throw new Error('Failed to create payment link')
  }

  const link: string = data.data?.link
  if (!link || typeof link !== 'string' || !link.startsWith('https://')) {
    throw new Error('Invalid payment link returned from Flutterwave')
  }

  return link
}

export async function POST(request: NextRequest) {
  try {
    // I1: CSRF — reject cross-origin requests unless from our own domain
    const origin = request.headers.get('origin')
    const appUrl = process.env.APP_URL
    if (origin && appUrl) {
      try {
        const allowedOrigin = new URL(appUrl).origin
        if (origin !== allowedOrigin) {
          return NextResponse.json(
            { ok: false, error: { code: 'FORBIDDEN', message: 'Invalid origin' } },
            { status: 403 },
          )
        }
      } catch {
        // If APP_URL is malformed, skip origin check (the redirect URL validation below will catch it)
      }
    }

    const ip = getClientIp(request)
    const rateLimit = await checkRateLimit(`checkout:${ip}`, {
      windowMs: 60_000,
      maxRequests: 10,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } },
        { status: 429 },
      )
    }

    const body = await request.json()
    const parsed = checkoutSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'VALIDATION',
            message: parsed.error.issues[0]?.message ?? 'Invalid input',
          },
        },
        { status: 400 },
      )
    }

    const { productId, buyerEmail: rawEmail, buyerName, buyerPhone, quantity } = parsed.data
    // I2: Normalize email before storage
    const buyerEmail = rawEmail.trim().toLowerCase()

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { seller: { select: { id: true, name: true } } },
    })

    if (!product || !product.published) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 },
      )
    }

    const totalAmount = product.price * quantity

    if (totalAmount <= 0) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION', message: 'Invalid amount' } },
        { status: 400 },
      )
    }

    if (totalAmount < 100) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION', message: 'Minimum amount is ₦1.00' } },
        { status: 400 },
      )
    }

    // M2: Validate redirect URL — ensure APP_URL is a valid origin
    if (!appUrl || !URL.canParse(appUrl)) {
      console.error('APP_URL is not configured or invalid')
      return NextResponse.json(
        { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' } },
        { status: 500 },
      )
    }
    const parsedAppUrl = new URL(appUrl)

    // Create the pending order first so we have an ID for tx_ref
    // C2/L1: Wrap in try/catch — mark FAILED if Flutterwave call fails
    let order: Awaited<ReturnType<typeof prisma.order.create>> | null = null
    try {
      order = await prisma.order.create({
        data: {
          buyerEmail,
          buyerName: buyerName || null,
          buyerPhone: buyerPhone || null,
          totalAmount,
          currency: product.currency,
          sellerId: product.sellerId,
          status: 'PENDING',
          items: {
            create: {
              productId: product.id,
              quantity,
              price: product.price,
            },
          },
        },
      })

      await logPaymentEvent({
        orderId: order.id,
        event: 'CHECKOUT_INITIATED',
        amount: totalAmount,
        currency: product.currency,
        status: 'PENDING',
        metadata: { productId, productName: product.name, quantity },
      })

      const redirectUrl = `${parsedAppUrl.origin}/p/${product.slug}?paid=true&tx_ref=${order.id}`

      const paymentLink = await createFlutterwavePaymentLink({
        tx_ref: order.id,
        amount: totalAmount / 100,
        currency: product.currency,
        redirect_url: redirectUrl,
        customer: {
          email: buyerEmail,
          ...(buyerName && { name: buyerName }),
          ...(buyerPhone && { phonenumber: buyerPhone }),
        },
        customizations: {
          title: product.seller.name || 'SELL SNAP',
          description: `Payment for ${product.name}`,
        },
      })

      return NextResponse.json({
        ok: true,
        data: {
          orderId: order.id,
          paymentLink,
        },
      })
    } catch (paymentError) {
      // C2: Mark the order as FAILED if the Flutterwave call fails
      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'FAILED' },
        })

        await logPaymentEvent({
          orderId: order.id,
          event: 'CHECKOUT_FAILED',
          amount: totalAmount,
          currency: product.currency,
          status: 'FAILED',
          message: 'Failed to create Flutterwave payment link',
          metadata: {
            error: paymentError instanceof Error ? paymentError.message : 'Unknown error',
          },
        })
      }
      throw paymentError
    }
  } catch (error) {
    console.error('Checkout error:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' } },
      { status: 500 },
    )
  }
}
