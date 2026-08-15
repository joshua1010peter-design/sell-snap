import { z } from 'zod'

export const checkoutSchema = z
  .object({
    productId: z.string().min(1, 'Product ID is required').max(30, 'Invalid product ID'),
    buyerEmail: z.string().email('Invalid email address').max(254, 'Email too long'),
    buyerName: z.string().min(1).max(100).optional(),
    buyerPhone: z.string().min(1).max(20).optional(),
    quantity: z.number().int().positive().max(100).default(1),
  })
  .strip()

export type CheckoutInput = z.infer<typeof checkoutSchema>
