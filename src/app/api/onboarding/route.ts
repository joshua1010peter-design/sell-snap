import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { AppError } from '@/lib/errors'
import { generateSlug } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 },
      )
    }

    const body = await request.json()
    const { businessName, storeDescription, storePhone, product, currency } = body

    if (!businessName || typeof businessName !== 'string' || !businessName.trim()) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Business name is required' } },
        { status: 400 },
      )
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        businessName: businessName.trim(),
        storeDescription: storeDescription?.trim() || null,
        storePhone: storePhone?.trim() || null,
        onboardingComplete: true,
      },
    })

    if (product && product.name && product.price) {
      const slug = generateSlug(product.name)

      await prisma.product.create({
        data: {
          sellerId: user.id,
          name: product.name.trim(),
          price: product.price,
          currency: currency || 'NGN',
          images: product.image ? JSON.stringify([product.image]) : '[]',
          slug,
          published: false,
        },
      })
    }

    return NextResponse.json({ ok: true, data: { message: 'Onboarding complete' } })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      )
    }
    console.error('Onboarding error:', error)
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 },
    )
  }
}
