import { NextRequest, NextResponse } from 'next/server'
import { signupUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { signupSchema } from '@/lib/validators/auth'
import { AppError } from '@/lib/errors'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rateLimit = await checkRateLimit(`signup:${ip}`, {
      windowMs: 60_000,
      maxRequests: 3,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many signup attempts. Please try again later.' } },
        { status: 429 },
      )
    }

    const body = await request.json()
    const parsed = signupSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 },
      )
    }

    const user = await signupUser(parsed.data.name, parsed.data.email, parsed.data.password)

    if (parsed.data.businessName) {
      await prisma.user.update({
        where: { id: user.id },
        data: { businessName: parsed.data.businessName },
      })
    }

    sendWelcomeEmail({ email: user.email, name: user.name })

    return NextResponse.json({ ok: true, data: { id: user.id, name: user.name, email: user.email } })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      )
    }
    console.error('[signup] Unexpected error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    })
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 },
    )
  }
}
