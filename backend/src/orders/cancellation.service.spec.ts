import { ForbiddenException } from '@nestjs/common'
import { CancellationService } from './cancellation.service'
import { OrderStatus } from './order-state-machine'

describe('CancellationService', () => {
  let service: CancellationService

  beforeEach(() => {
    service = new CancellationService()
  })

  describe('customer cancellation', () => {
    const allowed: OrderStatus[] = ['created', 'pending_payment', 'paid', 'restaurant_pending']
    const blocked: OrderStatus[] = ['restaurant_accepted', 'preparing', 'ready_for_pickup', 'driver_assigned', 'delivering', 'delivered']

    it.each(allowed)('allows cancel at %s', (status) => {
      expect(() => service.assertCanCancel('customer', status)).not.toThrow()
    })

    it.each(blocked)('blocks cancel at %s', (status) => {
      expect(() => service.assertCanCancel('customer', status)).toThrow(ForbiddenException)
    })

    it('error message references nhà hàng after restaurant_accepted', () => {
      try {
        service.assertCanCancel('customer', 'restaurant_accepted')
      } catch (e: unknown) {
        expect((e as ForbiddenException).message).toMatch(/nhà hàng/i)
      }
    })
  })

  describe('restaurant cancellation', () => {
    const allowed: OrderStatus[] = [
      'created', 'pending_payment', 'paid', 'restaurant_pending',
      'restaurant_accepted', 'preparing', 'ready_for_pickup',
    ]
    const blocked: OrderStatus[] = [
      'driver_assigned', 'driver_arriving_restaurant', 'picked_up', 'delivering', 'delivered',
    ]

    it.each(allowed)('allows cancel with reason at %s', (status) => {
      expect(() => service.assertCanCancel('restaurant', status, 'Out of stock')).not.toThrow()
    })

    it.each(blocked)('blocks cancel at %s', (status) => {
      expect(() => service.assertCanCancel('restaurant', status, 'reason')).toThrow(ForbiddenException)
    })

    it('throws when reason is missing', () => {
      expect(() => service.assertCanCancel('restaurant', 'restaurant_pending')).toThrow(ForbiddenException)
    })

    it('throws when reason is empty string', () => {
      expect(() => service.assertCanCancel('restaurant', 'restaurant_pending', '')).toThrow(ForbiddenException)
    })

    it('throws when reason is whitespace only', () => {
      expect(() => service.assertCanCancel('restaurant', 'restaurant_pending', '   ')).toThrow(ForbiddenException)
    })

    it('error message references tài xế when driver already assigned', () => {
      try {
        service.assertCanCancel('restaurant', 'delivering', 'reason')
      } catch (e: unknown) {
        expect((e as ForbiddenException).message).toMatch(/tài xế/i)
      }
    })
  })

  describe('admin cancellation', () => {
    const nonTerminal: OrderStatus[] = [
      'created', 'paid', 'restaurant_accepted', 'preparing', 'delivering', 'cancelled',
    ]

    it.each(nonTerminal)('allows admin cancel at %s', (status) => {
      expect(() => service.assertCanCancel('admin', status)).not.toThrow()
    })

    it('blocks admin cancel on completed', () => {
      expect(() => service.assertCanCancel('admin', 'completed')).toThrow(ForbiddenException)
    })

    it('blocks admin cancel on refunded', () => {
      expect(() => service.assertCanCancel('admin', 'refunded')).toThrow(ForbiddenException)
    })
  })

  describe('terminal state guard — all roles', () => {
    it.each(['customer', 'restaurant', 'admin'])('%s cannot cancel completed', (role) => {
      expect(() => service.assertCanCancel(role, 'completed', 'reason')).toThrow(ForbiddenException)
    })

    it.each(['customer', 'restaurant', 'admin'])('%s cannot cancel refunded', (role) => {
      expect(() => service.assertCanCancel(role, 'refunded', 'reason')).toThrow(ForbiddenException)
    })
  })

  describe('evaluate — unknown role', () => {
    it('returns allowed:false for unknown role', () => {
      expect(service.evaluate('hacker', 'created').allowed).toBe(false)
    })

    it('returns a truthy reason string for unknown role', () => {
      expect(service.evaluate('hacker', 'created').reason).toBeTruthy()
    })
  })
})
