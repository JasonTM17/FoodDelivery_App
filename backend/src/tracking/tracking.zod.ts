import { z } from 'zod'

const finiteNumber = z.number().finite()

export const driverLocationUpdateSchema = z.object({
  lat: finiteNumber,
  lng: finiteNumber,
  bearing: finiteNumber.optional(),
  speed: finiteNumber.optional(),
  accuracy: finiteNumber.optional(),
  timestamp: z.string().min(1),
}).strict()

export type DriverLocationUpdateBody = z.infer<typeof driverLocationUpdateSchema>
