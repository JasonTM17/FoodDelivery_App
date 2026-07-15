import { goOnlineSchema } from './drivers.zod'

describe('goOnlineSchema', () => {
  const baseSample = {
    lat: 10.7769,
    lng: 106.7009,
    sampledAt: '2026-07-15T08:00:00.000Z',
  }

  it('accepts optional high-quality GPS accuracy', () => {
    expect(goOnlineSchema.parse({ ...baseSample, accuracy: 50 }).accuracy).toBe(50)
  })

  it('rejects poor GPS accuracy', () => {
    expect(() => goOnlineSchema.parse({ ...baseSample, accuracy: 50.1 })).toThrow()
  })
})
