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
    { lat: '10.8', lng: 106.7, timestamp: '2026-07-10T10:00:00.000Z' },
    { lat: 10.8, lng: 106.7, timestamp: '' },
  ])('rejects malformed GPS shapes %#', (sample) => {
    expect(() => driverLocationUpdateSchema.parse(sample)).toThrow()
  })

  it('passes finite GPS values to the shared semantic rejection pipeline', () => {
    expect(driverLocationUpdateSchema.parse({
      lat: 100,
      lng: 200,
      bearing: 360,
      speed: 151,
      accuracy: 50.1,
      timestamp: 'not-a-timestamp',
    })).toEqual({
      lat: 100,
      lng: 200,
      bearing: 360,
      speed: 151,
      accuracy: 50.1,
      timestamp: 'not-a-timestamp',
    })
  })
})
