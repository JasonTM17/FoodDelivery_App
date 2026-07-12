import { dispatchOfferResponseSchema } from './dispatch.zod'

describe('dispatchOfferResponseSchema', () => {
  it.each(['accept', 'reject'] as const)('accepts the %s decision', decision => {
    expect(dispatchOfferResponseSchema.parse({
      offerToken: '4de03b4c-e5e6-4a40-b7f0-0cf50c7a5819',
      decision,
    })).toEqual({
      offerToken: '4de03b4c-e5e6-4a40-b7f0-0cf50c7a5819',
      decision,
    })
  })

  it('rejects an invalid token and unknown decision', () => {
    expect(() => dispatchOfferResponseSchema.parse({
      offerToken: 'not-a-token',
      decision: 'maybe',
    })).toThrow()
  })
})
