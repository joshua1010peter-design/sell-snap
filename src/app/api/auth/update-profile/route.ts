import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 },
      )
    }

    const body = await request.json()
    const { name, businessName } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Name is required' } },
        { status: 400 },
      )
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name, businessName: businessName || null },
    })

    return NextResponse.json({
      ok: true,
      data: { id: updated.id, name: updated.name, email: updated.email, businessName: updated.businessName },
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 },
    )
  }
}
