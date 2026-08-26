import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/dashboard/header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDateTime } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const orders = await prisma.order.findMany({
    where: { sellerId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: { product: { select: { name: true } } },
      },
    },
  })

  const statusBadge = (status: string) => {
    switch (status) {
      case 'PAID': return <Badge variant="success">Paid</Badge>
      case 'PENDING': return <Badge variant="warning">Pending</Badge>
      case 'FAILED': return <Badge variant="error">Failed</Badge>
      case 'REFUNDED': return <Badge variant="error">Refunded</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  return (
    <div>
      <Header
        title="Orders"
        description="View and manage your orders."
      />

      {orders.length === 0 ? (
        <Card>
          <CardContent>
            <div className="py-12 text-center">
              <p
                className="mb-2"
                style={{ fontSize: 'var(--text-title-medium-font-size)', color: 'var(--color-on-surface)' }}
              >
                No orders yet
              </p>
              <p style={{ fontSize: 'var(--text-body-medium-font-size)', color: 'var(--color-on-surface-variant)' }}>
                Share your product links to start receiving orders.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <div className="flex flex-col">
              <div
                className="grid grid-cols-5 gap-4 px-4 py-3 rounded-lg"
                style={{
                  backgroundColor: 'var(--color-surface-container-low)',
                  fontSize: 'var(--text-label-medium-font-size)',
                  color: 'var(--color-on-surface-variant)',
                }}
              >
                <span className="col-span-2">Product</span>
                <span>Buyer</span>
                <span>Amount</span>
                <span>Status</span>
              </div>
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="grid grid-cols-5 gap-4 px-4 py-4 items-center border-b transition-colors hover:bg-[var(--color-surface-container-low)]"
                  style={{
                    borderColor: 'var(--color-outline-variant)',
                    textDecoration: 'none',
                  }}
                >
                  <div className="col-span-2">
                    <p style={{ color: 'var(--color-on-surface)', fontSize: 'var(--text-body-medium-font-size)' }}>
                      {order.items[0]?.product.name ?? 'Order'}
                      {order.items.length > 1 ? ` +${order.items.length - 1}` : ''}
                    </p>
                    <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--text-body-small-font-size)' }}>
                      {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <p style={{ color: 'var(--color-on-surface)', fontSize: 'var(--text-body-medium-font-size)' }}>
                    {order.buyerEmail}
                  </p>
                  <p style={{ color: 'var(--color-on-surface)', fontSize: 'var(--text-body-medium-font-size)' }}>
                    {formatPrice(order.totalAmount)}
                  </p>
                  <div>{statusBadge(order.status)}</div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
