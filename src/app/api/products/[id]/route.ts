import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { updateProductSchema } from '@/lib/validators/product'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 },
      )
    }

    const { id } = await params

    const product = await prisma.product.findUnique({ where: { id } })
    if (!product || product.sellerId !== user.id) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 },
      )
    }

    return NextResponse.json({ ok: true, data: product })
  } catch (error) {
    console.error('Get product error:', error)
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 },
      )
    }

    const { id } = await params

    const product = await prisma.product.findUnique({ where: { id } })
    if (!product || product.sellerId !== user.id) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 },
      )
    }

    const body = await request.json()
    const parsed = updateProductSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 },
      )
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.description !== undefined && { description: parsed.data.description }),
        ...(parsed.data.price !== undefined && { price: parsed.data.price }),
        ...(parsed.data.images !== undefined && { images: JSON.stringify(parsed.data.images) }),
        ...(body.published !== undefined && { published: body.published }),
        ...(parsed.data.name && { slug: undefined }),
      },
    })

    if (parsed.data.name && parsed.data.name !== product.name) {
      const { generateSlug } = await import('@/lib/utils')
      await prisma.product.update({
        where: { id },
        data: { slug: generateSlug(parsed.data.name) },
      })
    }

    return NextResponse.json({ ok: true, data: updated })
  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 },
      )
    }

    const { id } = await params

    const product = await prisma.product.findUnique({ where: { id } })
    if (!product || product.sellerId !== user.id) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 },
      )
    }

    await prisma.product.delete({ where: { id } })

    return NextResponse.json({ ok: true, data: null })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 },
    )
  }
}
