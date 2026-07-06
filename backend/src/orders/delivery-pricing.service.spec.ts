import { ServiceUnavailableException } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import { DeliveryPricingService } from './delivery-pricing.service'

describe('DeliveryPricingService', () => {
  it('returns the configured base delivery fee', () => {
    const service = new DeliveryPricingService({
      get: jest.fn().mockReturnValue(18_000),
    } as unknown as ConfigService)

    expect(service.getBaseDeliveryFeeVnd()).toBe(18_000)
  })

  it('fails closed when delivery pricing is not configured', () => {
    const service = new DeliveryPricingService({
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService)

    expect(() => service.getBaseDeliveryFeeVnd()).toThrow(ServiceUnavailableException)
    expect(() => service.getBaseDeliveryFeeVnd()).toThrow('DELIVERY_PRICING_NOT_CONFIGURED')
  })

  it('rejects non-integer delivery fees', () => {
    const service = new DeliveryPricingService({
      get: jest.fn().mockReturnValue(15_000.5),
    } as unknown as ConfigService)

    expect(() => service.getBaseDeliveryFeeVnd()).toThrow(ServiceUnavailableException)
  })
})
