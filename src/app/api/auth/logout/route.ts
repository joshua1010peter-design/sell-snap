import { NextResponse } from 'next/server'
import { logoutUser } from '@/lib/auth'

export async function POST() {
  try {
    await logoutUser()
    return NextResponse.redirect(new URL('/auth?mode=login', process.env.APP_URL || 'http://localhost:3000'))
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 },
    )
  }
}
