import { OrderStateMachine } from './order-state-machine'

describe('OrderStateMachine', () => {
  describe('canTransition', () => {
    it('should allow created → pending_payment', () => {
      expect(OrderStateMachine.canTransition('created', 'pending_payment')).toBe(true)
    })
    it('should allow paid → restaurant_pending', () => {
      expect(OrderStateMachine.canTransition('paid', 'restaurant_pending')).toBe(true)
    })
    it('should allow delivering → delivered', () => {
      expect(OrderStateMachine.canTransition('delivering', 'delivered')).toBe(true)
    })
    it('should allow delivered → completed', () => {
      expect(OrderStateMachine.canTransition('delivered', 'completed')).toBe(true)
    })
    it('should allow cancelled → refunded', () => {
      expect(OrderStateMachine.canTransition('cancelled', 'refunded')).toBe(true)
    })
    it('should NOT allow completed → cancelled (backwards)', () => {
      expect(OrderStateMachine.canTransition('completed', 'cancelled')).toBe(false)
    })
    it('should NOT allow delivering → created (backwards)', () => {
      expect(OrderStateMachine.canTransition('delivering', 'created')).toBe(false)
    })
    it('should NOT allow refunded → anything', () => {
      expect(OrderStateMachine.canTransition('refunded', 'paid')).toBe(false)
      expect(OrderStateMachine.canTransition('refunded', 'completed')).toBe(false)
    })
  })

  describe('canTransitionByRole', () => {
    it('customer can cancel when status is paid', () => {
      expect(OrderStateMachine.canTransitionByRole('customer', 'paid', 'cancelled')).toBe(true)
    })
    it('customer CANNOT mark preparing', () => {
      expect(OrderStateMachine.canTransitionByRole('customer', 'restaurant_accepted', 'preparing')).toBe(false)
    })
    it('customer CANNOT cancel when delivering', () => {
      expect(OrderStateMachine.canTransitionByRole('customer', 'delivering', 'cancelled')).toBe(false)
    })
    it('customer can complete when delivered', () => {
      expect(OrderStateMachine.canTransitionByRole('customer', 'delivered', 'completed')).toBe(true)
    })
    it('restaurant can accept pending order', () => {
      expect(OrderStateMachine.canTransitionByRole('restaurant', 'restaurant_pending', 'restaurant_accepted')).toBe(true)
    })
    it('restaurant can mark preparing', () => {
      expect(OrderStateMachine.canTransitionByRole('restaurant', 'restaurant_accepted', 'preparing')).toBe(true)
    })
    it('restaurant can mark ready for pickup', () => {
      expect(OrderStateMachine.canTransitionByRole('restaurant', 'preparing', 'ready_for_pickup')).toBe(true)
    })
    it('driver can mark picked up', () => {
      expect(OrderStateMachine.canTransitionByRole('driver', 'driver_arriving_restaurant', 'picked_up')).toBe(true)
    })
    it('driver can mark delivering', () => {
      expect(OrderStateMachine.canTransitionByRole('driver', 'picked_up', 'delivering')).toBe(true)
    })
    it('driver can mark delivered', () => {
      expect(OrderStateMachine.canTransitionByRole('driver', 'delivering', 'delivered')).toBe(true)
    })
    it('admin can force any transition', () => {
      expect(OrderStateMachine.canTransitionByRole('admin', 'delivering', 'cancelled')).toBe(true)
      expect(OrderStateMachine.canTransitionByRole('admin', 'completed', 'cancelled')).toBe(true)
    })
    it('system can auto-transition', () => {
      expect(OrderStateMachine.canTransitionByRole('system', 'created', 'pending_payment')).toBe(true)
      expect(OrderStateMachine.canTransitionByRole('system', 'delivered', 'completed')).toBe(true)
    })
  })

  describe('validate', () => {
    it('should not throw for valid transitions', () => {
      expect(() => OrderStateMachine.validate('created', 'pending_payment', 'customer')).not.toThrow()
    })
    it('should throw for invalid transitions', () => {
      expect(() => OrderStateMachine.validate('completed', 'cancelled', 'customer')).toThrow()
    })
    it('should throw for unauthorized role', () => {
      expect(() => OrderStateMachine.validate('delivering', 'delivered', 'customer')).toThrow()
    })
  })

  describe('complete transition coverage', () => {
    const allStatuses = [
      'created', 'pending_payment', 'paid', 'restaurant_pending',
      'restaurant_accepted', 'preparing', 'ready_for_pickup',
      'driver_assigned', 'driver_arriving_restaurant', 'picked_up',
      'delivering', 'delivered', 'completed', 'cancelled', 'refunded',
    ]
    it('every status has defined transitions', () => {
      for (const status of allStatuses) {
        const transitions = OrderStateMachine['VALID_TRANSITIONS']?.[status]
        if (!['completed', 'refunded'].includes(status)) {
          expect(transitions?.length).toBeGreaterThan(0)
        }
      }
    })
  })
})
