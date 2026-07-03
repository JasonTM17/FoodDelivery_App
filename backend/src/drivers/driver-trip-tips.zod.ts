import { z } from 'zod'

export const driverTipReportSchema = z.object({
  amount: z.number().int().min(1000).max(500000),
})

export type DriverTipReportInput = z.infer<typeof driverTipReportSchema>
