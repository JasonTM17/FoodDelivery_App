import { driverLocationUpdateSchema } from './tracking.zod'

describe('driverLocationUpdateSchema', () => {
  it('accepts a finite GPS sample with an offset timestamp', () => {
    expect(driverLocationUpdateSchema.parse({
      lat: 10.8,
      lng: 106.7,
      bearing: 180,
      speed: 24,
      accuracy: 5,
      timestamp: '2026-07-10T10:00:00.000Z',
    })).toMatchObject({ lat: 10.8, lng: 106.7 })
  })

  it.each([
    { lat: Number.NaN, lng: 106.7, timestamp: '2026-07-10T10:00:00.000Z' },
    { lat: 10.8, lng: 106.7, speed: 151, timestamp: '2026-07-10T10:00:00.000Z' },
    { lat: 10.8, lng: 106.7, timestamp: 'not-a-timestamp' },
  ])('rejects malformed or unsafe GPS input %#', (sample) => {
    expect(() => driverLocationUpdateSchema.parse(sample)).toThrow()
  })
})
