import { UserRole } from '@prisma/client'
import { DispatchController } from './dispatch.controller'

describe('DispatchController', () => {
  const respondToOffer = jest.fn()
  const controller = new DispatchController({ respondToOffer } as never)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('binds the offer response to the authenticated driver identity', async () => {
    respondToOffer.mockResolvedValue({
      orderId: 'order-1',
      decision: 'accept',
      status: 'assigned',
    })

    await expect(controller.respond(
      { sub: 'driver-1', role: UserRole.driver },
      'order-1',
      {
        offerToken: '4de03b4c-e5e6-4a40-b7f0-0cf50c7a5819',
        decision: 'accept',
      },
    )).resolves.toMatchObject({ status: 'assigned' })
    expect(respondToOffer).toHaveBeenCalledWith(
      'order-1',
      'driver-1',
      '4de03b4c-e5e6-4a40-b7f0-0cf50c7a5819',
      'accept',
    )
  })
})
