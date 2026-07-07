import type { Job } from 'bullmq'
import { EtaRecomputeProcessor } from './eta-recompute.processor'
import type { RecomputeJobData } from './tracking.service'

describe('EtaRecomputeProcessor', () => {
  const mockPrisma = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    order: { updateMany: jest.fn() },
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
    mockPrisma.$queryRaw.mockResolvedValueOnce([{
      status: 'delivering',
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
    mockPrisma.order.updateMany.mockResolvedValueOnce({ count: 1 })
    mockPrisma.$executeRaw.mockResolvedValueOnce(1)

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
    expect(mockPrisma.order.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        id: 'order-1',
        status: { in: ['picked_up', 'delivering'] },
      },
      data: expect.objectContaining({ routePolyline: 'recomputed-polyline' }),
    }))
    expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1)
    const [routeTaskUpdate] = mockPrisma.$executeRaw.mock.calls[0]
    expect(routeTaskUpdate.sql).toContain('UPDATE delivery_tasks')
    expect(routeTaskUpdate.sql).toContain('delivery_distance_km')
    expect(routeTaskUpdate.values).toEqual(
      expect.arrayContaining([4.2, 'pickup', 780, 'dropoff', 'order-1']),
    )
    const routeJson = routeTaskUpdate.values.find(
      (value: unknown) =>
        typeof value === 'string' && value.includes('recomputed-polyline'),
    ) as string
    expect(JSON.parse(routeJson)).toMatchObject({
      provider: 'google',
      polyline: 'recomputed-polyline',
      distanceMeters: 4200,
      durationSeconds: 780,
    })
    expect(mockTrackingGateway.emitEtaUpdate).toHaveBeenCalledWith('order-1', {
      etaMinutes: 13,
      source: 'google',
      degraded: false,
      routePolyline: 'recomputed-polyline',
      routePhase: 'dropoff',
    })
  })

  it('skips a queued pickup recompute after the order has moved to dropoff', async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([{
      status: 'delivering',
      restaurantLat: 10.77,
      restaurantLng: 106.68,
      deliveryLat: 10.75,
      deliveryLng: 106.65,
    }])

    await processor.process({
      data: {
        orderId: 'order-1',
        lat: 10.8,
        lng: 106.7,
        phase: 'pickup',
      },
    } as Job<RecomputeJobData>)

    expect(mockDirectionsApi.fetchRoute).not.toHaveBeenCalled()
    expect(mockEtaCache.invalidate).not.toHaveBeenCalled()
    expect(mockPrisma.order.updateMany).not.toHaveBeenCalled()
    expect(mockPrisma.$executeRaw).not.toHaveBeenCalled()
    expect(mockTrackingGateway.emitEtaUpdate).not.toHaveBeenCalled()
  })

  it('does not emit when order status changes during recompute persistence', async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([{
      status: 'delivering',
      restaurantLat: 10.77,
      restaurantLng: 106.68,
      deliveryLat: 10.75,
      deliveryLng: 106.65,
    }])
    mockDirectionsApi.fetchRoute.mockResolvedValueOnce({
      polyline: 'late-polyline',
      distanceMeters: 4200,
      durationSeconds: 780,
      waypoints: [],
      provider: 'google',
    })
    mockEtaCache.invalidate.mockResolvedValueOnce(undefined)
    mockEtaCache.setRoute.mockResolvedValueOnce(undefined)
    mockPrisma.order.updateMany.mockResolvedValueOnce({ count: 0 })

    await processor.process({
      data: {
        orderId: 'order-1',
        lat: 10.8,
        lng: 106.7,
        phase: 'dropoff',
      },
    } as Job<RecomputeJobData>)

    expect(mockPrisma.order.updateMany).toHaveBeenCalled()
    expect(mockPrisma.$executeRaw).not.toHaveBeenCalled()
    expect(mockTrackingGateway.emitEtaUpdate).not.toHaveBeenCalled()
  })
})
