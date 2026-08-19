import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, changePassword } from '@/lib/auth'
import { changePasswordSchema } from '@/lib/validators/auth'
import { AppError } from '@/lib/errors'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 },
      )
    }

    const ip = getClientIp(request)
    const rateLimit = await checkRateLimit(`change-password:${ip}`, {
      windowMs: 60_000,
      maxRequests: 3,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again later.' } },
        { status: 429 },
      )
    }

    const body = await request.json()
    const parsed = changePasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 },
      )
    }

    await changePassword(user.id, parsed.data.currentPassword, parsed.data.newPassword)

    return NextResponse.json({ ok: true, data: { message: 'Password changed successfully' } })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      )
    }
    console.error('Change password error:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 },
    )
  }
}
