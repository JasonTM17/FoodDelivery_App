import { z } from 'zod'
import { isWithinVietnamDeliveryBounds } from '../common/utils/delivery-area.utils'

const finiteCoordinate = z.number().refine(Number.isFinite, {
  message: 'Coordinate must be finite',
})

export const goOnlineSchema = z.object({
  lat: finiteCoordinate,
  lng: finiteCoordinate,
}).refine(({ lat, lng }) => isWithinVietnamDeliveryBounds(lat, lng), {
  message: 'LOCATION_OUT_OF_DELIVERY_AREA',
  path: ['lat'],
})

export type GoOnlineInput = z.infer<typeof goOnlineSchema>
