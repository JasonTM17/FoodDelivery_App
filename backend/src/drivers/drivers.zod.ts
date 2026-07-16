import { z } from 'zod'
import { isWithinVietnamDeliveryBounds } from '../common/utils/delivery-area.utils'

const finiteCoordinate = z.number().refine(Number.isFinite, {
  message: 'Coordinate must be finite',
})

export const goOnlineSchema = z.object({
  lat: finiteCoordinate,
  lng: finiteCoordinate,
  accuracy: z.number().finite().min(0).max(50).optional(),
  sampledAt: z.string().min(1),
}).refine(({ lat, lng }) => isWithinVietnamDeliveryBounds(lat, lng), {
  message: 'LOCATION_OUT_OF_DELIVERY_AREA',
  path: ['lat'],
})

export type GoOnlineInput = z.infer<typeof goOnlineSchema>
