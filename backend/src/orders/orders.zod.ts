import { z } from 'zod'

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const paymentMethodSchema = z.enum(['cash', 'wallet', 'sepay'])

export const placeOrderSchema = z.object({
  addressId: z.string().regex(uuidRegex, 'Invalid UUID format'),
  paymentMethod: paymentMethodSchema.default('cash'),
  promotionCode: z.string().optional(),
  notes: z.string().optional(),
})

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>

export const cancelOrderSchema = z.object({
  reason: z.string().optional(),
})

export type CancelOrderInput = z.infer<typeof cancelOrderSchema>

export const createReviewSchema = z.object({
  foodRating: z.number().int().min(1).max(5),
  deliveryRating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
})

export type CreateReviewInput = z.infer<typeof createReviewSchema>

export const updateOrderStatusSchema = z.object({
  status: z.string().min(1, 'Status is required'),
  note: z.string().optional(),
})

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>

export const createOrderChatMessageSchema = z.object({
  content: z.string().trim().min(1, 'Message content is required').max(1000, 'Message content is too long'),
})

export type CreateOrderChatMessageInput = z.infer<typeof createOrderChatMessageSchema>
