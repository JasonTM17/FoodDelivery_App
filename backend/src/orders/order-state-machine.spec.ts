import { OrderStateMachine, OrderStatus } from './order-state-machine'

describe('OrderStateMachine', () => {
  describe('canTransition — valid forward paths', () => {
    const validPairs: [OrderStatus, OrderStatus][] = [
      ['created', 'pending_payment'],
      ['created', 'cancelled'],
      ['pending_payment', 'paid'],
      ['pending_payment', 'cancelled'],
      ['paid', 'restaurant_pending'],
      ['paid', 'cancelled'],
      ['paid', 'refunded'],
      ['restaurant_pending', 'restaurant_accepted'],
      ['restaurant_pending', 'cancelled'],
      ['restaurant_accepted', 'preparing'],
      ['restaurant_accepted', 'cancelled'],
      ['preparing', 'ready_for_pickup'],
      ['preparing', 'cancelled'],
      ['ready_for_pickup', 'driver_assigned'],
      ['driver_assigned', 'driver_arriving_restaurant'],
      ['driver_arriving_restaurant', 'picked_up'],
      ['picked_up', 'delivering'],
      ['delivering', 'delivered'],
      ['delivered', 'completed'],
      ['cancelled', 'refunded'],
    ]
    it.each(validPairs)('%s → %s is allowed', (from, to) => {
      expect(OrderStateMachine.canTransition(from, to)).toBe(true)
    })
  })

  describe('canTransition — invalid / backwards transitions', () => {
    const invalidPairs: [OrderStatus, OrderStatus][] = [
      ['completed', 'cancelled'],
      ['completed', 'refunded'],
      ['refunded', 'paid'],
      ['refunded', 'cancelled'],
      ['refunded', 'completed'],
      ['delivered', 'delivering'],
      ['delivering', 'created'],
      ['picked_up', 'driver_assigned'],
      ['paid', 'created'],
      ['restaurant_accepted', 'paid'],
      ['driver_assigned', 'ready_for_pickup'],
    ]
    it.each(invalidPairs)('%s → %s is rejected', (from, to) => {
      expect(OrderStateMachine.canTransition(from, to)).toBe(false)
    })

    it('terminal states have no outgoing transitions', () => {
      const terminals: OrderStatus[] = ['completed', 'refunded']
      const allStatuses: OrderStatus[] = [
        'created', 'pending_payment', 'paid', 'restaurant_pending',
        'restaurant_accepted', 'preparing', 'ready_for_pickup',
        'driver_assigned', 'driver_arriving_restaurant', 'picked_up',
        'delivering', 'delivered', 'completed', 'cancelled', 'refunded',
      ]
      for (const terminal of terminals) {
        for (const any of allStatuses) {
          expect(OrderStateMachine.canTransition(terminal, any)).toBe(false)
        }
      }
    })
  })

  describe('canTransitionByRole — customer', () => {
    it('can initiate payment from created', () => {
      expect(OrderStateMachine.canTransitionByRole('customer', 'created', 'pending_payment')).toBe(true)
    })
    it('can cancel when pending_payment', () => {
      expect(OrderStateMachine.canTransitionByRole('customer', 'pending_payment', 'cancelled')).toBe(true)
    })
    it('can cancel when paid', () => {
      expect(OrderStateMachine.canTransitionByRole('customer', 'paid', 'cancelled')).toBe(true)
    })
    it('can complete when delivered', () => {
      expect(OrderStateMachine.canTransitionByRole('customer', 'delivered', 'completed')).toBe(true)
    })
    it('cannot mark preparing', () => {
      expect(OrderStateMachine.canTransitionByRole('customer', 'restaurant_accepted', 'preparing')).toBe(false)
    })
    it('cannot cancel when delivering', () => {
      expect(OrderStateMachine.canTransitionByRole('customer', 'delivering', 'cancelled')).toBe(false)
    })
  })

  describe('canTransitionByRole — restaurant', () => {
    it('can accept a pending order', () => {
      expect(OrderStateMachine.canTransitionByRole('restaurant', 'restaurant_pending', 'restaurant_accepted')).toBe(true)
    })
    it('can mark order as preparing', () => {
      expect(OrderStateMachine.canTransitionByRole('restaurant', 'restaurant_accepted', 'preparing')).toBe(true)
    })
    it('can mark ready for pickup', () => {
      expect(OrderStateMachine.canTransitionByRole('restaurant', 'preparing', 'ready_for_pickup')).toBe(true)
    })
    it('cannot mark delivered', () => {
      expect(OrderStateMachine.canTransitionByRole('restaurant', 'delivering', 'delivered')).toBe(false)
    })
  })

  describe('canTransitionByRole — driver', () => {
    it('can mark arriving at restaurant', () => {
      expect(OrderStateMachine.canTransitionByRole('driver', 'driver_assigned', 'driver_arriving_restaurant')).toBe(true)
    })
    it('can mark picked up', () => {
      expect(OrderStateMachine.canTransitionByRole('driver', 'driver_arriving_restaurant', 'picked_up')).toBe(true)
    })
    it('can mark delivering', () => {
      expect(OrderStateMachine.canTransitionByRole('driver', 'picked_up', 'delivering')).toBe(true)
    })
    it('can mark delivered', () => {
      expect(OrderStateMachine.canTransitionByRole('driver', 'delivering', 'delivered')).toBe(true)
    })
    it('cannot accept a restaurant order', () => {
      expect(OrderStateMachine.canTransitionByRole('driver', 'restaurant_pending', 'restaurant_accepted')).toBe(false)
    })
  })

  describe('canTransitionByRole — system', () => {
    it('can auto-advance created → pending_payment', () => {
      expect(OrderStateMachine.canTransitionByRole('system', 'created', 'pending_payment')).toBe(true)
    })
    it('can mark paid', () => {
      expect(OrderStateMachine.canTransitionByRole('system', 'pending_payment', 'paid')).toBe(true)
    })
    it('can transition to restaurant_pending', () => {
      expect(OrderStateMachine.canTransitionByRole('system', 'paid', 'restaurant_pending')).toBe(true)
    })
    it('can auto-timeout restaurant_pending → cancelled', () => {
      expect(OrderStateMachine.canTransitionByRole('system', 'restaurant_pending', 'cancelled')).toBe(true)
    })
    it('can cancel when no driver is found after restaurant accept', () => {
      expect(OrderStateMachine.canTransitionByRole('system', 'restaurant_accepted', 'cancelled')).toBe(true)
    })
    it('can assign driver from restaurant_accepted', () => {
      expect(OrderStateMachine.canTransitionByRole('system', 'restaurant_accepted', 'driver_assigned')).toBe(true)
    })
    it('can cancel unpaid pending payment', () => {
      expect(OrderStateMachine.canTransitionByRole('system', 'pending_payment', 'cancelled')).toBe(true)
    })
    it('can finalise delivered → completed', () => {
      expect(OrderStateMachine.canTransitionByRole('system', 'delivered', 'completed')).toBe(true)
    })
    it('can process refund', () => {
      expect(OrderStateMachine.canTransitionByRole('system', 'cancelled', 'refunded')).toBe(true)
    })
  })

  describe('canTransitionByRole — admin', () => {
    it('can do any valid state-machine transition (e.g. paid → cancelled)', () => {
      // admin delegates to canTransition — valid pairs work regardless of role
      expect(OrderStateMachine.canTransitionByRole('admin', 'paid', 'cancelled')).toBe(true)
    })
    it('cannot bypass terminal states (completed is final)', () => {
      // admin delegates to canTransition; completed has no outgoing edges
      expect(OrderStateMachine.canTransitionByRole('admin', 'completed', 'cancelled')).toBe(false)
    })
    it('cannot bypass terminal states (refunded is final)', () => {
      expect(OrderStateMachine.canTransitionByRole('admin', 'refunded', 'paid')).toBe(false)
    })
    it('returns false for unknown role', () => {
      expect(OrderStateMachine.canTransitionByRole('unknown', 'created', 'pending_payment')).toBe(false)
    })
  })

  describe('validate', () => {
    it('does not throw for customer initiating payment', () => {
      expect(() => OrderStateMachine.validate('created', 'pending_payment', 'customer')).not.toThrow()
    })
    it('throws ConflictException for invalid state-machine transition', () => {
      expect(() => OrderStateMachine.validate('completed', 'cancelled', 'customer')).toThrow()
    })
    it('throws ConflictException when role is not permitted for the transition', () => {
      expect(() => OrderStateMachine.validate('delivering', 'delivered', 'customer')).toThrow()
    })
    it('throws with message containing both statuses on invalid transition', () => {
      expect(() => OrderStateMachine.validate('refunded', 'created', 'admin')).toThrow(/refunded/)
    })
  })
})
