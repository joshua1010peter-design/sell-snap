import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createProductSchema } from '@/lib/validators/product'
import { generateSlug } from '@/lib/utils'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 },
      )
    }

    const products = await prisma.product.findMany({
      where: { sellerId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ ok: true, data: products })
  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 },
    )
  }
}

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
    const parsed = createProductSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 },
      )
    }

    const slug = generateSlug(parsed.data.name)

    const product = await prisma.product.create({
      data: {
        sellerId: user.id,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        price: parsed.data.price,
        currency: parsed.data.currency,
        images: JSON.stringify(parsed.data.images ?? []),
        slug,
        published: body.published ?? false,
      },
    })

    return NextResponse.json({ ok: true, data: product })
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 },
    )
  }
}
