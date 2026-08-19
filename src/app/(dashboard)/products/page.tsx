import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/dashboard/header'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice, formatDate } from '@/lib/utils'

export default async function ProductsPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const products = await prisma.product.findMany({
    where: { sellerId: user.id },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <Header
        title="Products"
        description="Manage your product catalog."
        action={
          <Link href="/products/new">
            <Button>New Product</Button>
          </Link>
        }
      />

      {products.length === 0 ? (
        <Card>
          <CardContent>
            <div className="py-12 text-center">
              <p
                className="mb-4"
                style={{
                  fontSize: 'var(--text-title-medium-font-size)',
                  color: 'var(--color-on-surface)',
                }}
              >
                No products yet
              </p>
              <p
                className="mb-6"
                style={{
                  fontSize: 'var(--text-body-medium-font-size)',
                  color: 'var(--color-on-surface-variant)',
                }}
              >
                Create your first product and start selling with just a link.
              </p>
              <Link href="/products/new">
                <Button size="lg">Create Product</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              style={{ textDecoration: 'none' }}
            >
              <Card className="h-full transition-shadow hover:shadow-lg">
                <div
                  className="aspect-video rounded-lg mb-4 flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--color-surface-container-low)',
                  }}
                >
                  {JSON.parse(product.images).length > 0 ? (
                      <img
                        src={JSON.parse(product.images)[0]}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span style={{ fontSize: 48 }}>📦</span>
                  )}
                </div>
                <CardTitle>{product.name}</CardTitle>
                <p
                  className="mt-1 mb-3"
                  style={{
                    fontSize: 'var(--text-title-medium-font-size)',
                    fontWeight: 600,
                    color: 'var(--color-primary-container)',
                  }}
                >
                  {formatPrice(product.price)}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant={product.published ? 'success' : 'default'}>
                    {product.published ? 'Published' : 'Draft'}
                  </Badge>
                  <span
                    style={{
                      fontSize: 'var(--text-body-small-font-size)',
                      color: 'var(--color-on-surface-variant)',
                    }}
                  >
                    {formatDate(product.createdAt)}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
