import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/dashboard/header'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDateTime } from '@/lib/utils'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/auth?mode=login')

  const { id } = await params

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: true },
      },
    },
  })

  if (!order || order.sellerId !== user.id) {
    notFound()
  }

  return (
    <div>
      <Header title={`Order #${order.id.slice(0, 8)}`} description={formatDateTime(order.createdAt)} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardTitle>Items</CardTitle>
            <CardContent>
              <div className="flex flex-col gap-3 mt-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--color-surface-container-low)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden"
                        style={{ backgroundColor: 'var(--color-surface-container)' }}
                      >
                        {(() => {
                          try {
                            const imgs = JSON.parse(item.product.images)
                            if (Array.isArray(imgs) && imgs.length > 0) {
                              return <img src={imgs[0]} alt={item.product.name} className="w-full h-full object-cover" />
                            }
                          } catch {}
                          return <span>📦</span>
                        })()}
                      </div>
                      <div>
                        <p style={{ color: 'var(--color-on-surface)', fontSize: 'var(--text-body-medium-font-size)' }}>
                          {item.product.name}
                        </p>
                        <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--text-body-small-font-size)' }}>
                          Qty: {item.quantity} × {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>
                    <p style={{ color: 'var(--color-on-surface)', fontSize: 'var(--text-body-medium-font-size)' }}>
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div
                className="flex items-center justify-between mt-4 pt-4"
                style={{ borderTop: '2px solid var(--color-outline-variant)' }}
              >
                <span style={{ fontSize: 'var(--text-title-small-font-size)', color: 'var(--color-on-surface)' }}>
                  Total
                </span>
                <span
                  style={{
                    fontSize: 'var(--text-title-medium-font-size)',
                    fontWeight: 600,
                    color: 'var(--color-primary-container)',
                  }}
                >
                  {formatPrice(order.totalAmount)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="mb-4">
            <CardTitle>Status</CardTitle>
            <CardContent>
              <div className="mt-4">
                <Badge
                  variant={order.status === 'PAID' ? 'success' : order.status === 'PENDING' ? 'warning' : 'error'}
                  className="text-sm px-3 py-1"
                >
                  {order.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardTitle>Buyer Details</CardTitle>
            <CardContent>
              <div className="mt-4 flex flex-col gap-2">
                <div>
                  <p style={{ fontSize: 'var(--text-label-medium-font-size)', color: 'var(--color-on-surface-variant)' }}>
                    Email
                  </p>
                  <p style={{ fontSize: 'var(--text-body-medium-font-size)', color: 'var(--color-on-surface)' }}>
                    {order.buyerEmail}
                  </p>
                </div>
                {order.buyerName && (
                  <div>
                    <p style={{ fontSize: 'var(--text-label-medium-font-size)', color: 'var(--color-on-surface-variant)' }}>
                      Name
                    </p>
                    <p style={{ fontSize: 'var(--text-body-medium-font-size)', color: 'var(--color-on-surface)' }}>
                      {order.buyerName}
                    </p>
                  </div>
                )}
                {order.buyerPhone && (
                  <div>
                    <p style={{ fontSize: 'var(--text-label-medium-font-size)', color: 'var(--color-on-surface-variant)' }}>
                      Phone
                    </p>
                    <p style={{ fontSize: 'var(--text-body-medium-font-size)', color: 'var(--color-on-surface)' }}>
                      {order.buyerPhone}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
