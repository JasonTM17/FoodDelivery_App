import { z } from 'zod'

export const driverBankAccountSchema = z.object({
  bankCode: z.string().trim().min(2).max(32).regex(/^[a-z0-9_-]+$/i),
  bankName: z.string().trim().min(2).max(160),
  accountNumber: z.string().trim().regex(/^[0-9]{4,32}$/),
  accountHolderName: z.string().trim().min(2).max(160),
})

export type DriverBankAccountInput = z.infer<typeof driverBankAccountSchema>
