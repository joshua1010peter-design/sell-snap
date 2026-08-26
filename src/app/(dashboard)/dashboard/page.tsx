import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/dashboard/header'
import { StatsCard } from '@/components/dashboard/stats-card'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const productCount = await prisma.product.count({ where: { sellerId: user.id } })
  const publishedCount = await prisma.product.count({ where: { sellerId: user.id, published: true } })
  const orderCount = await prisma.order.count({ where: { sellerId: user.id } })
  const paidOrders = await prisma.order.findMany({
    where: { sellerId: user.id, status: 'PAID' },
    select: { totalAmount: true },
  })
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0)

  const recentOrders = await prisma.order.findMany({
    where: { sellerId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { items: { include: { product: { select: { name: true } } } } },
  })

  const recentProducts = await prisma.product.findMany({
    where: { sellerId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  return (
    <div>
      <Header
        title={`Welcome back, ${user.name}`}
        description="Here is what is happening with your store today."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard className="animate-fade-in-up delay-100" title="Total Products" value={productCount} icon="📦" />
        <StatsCard className="animate-fade-in-up delay-200" title="Published" value={publishedCount} icon="✅" />
        <StatsCard className="animate-fade-in-up delay-300" title="Total Orders" value={orderCount} icon="🛒" />
        <StatsCard className="animate-fade-in-up delay-400" title="Revenue" value={formatPrice(totalRevenue)} icon="💰" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up delay-500">
        <Card>
          <CardTitle>Recent Orders</CardTitle>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--color-surface-container-high)] flex items-center justify-center mb-4 text-3xl opacity-50">
                  🛒
                </div>
                <p
                  style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--text-body-medium-font-size)' }}
                >
                  No orders yet. Share your product links to start selling!
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 mt-4">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:bg-[color-mix(in_srgb,var(--color-primary)_5%,transparent)] group"
                    style={{
                      backgroundColor: 'var(--color-surface-container-low)',
                      textDecoration: 'none',
                    }}
                  >
                    <div>
                      <p style={{ color: 'var(--color-on-surface)', fontSize: 'var(--text-body-medium-font-size)', fontFamily: 'var(--text-body-medium-font-family)' }}>
                        {order.items[0]?.product.name ?? 'Order'} {order.items.length > 1 ? `+${order.items.length - 1} more` : ''}
                      </p>
                      <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--text-body-small-font-size)', fontFamily: 'var(--text-body-small-font-family)' }}>
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span style={{ color: 'var(--color-on-surface)', fontSize: 'var(--text-body-medium-font-size)' }}>
                        {formatPrice(order.totalAmount)}
                      </span>
                      <Badge variant={order.status === 'PAID' ? 'success' : order.status === 'PENDING' ? 'warning' : 'error'}>
                        {order.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Recent Products</CardTitle>
          <CardContent>
            {recentProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--color-surface-container-high)] flex items-center justify-center mb-4 text-3xl opacity-50">
                  📦
                </div>
                <p
                  style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--text-body-medium-font-size)' }}
                >
                  No products yet. Create your first product to start selling!
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 mt-4">
                {recentProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:bg-[color-mix(in_srgb,var(--color-primary)_5%,transparent)] group"
                    style={{
                      backgroundColor: 'var(--color-surface-container-low)',
                      textDecoration: 'none',
                    }}
                  >
                    <div>
                      <p style={{ color: 'var(--color-on-surface)', fontSize: 'var(--text-body-medium-font-size)', fontFamily: 'var(--text-body-medium-font-family)' }}>
                        {product.name}
                      </p>
                      <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--text-body-small-font-size)', fontFamily: 'var(--text-body-small-font-family)' }}>
                        {formatDate(product.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span style={{ color: 'var(--color-on-surface)', fontSize: 'var(--text-body-medium-font-size)' }}>
                        {formatPrice(product.price)}
                      </span>
                      <Badge variant={product.published ? 'success' : 'default'}>
                        {product.published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
