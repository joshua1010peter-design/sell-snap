import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { Suspense } from 'react'
import { CheckoutForm } from '@/components/payment/checkout-form'
import { PaymentStatus } from '@/components/payment/payment-status'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

function isValidImageUrl(url: string): boolean {
  if (url.startsWith('/')) return true
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function parseProductImages(images: string): string[] {
  try {
    const parsed = JSON.parse(images)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((url): url is string => typeof url === 'string' && isValidImageUrl(url))
  } catch {
    return []
  }
}

function resolveImageUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const base = process.env.APP_URL || 'http://localhost:3000'
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  const product = await prisma.product.findUnique({
    where: { slug },
    include: { seller: { select: { businessName: true } } },
  })

  if (!product || !product.published) {
    return { title: 'Product Not Found' }
  }

  const images = parseProductImages(product.images)
  const imageUrl = images.length > 0 ? resolveImageUrl(images[0]) : undefined
  const description = product.description || `Buy ${product.name} on SELL SNAP`
  const seller = product.seller.businessName || 'SELL SNAP'

  return {
    title: `${product.name} | ${seller}`,
    description,
    openGraph: {
      title: product.name,
      description,
      url: `${process.env.APP_URL || 'http://localhost:3000'}/p/${product.slug}`,
      siteName: 'SELL SNAP',
      type: 'website',
      ...(imageUrl && {
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: product.name,
          },
        ],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      seller: { select: { businessName: true, name: true } },
    },
  })

  if (!product || !product.published) {
    notFound()
  }

  const images = parseProductImages(product.images)

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <header className="px-6 py-4">
        <Link
          href="/"
          style={{
            fontSize: 'var(--text-title-large-font-size)',
            fontWeight: 700,
            color: 'var(--color-primary)',
            textDecoration: 'none',
          }}
        >
          SELL SNAP
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div
          className="max-w-2xl w-full rounded-xl overflow-hidden"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          <div
            className="aspect-video flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-surface-container-low)' }}
          >
            {images.length > 0 ? (
              <img
                src={images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span style={{ fontSize: 80 }}>📦</span>
            )}
          </div>

          <div className="p-8">
            <h1
              style={{
                fontSize: 'var(--text-headline-medium-font-size)',
                fontWeight: 'var(--text-headline-medium-font-weight)',
                lineHeight: 'var(--text-headline-medium-line-height)',
                fontFamily: 'var(--text-headline-medium-font-family)',
                color: 'var(--color-on-surface)',
              }}
            >
              {product.name}
            </h1>

            <p
              className="mt-2"
              style={{
                fontSize: 'var(--text-title-large-font-size)',
                fontWeight: 600,
                color: 'var(--color-primary-container)',
              }}
            >
              {formatPrice(product.price)}
            </p>

            {product.description && (
              <p
                className="mt-4"
                style={{
                  fontSize: 'var(--text-body-medium-font-size)',
                  lineHeight: 1.6,
                  color: 'var(--color-on-surface-variant)',
                  fontFamily: 'var(--text-body-medium-font-family)',
                }}
              >
                {product.description}
              </p>
            )}

            {product.seller.businessName && (
              <p
                className="mt-6"
                style={{
                  fontSize: 'var(--text-body-small-font-size)',
                  color: 'var(--color-outline)',
                  fontFamily: 'var(--text-body-small-font-family)',
                }}
              >
                Sold by {product.seller.businessName}
              </p>
            )}

            <Suspense fallback={null}>
              <PaymentStatus />
            </Suspense>

            <CheckoutForm
              productId={product.id}
              productName={product.name}
              price={formatPrice(product.price)}
              productSlug={product.slug}
            />

            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Check this out: ${process.env.APP_URL || ''}/p/${product.slug}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center justify-center px-6 py-3 rounded-lg w-full transition-colors"
              style={{
                backgroundColor: '#25D366',
                color: 'white',
                fontSize: 'var(--text-label-large-font-size)',
                fontWeight: 'var(--text-label-large-font-weight)',
                fontFamily: 'var(--text-label-large-font-family)',
                textDecoration: 'none',
              }}
            >
              Share on WhatsApp
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
