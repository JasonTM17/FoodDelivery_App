import { z } from 'zod'

export const dispatchOfferResponseSchema = z.object({
  offerToken: z.string().uuid(),
  decision: z.enum(['accept', 'reject']),
}).strict()

export type DispatchOfferResponseBody = z.infer<typeof dispatchOfferResponseSchema>
