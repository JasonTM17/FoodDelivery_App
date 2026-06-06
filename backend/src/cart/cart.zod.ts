import { z } from 'zod'

const selectedOptionSchema = z.object({
  optionId: z.string(),
  valueId: z.string(),
})

export const addCartItemSchema = z.object({
  restaurantId: z.string().min(1, 'Restaurant ID is required'),
  menuItemId: z.string().min(1, 'Menu item ID is required'),
  quantity: z.number().int().min(1).default(1),
  selectedOptions: z.array(selectedOptionSchema).optional(),
  notes: z.string().optional(),
})

export type AddCartItemInput = z.infer<typeof addCartItemSchema>

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).optional(),
  notes: z.string().optional(),
})

export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>

export const applyPromotionSchema = z.object({
  code: z.string().min(1, 'Promotion code is required'),
})

export type ApplyPromotionInput = z.infer<typeof applyPromotionSchema>
