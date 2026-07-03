import { z } from 'zod'

export const acceptDriverAgreementSchema = z.object({
  termsVersion: z.string().trim().min(4).max(32),
})

export type AcceptDriverAgreementInput = z.infer<typeof acceptDriverAgreementSchema>
