import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().max(5000).optional(),
  price: z.number().positive('Price must be positive').max(999999999),
  currency: z.string().default('NGN'),
  images: z.array(z.string().min(1)).max(10).optional(),
})

export const updateProductSchema = createProductSchema.partial()

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
