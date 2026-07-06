import type { Job } from 'bullmq'
import { EtaRecomputeProcessor } from './eta-recompute.processor'
import type { RecomputeJobData } from './tracking.service'

describe('EtaRecomputeProcessor', () => {
  const mockPrisma = {
    $queryRawUnsafe: jest.fn(),
    order: { update: jest.fn() },
  }
  const mockDirectionsApi = { fetchRoute: jest.fn() }
  const mockEtaCache = {
    invalidate: jest.fn(),
    setRoute: jest.fn(),
  }
  const mockTrackingGateway = { emitEtaUpdate: jest.fn() }

  let processor: EtaRecomputeProcessor

  beforeEach(() => {
    jest.clearAllMocks()
    processor = new EtaRecomputeProcessor(
      mockPrisma as never,
      mockDirectionsApi as never,
      mockEtaCache as never,
      mockTrackingGateway as never,
    )
  })

  it('emits a fresh ETA update after recomputing and persisting the route', async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([{
      restaurantLat: 10.77,
      restaurantLng: 106.68,
      deliveryLat: 10.75,
      deliveryLng: 106.65,
    }])
    mockDirectionsApi.fetchRoute.mockResolvedValueOnce({
      polyline: 'recomputed-polyline',
      distanceMeters: 4200,
      durationSeconds: 780,
      waypoints: [{ lat: 10.76, lng: 106.66 }],
      provider: 'google',
    })
    mockEtaCache.invalidate.mockResolvedValueOnce(undefined)
    mockEtaCache.setRoute.mockResolvedValueOnce(undefined)
    mockPrisma.order.update.mockResolvedValueOnce({ id: 'order-1' })

    await processor.process({
      data: {
        orderId: 'order-1',
        lat: 10.8,
        lng: 106.7,
        phase: 'dropoff',
      },
    } as Job<RecomputeJobData>)

    expect(mockEtaCache.invalidate).toHaveBeenCalledWith('order-1:dropoff')
    expect(mockEtaCache.setRoute).toHaveBeenCalledWith('order-1:dropoff', expect.objectContaining({
      polyline: 'recomputed-polyline',
      provider: 'google',
    }))
    expect(mockPrisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'order-1' },
      data: expect.objectContaining({ routePolyline: 'recomputed-polyline' }),
    }))
    expect(mockTrackingGateway.emitEtaUpdate).toHaveBeenCalledWith('order-1', {
      etaMinutes: 13,
      source: 'google',
      degraded: false,
      routePolyline: 'recomputed-polyline',
      routePhase: 'dropoff',
    })
  })
})
