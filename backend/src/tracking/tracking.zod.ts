import { z } from 'zod'

const finiteNumber = z.number().finite()

export const driverLocationUpdateSchema = z.object({
  lat: finiteNumber.min(-90).max(90),
  lng: finiteNumber.min(-180).max(180),
  bearing: finiteNumber.min(0).max(359.999999).optional(),
  speed: finiteNumber.min(0).max(150).optional(),
  accuracy: finiteNumber.min(0).max(10_000).optional(),
  timestamp: z.string().datetime({ offset: true }),
}).strict()

export type DriverLocationUpdateBody = z.infer<typeof driverLocationUpdateSchema>
