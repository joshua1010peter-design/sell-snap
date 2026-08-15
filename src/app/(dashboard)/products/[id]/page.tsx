import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/dashboard/header'
import { ProductEditForm } from '@/components/dashboard/product-edit-form'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/auth?mode=login')

  const { id } = await params

  const product = await prisma.product.findUnique({
    where: { id },
  })

  if (!product || product.sellerId !== user.id) {
    notFound()
  }

  return (
    <div>
      <Header title={product.name} description="Edit your product details." />
      <ProductEditForm product={product} />
    </div>
  )
}
