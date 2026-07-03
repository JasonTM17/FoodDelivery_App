import { Test, TestingModule } from '@nestjs/testing'
import { getQueueToken } from '@nestjs/bullmq'
import { TrackingService } from './tracking.service'
import { DirectionsApiService } from './directions-api.service'
import { EtaCacheService } from './eta-cache.service'
import { PrismaService } from '../database/prisma.service'

describe('TrackingService', () => {
  let service: TrackingService
  let module: TestingModule

  const mockRedis = { geoadd: jest.fn(), setex: jest.fn(), get: jest.fn(), geopos: jest.fn() }
  const mockPrisma = {
    $executeRawUnsafe: jest.fn().mockResolvedValue(1),
    $queryRawUnsafe: jest.fn().mockResolvedValue([]),
  }
  const mockDirectionsApi = { fetchRoute: jest.fn() }
  const mockEtaCache = {
    getRoute: jest.fn().mockResolvedValue(null),
    setRoute: jest.fn().mockResolvedValue(undefined),
    invalidate: jest.fn().mockResolvedValue(undefined),
  }
  const mockEtaQueue = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) }

  beforeEach(async () => {
    jest.clearAllMocks()
    module = await Test.createTestingModule({
      providers: [
        TrackingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: 'REDIS_CLIENT', useValue: mockRedis },
        { provide: DirectionsApiService, useValue: mockDirectionsApi },
        { provide: EtaCacheService, useValue: mockEtaCache },
        { provide: getQueueToken('tracking-eta'), useValue: mockEtaQueue },
      ],
    }).compile()
    service = module.get(TrackingService)
  })

  afterEach(async () => {
    await module?.close()
  })

  describe('calculateETA', () => {
    it('returns positive minutes for valid distance', () => {
      const eta = service.calculateETA(10.8231, 106.6297, 10.7800, 106.6950)
      expect(eta).toBeGreaterThan(0)
    })

    it('nearby locations have shorter ETA', () => {
      const near = service.calculateETA(10.8, 106.7, 10.8001, 106.7001)
      const far = service.calculateETA(10.8, 106.7, 11.0, 107.0)
      expect(near).toBeLessThan(far)
    })
  })

  describe('handleLocationUpdate', () => {
    it('stores driver location in Redis and returns orderId', async () => {
      mockRedis.get.mockResolvedValueOnce('order-123')
      const orderId = await service.handleLocationUpdate('d1', {
        lat: 10.8, lng: 106.7, bearing: 90, speed: 20, accuracy: 10,
      })
      expect(mockRedis.geoadd).toHaveBeenCalled()
      expect(mockRedis.setex).toHaveBeenCalledWith('driver:d1:alive', 35, '1')
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'driver:d1:last_seen_at',
        35,
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      )
      expect(orderId).toBe('order-123')
    })

    it('returns null when driver has no current order', async () => {
      mockRedis.get.mockResolvedValueOnce(null)
      const orderId = await service.handleLocationUpdate('d1', {
        lat: 10.8, lng: 106.7, bearing: 90, speed: 20, accuracy: 10,
      })
      expect(orderId).toBeNull()
    })
  })

  describe('getDriverLocation', () => {
    it('returns coordinates with the real Redis last-seen timestamp', async () => {
      mockRedis.geopos.mockResolvedValueOnce([['106.7001', '10.8001']])
      mockRedis.get.mockResolvedValueOnce('2026-07-03T01:00:00.000Z')

      await expect(service.getDriverLocation('d1')).resolves.toEqual({
        lat: 10.8001,
        lng: 106.7001,
        timestamp: '2026-07-03T01:00:00.000Z',
      })
    })

    it('does not fabricate a timestamp when Redis has no last-seen value', async () => {
      mockRedis.geopos.mockResolvedValueOnce([['106.7001', '10.8001']])
      mockRedis.get.mockResolvedValueOnce(null)

      await expect(service.getDriverLocation('d1')).resolves.toBeNull()
    })
  })

  describe('getOrFetchRoute', () => {
    const mockRoute = {
      polyline: 'abcd',
      distanceMeters: 5000,
      durationSeconds: 900,
      waypoints: [{ lat: 10.77, lng: 106.68 }],
      provider: 'google' as const,
    }

    it('returns cached route without calling Directions API', async () => {
      mockEtaCache.getRoute.mockResolvedValueOnce(mockRoute)
      const result = await service.getOrFetchRoute('ord-1', 10.8, 106.7, 10.75, 106.65)
      expect(result).toBe(mockRoute)
      expect(mockDirectionsApi.fetchRoute).not.toHaveBeenCalled()
    })

    it('fetches and caches route on cache miss', async () => {
      mockEtaCache.getRoute.mockResolvedValueOnce(null)
      mockDirectionsApi.fetchRoute.mockResolvedValueOnce(mockRoute)
      const result = await service.getOrFetchRoute('ord-1', 10.8, 106.7, 10.75, 106.65)
      expect(mockDirectionsApi.fetchRoute).toHaveBeenCalledWith(
        { lat: 10.8, lng: 106.7 },
        { lat: 10.75, lng: 106.65 },
      )
      expect(mockEtaCache.setRoute).toHaveBeenCalledWith('ord-1', mockRoute)
      expect(result).toEqual(mockRoute)
    })

    it('returns null and does not throw when Directions API fails', async () => {
      mockEtaCache.getRoute.mockResolvedValueOnce(null)
      mockDirectionsApi.fetchRoute.mockRejectedValueOnce(new Error('API down'))
      const result = await service.getOrFetchRoute('ord-1', 10.8, 106.7, 10.75, 106.65)
      expect(result).toBeNull()
    })
  })

  describe('maybeEnqueueRecompute', () => {
    it('does nothing when no cached route exists', async () => {
      mockEtaCache.getRoute.mockResolvedValueOnce(null)
      await service.maybeEnqueueRecompute('ord-1', 10.8, 106.7)
      expect(mockEtaQueue.add).not.toHaveBeenCalled()
    })

    it('enqueues recompute job when driver deviates >100m from polyline', async () => {
      // Google example polyline encodes points in the USA; driver at (10.85, 106.75)
      // is thousands of km away — clearly beyond the 100m threshold.
      mockEtaCache.getRoute.mockResolvedValueOnce({
        polyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
        distanceMeters: 5000,
        durationSeconds: 900,
        waypoints: [],
        provider: 'google',
      })
      await service.maybeEnqueueRecompute('ord-1', 10.85, 106.75)
      expect(mockEtaQueue.add).toHaveBeenCalledWith(
        'recompute-route',
        expect.objectContaining({ orderId: 'ord-1', lat: 10.85, lng: 106.75 }),
        expect.objectContaining({ jobId: 'recompute:ord-1' }),
      )
    })

    it('does NOT enqueue when driver is within 100m of polyline', async () => {
      // Driver is exactly at a vertex of the polyline (0 m deviation).
      mockEtaCache.getRoute.mockResolvedValueOnce({
        polyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
        distanceMeters: 5000,
        durationSeconds: 900,
        waypoints: [],
        provider: 'google',
      })
      await service.maybeEnqueueRecompute('ord-1', 38.5, -120.2)
      expect(mockEtaQueue.add).not.toHaveBeenCalled()
    })
  })
})
