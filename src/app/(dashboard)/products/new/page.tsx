import { getCurrentUser } from '@/lib/auth'
import { Header } from '@/components/dashboard/header'
import { ProductForm } from '@/components/dashboard/product-form'

export const dynamic = 'force-dynamic'

export default async function NewProductPage() {
  const user = await getCurrentUser()
  if (!user) return null

  return (
    <div>
      <Header title="New Product" description="Create a new product to start selling." />
      <ProductForm />
    </div>
  )
}
