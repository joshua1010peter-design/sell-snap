import { NextRequest, NextResponse } from 'next/server'
import { loginUser } from '@/lib/auth'
import { loginSchema } from '@/lib/validators/auth'
import { AppError } from '@/lib/errors'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rateLimit = await checkRateLimit(`login:${ip}`, {
      windowMs: 60_000,
      maxRequests: 5,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Please try again later.' } },
        { status: 429 },
      )
    }

    const body = await request.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 },
      )
    }

    const user = await loginUser(parsed.data.email, parsed.data.password)

    return NextResponse.json({ ok: true, data: { id: user.id, name: user.name, email: user.email } })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      )
    }
    console.error('[login] Unexpected error:', {
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
