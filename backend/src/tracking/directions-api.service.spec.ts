import { Test, TestingModule } from '@nestjs/testing'
import { DirectionsApiService } from './directions-api.service'

// ─── Shared helpers ────────────────────────────────────────────────────────────

const makeRedis = () => ({
  get: jest.fn().mockResolvedValue(null),
  incr: jest.fn().mockResolvedValue(1),
  expire: jest.fn().mockResolvedValue(1),
})

async function buildService(redis: ReturnType<typeof makeRedis>): Promise<DirectionsApiService> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      DirectionsApiService,
      { provide: 'REDIS_CLIENT', useValue: redis },
    ],
  }).compile()
  return module.get(DirectionsApiService)
}

const origin = { lat: 10.8, lng: 106.7 }
const dest   = { lat: 10.75, lng: 106.65 }
const originalNodeEnv = process.env.NODE_ENV
const originalGoogleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY
const originalOsrmUrl = process.env.OSRM_URL

afterEach(() => {
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV
  else process.env.NODE_ENV = originalNodeEnv

  if (originalGoogleMapsApiKey === undefined) delete process.env.GOOGLE_MAPS_API_KEY
  else process.env.GOOGLE_MAPS_API_KEY = originalGoogleMapsApiKey

  if (originalOsrmUrl === undefined) delete process.env.OSRM_URL
  else process.env.OSRM_URL = originalOsrmUrl
})

// ─── Suite 1: no API key configured ──────────────────────────────────────────

describe('DirectionsApiService (no API key)', () => {
  let service: DirectionsApiService
  let mockRedis: ReturnType<typeof makeRedis>

  beforeEach(async () => {
    delete process.env.GOOGLE_MAPS_API_KEY
    mockRedis = makeRedis()
    service = await buildService(mockRedis)
    jest.clearAllMocks()
  })

  describe('isQuotaAvailable', () => {
    it('returns true when counter is below 80 % of limit', async () => {
      mockRedis.get.mockResolvedValueOnce('500')
      expect(await service.isQuotaAvailable()).toBe(true)
    })

    it('returns false when counter is at or above 80 %', async () => {
      mockRedis.get.mockResolvedValueOnce('8001')
      expect(await service.isQuotaAvailable()).toBe(false)
    })

    it('returns true when key does not exist yet', async () => {
      mockRedis.get.mockResolvedValueOnce(null)
      expect(await service.isQuotaAvailable()).toBe(true)
    })
  })

  it('uses OSRM when no API key is configured', async () => {
    const osrmBody = {
      code: 'Ok',
      routes: [{
        geometry: 'encodedPolyline',
        distance: 5000,
        duration: 900,
        legs: [{ steps: [{ maneuver: { location: [106.68, 10.77] } }] }],
      }],
    }
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true, json: async () => osrmBody,
    } as Response)

    const result = await service.fetchRoute(origin, dest)
    expect(result.provider).toBe('osrm')
    expect(result.distanceMeters).toBe(5000)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('aborts a hung OSRM request instead of waiting forever', async () => {
    jest.useFakeTimers()
    global.fetch = jest.fn((_url, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const error = new Error('aborted')
          error.name = 'AbortError'
          reject(error)
        })
      }),
    )

    const expectation = expect(service.fetchRoute(origin, dest))
      .rejects.toThrow('Directions provider timed out after 5000ms')
    await jest.advanceTimersByTimeAsync(5000)

    await expectation
    jest.useRealTimers()
  })
})

// ─── Suite 2: Google API key configured ───────────────────────────────────────

describe('DirectionsApiService production configuration', () => {
  it('fails closed instead of using the public OSRM demo server in production', async () => {
    process.env.NODE_ENV = 'production'
    delete process.env.GOOGLE_MAPS_API_KEY
    delete process.env.OSRM_URL

    await expect(buildService(makeRedis())).rejects.toThrow('OSRM_URL is required in production')
  })
})

describe('DirectionsApiService (with API key)', () => {
  let service: DirectionsApiService
  let mockRedis: ReturnType<typeof makeRedis>

  beforeEach(async () => {
    process.env.GOOGLE_MAPS_API_KEY = 'test-key'
    mockRedis = makeRedis()
    service = await buildService(mockRedis)
    jest.clearAllMocks()
  })

  afterEach(() => {
    delete process.env.GOOGLE_MAPS_API_KEY
  })

  it('falls back to OSRM when Google Directions returns non-OK status', async () => {
    mockRedis.get.mockResolvedValueOnce('0')   // quota available

    const googleBody = { status: 'REQUEST_DENIED', routes: [] }
    const osrmBody = {
      code: 'Ok',
      routes: [{
        geometry: 'fallbackPolyline',
        distance: 6000,
        duration: 1100,
        legs: [{ steps: [] }],
      }],
    }
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => googleBody } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => osrmBody } as Response)

    const result = await service.fetchRoute(origin, dest)
    expect(result.provider).toBe('osrm')
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('falls back to OSRM when quota is exhausted', async () => {
    mockRedis.get.mockResolvedValueOnce('9000')  // > 80 % of 10 000

    const osrmBody = {
      code: 'Ok',
      routes: [{
        geometry: 'quotaFallback',
        distance: 5500,
        duration: 1000,
        legs: [{ steps: [] }],
      }],
    }
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true, json: async () => osrmBody,
    } as Response)

    const result = await service.fetchRoute(origin, dest)
    expect(result.provider).toBe('osrm')
    // Google should NOT have been called — only OSRM
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('calls Google and returns result when quota and key are both available', async () => {
    mockRedis.get.mockResolvedValueOnce('0')   // quota available

    const googleBody = {
      status: 'OK',
      routes: [{
        overview_polyline: { points: 'googlePolyline' },
        legs: [{
          distance: { value: 4000 },
          duration: { value: 700 },
          duration_in_traffic: { value: 750 },
          steps: [{ end_location: { lat: 10.77, lng: 106.68 } }],
        }],
      }],
    }
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true, json: async () => googleBody,
    } as Response)

    const result = await service.fetchRoute(origin, dest)
    expect(result.provider).toBe('google')
    expect(result.distanceMeters).toBe(4000)
    expect(result.durationSeconds).toBe(750) // duration_in_traffic used
    expect(mockRedis.incr).toHaveBeenCalled()
  })
})
