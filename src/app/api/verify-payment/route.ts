import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyTransaction, amountsMatch } from '@/lib/flutterwave'
import { logPaymentEvent } from '@/lib/payment-log'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { formatPrice } from '@/lib/utils'
import { sendOrderConfirmation, sendSellerNotification } from '@/lib/email'

const VALID_ID = /^c[a-z0-9]{24}$/

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request)

    const ipRateLimit = await checkRateLimit(`verify:${ip}`, {
      windowMs: 60_000,
      maxRequests: 30,
    })

    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } },
        { status: 429 },
      )
    }

    const transactionId = request.nextUrl.searchParams.get('transaction_id')
    const orderId = request.nextUrl.searchParams.get('tx_ref')

    if (!orderId) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION', message: 'Missing tx_ref' } },
        { status: 400 },
      )
    }

    if (!VALID_ID.test(orderId)) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION', message: 'Invalid order reference' } },
        { status: 400 },
      )
    }

    const orderRateLimit = await checkRateLimit(`verify:${orderId}:${ip}`, {
      windowMs: 30_000,
      maxRequests: 15,
    })

    if (!orderRateLimit.allowed) {
      return NextResponse.json(
        { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many requests for this order. Please try again later.' } },
        { status: 429 },
      )
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } })

    if (!order) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Order not found' } },
        { status: 404 },
      )
    }

    if (order.status === 'PAID') {
      return NextResponse.json({ ok: true, data: { status: 'PAID' } })
    }

    if (order.status === 'REFUNDED') {
      return NextResponse.json({ ok: true, data: { status: order.status } })
    }

    if (!transactionId) {
      return NextResponse.json({ ok: true, data: { status: 'PENDING' } })
    }

    const verification = await verifyTransaction(transactionId)
    const isSuccessful = verification.status === 'successful'
    const amountsOk = amountsMatch(verification.amount, order.totalAmount)
    const currenciesMatch = verification.currency === order.currency
    const refsMatch = verification.tx_ref === order.id

    if (!isSuccessful || !amountsOk || !currenciesMatch || !refsMatch) {
      await logPaymentEvent({
        orderId: order.id,
        event: 'VERIFICATION_MISMATCH',
        amount: order.totalAmount,
        currency: order.currency,
        status: order.status,
        message: 'Amount, currency, or reference mismatch — pending webhook confirmation',
        metadata: {
          transactionId,
          flutterwaveAmount: verification.amount,
          flutterwaveCurrency: verification.currency,
          flutterwaveTxRef: verification.tx_ref,
        },
      })

      return NextResponse.json(
        { ok: true, data: { status: 'PENDING' } },
      )
    }

    const updated = await prisma.order.updateMany({
      where: { id: order.id, status: { in: ['PENDING', 'FAILED'] } },
      data: { status: 'PAID', flutterwaveId: transactionId },
    })

    if (updated.count === 0) {
      return NextResponse.json({ ok: true, data: { status: 'PAID' } })
    }

    await logPaymentEvent({
      orderId: order.id,
      event: 'VERIFICATION_SUCCESS',
      amount: order.totalAmount,
      currency: order.currency,
      status: 'PAID',
      message: 'Flutterwave API verification passed, order confirmed',
      metadata: { transactionId },
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

    return NextResponse.json({ ok: true, data: { status: 'PAID' } })
  } catch (error) {
    console.error('Verify payment error:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Verification failed' } },
      { status: 500 },
    )
  }
}
